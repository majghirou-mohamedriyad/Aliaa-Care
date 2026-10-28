import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory, useBulkDeleteCategories, DbCategory } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FolderOpen, 
  Loader2, 
  Search, 
  X, 
  AlertTriangle, 
  Upload, 
  Globe, 
  LayoutGrid, 
  List,
  Package,
  CheckCircle2,
  FolderX,
  ExternalLink,
  Sparkles,
  Layers
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";
import { cn } from "@/lib/utils";

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
  const [filterType, setFilterType] = useState<"all" | "with_products" | "empty">("all");
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
      const compressed = await compressImage(file);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage.from("category-images").upload(path, compressed, {
        contentType: "image/webp",
      });
      if (error) {
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
      toast({ title: "Image importée avec succès" });
    } catch {
      toast({ title: "Erreur d'upload", description: "Impossible de charger l'image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing?.name?.trim()) {
      toast({ title: "Champ obligatoire manquant", description: "Le nom de la catégorie est obligatoire", variant: "destructive" });
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
        toast({ title: "Catégorie mise à jour avec succès" });
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
        toast({ title: "Nouvelle catégorie créée avec succès" });
      }
      clearDraft();
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Erreur de sauvegarde", description: "Impossible d'enregistrer la catégorie", variant: "destructive" });
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
        toast({ title: "Catégorie supprimée avec succès" });
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

  const productCount = (catId: string) =>
    products.filter((p) => p.category_ids?.includes(catId)).length;

  // KPI Calculations
  const totalCategories = categories.length;
  const categoriesWithProducts = categories.filter(c => productCount(c.id) > 0).length;
  const emptyCategories = totalCategories - categoriesWithProducts;
  const totalAssignedProducts = products.filter(p => p.category_ids && p.category_ids.length > 0).length;

  const filteredCategories = categories.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const count = productCount(c.id);
    if (filterType === "with_products") return count > 0;
    if (filterType === "empty") return count === 0;

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Chargement des catégories...</p>
      </div>
    );
  }

  const filterTabs = [
    { id: "all", label: "Toutes", count: totalCategories },
    { id: "with_products", label: "Actives (avec produits)", count: categoriesWithProducts },
    { id: "empty", label: "Sans produit", count: emptyCategories, isAlert: emptyCategories > 0 },
  ] as const;

  return (
    <div className="space-y-6">
      
      {/* En-tête Executive & Actions Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Organisation Boutique
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Gestion des Catégories
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Structurez votre catalogue, classez vos rituels et valorisez vos rayons.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsBulkDeleting(true)}
              className="rounded-xl h-10 px-4 text-xs font-semibold gap-2 shadow-xs"
            >
              <Trash2 className="w-4 h-4" /> 
              <span>Supprimer ({selectedIds.length})</span>
            </Button>
          )}

          <Button 
            onClick={openNew} 
            className="rounded-xl h-10 px-5 text-xs font-bold uppercase tracking-wider gap-2 btn-premium shadow-md shadow-primary/10 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" /> 
            <span>Nouvelle Catégorie</span>
          </Button>
        </div>
      </div>

      {/* Cartes KPI "Luxury E-commerce Suite" (4 Indicateurs Clés) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1 : Total Catégories */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catégories
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-foreground">{totalCategories}</span>
            <span className="text-xs text-muted-foreground">rayons</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sections de navigation actives
          </p>
        </div>

        {/* KPI 2 : Catégories avec Produits */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rayons Actifs
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-emerald-600 dark:text-emerald-400">
              {categoriesWithProducts}
            </span>
            <span className="text-xs text-muted-foreground">
              / {totalCategories}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Contiennent au moins 1 soin
          </p>
        </div>

        {/* KPI 3 : Produits Référencés */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Soins Rattachés
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-foreground">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-muted-foreground">produits</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Classés dans le catalogue
          </p>
        </div>

        {/* KPI 4 : Catégories Vides */}
        <div className={cn(
          "p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2 transition-colors",
          emptyCategories > 0
            ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-card"
            : "border-border/70 bg-gradient-to-br from-card to-card/60"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rayons Vides
            </span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              emptyCategories > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
            )}>
              <FolderX className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl sm:text-3xl font-bold font-sans",
              emptyCategories > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
            )}>
              {emptyCategories}
            </span>
            <span className="text-xs text-muted-foreground">sans soin</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {emptyCategories > 0 ? "En attente de produits associés" : "Toutes les catégories sont garnies"}
          </p>
        </div>
      </div>

      {/* Barre de Recherche, Filtres & Bascule Vue */}
      <div className="space-y-3 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card shadow-xs">
        
        {/* Ligne 1 : Recherche + Bascule Liste / Grille */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, arabe, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10 rounded-xl bg-background border-border/80 text-xs sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                title="Effacer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border border-border/70 rounded-xl p-1 bg-muted/20 shrink-0 self-start sm:self-auto">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3 gap-1.5 rounded-lg text-xs font-semibold"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille</span>
            </Button>
          </div>
        </div>

        {/* Ligne 2 : Chips de Filtres Rapides */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => {
              const isSelected = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                    isSelected 
                      ? "bg-foreground text-background font-semibold shadow-xs" 
                      : "bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                    isSelected 
                      ? "bg-background/20 text-background" 
                      : tab.isAlert 
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold" 
                      : "bg-background text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredCategories.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox 
                checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="cursor-pointer select-none">
                {selectedIds.length > 0 ? `${selectedIds.length} sélectionnée(s)` : "Tout cocher"}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Vue Liste (Tableau Haute Définition) */}
      {viewMode === "list" ? (
        <>
          {/* Table Desktop */}
          <div className="hidden md:block rounded-2xl border border-border/70 overflow-hidden bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <Checkbox
                      checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">Catégorie</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-center p-4 font-semibold">Soins Associés</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCategories.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const count = productCount(c.id);

                  return (
                    <tr 
                      key={c.id} 
                      className={cn(
                        "hover:bg-muted/20 transition-colors group",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="p-4 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(c.id)}
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div 
                            onClick={() => openEdit(c)}
                            className="w-12 h-12 rounded-xl bg-muted/30 overflow-hidden shrink-0 border border-border/60 shadow-2xs cursor-pointer group-hover:scale-105 transition-transform duration-200"
                          >
                            <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p 
                              onClick={() => openEdit(c)}
                              className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                            >
                              {c.name}
                            </p>
                            <span className="text-[11px] font-mono text-muted-foreground/70 block">
                              /{c.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-muted-foreground text-xs max-w-sm">
                        <p className="line-clamp-2 leading-relaxed">
                          {c.description || <span className="italic text-muted-foreground/50">Aucune description</span>}
                        </p>
                      </td>

                      <td className="p-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                          count > 0 
                            ? "bg-primary/10 text-primary border border-primary/20" 
                            : "bg-muted/60 text-muted-foreground"
                        )}>
                          <Package className="w-3 h-3" />
                          <span>{count} {count > 1 ? "produits" : "produit"}</span>
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            asChild
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            title="Voir sur la boutique"
                          >
                            <Link to={`/products?category=${c.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => openEdit(c)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setCategoryToDelete(c.id)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCategories.length === 0 && (
              <div className="p-16 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Aucune catégorie trouvée</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Essayez de modifier votre recherche ou vos filtres.</p>
                </div>
              </div>
            )}
          </div>

          {/* Vue Mobile (Cartes Élégantes) */}
          <div className="md:hidden space-y-3">
            {filteredCategories.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              const count = productCount(c.id);

              return (
                <div 
                  key={c.id} 
                  className={cn(
                    "p-3.5 rounded-2xl border border-border/70 bg-card space-y-3 transition-colors shadow-xs",
                    isSelected && "bg-primary/5 border-primary/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(c.id)}
                      className="mt-1"
                    />
                    <div className="w-14 h-14 rounded-xl bg-muted/30 overflow-hidden shrink-0 border border-border/60">
                      <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p 
                        onClick={() => openEdit(c)}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.description || "Aucune description"}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Package className="w-3 h-3" />
                        {count} {count > 1 ? "produits" : "produit"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/60">
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                      <Link to={`/products?category=${c.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} className="h-8 w-8 text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => setCategoryToDelete(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Vue Grille (Design Rayons Visuels) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              const count = productCount(c.id);

              return (
                <div 
                  key={c.id} 
                  className={cn(
                    "p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all group shadow-xs",
                    isSelected && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="space-y-3">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted/20 border border-border/60 relative">
                      <img src={c.image || "/placeholder.svg"} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      <div className="absolute top-2.5 left-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(c.id)}
                          className="bg-background/90 backdrop-blur-xs"
                        />
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <Badge className="text-[10px] bg-primary text-primary-foreground font-bold shadow-xs">
                          {count} {count > 1 ? "produits" : "produit"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 
                        onClick={() => openEdit(c)}
                        className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                      >
                        {c.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
                        {c.description || "Aucune description"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground/70">
                      /{c.slug}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <Link to={`/products?category=${c.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" onClick={() => openEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setCategoryToDelete(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="p-16 text-center text-muted-foreground rounded-2xl border border-border/70 bg-card">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-foreground">Aucune catégorie trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Élégant d'Ajout / Modification Catégorie */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-7 rounded-2xl border-border/80 shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Rayon & Catégorie
              </span>
            </div>
            <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              {editing?.id ? "Modifier la Catégorie" : "Nouvelle Catégorie"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Renseignez le nom, l'image de couverture et les descriptions multilingues.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Colonne Gauche : Configuration générale & Image */}
                <div className="space-y-6">
                  
                  {/* Nom & Slug */}
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2 pb-2 border-b border-border/60">
                      <FolderOpen className="w-4 h-4" /> Informations Générales
                    </h3>
                    
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-foreground">Nom de la Catégorie (Français) *</label>
                      <Input 
                        value={editing.name} 
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setEditing({ ...editing, name, slug });
                        }} 
                        placeholder="Ex: Soins du Visage" 
                        className="rounded-xl h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-foreground">Identifiant URL (Slug)</label>
                      <Input 
                        value={editing.slug} 
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })} 
                        placeholder="ex: soins-du-visage" 
                        className="rounded-xl h-10 text-xs sm:text-sm font-mono text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Image de couverture */}
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2 pb-2 border-b border-border/60">
                      <Sparkles className="w-4 h-4" /> Image de Couverture
                    </h3>
                    
                    <div className="relative border-2 border-dashed border-border/80 rounded-2xl bg-muted/10 p-5 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      
                      {editing.image ? (
                        <div className="relative w-full aspect-video max-w-[240px] rounded-xl overflow-hidden shadow-md border border-border group">
                          <img src={editing.image} alt="Aperçu" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm" 
                              className="rounded-xl text-xs"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              Changer l'image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/60">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Aucune image sélectionnée</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Format recommandé : 800 × 600px (WebP, JPG, PNG)</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl gap-2 h-9 text-xs mt-2"
                          >
                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Choisir une image
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colonne Droite : Descriptions & Multilingue (FR / AR / EN) */}
                <div className="space-y-6">
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Textes & Traductions
                      </h3>
                    </div>

                    <Tabs defaultValue="fr" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/40 p-1 rounded-xl">
                        <TabsTrigger value="fr" className="rounded-lg text-xs py-2 font-bold">Français (FR)</TabsTrigger>
                        <TabsTrigger value="ar" className="rounded-lg text-xs py-2 font-bold">العربية (AR)</TabsTrigger>
                        <TabsTrigger value="en" className="rounded-lg text-xs py-2 font-bold">English (EN)</TabsTrigger>
                      </TabsList>

                      {/* Onglet Français */}
                      <TabsContent value="fr" className="space-y-4 mt-0">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Description du Rayon (Français)</label>
                          <Textarea 
                            value={editing.description} 
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })} 
                            rows={6} 
                            placeholder="Décrivez les soins de cette catégorie, leurs spécificités et bienfaits..."
                            className="rounded-xl text-xs sm:text-sm resize-none"
                          />
                        </div>
                      </TabsContent>

                      {/* Onglet Arabe */}
                      <TabsContent value="ar" className="space-y-4 mt-0" dir="rtl">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">اسم الفئة (بالعربية)</label>
                          <Input 
                            value={editing.name_ar} 
                            onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} 
                            placeholder="اسم الفئة بالعربية..."
                            className="text-right rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">الوصف (بالعربية)</label>
                          <Textarea 
                            value={editing.description_ar} 
                            onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} 
                            rows={6} 
                            placeholder="اكتب وصفاً لهذه الفئة والمنتجات التابعة لها..."
                            className="text-right rounded-xl text-xs sm:text-sm resize-none"
                          />
                        </div>
                      </TabsContent>

                      {/* Onglet Anglais */}
                      <TabsContent value="en" className="space-y-4 mt-0">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Category Name (English)</label>
                          <Input 
                            value={editing.name_en} 
                            onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} 
                            placeholder="Category name in English..."
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Description (English)</label>
                          <Textarea 
                            value={editing.description_en} 
                            onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} 
                            rows={6} 
                            placeholder="Write category description in English..."
                            className="rounded-xl text-xs sm:text-sm resize-none"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/70">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 text-xs font-semibold uppercase tracking-wider border-border/80" 
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="flex-1 rounded-xl h-11 text-xs font-bold uppercase tracking-wider btn-premium shadow-md shadow-primary/10"
                >
                  {editing.id ? "Mettre à jour la catégorie" : "Créer la catégorie"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation de Suppression */}
      <AlertDialog
        open={!!categoryToDelete || isBulkDeleting}
        onOpenChange={(open) => { if (!open) { setCategoryToDelete(null); setIsBulkDeleting(false); } }}
      >
        <AlertDialogContent 
          className="rounded-2xl border-border/80 shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="font-serif text-xl font-bold">
              {isBulkDeleting ? `Supprimer ${selectedIds.length} catégories` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {isBulkDeleting
                ? `Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedIds.length} catégories ?`
                : "Êtes-vous sûr de vouloir supprimer définitivement cette catégorie ?"
              } <br />
              Cette action est irréversible. Les produits associés ne seront pas supprimés mais n'auront plus cette catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl h-10 text-xs">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="rounded-xl h-10 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement {isBulkDeleting ? `(${selectedIds.length})` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategories;
