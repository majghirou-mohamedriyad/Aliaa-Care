import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { 
  useProducts, 
  useAddProduct, 
  useUpdateProduct, 
  useDeleteProduct, 
  useBulkDeleteProducts, 
  useToggleProductActive, 
  useToggleProductFreeShipping, 
  uploadProductImage, 
  DbProduct 
} from "@/hooks/useProducts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Package, 
  Upload, 
  X, 
  Loader2, 
  Search, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  LayoutGrid, 
  List, 
  Truck,
  CheckCircle2,
  Boxes,
  ExternalLink,
  Sparkles,
  Tag,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  free_shipping: boolean;
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
  featured: false, is_new: false, free_shipping: false, category_ids: [], flavors: [], flavors_ar: [], flavors_en: [],
};

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();
  const toggleFreeShipping = useToggleProductFreeShipping();
  const bulkDeleteProducts = useBulkDeleteProducts();
  const { toast } = useToast();

  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock" | "out_of_stock" | "free_shipping">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
          free_shipping: p.free_shipping ?? false,
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

  // KPI Calculations
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 5 && p.active).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0 && p.active).length;
  const freeShippingProducts = products.filter((p) => p.free_shipping).length;

  // Filtered list
  const filtered = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_ar && p.name_ar.toLowerCase().includes(search.toLowerCase())) ||
      (p.slug && p.slug.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter !== "all" && !p.category_ids.includes(categoryFilter)) {
      return false;
    }

    if (statusFilter === "active") return p.active;
    if (statusFilter === "inactive") return !p.active;
    if (statusFilter === "low_stock") return p.stock > 0 && p.stock < 5;
    if (statusFilter === "out_of_stock") return p.stock === 0;
    if (statusFilter === "free_shipping") return !!p.free_shipping;

    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingProduct || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadProductImage(file));
      const urls = await Promise.all(uploadPromises);
      setEditingProduct({ ...editingProduct, images: [...editingProduct.images, ...urls] });
      toast({ title: "Images uploadées avec succès" });
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
      toast({ title: "Champs obligatoires manquants", description: "Veuillez renseigner le nom, la catégorie et le prix de base.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = editingProduct.slug || editingProduct.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
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
            free_shipping: editingProduct.free_shipping,
            flavors: cleanedFlavors,
            flavors_ar: cleanedFlavorsAr,
            flavors_en: cleanedFlavorsEn,
          },
          images: editingProduct.images,
          category_ids: editingProduct.category_ids,
        });
        toast({ title: "Produit mis à jour avec succès" });
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
          free_shipping: editingProduct.free_shipping,
          flavors: cleanedFlavors,
          flavors_ar: cleanedFlavorsAr,
          flavors_en: cleanedFlavorsEn,
          images: editingProduct.images.length > 0 ? editingProduct.images : ["/placeholder.svg"],
          category_ids: editingProduct.category_ids,
        });
        toast({ title: "Nouveau produit créé avec succès" });
      }
      clearDraft();
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (err) {
      toast({ title: "Erreur de sauvegarde", description: "Impossible d'enregistrer le produit", variant: "destructive" });
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
        toast({ title: "Produit supprimé avec succès" });
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

  const handleToggleFreeShipping = (id: string, current: boolean) => {
    toggleFreeShipping.mutate({ id, free_shipping: !current });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Chargement du catalogue...</p>
      </div>
    );
  }

  const filterTabs = [
    { id: "all", label: "Tous", count: totalProducts },
    { id: "active", label: "En ligne", count: activeProducts },
    { id: "inactive", label: "Inactifs", count: totalProducts - activeProducts },
    { id: "low_stock", label: "Stock faible", count: lowStockProducts, isAlert: lowStockProducts > 0 },
    { id: "out_of_stock", label: "Rupture", count: outOfStockProducts, isAlert: outOfStockProducts > 0 },
    { id: "free_shipping", label: "Livraison offerte", count: freeShippingProducts },
  ] as const;

  return (
    <div className="space-y-6">
      
      {/* En-tête Executive & Actions Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Catalogue Store
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Gestion des Produits
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pilotez votre catalogue, inventaire, variantes et livraison en temps réel.
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
            <span>Nouveau Produit</span>
          </Button>
        </div>
      </div>

      {/* Cartes KPI "Luxury E-commerce Suite" (4 Indicateurs Clés) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1 : Total Références */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Références
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-foreground">{totalProducts}</span>
            <span className="text-xs text-muted-foreground">soins</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Répartis dans {categories.length} catégories
          </p>
        </div>

        {/* KPI 2 : Produits en ligne */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En Ligne
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-emerald-600 dark:text-emerald-400">
              {activeProducts}
            </span>
            <span className="text-xs text-muted-foreground">
              / {totalProducts}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}% du catalogue actif
          </p>
        </div>

        {/* KPI 3 : Alertes Stock */}
        <div className={cn(
          "p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2 transition-colors",
          (lowStockProducts > 0 || outOfStockProducts > 0)
            ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-card"
            : "border-border/70 bg-gradient-to-br from-card to-card/60"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              État des Stocks
            </span>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              (lowStockProducts > 0 || outOfStockProducts > 0)
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            )}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl sm:text-3xl font-bold font-sans",
              outOfStockProducts > 0 ? "text-rose-600 dark:text-rose-400" : lowStockProducts > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
            )}>
              {lowStockProducts + outOfStockProducts}
            </span>
            <span className="text-xs text-muted-foreground">alertes</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {outOfStockProducts} épuisés · {lowStockProducts} stock faible
          </p>
        </div>

        {/* KPI 4 : Livraison Gratuite */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Livraison Offerte
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-sans text-foreground">
              {freeShippingProducts}
            </span>
            <span className="text-xs text-muted-foreground">produits</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Badge "Livraison Gratuite" actif
          </p>
        </div>
      </div>

      {/* Barre de Recherche, Filtres Intelligents & Bascule Vue */}
      <div className="space-y-3 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card shadow-xs">
        
        {/* Ligne 1 : Recherche + Sélecteur Catégorie + Mode Liste/Grille */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Input Recherche */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, arabe, slug..."
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

            {/* Filtre par Catégorie */}
            <div className="w-full sm:w-[200px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Toutes les catégories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bascule Vue : Liste / Grille */}
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

        {/* Ligne 2 : Chips de Filtres Rapides (Tous, Actifs, Stock Faible...) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
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

          {/* Tout sélectionner */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox 
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onCheckedChange={toggleSelectAll}
                id="select-all-products"
              />
              <label htmlFor="select-all-products" className="cursor-pointer select-none">
                {selectedIds.length > 0 ? `${selectedIds.length} sélectionné(s)` : "Tout cocher"}
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
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold">Produit</th>
                  <th className="text-left p-4 font-semibold">Catégorie(s)</th>
                  <th className="text-right p-4 font-semibold">Prix</th>
                  <th className="text-center p-4 font-semibold">Stock</th>
                  <th className="text-center p-4 font-semibold">Livraison</th>
                  <th className="text-center p-4 font-semibold">En Ligne</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => {
                  const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
                  const isSelected = selectedIds.includes(p.id);
                  const hasWeightPrices = p.weight_prices && p.weight_prices.length > 1;

                  return (
                    <tr 
                      key={p.id} 
                      className={cn(
                        "hover:bg-muted/20 transition-colors group",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                      </td>

                      {/* Photo + Nom + Badges */}
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div 
                            onClick={() => openEdit(p)}
                            className="relative w-12 h-14 rounded-xl overflow-hidden border border-border/60 bg-muted/20 shrink-0 cursor-pointer shadow-2xs"
                          >
                            <img 
                              src={p.images[0] || "/placeholder.svg"} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p 
                              onClick={() => openEdit(p)}
                              className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer truncate max-w-xs"
                            >
                              {p.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {p.free_shipping && (
                                <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 py-0 px-2 rounded-md font-bold shadow-2xs">
                                  <Truck className="w-2.5 h-2.5" /> Gratuite
                                </Badge>
                              )}
                              {p.featured && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  <Star className="w-2.5 h-2.5 fill-current" /> Vedette
                                </span>
                              )}
                              {p.is_new && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                                  Nouveau
                                </span>
                              )}
                              {p.flavors && p.flavors.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {p.flavors.length} goût(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Catégories */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {productCats.length > 0 ? (
                            productCats.map((c) => (
                              <span 
                                key={c?.id} 
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                              >
                                {c?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">Sans catégorie</span>
                          )}
                        </div>
                      </td>

                      {/* Prix */}
                      <td className="p-4 text-right">
                        <div>
                          <span className="font-bold text-foreground font-sans text-sm">
                            {p.price.toLocaleString()} DH
                          </span>
                          {hasWeightPrices && (
                            <span className="block text-[10px] text-muted-foreground">
                              {p.weight_prices.length} déclinaisons
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock avec Pastille d'état */}
                      <td className="p-4 text-center">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Rupture
                          </span>
                        ) : p.stock < 5 && p.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {p.stock} restant(s)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {p.stock} unités
                          </span>
                        )}
                      </td>

                      {/* Livraison Gratuite (Quick Toggle) */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFreeShipping(p.id, !!p.free_shipping)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer",
                            p.free_shipping 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs" 
                              : "bg-muted/60 hover:bg-muted text-muted-foreground"
                          )}
                          title={p.free_shipping ? "Désactiver la livraison offerte" : "Activer la livraison offerte"}
                        >
                          <Truck className="w-3 h-3" />
                          <span>{p.free_shipping ? "Offerte" : "Payante"}</span>
                        </button>
                      </td>

                      {/* En Ligne (Switch) */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch 
                            checked={p.active} 
                            onCheckedChange={() => handleToggleActive(p.id, p.active)} 
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            asChild
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            title="Voir sur la boutique"
                          >
                            <Link to={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => openEdit(p)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setProductToDelete(p.id)}
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

            {filtered.length === 0 && (
              <div className="p-16 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Aucun produit ne correspond à vos critères</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Essayez de modifier vos filtres ou votre recherche.</p>
                </div>
              </div>
            )}
          </div>

          {/* Vue Mobile (Cartes Élégantes) */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => {
              const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  className={cn(
                    "p-3.5 rounded-2xl border border-border/70 bg-card space-y-3 transition-colors shadow-xs",
                    isSelected && "bg-primary/5 border-primary/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(p.id)}
                      className="mt-1"
                    />
                    <img 
                      src={p.images[0] || "/placeholder.svg"} 
                      alt={p.name} 
                      className="w-16 h-18 rounded-xl object-cover shrink-0 border border-border/50 bg-muted/20" 
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p 
                        onClick={() => openEdit(p)}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {p.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-foreground font-sans text-sm">
                          {p.price.toLocaleString()} DH
                        </span>
                        {p.free_shipping && (
                          <Badge className="text-[9px] bg-emerald-600 text-white gap-1 py-0 px-1.5 rounded">
                            <Truck className="w-2.5 h-2.5" /> Gratuite
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {productCats.map((c) => c?.name).join(", ") || "Sans catégorie"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={p.active} 
                        onCheckedChange={() => handleToggleActive(p.id, p.active)} 
                      />
                      <span className="text-muted-foreground text-[11px]">
                        {p.active ? "En ligne" : "Inactif"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                        <Link to={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="h-8 w-8 text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setProductToDelete(p.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Vue Grille (Design Boutique Visuelle) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const productCats = p.category_ids.map((cid) => categories.find((c) => c.id === cid)).filter(Boolean);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  className={cn(
                    "p-4 rounded-2xl border border-border/70 bg-card flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all group shadow-xs",
                    isSelected && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="space-y-3">
                    <div className="aspect-[4/5] sm:aspect-square w-full rounded-xl overflow-hidden bg-muted/20 border border-border/60 relative">
                      <img 
                        src={p.images[0] || "/placeholder.svg"} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      
                      {/* Checkbox flottante */}
                      <div className="absolute top-2.5 left-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className="bg-background/90 backdrop-blur-xs"
                        />
                      </div>

                      {/* Badges d'état flottants */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                        {p.stock === 0 ? (
                          <Badge variant="destructive" className="text-[10px] font-bold shadow-xs">Rupture</Badge>
                        ) : p.stock < 5 && p.active && (
                          <Badge className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs">Stock faible</Badge>
                        )}
                        {p.featured && (
                          <Badge className="text-[10px] bg-amber-500/90 text-white font-bold shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current mr-1" /> Vedette
                          </Badge>
                        )}
                      </div>

                      {p.free_shipping && (
                        <div className="absolute bottom-2.5 left-2.5">
                          <Badge className="text-[10px] bg-emerald-600 text-white gap-1 shadow-sm font-bold">
                            <Truck className="w-2.5 h-2.5" /> Livraison Gratuite
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate block">
                        {productCats.map((c) => c?.name).join(", ") || "Sans catégorie"}
                      </span>
                      <h3 
                        onClick={() => openEdit(p)}
                        className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                      >
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-bold text-foreground font-sans">
                          {p.price.toLocaleString()} DH
                        </span>
                        <span className={cn(
                          "text-xs font-semibold",
                          p.stock === 0 ? "text-destructive" : p.stock < 5 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {p.stock === 0 ? "Épuisé" : `${p.stock} en stock`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={p.active} 
                        onCheckedChange={() => handleToggleActive(p.id, p.active)} 
                      />
                      <span className="text-xs text-muted-foreground">{p.active ? "En ligne" : "Inactif"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <Link to={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setProductToDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="p-16 text-center text-muted-foreground rounded-2xl border border-border/70 bg-card">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-foreground">Aucun produit trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Élégant d'Ajout / Modification Produit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-7 rounded-2xl border-border/80 shadow-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Fiche Produit
              </span>
            </div>
            <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              {editingProduct?.id ? "Modifier le Produit" : "Nouveau Produit"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Configurez le nom, la tarification par poids, les photos et les traductions multilingues.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Colonne Gauche : Opérations, Stocks & Poids */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Bloc 1 : Informations Générales */}
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2 pb-2 border-b border-border/60">
                      <Package className="w-4 h-4" /> Informations Générales
                    </h3>
                    
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-foreground">Nom du produit (Français) *</label>
                      <Input 
                        value={editingProduct.name} 
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                          setEditingProduct({ ...editingProduct, name, slug });
                        }} 
                        placeholder="Ex: Eau de Rose Pure Bio"
                        className="rounded-xl h-10 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block text-foreground">Stock</label>
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
                          className="rounded-xl h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block text-foreground">En Ligne</label>
                        <div className="flex items-center h-10 gap-2.5 px-3 rounded-xl border border-border/60 bg-muted/20">
                          <Switch 
                            checked={editingProduct.active} 
                            onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, active: checked })} 
                          />
                          <span className="text-xs font-medium text-foreground">{editingProduct.active ? "Actif" : "Inactif"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Switch Livraison Gratuite */}
                    <div className="p-3.5 border border-border/70 rounded-xl bg-muted/20 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <label 
                            className="text-xs font-bold text-foreground cursor-pointer" 
                            onClick={() => setEditingProduct({ ...editingProduct, free_shipping: !editingProduct.free_shipping })}
                          >
                            Livraison 100% Offerte
                          </label>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Affiche le tag "Livraison Gratuite" sur ce produit
                        </p>
                      </div>
                      <Switch 
                        checked={editingProduct.free_shipping} 
                        onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, free_shipping: checked })} 
                      />
                    </div>
                    
                    {/* Catégories */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-foreground">Catégories *</label>
                      <div className="grid grid-cols-2 gap-2 p-3 border border-border/70 rounded-xl bg-muted/10 max-h-[140px] overflow-y-auto">
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

                  {/* Bloc 2 : Prix et Déclinaisons de Poids */}
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Prix & Formats *
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => {
                          const current = editingProduct.weight_prices || [];
                          setEditingProduct({
                            ...editingProduct,
                            weight_prices: [...current, { weight: "", price: 0 }]
                          });
                        }}
                      >
                        + Ajouter un format
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {(editingProduct.weight_prices || []).map((wp, idx) => (
                        <div key={idx} className="flex gap-2.5 items-end p-2.5 rounded-xl bg-muted/20 border border-border/60">
                          <div className="flex-1">
                            <span className="text-[10px] text-muted-foreground block mb-1 font-semibold">Poids / Format</span>
                            <Input
                              type="text"
                              value={wp.weight || ""}
                              placeholder="Ex: 250g, 100ml"
                              className="h-9 text-xs rounded-lg bg-background"
                              spellCheck={false}
                              onChange={(e) => {
                                const newWeightPrices = [...editingProduct.weight_prices];
                                newWeightPrices[idx] = { ...newWeightPrices[idx], weight: e.target.value };
                                setEditingProduct({ ...editingProduct, weight_prices: newWeightPrices });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] text-muted-foreground block mb-1 font-semibold">Prix (DH)</span>
                            <Input
                              type="number"
                              value={wp.price || ""}
                              placeholder="Ex: 80"
                              className="h-9 text-xs rounded-lg bg-background font-bold text-primary"
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
                            className="text-destructive h-9 w-9 shrink-0 hover:bg-destructive/10 rounded-lg"
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
                  </div>

                  {/* Bloc 3 : Galerie Photos */}
                  <div className="p-5 border border-border/70 rounded-2xl bg-card shadow-xs space-y-4">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-primary flex items-center gap-2 pb-2 border-b border-border/60">
                      <Sparkles className="w-4 h-4" /> Galerie Photos du Produit
                    </h3>
                    <div className="p-4 border border-border/70 border-dashed rounded-xl bg-muted/10 space-y-3">
                      <div className="flex flex-wrap gap-2.5">
                        {editingProduct.images.map((img, i) => (
                          <div key={i} className="relative w-20 h-24 rounded-xl overflow-hidden border border-border shadow-xs group bg-muted/40">
                            <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            
                            {/* Contrôles overlay au survol */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                              <div className="flex justify-between items-center w-full">
                                {i > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setAsCoverImage(i)}
                                    className="p-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                    title="Définir comme principale"
                                  >
                                    <Star className="w-3 h-3 fill-current" />
                                  </button>
                                ) : <div />}
                                <button 
                                  type="button" 
                                  onClick={() => removeImage(i)}
                                  className="p-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex justify-between w-full">
                                {i > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(i, "left")}
                                    className="p-1 bg-background text-foreground rounded-md hover:bg-muted"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {i < editingProduct.images.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveImage(i, "right")}
                                    className="p-1 bg-background text-foreground rounded-md hover:bg-muted ms-auto"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Badge Photo Principale */}
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-[8px] font-bold text-primary-foreground rounded shadow-xs z-10 uppercase">
                                Couverture
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full gap-2 border-dashed h-10 text-xs rounded-xl hover:border-primary/50" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "Upload en cours..." : "Téléverser de nouvelles photos"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Colonne Droite : Descriptions & Multilingue (FR / AR / EN) */}
                <div className="lg:col-span-7 space-y-6">
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
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Description courte (Français) *</label>
                          <Textarea 
                            value={editingProduct.description} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                            placeholder="Saisissez une description concise et accrocheuse..."
                            rows={3} 
                            className="rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Description détaillée & Bienfaits (Français)</label>
                          <Textarea 
                            value={editingProduct.long_description} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description: e.target.value })} 
                            placeholder="Saisissez la description complète, les bienfaits naturels, le rituel d'application..."
                            rows={6} 
                            className="rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Ingrédients / Composition (Français)</label>
                          <Input 
                            value={editingProduct.materials} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials: e.target.value })} 
                            placeholder="Ex: Huile d'argan pure, Beurre de karité, Vitamine E..." 
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Parfums / Variantes (Français - Séparés par des virgules)</label>
                          <Input 
                            value={(editingProduct.flavors || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors: flavorsArray });
                            }} 
                            placeholder="Ex: Nature, Lavande, Fleur d'oranger..." 
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </TabsContent>

                      {/* Onglet Arabe */}
                      <TabsContent value="ar" className="space-y-4 mt-0" dir="rtl">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">اسم المنتج (بالعربية)</label>
                          <Input 
                            value={editingProduct.name_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })} 
                            placeholder="اسم المنتج باللغة العربية..."
                            className="text-right rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">الوصف القصير (بالعربية)</label>
                          <Textarea 
                            value={editingProduct.description_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_ar: e.target.value })} 
                            placeholder="اكتب وصفاً موجزاً للمنتج..."
                            rows={3}
                            className="text-right rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">الوصف التفصيلي والفوائد (بالعربية)</label>
                          <Textarea 
                            value={editingProduct.long_description_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description_ar: e.target.value })} 
                            placeholder="اكتب تفاصيل المنتج، الفوائد وطريقة الاستعمال..."
                            rows={6}
                            className="text-right rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">المكونات (بالعربية)</label>
                          <Input 
                            value={editingProduct.materials_ar} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials_ar: e.target.value })} 
                            placeholder="المكونات الطبيعية..."
                            className="text-right rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-right">النكهات / الروائح (مفصولة بفاصلة)</label>
                          <Input 
                            value={(editingProduct.flavors_ar || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors_ar: flavorsArray });
                            }} 
                            placeholder="طبيعي, لافندر, ياسمين..."
                            className="text-right rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </TabsContent>

                      {/* Onglet Anglais */}
                      <TabsContent value="en" className="space-y-4 mt-0">
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Product Name (English)</label>
                          <Input 
                            value={editingProduct.name_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })} 
                            placeholder="Product name in English..."
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Short Description (English)</label>
                          <Textarea 
                            value={editingProduct.description_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, description_en: e.target.value })} 
                            placeholder="Enter a brief summary..."
                            rows={3} 
                            className="rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Long Description (English)</label>
                          <Textarea 
                            value={editingProduct.long_description_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, long_description_en: e.target.value })} 
                            placeholder="Enter comprehensive treatment details and ritual..."
                            rows={6} 
                            className="rounded-xl text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Ingredients / Materials (English)</label>
                          <Input 
                            value={editingProduct.materials_en} 
                            onChange={(e) => setEditingProduct({ ...editingProduct, materials_en: e.target.value })} 
                            placeholder="Ingredients..." 
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-foreground">Flavors / Varieties (English)</label>
                          <Input 
                            value={(editingProduct.flavors_en || []).join(", ")} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const flavorsArray = val.split(",").map(s => s.trimStart());
                              setEditingProduct({ ...editingProduct, flavors_en: flavorsArray });
                            }} 
                            placeholder="Natural, Lavender, Orange Blossom..." 
                            className="rounded-xl h-10 text-xs sm:text-sm"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action du Modal */}
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
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingProduct.id ? "Enregistrer les modifications" : "Créer le produit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation de Suppression */}
      <AlertDialog 
        open={!!productToDelete || isBulkDeleting} 
        onOpenChange={(open) => { if (!open) { setProductToDelete(null); setIsBulkDeleting(false); }}}
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
              {isBulkDeleting ? `Supprimer ${selectedIds.length} produits` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {isBulkDeleting 
                ? `Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedIds.length} produits du catalogue ?` 
                : "Êtes-vous sûr de vouloir supprimer définitivement ce produit du catalogue ?"
              } <br />
              Cette action est irréversible et supprimera les données associées.
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

export default AdminProducts;
