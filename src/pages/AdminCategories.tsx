import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useBulkDeleteCategories, DbCategory } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FolderOpen, Loader2, Search, X, AlertTriangle, Upload, Globe, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";

const AdminCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const bulkDeleteCategories = useBulkDeleteCategories();
  const { toast } = useToast();
  const [editing, setEditing] = useState<{ 
    id?: string; 
    name: string; 
    description: string; 
    slug: string; 
    image: string;
    name_ar?: string;
    name_en?: string;
    description_ar?: string;
    description_en?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("admin_categories_view_mode") as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("admin_categories_view_mode", viewMode);
  }, [viewMode]);

  // Sync dialog state with URL
  const dialogOpen = searchParams.get("action") === "edit" || searchParams.get("action") === "new";

  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    
    const draftKey = `category_draft_${action}_${id || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setEditing(JSON.parse(savedDraft));
      return;
    }

    if (action === "new") {
      setEditing({ name: "", description: "", slug: "", image: "", name_ar: "", name_en: "", description_ar: "", description_en: "" });
    } else if (action === "edit" && id && categories.length > 0) {
      const c = categories.find(cat => cat.id === id);
      if (c) {
        setEditing({ 
          id: c.id, 
          name: c.name, 
          description: c.description || "", 
          slug: c.slug, 
          image: c.image || "",
          name_ar: c.name_ar || "",
          name_en: c.name_en || "",
          description_ar: c.description_ar || "",
          description_en: c.description_en || ""
        });
      }
    } else if (!action) {
      setEditing(null);
    }
  }, [searchParams, categories]);

  // Save draft whenever editing changes
  useEffect(() => {
    if (editing && dialogOpen) {
      const action = searchParams.get("action");
      const id = searchParams.get("id");
      const draftKey = `category_draft_${action}_${id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(editing));
    }
  }, [editing, dialogOpen, searchParams]);

  const clearDraft = () => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    localStorage.removeItem(`category_draft_${action}_${id || 'new'}`);
  };

  const setDialogOpen = (open: boolean) => {
    if (!open) {
      clearDraft();
      setSearchParams({});
    }
  };

  const openNew = () => {
    setSearchParams({ action: "new" });
  };

  const openEdit = (c: DbCategory) => {
    setSearchParams({ action: "edit", id: c.id });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      // Compress image before upload (max 300KB, 1200px, WebP)
      const compressed = await compressImage(file);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage.from("category-images").upload(path, compressed, {
        contentType: "image/webp",
      });
      if (error) {
        // Fallback to product-images if category-images doesn't exist
        const { error: err2 } = await supabase.storage.from("product-images").upload(path, compressed, {
          contentType: "image/webp",
        });
        if (err2) throw err2;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setEditing({ ...editing, image: data.publicUrl });
      } else {
        const { data } = supabase.storage.from("category-images").getPublicUrl(path);
        setEditing({ ...editing, image: data.publicUrl });
      }
      toast({ title: "Image importée" });
    } catch {
      toast({ title: "Erreur d'upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing?.name?.trim()) {
      toast({ title: "Erreur", description: "Le nom est obligatoire", variant: "destructive" });
      return;
    }
    const slug = editing.slug || editing.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    try {
      if (editing.id) {
        await updateCategory.mutateAsync({ 
          id: editing.id, 
          updates: { 
            name: editing.name, 
            slug, 
            description: editing.description, 
            image: editing.image,
            name_ar: editing.name_ar,
            name_en: editing.name_en,
            description_ar: editing.description_ar,
            description_en: editing.description_en
          } 
        });
        toast({ title: "Catégorie mise à jour" });
      } else {
        await addCategory.mutateAsync({ 
          name: editing.name, 
          slug, 
          description: editing.description, 
          image: editing.image,
          name_ar: editing.name_ar,
          name_en: editing.name_en,
          description_ar: editing.description_ar,
          description_en: editing.description_en
        });
        toast({ title: "Catégorie ajoutée" });
      }
      clearDraft();
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      if (isBulkDeleting) {
        await bulkDeleteCategories.mutateAsync(selectedIds);
        toast({ title: `${selectedIds.length} catégories supprimées` });
        setSelectedIds([]);
        setIsBulkDeleting(false);
      } else if (categoryToDelete) {
        await deleteCategory.mutateAsync(categoryToDelete);
        toast({ title: "Catégorie supprimée" });
        setCategoryToDelete(null);
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCategories.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const productCount = (catId: string) =>
    products.filter((p) => p.category_ids.includes(catId)).length;

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Gestion des Catégories</h1>
            <p className="text-sm text-muted-foreground">{categories.length} catégories</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleting(true)}
                className="rounded-none gap-2"
              >
                <Trash2 className="w-4 h-4" /> Supprimer ({selectedIds.length})
              </Button>
            )}
            <Button onClick={openNew} className="rounded-none gap-2 flex-1 sm:flex-initial">
              <Plus className="w-4 h-4" /> Ajouter Catégorie
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:pl-1">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:max-w-2xl">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 h-10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <Checkbox 
                  checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                  onCheckedChange={toggleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                  Tout sélectionner
                </label>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30 shrink-0 self-end md:self-auto">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3 gap-1.5 rounded-md"
            >
              <List className="w-4 h-4" />
              <span className="text-xs">Liste</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3 gap-1.5 rounded-md"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-xs">Grille</span>
            </Button>
          </div>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Desktop table */}
            <div className="border border-border rounded-lg overflow-hidden hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Nom</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Produits</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} className={`border-t border-border hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                              <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{c.description}</td>
                        <td className="p-3 text-right">{productCount(c.id)}</td>
                        <td className="p-3 text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setCategoryToDelete(c.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCategories.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune catégorie trouvée</p>
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredCategories.map((c) => (
                <div key={c.id} className={`border border-border rounded-lg p-3 flex items-start gap-3 transition-colors ${selectedIds.includes(c.id) ? 'bg-primary/5 border-primary/20' : ''}`}>
                  <Checkbox
                    checked={selectedIds.includes(c.id)}
                    onCheckedChange={() => toggleSelect(c.id)}
                    className="mt-1"
                  />
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{productCount(c.id)} produits</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setCategoryToDelete(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune catégorie trouvée</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCategories.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div key={c.id} className={`border border-border rounded-xl p-4 bg-card flex flex-col justify-between hover:shadow-md transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="space-y-3">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted relative">
                        <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c.id)}
                            className="bg-white/90 data-[state=checked]:bg-primary"
                          />
                        </div>
                        <Badge className="absolute top-2 right-2 text-[10px] bg-primary/95 text-white">{productCount(c.id)} produits</Badge>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-foreground line-clamp-1">{c.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">{c.description || "Aucune description"}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border mt-4 flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setCategoryToDelete(c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredCategories.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucune catégorie trouvée</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing?.id ? "Modifier" : "Ajouter"} une Catégorie</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: General Configuration */}
                <div className="space-y-6">
                  {/* General Info */}
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" /> Informations Générales
                    </h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nom de la Catégorie (Français) *</label>
                      <Input 
                        value={editing.name} 
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setEditing({ ...editing, name, slug });
                        }} 
                        placeholder="Ex: Soins du Visage" 
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Image Cover */}
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                      Image de couverture
                    </h3>
                    <div className="relative group border-2 border-dashed border-border rounded-xl bg-muted/10 p-4 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/20">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      
                      {editing.image ? (
                        <div className="relative w-full aspect-square max-w-[150px] rounded-lg overflow-hidden shadow-md border border-border group">
                          <img src={editing.image} alt="Aperçu" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              Changer l'image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Aucune image sélectionnée</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2 h-9 text-xs"
                          >
                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Choisir une image
                          </Button>
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground mt-3 uppercase tracking-widest font-medium">Recommandé: 800x800px</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Localized content & Translations */}
                <div className="space-y-6">
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Traductions & Descriptions
                      </h3>
                    </div>

                    <Tabs defaultValue="fr" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 p-1 rounded-lg">
                        <TabsTrigger value="fr" className="rounded-md text-xs py-2 font-medium">Français (FR)</TabsTrigger>
                        <TabsTrigger value="ar" className="rounded-md text-xs py-2 font-medium">العربية (AR)</TabsTrigger>
                        <TabsTrigger value="en" className="rounded-md text-xs py-2 font-medium">English (EN)</TabsTrigger>
                      </TabsList>

                      <TabsContent value="fr" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Description (Français)</label>
                          <Textarea 
                            value={editing.description} 
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })} 
                            rows={5} 
                            placeholder="Décrivez les produits de cette catégorie en français..."
                            className="resize-none"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="ar" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir="rtl">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">اسم الفئة (بالعربية)</label>
                          <Input 
                            value={editing.name_ar} 
                            onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} 
                            placeholder="اسم الفئة بالعربية..."
                            className="text-right h-10"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">الوصف (بالعربية)</label>
                          <Textarea 
                            value={editing.description_ar} 
                            onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} 
                            rows={5} 
                            placeholder="اكتب وصفاً لهذه الفئة بالعربية..."
                            className="text-right resize-none"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="en" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Category Name (English)</label>
                          <Input 
                            value={editing.name_en} 
                            onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} 
                            placeholder="Category name in English..."
                            className="h-10"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Description (English)</label>
                          <Textarea 
                            value={editing.description_en} 
                            onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} 
                            rows={5} 
                            placeholder="Write category description in English..."
                            className="resize-none"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border">
                <Button variant="outline" className="flex-1 rounded-none h-11" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} className="flex-1 rounded-none h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  {editing.id ? "Mettre à jour" : "Créer la catégorie"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!categoryToDelete || isBulkDeleting}
        onOpenChange={(open) => { if (!open) { setCategoryToDelete(null); setIsBulkDeleting(false); } }}
      >
        <AlertDialogContent 
          className="rounded-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="font-serif text-xl">
              {isBulkDeleting ? `Supprimer ${selectedIds.length} catégories` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDeleting
                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} catégories ?`
                : "Êtes-vous sûr de vouloir supprimer cette catégorie ?"
              } <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-none">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-none bg-destructive hover:bg-destructive/90">
              Supprimer {isBulkDeleting ? `(${selectedIds.length})` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCategories;

