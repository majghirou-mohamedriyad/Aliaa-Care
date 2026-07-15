import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { usePacks, useAddPack, useUpdatePack, useDeletePack, useBulkDeletePacks, useTogglePackActive, DbPack } from "@/hooks/usePacks";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
import { Plus, Pencil, Trash2, Package, Loader2, Search, X, AlertTriangle, Upload, ImageIcon, Globe, ChevronLeft, ChevronRight, Star, LayoutGrid, List } from "lucide-react";

interface EditingPack {
  id?: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  price: number;
  image: string;
  images: string[];
  active: boolean;
  featured: boolean;
  items: { product_id: string; quantity: number; selected_weight?: string | null }[];
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  long_description_ar: string;
  long_description_en: string;
}

const emptyPack: EditingPack = {
  name: "", slug: "", description: "", long_description: "",
  price: 0, image: "/placeholder.svg", images: [], active: true, featured: false, items: [],
  name_ar: "", name_en: "", description_ar: "", description_en: "",
  long_description_ar: "", long_description_en: "",
};

const getProductPriceForWeight = (
  prod: { price: number; weight_prices?: { weight: string | number; price: number }[] | null },
  selectedWeight: string | null | undefined
) => {
  if (selectedWeight && prod.weight_prices && prod.weight_prices.length > 0) {
    const found = prod.weight_prices.find((wp) => String(wp.weight) === String(selectedWeight));
    if (found) return found.price;
  }
  return prod.price;
};

