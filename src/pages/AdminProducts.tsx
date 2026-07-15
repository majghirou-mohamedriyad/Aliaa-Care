import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct, useBulkDeleteProducts, useToggleProductActive, uploadProductImage, DbProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, AlertTriangle, Package, Upload, X, Loader2, Search, Globe, ChevronLeft, ChevronRight, Star, LayoutGrid, List } from "lucide-react";

interface EditingProduct {
  id?: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  long_description: string;
  materials: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  long_description_ar: string;
  long_description_en: string;
  materials_ar: string;
  materials_en: string;
  weight?: string;
  weight_prices: { weight: string | number; price: number }[];
  stock: number;
  active: boolean;
  visible: boolean;
  featured: boolean;
  is_new: boolean;
  images: string[];
  category_ids: string[];
  flavors: string[];
  flavors_ar: string[];
  flavors_en: string[];
}

const emptyProduct: EditingProduct = {
  name: "", slug: "", price: 0, description: "", long_description: "",
  materials: "", name_ar: "", name_en: "", description_ar: "", description_en: "",
  long_description_ar: "", long_description_en: "", materials_ar: "", materials_en: "",
  weight: undefined, weight_prices: [], images: [], stock: 10, active: true, visible: true,
  featured: false, is_new: false, category_ids: [], flavors: [], flavors_ar: [], flavors_en: [],
};

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("admin_products_view_mode") as "grid" | "list") || "list";
  });

  useEffect(() => {
    localStorage.setItem("admin_products_view_mode", viewMode);
  }, [viewMode]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync dialog state with URL
  const dialogOpen = searchParams.get("action") === "edit" || searchParams.get("action") === "new";

  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    
    // Check for draft first
    const draftKey = `product_draft_${action}_${id || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setEditingProduct(JSON.parse(savedDraft));
      return;
    }

    if (action === "new") {
      setEditingProduct({ ...emptyProduct, weight_prices: [{ weight: "", price: 0 }] });
    } else if (action === "edit" && id && products.length > 0) {
      const p = products.find(p => p.id === id);
      if (p) {
        let weightPrices = (p.weight_prices as { weight: string | number; price: number }[]) || [];
        if (weightPrices.length === 0) {
          weightPrices = [{ weight: p.weight ? String(p.weight) : "", price: p.price || 0 }];
        }
        setEditingProduct({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          description: p.description || "",
          long_description: p.long_description || "",
          materials: p.materials || "",
          name_ar: p.name_ar || "",
          name_en: p.name_en || "",
          description_ar: p.description_ar || "",
          description_en: p.description_en || "",
          long_description_ar: p.long_description_ar || "",
          long_description_en: p.long_description_en || "",
          materials_ar: p.materials_ar || "",
          materials_en: p.materials_en || "",
          weight: p.weight ? String(p.weight) : undefined,
          weight_prices: weightPrices,
          stock: p.stock,
          active: p.active,
          visible: p.visible,
          featured: p.featured ?? false,
          is_new: p.is_new ?? false,
          images: p.images,
          category_ids: p.category_ids,
          flavors: p.flavors || [],
          flavors_ar: p.flavors_ar || [],
          flavors_en: p.flavors_en || [],
        });
      }
    } else if (!action) {
      setEditingProduct(null);
    }
  }, [searchParams, products]);

  // Save draft whenever editingProduct changes
  useEffect(() => {
    if (editingProduct && dialogOpen) {
      const action = searchParams.get("action");
      const id = searchParams.get("id");
      const draftKey = `product_draft_${action}_${id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(editingProduct));
    }
  }, [editingProduct, dialogOpen, searchParams]);

  const clearDraft = () => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    localStorage.removeItem(`product_draft_${action}_${id || 'new'}`);
  };

  const setDialogOpen = (open: boolean) => {
    if (!open) {
      clearDraft();
      setSearchParams({});
    }
  };
  const bulkDeleteProducts = useBulkDeleteProducts();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const lowStock = products.filter((p) => p.stock < 5 && p.active);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingProduct || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadProductImage(file));
      const urls = await Promise.all(uploadPromises);
      setEditingProduct({ ...editingProduct, images: [...editingProduct.images, ...urls] });
      toast({ title: "Images uploadées" });
    } catch (err) {
      toast({ title: "Erreur upload", description: "Impossible d'uploader les images", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (!editingProduct) return;
    const newImages = [...editingProduct.images];
    newImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    if (!editingProduct) return;
    const newImages = [...editingProduct.images];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const setAsCoverImage = (index: number) => {
    if (!editingProduct || index === 0) return;
    const newImages = [...editingProduct.images];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const toggleCategory = (catId: string) => {
    if (!editingProduct) return;
    const current = editingProduct.category_ids;
    const updated = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    setEditingProduct({ ...editingProduct, category_ids: updated });
  };

  const handleSave = async () => {
    const firstWeightPrice = editingProduct.weight_prices?.[0];
    if (!editingProduct?.name || editingProduct.category_ids.length === 0 || !firstWeightPrice || !firstWeightPrice.price) {
      toast({ title: "Erreur", description: "Remplissez les champs obligatoires (nom, catégorie, prix du premier poids)", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = editingProduct.slug || editingProduct.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Clean up flavors array: trim and filter empty strings
    const cleanedFlavors = editingProduct.flavors.map(f => f.trim()).filter(Boolean);
    const cleanedFlavorsAr = editingProduct.flavors_ar.map(f => f.trim()).filter(Boolean);
    const cleanedFlavorsEn = editingProduct.flavors_en.map(f => f.trim()).filter(Boolean);

    const basePrice = Number(firstWeightPrice.price);
    const baseWeight = firstWeightPrice.weight ? String(firstWeightPrice.weight) : null;

    try {
      if (editingProduct.id) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          updates: {
            name: editingProduct.name,
            slug,
            price: basePrice,
            description: editingProduct.description,
            long_description: editingProduct.long_description,
            materials: editingProduct.materials,
            name_ar: editingProduct.name_ar,
            name_en: editingProduct.name_en,
            description_ar: editingProduct.description_ar,
            description_en: editingProduct.description_en,
            long_description_ar: editingProduct.long_description_ar,
            long_description_en: editingProduct.long_description_en,
            materials_ar: editingProduct.materials_ar,
            materials_en: editingProduct.materials_en,
            weight: baseWeight,
            weight_prices: editingProduct.weight_prices || [],
            stock: editingProduct.stock,
            active: editingProduct.active,
            visible: editingProduct.visible,
            featured: editingProduct.featured,
            is_new: editingProduct.is_new,
            flavors: cleanedFlavors,
            flavors_ar: cleanedFlavorsAr,
            flavors_en: cleanedFlavorsEn,
          },
          images: editingProduct.images,
          category_ids: editingProduct.category_ids,
        });
        toast({ title: "Produit mis à jour" });
      } else {
        await addProduct.mutateAsync({
          name: editingProduct.name,
          slug,
          price: basePrice,
          description: editingProduct.description,
          long_description: editingProduct.long_description,
          materials: editingProduct.materials,
          name_ar: editingProduct.name_ar,
          name_en: editingProduct.name_en,
          description_ar: editingProduct.description_ar,
          description_en: editingProduct.description_en,
          long_description_ar: editingProduct.long_description_ar,
          long_description_en: editingProduct.long_description_en,
          materials_ar: editingProduct.materials_ar,
          materials_en: editingProduct.materials_en,
          weight: baseWeight,
          weight_prices: editingProduct.weight_prices || [],
          stock: editingProduct.stock,
          active: editingProduct.active,
          visible: editingProduct.visible,
          featured: editingProduct.featured,
          is_new: editingProduct.is_new,
          flavors: cleanedFlavors,
          flavors_ar: cleanedFlavorsAr,
          flavors_en: cleanedFlavorsEn,
          images: editingProduct.images.length > 0 ? editingProduct.images : ["/placeholder.svg"],
          category_ids: editingProduct.category_ids,
        });
        toast({ title: "Produit ajouté" });
      }
      clearDraft();
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => { setSearchParams({ action: "new" }); };
  const openEdit = (p: DbProduct) => {
    setSearchParams({ action: "edit", id: p.id });
  };

  const handleDelete = async () => {
    try {
      if (isBulkDeleting) {
        await bulkDeleteProducts.mutateAsync(selectedIds);
        toast({ title: `${selectedIds.length} produits supprimés` });
        setSelectedIds([]);
        setIsBulkDeleting(false);
      } else if (productToDelete) {
        await deleteProduct.mutateAsync(productToDelete);
        toast({ title: "Produit supprimé" });
        setProductToDelete(null);
      }
    } catch (err) {
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

  const handleToggleActive = (id: string, current: boolean) => {
    toggleActive.mutate({ id, active: !current });
  };

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
            <h1 className="font-serif text-3xl font-bold tracking-tight">Gestion des Produits</h1>
            <p className="text-sm text-muted-foreground">{products.length} produits · {categories.length} catégories</p>
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
              <Plus className="w-4 h-4" /> Ajouter Produit
            </Button>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive text-sm">Stock faible !</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full sm:pl-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30 shrink-0">
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
                    <th className="text-left p-3 font-medium">Produit</th>
                    <th className="text-left p-3 font-medium">Catégories</th>
                    <th className="text-right p-3 font-medium">Prix</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-center p-3 font-medium">Actif</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr key={p.id} className={`border-t border-border hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="p-3 text-center">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="p-3 flex items-center gap-3">
                          <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {p.stock === 0 ? (
                              <Badge variant="destructive" className="text-[10px] mt-0.5">Rupture de stock</Badge>
                            ) : p.stock < 5 && p.active && (
                              <Badge variant="outline" className="text-[10px] mt-0.5 text-amber-600 border-amber-200 bg-amber-50">Stock faible</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {productCats.map((c) => c?.name).join(", ")}
                        </td>
                        <td className="p-3 text-right">{p.price} DH</td>
                        <td className="p-3 text-right">
                          <span className={p.stock === 0 ? "text-destructive font-bold" : p.stock < 5 ? "text-amber-600 font-medium" : ""}>
                            {p.stock === 0 ? "Épuisé" : p.stock}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Switch checked={p.active} onCheckedChange={() => handleToggleActive(p.id, p.active)} />
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setProductToDelete(p.id)}>
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
                  <p>Aucun produit trouvé</p>
                </div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => {
                const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
                return (
                  <div key={p.id} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="w-14 h-14 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{productCats.map((c) => c?.name).join(", ")}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-medium">{p.price} DH</span>
                          <span className={`text-xs ${p.stock === 0 ? "text-destructive font-bold" : p.stock < 5 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                            Stock: {p.stock === 0 ? "Épuisé" : p.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={() => handleToggleActive(p.id, p.active)} />
                        <span className="text-xs text-muted-foreground">{p.active ? "Actif" : "Inactif"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setProductToDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun produit trouvé</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
                return (
                  <div key={p.id} className={`border border-border rounded-xl p-4 bg-card flex flex-col justify-between hover:shadow-md transition-all ${selectedIds.includes(p.id) ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="space-y-3">
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted relative">
                        <img src={p.images[0] || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2">
                          <Checkbox
                            checked={selectedIds.includes(p.id)}
                            onCheckedChange={() => toggleSelect(p.id)}
                            className="bg-white/90 data-[state=checked]:bg-primary"
                          />
                        </div>
                        {p.stock === 0 ? (
                          <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Rupture</Badge>
                        ) : p.stock < 5 && p.active && (
                          <Badge className="absolute top-2 right-2 text-[10px] bg-amber-500 hover:bg-amber-600 text-white">Stock faible</Badge>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {productCats.map((c) => c?.name).join(", ")}
                        </span>
                        <h3 className="font-medium text-sm text-foreground line-clamp-1 mt-0.5">{p.name}</h3>
                        <p className="text-sm font-bold text-primary mt-1">{p.price} DH</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={p.active} onCheckedChange={() => handleToggleActive(p.id, p.active)} />
                        <span className="text-xs text-muted-foreground">{p.active ? "Actif" : "Inactif"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setProductToDelete(p.id)}>
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
                <p>Aucun produit trouvé</p>
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
            <DialogTitle className="font-serif text-2xl">{editingProduct?.id ? "Modifier" : "Ajouter"} un Produit</DialogTitle>
            <DialogDescription className="sr-only">Formulaire pour {editingProduct?.id ? "modifier" : "ajouter"} les détails du produit.</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: General & Operational info */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-5 border border-border/80 rounded-xl bg-card shadow-sm space-y-4">
                    <h3 className="font-semibold text-sm tracking-wide uppercase text-primary/80 border-b border-border pb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Informations Générales
                    </h3>
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nom du produit (Français) *</label>
                      <Input 
                        value={editingProduct.name} 
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setEditingProduct({ ...editingProduct, name, slug });
                        }} 
                        placeholder="Ex: Thé amincissant"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Stock</label>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="0"
                          value={editingProduct.stock === 0 ? "" : editingProduct.stock} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingProduct({ ...editingProduct, stock: val === "" ? 0 : Math.max(0, Math.floor(Number(val))) });
                          }}
                          onKeyDown={(e) => ["e", "E", "+", "-", ".", ","].includes(e.key) && e.preventDefault()}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Actif / En ligne</label>
                        <div className="flex items-center h-10 gap-3 pl-1">
                          <Switch 
                            checked={editingProduct.active} 
                            onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, active: checked })} 
                          />
                          <span className="text-xs text-muted-foreground">{editingProduct.active ? "Actif" : "Inactif"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Catégories *</label>
                      <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-md bg-muted/10 max-h-[140px] overflow-y-auto">
                        {categories.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors py-0.5">
                            <Checkbox
                              checked={editingProduct.category_ids.includes(c.id)}
                              onCheckedChange={() => toggleCategory(c.id)}
                            />
                            <span className="truncate">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        Prix par poids *
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2.5 rounded-none"
                        onClick={() => {
                          const current = editingProduct.weight_prices || [];
                          setEditingProduct({
                            ...editingProduct,
                            weight_prices: [...current, { weight: "", price: 0 }]
                          });
                        }}
                      >
                        + Ajouter un prix
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {(editingProduct.weight_prices || []).map((wp, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <span className="text-[10px] text-muted-foreground block mb-1 ml-0.5 font-medium">Poids</span>
                            <Input
                              type="text"
                              value={wp.weight || ""}
                              placeholder="Ex: 250g, 100ml"
                              className="h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                              spellCheck={false}
                              onChange={(e) => {
                                const newWeightPrices = [...editingProduct.weight_prices];
                                newWeightPrices[idx] = { ...newWeightPrices[idx], weight: e.target.value };
                                setEditingProduct({ ...editingProduct, weight_prices: newWeightPrices });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-muted-foreground block mb-1 ml-0.5 font-medium">Prix (DH)</span>
                            <Input
                              type="number"
                              value={wp.price || ""}
                              placeholder="Ex: 40"
                              className="h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                              spellCheck={false}
                              onChange={(e) => {
                                const newWeightPrices = [...editingProduct.weight_prices];
                                newWeightPrices[idx] = { ...newWeightPrices[idx], price: Number(e.target.value) };
                                setEditingProduct({ ...editingProduct, weight_prices: newWeightPrices });
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-9 w-9 shrink-0 hover:bg-destructive/5 rounded-md"
                            disabled={editingProduct.weight_prices.length <= 1}
                            onClick={() => {
                              const newWeightPrices = editingProduct.weight_prices.filter((_, i) => i !== idx);
                              setEditingProduct({ ...editingProduct, weight_prices: newWeightPrices });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 leading-normal">
                      Ces options remplaceront le prix de base sur la fiche produit et s'afficheront en menu déroulant.
                    </p>
                  </div>

                  <div className="p-5 border border-border/80 rounded-xl bg-card shadow-sm space-y-4">
                    <h3 className="font-semibold text-sm tracking-wide uppercase text-primary/80 border-b border-border pb-2 flex items-center gap-2">
                      Images du produit
                    </h3>
                    <div className="p-4 border border-border border-dashed rounded-lg bg-muted/5">
                      <div className="flex flex-wrap gap-3 mb-4">
                        {editingProduct.images.map((img, i) => (
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
                                {i < editingProduct.images.length - 1 ? (
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
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                      <Button type="button" variant="outline" className="w-full gap-2 border-dashed h-10 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "Chargement..." : "Ajouter des photos"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Localized content & Translations */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-5 border border-border/80 rounded-xl bg-card shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-semibold text-sm tracking-wide uppercase text-primary/80 flex items-center gap-2">
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
                            value={editingProduct.description} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                            placeholder="Saisissez une description concise..."
                            rows={3} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Description longue (Français)</label>
                          <Textarea 
                            value={editingProduct.long_description} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description: e.target.value })} 
                            placeholder="Saisissez la description complète du produit..."
                            rows={6} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Ingrédients / Matériaux (Français)</label>
                          <Input 
                            value={editingProduct.materials} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials: e.target.value })} 
                            placeholder="Ex: Huile d'argan, Lavande..." 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Goûts / Variantes (Français - Séparés par des virgules)</label>
                          <Input 
                            value={(editingProduct.flavors || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors: flavorsArray });
                            }} 
                            placeholder="Ex: Nature, Menthe..." 
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="ar" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0" dir="rtl">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">اسم المنتج (بالعربية)</label>
                          <Input 
                            value={editingProduct.name_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })} 
                            placeholder="اسم المنتج باللغة العربية..."
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">الوصف القصير (بالعربية)</label>
                          <Textarea 
                            value={editingProduct.description_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_ar: e.target.value })} 
                            placeholder="اكتب وصفاً قصيراً للمنتج..."
                            rows={3}
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">الوصف التفصيلي (بالعربية)</label>
                          <Textarea 
                            value={editingProduct.long_description_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description_ar: e.target.value })} 
                            placeholder="اكتب وصفاً مفصلاً للمنتج..."
                            rows={6}
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">المكونات (بالعربية)</label>
                          <Input 
                            value={editingProduct.materials_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials_ar: e.target.value })} 
                            placeholder="المكونات مثل: زيت أركان..."
                            className="text-right"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block text-right font-medium">النكهات / الأنواع (بالعربية - مفصولة بفاصلة)</label>
                          <Input 
                            value={(editingProduct.flavors_ar || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors_ar: flavorsArray });
                            }} 
                            placeholder="مثال: طبيعي, نعناع..."
                            className="text-right"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="en" className="space-y-4 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Product Name (English)</label>
                          <Input 
                            value={editingProduct.name_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })} 
                            placeholder="Product name in English..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Short Description (English)</label>
                          <Textarea 
                            value={editingProduct.description_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_en: e.target.value })} 
                            placeholder="Enter a brief description..."
                            rows={3} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Long Description (English)</label>
                          <Textarea 
                            value={editingProduct.long_description_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description_en: e.target.value })} 
                            placeholder="Enter the full description..."
                            rows={6} 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Ingredients / Materials (English)</label>
                          <Input 
                            value={editingProduct.materials_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials_en: e.target.value })} 
                            placeholder="Ingredients like: Argan oil, Lavender..." 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Flavors / Varieties (English - Separated by commas)</label>
                          <Input 
                            value={(editingProduct.flavors_en || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors_en: flavorsArray });
                            }} 
                            placeholder="Ex: Natural, Mint..." 
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/85">
                <Button variant="outline" className="flex-1 rounded-none h-11" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} className="flex-1 rounded-none h-11" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingProduct.id ? "Mettre à jour le produit" : "Créer le produit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={!!productToDelete || isBulkDeleting} 
        onOpenChange={(open) => { if (!open) { setProductToDelete(null); setIsBulkDeleting(false); }}}
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
              {isBulkDeleting ? `Supprimer ${selectedIds.length} produits` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDeleting 
                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} produits ?` 
                : "Êtes-vous sûr de vouloir supprimer ce produit ?"
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

export default AdminProducts;