const AdminPacks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: packs = [], isLoading } = usePacks();
  const { data: products = [] } = useProducts();
  const addPack = useAddPack();
  const updatePack = useUpdatePack();
  const deletePack = useDeletePack();
  const toggleActive = useTogglePackActive();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditingPack | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const bulkDeletePacks = useBulkDeletePacks();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [packToDelete, setPackToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("admin_packs_view_mode") as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("admin_packs_view_mode", viewMode);
  }, [viewMode]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productSearch, setProductSearch] = useState("");

  // Sync dialog state with URL
  const dialogOpen = searchParams.get("action") === "edit" || searchParams.get("action") === "new";

  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    
    const draftKey = `pack_draft_${action}_${id || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setEditing(JSON.parse(savedDraft));
      return;
    }

    if (action === "new") {
      setEditing({ ...emptyPack, items: [] });
    } else if (action === "edit" && id && packs.length > 0) {
      const p = packs.find(p => p.id === id);
      if (p) {
        const packItems = (p.items || []).map((i) => ({ 
          product_id: i.product_id, 
          quantity: i.quantity || 1,
          selected_weight: i.selected_weight || null
        })).filter(i => i.product_id);
        setEditing({
          id: p.id, name: p.name, slug: p.slug, description: p.description,
          long_description: p.long_description, price: p.price, image: p.image,
          images: p.images || [],
          active: p.active, featured: p.featured,
          items: packItems,
          name_ar: p.name_ar || "",
          name_en: p.name_en || "",
          description_ar: p.description_ar || "",
          description_en: p.description_en || "",
          long_description_ar: p.long_description_ar || "",
          long_description_en: p.long_description_en || "",
        });
      }
    } else if (!action) {
      setEditing(null);
    }
  }, [searchParams, packs]);

  // Save draft whenever editing changes
  useEffect(() => {
    if (editing && dialogOpen) {
      const action = searchParams.get("action");
      const id = searchParams.get("id");
      const draftKey = `pack_draft_${action}_${id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(editing));
    }
  }, [editing, dialogOpen, searchParams]);

  const clearDraft = () => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    localStorage.removeItem(`pack_draft_${action}_${id || 'new'}`);
  };

  const setDialogOpen = (open: boolean) => {
    if (!open) {
      clearDraft();
      setSearchParams({});
    }
  };

  const openNew = () => { setSearchParams({ action: "new" }); };
  const openEdit = (p: DbPack) => { setSearchParams({ action: "edit", id: p.id }); };

  const filtered = packs.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggleProduct = (pid: string) => {
    if (!editing) return;
    const exists = editing.items.some((item) => item.product_id === pid);
    let updatedItems;
    if (exists) {
      updatedItems = editing.items.filter((item) => item.product_id !== pid);
    } else {
      const prod = products.find(p => p.id === pid);
      const defaultWeight = prod?.weight_prices?.[0]?.weight || prod?.weight || null;
      updatedItems = [...editing.items, { 
        product_id: pid, 
        quantity: 1, 
        selected_weight: defaultWeight ? String(defaultWeight) : null 
      }];
    }
    setEditing({ ...editing, items: updatedItems });
  };

  const updateProductWeight = (pid: string, weight: string) => {
    if (!editing) return;
    const updatedItems = editing.items.map((item) =>
      item.product_id === pid ? { ...item, selected_weight: weight } : item
    );
    setEditing({ ...editing, items: updatedItems });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editing || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressed = await compressImage(file);
        const path = `packs/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
          contentType: "image/webp",
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        return data.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setEditing({ ...editing, images: [...(editing.images || []), ...urls] });
      toast({ title: "Images uploadées" });
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'uploader les images", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (!editing) return;
    const newImages = [...(editing.images || [])];
    newImages.splice(index, 1);
    setEditing({ ...editing, images: newImages });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    if (!editing) return;
    const newImages = [...(editing.images || [])];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    // Swap
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    
    setEditing({ ...editing, images: newImages });
  };

  const setAsCoverImage = (index: number) => {
    if (!editing || index === 0) return;
    const newImages = [...(editing.images || [])];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    setEditing({ ...editing, images: newImages });
  };

  const handleDelete = async () => {
    try {
      if (isBulkDeleting) {
        await bulkDeletePacks.mutateAsync(selectedIds);
        toast({ title: `${selectedIds.length} packs supprimés` });
        setSelectedIds([]);
        setIsBulkDeleting(false);
      } else if (packToDelete) {
        await deletePack.mutateAsync(packToDelete);
        toast({ title: "Pack supprimé" });
        setPackToDelete(null);
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!editing?.name || !editing.price || editing.items.length === 0) {
      toast({ title: "Erreur", description: "Remplissez nom, prix et sélectionnez des produits", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = editing.slug || editing.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const coverImage = editing.images?.[0] || "/placeholder.svg";
      if (editing.id) {
        await updatePack.mutateAsync({
          id: editing.id,
          updates: { 
            name: editing.name, 
            slug, 
            description: editing.description, 
            long_description: editing.long_description, 
            price: editing.price, 
            image: coverImage, 
            active: editing.active, 
            featured: editing.featured,
            name_ar: editing.name_ar,
            name_en: editing.name_en,
            description_ar: editing.description_ar,
            description_en: editing.description_en,
            long_description_ar: editing.long_description_ar,
            long_description_en: editing.long_description_en,
          },
          images: editing.images || [],
          items: editing.items,
        });
        toast({ title: "Pack mis à jour" });
      } else {
        await addPack.mutateAsync({
          name: editing.name, slug, description: editing.description, long_description: editing.long_description,
          price: editing.price, image: coverImage, images: editing.images || [], active: editing.active, featured: editing.featured,
          items: editing.items,
          name_ar: editing.name_ar,
          name_en: editing.name_en,
          description_ar: editing.description_ar,
          description_en: editing.description_en,
          long_description_ar: editing.long_description_ar,
          long_description_en: editing.long_description_en,
        });
        toast({ title: "Pack ajouté" });
      }
      clearDraft();
      setDialogOpen(false);
      setEditing(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div></>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Gestion des Packs</h1>
            <p className="text-sm text-muted-foreground">{packs.length} packs</p>
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
              <Plus className="w-4 h-4" /> Ajouter Pack
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full sm:pl-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un pack..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30 shrink-0 select-none">
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
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Pack</th>
                    <th className="text-left p-3 font-medium">Produits</th>
                    <th className="text-right p-3 font-medium">Prix</th>
                    <th className="text-center p-3 font-medium">Actif</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr key={p.id} className={`border-t border-border hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.items.length} produits</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {p.items.map((i) => `${i.product_name}${i.selected_weight ? ` (${i.selected_weight})` : ""}`).join(", ")}
                        </td>
                        <td className="p-3 text-right font-medium">{p.price} DH</td>
                        <td className="p-3 text-center">
                          <Switch checked={p.active} onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })} />
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPackToDelete(p.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun pack trouvé</p>
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.items.length} produits · {p.price} DH</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.includes(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })} />
                        <span className="text-xs text-muted-foreground">{p.active ? "Actif" : "Inactif"}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPackToDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun pack trouvé</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div key={p.id} className={`border border-border rounded-xl p-4 bg-card flex flex-col justify-between hover:shadow-md transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="space-y-3">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted relative">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <Package className="w-10 h-10 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p.id)}
                            className="bg-white/90 data-[state=checked]:bg-primary"
                          />
                        </div>
                        <Badge className="absolute top-2 right-2 text-[10px] bg-primary text-white">{p.items.length} produits</Badge>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-foreground line-clamp-1">{p.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 min-h-[1.5rem]">
                          {p.items.map((i) => `${i.product_name}${i.selected_weight ? ` (${i.selected_weight})` : ""}`).join(", ")}
                        </p>
                        <p className="text-sm font-bold text-primary mt-2">{p.price} DH</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })} />
                        <span className="text-xs text-muted-foreground">{p.active ? "Actif" : "Inactif"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setPackToDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucun pack trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing?.id ? "Modifier" : "Ajouter"} un Pack</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Details & Products Selection */}
                <div className="lg:col-span-5 space-y-6">
                  {/* General Info */}
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4" /> Informations Générales
                    </h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nom du pack (Français) *</label>
                      <Input 
                        value={editing.name} 
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setEditing({ ...editing, name, slug });
                        }} 
                        placeholder="Ex: Pack Rituel Matinal" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Prix du pack (DH) *</label>
                        <Input type="number" value={editing.price === 0 ? "" : editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} placeholder="0" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Statut</label>
                        <div className="flex flex-col gap-2 pt-1">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: !!v })} />
                            <span>Pack actif</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: !!v })} />
                            <span>Mettre en vedette</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images du pack */}
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                      Images du pack
                    </h3>
                    <div className="p-4 border border-border border-dashed rounded-lg bg-muted/5">
                      <div className="flex flex-wrap gap-3 mb-4">
                        {(editing.images || []).map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shadow-sm group bg-muted flex flex-col justify-between">
                            <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover absolute inset-0 z-0" />
                            
                            {/* Overlay and controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-between p-1.5">
                              <div className="flex justify-between items-center w-full">
                                {i > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setAsCoverImage(i)}
                                    className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                    title="Définir comme principale"
                                  >
                                    <Star className="w-3 h-3 fill-current" />
                                  </button>
                                ) : (
                                  <div className="w-5" />
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => removeImage(i)}
                                  className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/95 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex justify-between w-full">
                                {i > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(i, "left")}
                                    className="p-1 bg-background text-foreground rounded hover:bg-accent transition-colors"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <div className="w-5" />
                                )}
                                {i < (editing.images || []).length - 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(i, "right")}
                                    className="p-1 bg-background text-foreground rounded hover:bg-accent transition-colors"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <div className="w-5" />
                                )}
                              </div>
                            </div>

                            {/* "Principale" badge */}
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-[9px] font-medium text-primary-foreground rounded shadow-sm z-20">
                                Principale
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full gap-2 border-dashed h-10 text-xs" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "Chargement..." : "Ajouter des photos"}
                      </Button>
                    </div>
                  </div>

                  {/* Products Selection */}
                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                        Produits inclus *
                      </h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        {editing.items.length} sélectionné(s)
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-9 h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                      {productSearch && (
                        <button 
                          type="button"
                          onClick={() => setProductSearch("")} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto border border-border rounded-lg p-3 bg-muted/10">
                      {products
                        .filter(p => p.active)
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((p) => (
                          <label key={p.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-background p-2 rounded-md transition-colors border border-transparent hover:border-border">
                            <Checkbox
                              checked={editing.items.some((i) => i.product_id === p.id)}
                              onCheckedChange={() => toggleProduct(p.id)}
                            />
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-border shrink-0">
                              <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-xs">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{p.price} DH</p>
                            </div>
                          </label>
                        ))}
                      {products.filter(p => p.active).filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">Aucun produit trouvé</p>
                      )}
                    </div>

                    {/* Weights for selected products */}
                    {editing.items.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Poids des produits</label>
                        <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/5 max-h-[160px] overflow-y-auto">
                          {editing.items.map((item) => {
                            const prod = products.find(p => p.id === item.product_id);
                            if (!prod) return null;
                            return (
                              <div key={item.product_id} className="flex items-center justify-between gap-4 p-2 bg-background rounded-md border border-border">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={prod.images[0] || "/placeholder.svg"} className="w-7 h-7 rounded object-cover shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium truncate">{prod.name}</p>
                                    <p className="text-[9px] text-muted-foreground">
                                      {getProductPriceForWeight(prod, item.selected_weight)} DH
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[9px] text-muted-foreground">Poids :</span>
                                  {(() => {
                                    const weights = prod.weight_prices && prod.weight_prices.length > 0
                                      ? prod.weight_prices.map(wp => String(wp.weight))
                                      : (prod.weight ? [String(prod.weight)] : []);
                                    if (weights.length === 0) {
                                      return <span className="text-[10px] text-muted-foreground">Aucun</span>;
                                    }
                                    return (
                                      <select
                                        value={item.selected_weight || weights[0] || ""}
                                        onChange={(e) => updateProductWeight(item.product_id, e.target.value)}
                                        className="border border-input bg-background rounded px-1.5 py-0.5 text-[11px] focus:ring-1 focus:ring-primary/20 focus:border-primary focus:outline-none"
                                      >
                                        {weights.map((w) => (
                                          <option key={w} value={w}>{w}</option>
                                        ))}
                                      </select>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {editing.items.length > 0 && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Valeur totale des produits :</span>
                          <span className="font-bold line-through text-muted-foreground/70">
                            {editing.items.reduce((s, item) => {
                              const prod = products.find(p => p.id === item.product_id);
                              if (!prod) return s;
                              return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                            }, 0)} DH
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="font-medium text-primary">Économie réalisée :</span>
                          <span className="font-bold text-primary">
                            {editing.items.reduce((s, item) => {
                              const prod = products.find(p => p.id === item.product_id);
                              if (!prod) return s;
                              return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                            }, 0) - editing.price} DH
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Localized content & Translations */}
                <div className="lg:col-span-7 space-y-6">
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
                          <label className="text-sm font-medium mb-1.5 block">Description courte (Français) *</label>
                          <Textarea 
                            value={editing.description} 
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })} 
                            placeholder="Saisissez une description courte du pack..."
                            rows={3} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Description longue (Français)</label>
                          <Textarea 
                            value={editing.long_description} 
                            onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} 
                            placeholder="Saisissez la description complète du pack..."
                            rows={7} 
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="ar" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir="rtl">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">اسم المنتج (بالعربية)</label>
                          <Input 
                            value={editing.name_ar} 
                            onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} 
                            placeholder="اسم الباقة بالعربية..."
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">الوصف القصير (بالعربية)</label>
                          <Textarea 
                            value={editing.description_ar} 
                            onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} 
                            placeholder="اكتب وصفاً قصيراً للباقة..."
                            rows={3}
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">الوصف التفصيلي (بالعربية)</label>
                          <Textarea 
                            value={editing.long_description_ar} 
                            onChange={(e) => setEditing({ ...editing, long_description_ar: e.target.value })} 
                            placeholder="اكتب وصفاً مفصلاً للباقة..."
                            rows={7}
                            className="text-right"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="en" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Pack Name (English)</label>
                          <Input 
                            value={editing.name_en} 
                            onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} 
                            placeholder="Pack name in English..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Short Description (English)</label>
                          <Textarea 
                            value={editing.description_en} 
                            onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} 
                            placeholder="Enter a brief description..."
                            rows={3} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Long Description (English)</label>
                          <Textarea 
                            value={editing.long_description_en} 
                            onChange={(e) => setEditing({ ...editing, long_description_en: e.target.value })} 
                            placeholder="Enter the full description..."
                            rows={7} 
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="flex-1 rounded-none h-11" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-none h-11 gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing.id ? "Mettre à jour le pack" : "Créer le pack"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!packToDelete || isBulkDeleting}
        onOpenChange={(open) => { if (!open) { setPackToDelete(null); setIsBulkDeleting(false); } }}
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
              {isBulkDeleting ? `Supprimer ${selectedIds.length} packs` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDeleting
                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} packs ?`
                : "Êtes-vous sûr de vouloir supprimer ce pack ?"
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

export default AdminPacks;

