import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  usePacks,
  useAddPack,
  useUpdatePack,
  useDeletePack,
  useBulkDeletePacks,
  useTogglePackActive,
  useTogglePackFreeShipping,
  DbPack
} from "@/hooks/usePacks";
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
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Search,
  X,
  AlertTriangle,
  Upload,
  Globe,
  ChevronLeft,
  ChevronRight,
  Star,
  LayoutGrid,
  List,
  Truck,
  ExternalLink,
  Sparkles,
  Percent,
  Layers,
  CheckCircle2,
  XCircle,
  Eye,
  Tag,
  Clock
} from "lucide-react";

interface EditingPack {
  id?: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  ritual: string;
  price: number;
  image: string;
  images: string[];
  active: boolean;
  featured: boolean;
  free_shipping: boolean;
  items: { product_id: string; quantity: number; selected_weight?: string | null }[];
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  long_description_ar: string;
  long_description_en: string;
  ritual_ar: string;
  ritual_en: string;
}

const emptyPack: EditingPack = {
  name: "",
  slug: "",
  description: "",
  long_description: "",
  ritual: "",
  price: 0,
  image: "/placeholder.svg",
  images: [],
  active: true,
  featured: false,
  free_shipping: false,
  items: [],
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  long_description_ar: "",
  long_description_en: "",
  ritual_ar: "",
  ritual_en: "",
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

type FilterStatus = "all" | "active" | "inactive" | "free_shipping" | "featured";

const AdminPacks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: packs = [], isLoading } = usePacks();
  const { data: products = [] } = useProducts();
  const addPack = useAddPack();
  const updatePack = useUpdatePack();
  const deletePack = useDeletePack();
  const toggleActive = useTogglePackActive();
  const toggleFreeShipping = useTogglePackFreeShipping();
  const { toast } = useToast();

  const [editing, setEditing] = useState<EditingPack | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
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

    const draftKey = `pack_draft_${action}_${id || "new"}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setEditing(JSON.parse(savedDraft));
      return;
    }

    if (action === "new") {
      setEditing({ ...emptyPack, items: [] });
    } else if (action === "edit" && id && packs.length > 0) {
      const p = packs.find((item) => item.id === id);
      if (p) {
        const packItems = (p.items || [])
          .map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity || 1,
            selected_weight: i.selected_weight || null,
          }))
          .filter((i) => i.product_id);

        setEditing({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          long_description: p.long_description,
          ritual: (p as any).ritual || p.long_description || "",
          price: p.price,
          image: p.image,
          images: p.images || [],
          active: p.active,
          featured: p.featured,
          free_shipping: p.free_shipping ?? false,
          items: packItems,
          name_ar: p.name_ar || "",
          name_en: p.name_en || "",
          description_ar: p.description_ar || "",
          description_en: p.description_en || "",
          long_description_ar: p.long_description_ar || "",
          long_description_en: p.long_description_en || "",
          ritual_ar: (p as any).ritual_ar || p.long_description_ar || "",
          ritual_en: (p as any).ritual_en || p.long_description_en || "",
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
      const draftKey = `pack_draft_${action}_${id || "new"}`;
      localStorage.setItem(draftKey, JSON.stringify(editing));
    }
  }, [editing, dialogOpen, searchParams]);

  const clearDraft = () => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    localStorage.removeItem(`pack_draft_${action}_${id || "new"}`);
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

  const openEdit = (p: DbPack) => {
    setSearchParams({ action: "edit", id: p.id });
  };

  const handleToggleFreeShipping = (id: string, current: boolean) => {
    toggleFreeShipping.mutate({ id, free_shipping: !current });
  };

  // KPIs
  const stats = useMemo(() => {
    const total = packs.length;
    const active = packs.filter((p) => p.active).length;
    const freeShipping = packs.filter((p) => p.free_shipping).length;
    const totalItemsCount = packs.reduce((acc, p) => acc + (p.items?.length || 0), 0);
    const featured = packs.filter((p) => p.featured).length;

    return { total, active, freeShipping, totalItemsCount, featured };
  }, [packs]);

  // Filtering
  const filtered = useMemo(() => {
    return packs.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.items.some((i) => i.product_name?.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "active") return p.active;
      if (statusFilter === "inactive") return !p.active;
      if (statusFilter === "free_shipping") return !!p.free_shipping;
      if (statusFilter === "featured") return !!p.featured;

      return true;
    });
  }, [packs, search, statusFilter]);

  const toggleProduct = (pid: string) => {
    if (!editing) return;
    const exists = editing.items.some((item) => item.product_id === pid);
    let updatedItems;
    if (exists) {
      updatedItems = editing.items.filter((item) => item.product_id !== pid);
    } else {
      const prod = products.find((p) => p.id === pid);
      const defaultWeight = prod?.weight_prices?.[0]?.weight || prod?.weight || null;
      updatedItems = [
        ...editing.items,
        {
          product_id: pid,
          quantity: 1,
          selected_weight: defaultWeight ? String(defaultWeight) : null,
        },
      ];
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
      toast({ title: "Images uploadées avec succès" });
    } catch {
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
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!editing?.name || !editing.price || editing.items.length === 0) {
      toast({
        title: "Champs incomplets",
        description: "Veuillez renseigner le nom, le prix et ajouter au moins un produit.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const slug =
      editing.slug ||
      editing.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const ritualVal = editing.ritual || editing.long_description || "";
    const ritualArVal = editing.ritual_ar || editing.long_description_ar || "";
    const ritualEnVal = editing.ritual_en || editing.long_description_en || "";

    try {
      const coverImage = editing.images?.[0] || "/placeholder.svg";
      if (editing.id) {
        await updatePack.mutateAsync({
          id: editing.id,
          updates: {
            name: editing.name,
            slug,
            description: editing.description,
            long_description: ritualVal,
            ritual: ritualVal,
            price: editing.price,
            image: coverImage,
            active: editing.active,
            featured: editing.featured,
            free_shipping: editing.free_shipping,
            name_ar: editing.name_ar,
            name_en: editing.name_en,
            description_ar: editing.description_ar,
            description_en: editing.description_en,
            long_description_ar: ritualArVal,
            long_description_en: ritualEnVal,
            ritual_ar: ritualArVal,
            ritual_en: ritualEnVal,
          },
          images: editing.images || [],
          items: editing.items,
        });
        toast({ title: "Pack mis à jour avec succès" });
      } else {
        await addPack.mutateAsync({
          name: editing.name,
          slug,
          description: editing.description,
          long_description: ritualVal,
          ritual: ritualVal,
          price: editing.price,
          image: coverImage,
          images: editing.images || [],
          active: editing.active,
          featured: editing.featured,
          free_shipping: editing.free_shipping,
          items: editing.items,
          name_ar: editing.name_ar,
          name_en: editing.name_en,
          description_ar: editing.description_ar,
          description_en: editing.description_en,
          long_description_ar: ritualArVal,
          long_description_en: ritualEnVal,
          ritual_ar: ritualArVal,
          ritual_en: ritualEnVal,
        });
        toast({ title: "Pack créé avec succès" });
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
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement des packs & coffrets...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 px-2.5 py-0.5 rounded-full">
                Catalogue & Coffrets
              </span>
              <span className="text-xs text-muted-foreground">• {packs.length} coffrets enregistrés</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Gestion des Packs & Rituels
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Composez des coffrets bien-être sur mesure, associez des rituels synergiques et valorisez les économies offertes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleting(true)}
                className="rounded-xl gap-2 shadow-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ({selectedIds.length})
              </Button>
            )}
            <Button
              onClick={openNew}
              className="btn-premium rounded-xl px-5 h-11 gap-2 shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau Coffret
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Coffrets</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {stats.featured} mis en vedette
              </p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Packs En Ligne</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">{stats.active}</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% du catalogue actif
              </p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Soins Rattachés</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">{stats.totalItemsCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                ~{stats.total > 0 ? (stats.totalItemsCount / stats.total).toFixed(1) : 0} soins par coffret
              </p>
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Livraison Offerte</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">{stats.freeShipping}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Éligibles expédition gratuite
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Tous ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                En ligne ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === "inactive"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Inactifs ({stats.total - stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("free_shipping")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === "free_shipping"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Livraison Offerte ({stats.freeShipping})
              </button>
              <button
                onClick={() => setStatusFilter("featured")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === "featured"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                En vedette ({stats.featured})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-border/60 rounded-xl p-1 bg-muted/30 self-end lg:self-auto shrink-0">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3 gap-1.5 rounded-lg text-xs"
              >
                <List className="w-3.5 h-3.5" />
                <span>Liste</span>
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3 gap-1.5 rounded-lg text-xs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grille</span>
              </Button>
            </div>
          </div>

          {/* Search + Bulk Selection Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, slug ou soin inclus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9 h-10 rounded-xl bg-background/50 border-border/70 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onCheckedChange={toggleSelectAll}
                  id="select-all-packs"
                  className="rounded-md"
                />
                <label
                  htmlFor="select-all-packs"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Tout sélectionner ({filtered.length})
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Content Section: List vs Grid */}
        {viewMode === "list" ? (
          <>
            {/* Desktop Luxury Table */}
            <div className="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-sm hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/60 text-xs text-muted-foreground">
                    <th className="p-3.5 w-12 text-center">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onCheckedChange={toggleSelectAll}
                        className="rounded-md"
                      />
                    </th>
                    <th className="text-left p-3.5 font-semibold">Coffret / Pack</th>
                    <th className="text-left p-3.5 font-semibold">Composition ({products.length} réf. dispo)</th>
                    <th className="text-right p-3.5 font-semibold">Prix & Valeur</th>
                    <th className="text-center p-3.5 font-semibold">Livraison</th>
                    <th className="text-center p-3.5 font-semibold">Statut</th>
                    <th className="text-right p-3.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((p) => {
                    const isSelected = selectedIds.includes(p.id);

                    // Compute total retail value of individual products inside this pack
                    const totalRetailValue = p.items.reduce((s, item) => {
                      const prod = products.find((prod) => prod.id === item.product_id);
                      if (!prod) return s;
                      return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                    }, 0);

                    const savings = totalRetailValue > p.price ? totalRetailValue - p.price : 0;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-muted/20 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p.id)}
                            className="rounded-md"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-xl border border-border/60 bg-muted/40 overflow-hidden shrink-0 relative group">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary/40">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                              {p.featured && (
                                <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                                  {p.name}
                                </p>
                                <a
                                  href={`/pack/${p.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground/60 hover:text-primary p-0.5 rounded transition-colors"
                                  title="Voir sur la boutique"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">/pack/{p.slug}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full font-normal">
                                  {p.items.length} soins inclus
                                </Badge>
                                {p.images && p.images.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    • {p.images.length} photos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {p.items.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-lg border border-border/40 font-medium"
                              >
                                {item.product_name}
                                {item.selected_weight && (
                                  <span className="text-[10px] text-primary font-semibold">
                                    ({item.selected_weight})
                                  </span>
                                )}
                              </span>
                            ))}
                            {p.items.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-medium self-center">
                                +{p.items.length - 3} autre(s)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-base text-foreground">{p.price} DH</span>
                            {totalRetailValue > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                                <span className="text-muted-foreground line-through">
                                  {totalRetailValue} DH
                                </span>
                                {savings > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    -{savings} DH
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFreeShipping(p.id, !!p.free_shipping)}
                            className="inline-flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 px-2.5 py-1 rounded-full border text-xs font-medium"
                            title={p.free_shipping ? "Désactiver la gratuité" : "Activer la gratuité"}
                          >
                            {p.free_shipping ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                                <Truck className="w-3 h-3" /> Offerte
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px] hover:text-foreground">
                                Standard
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={p.active}
                              onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })}
                            />
                            <span
                              className={`text-xs font-medium ${
                                p.active ? "text-emerald-600" : "text-muted-foreground"
                              }`}
                            >
                              {p.active ? "En ligne" : "Masqué"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => openEdit(p)}
                              title="Modifier le pack"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => setPackToDelete(p.id)}
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
                <div className="py-20 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
                  <p className="text-base font-medium text-foreground">Aucun coffret trouvé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Essayez de modifier votre recherche ou ajoutez un nouveau pack.
                  </p>
                </div>
              )}
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const totalRetailValue = p.items.reduce((s, item) => {
                  const prod = products.find((prod) => prod.id === item.product_id);
                  if (!prod) return s;
                  return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                }, 0);
                const savings = totalRetailValue > p.price ? totalRetailValue - p.price : 0;

                return (
                  <div
                    key={p.id}
                    className={`border border-border/70 rounded-2xl p-4 bg-card space-y-3.5 transition-all shadow-sm ${
                      isSelected ? "border-primary/40 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(p.id)}
                        className="rounded-md mt-1"
                      />
                      <div className="w-16 h-16 rounded-xl border border-border/60 bg-muted/40 overflow-hidden shrink-0 relative">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary/40">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        {p.featured && (
                          <span className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <Star className="w-2 h-2 fill-current" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                            {p.name}
                          </h3>
                          <a
                            href={`/pack/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary p-0.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-foreground">{p.price} DH</span>
                          {savings > 0 && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold">
                              Éco: {savings} DH
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full">
                            {p.items.length} soins
                          </Badge>
                          {p.free_shipping && (
                            <Badge className="text-[10px] bg-emerald-600 text-white py-0 px-2 rounded-full gap-1">
                              <Truck className="w-2.5 h-2.5" /> Livraison Offerte
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.active}
                          onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })}
                        />
                        <span className="text-xs text-muted-foreground">{p.active ? "En ligne" : "Masqué"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-destructive"
                          onClick={() => setPackToDelete(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-16 text-center text-muted-foreground bg-card border border-border/70 rounded-2xl p-6">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
                  <p className="font-medium text-sm">Aucun coffret trouvé</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const totalRetailValue = p.items.reduce((s, item) => {
                const prod = products.find((prod) => prod.id === item.product_id);
                if (!prod) return s;
                return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
              }, 0);
              const savings = totalRetailValue > p.price ? totalRetailValue - p.price : 0;

              return (
                <div
                  key={p.id}
                  className={`bg-card border border-border/70 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? "border-primary/50 ring-2 ring-primary/20" : ""
                  }`}
                >
                  <div>
                    {/* Media Header */}
                    <div className="aspect-[4/3] w-full bg-muted/40 relative overflow-hidden group">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/40">
                          <Package className="w-10 h-10" />
                        </div>
                      )}

                      {/* Top Action Pills */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className="bg-background/90 rounded-md shadow-sm"
                        />
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                        {p.featured && (
                          <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-sm" title="En vedette">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                        <a
                          href={`/pack/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-background/90 backdrop-blur text-foreground hover:text-primary transition-colors shadow-sm"
                          title="Voir sur le site"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Bottom Image Badges */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <Badge className="bg-background/95 backdrop-blur text-foreground text-[10px] font-semibold py-0.5 px-2 rounded-lg shadow-sm border border-border/50">
                          {p.items.length} soins inclus
                        </Badge>
                        {p.free_shipping && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-semibold py-0.5 px-2 rounded-lg shadow-sm gap-1">
                            <Truck className="w-3 h-3" /> Offerte
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-1 hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">/pack/{p.slug}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Prix coffret :</span>
                          <span className="text-base font-bold text-foreground">{p.price} DH</span>
                        </div>
                        {totalRetailValue > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Valeur réelle :</span>
                            <div className="flex items-center gap-1.5">
                              <span className="line-through">{totalRetailValue} DH</span>
                              {savings > 0 && (
                                <span className="text-emerald-600 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">
                                  -{savings} DH
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Contenu :
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40 font-medium truncate max-w-[140px]"
                            >
                              {it.product_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.active}
                        onCheckedChange={() => toggleActive.mutate({ id: p.id, active: !p.active })}
                      />
                      <span className="text-xs text-muted-foreground">{p.active ? "Actif" : "Masqué"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => openEdit(p)}
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-destructive"
                        onClick={() => setPackToDelete(p.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Luxury Add / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto p-5 sm:p-7 rounded-3xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-serif text-2xl font-bold">
                  {editing?.id ? "Modifier le Coffret" : "Nouveau Coffret Cadeau & Soin"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Définissez la composition, l'imagerie et les rituels associés à ce pack.
                </p>
              </div>
              {editing?.id && (
                <a
                  href={`/pack/${editing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Voir sur le site
                </a>
              )}
            </div>
          </DialogHeader>

          {editing && (
            <div className="space-y-6 pt-3">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                {/* Left Column: General Info, Images & Composition */}
                <div className="lg:col-span-5 space-y-6">
                  {/* General Details Box */}
                  <div className="p-4 border border-border/70 rounded-2xl bg-card space-y-4 shadow-sm">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" /> Informations Générales
                    </h3>

                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">
                        Nom du pack (Français) *
                      </label>
                      <Input
                        value={editing.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const slug = name
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-]/g, "");
                          setEditing({ ...editing, name, slug });
                        }}
                        placeholder="Ex: Box Nifas Complète (40 Jours)"
                        className="rounded-xl h-10 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">
                          Prix du pack (DH) *
                        </label>
                        <Input
                          type="number"
                          value={editing.price === 0 ? "" : editing.price}
                          onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                          placeholder="0"
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground mb-1.5 block">Slug URL</label>
                        <Input
                          value={editing.slug}
                          onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                          placeholder="box-nifas"
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                      <label className="flex items-center justify-between text-xs cursor-pointer">
                        <span className="font-medium text-foreground">Pack actif en boutique</span>
                        <Switch
                          checked={editing.active}
                          onCheckedChange={(v) => setEditing({ ...editing, active: !!v })}
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs cursor-pointer">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> Mettre en vedette
                        </span>
                        <Switch
                          checked={editing.featured}
                          onCheckedChange={(v) => setEditing({ ...editing, featured: !!v })}
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs cursor-pointer pt-1 border-t border-border/30">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Livraison offerte
                        </span>
                        <Switch
                          checked={editing.free_shipping}
                          onCheckedChange={(v) => setEditing({ ...editing, free_shipping: !!v })}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Multi-Image Gallery */}
                  <div className="p-4 border border-border/70 rounded-2xl bg-card space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" /> Galerie Photos ({editing.images?.length || 0})
                      </h3>
                      <span className="text-[10px] text-muted-foreground">Première image = Couverture</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(editing.images || []).map((img, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/70 shadow-sm group bg-muted"
                        >
                          <img
                            src={img}
                            alt={`Image ${i + 1}`}
                            className="w-full h-full object-cover absolute inset-0"
                          />

                          {/* Controls Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-between p-1">
                            <div className="flex justify-between items-center w-full">
                              {i > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setAsCoverImage(i)}
                                  className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                  title="Définir comme photo principale"
                                >
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                title="Supprimer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="flex justify-between w-full">
                              {i > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => moveImage(i, "left")}
                                  className="p-1 bg-background text-foreground rounded hover:bg-accent transition-colors"
                                  title="Déplacer vers la gauche"
                                >
                                  <ChevronLeft className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}
                              {i < (editing.images || []).length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => moveImage(i, "right")}
                                  className="p-1 bg-background text-foreground rounded hover:bg-accent transition-colors"
                                  title="Déplacer vers la droite"
                                >
                                  <ChevronRight className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}
                            </div>
                          </div>

                          {i === 0 && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-primary text-[8px] font-semibold text-primary-foreground rounded-full shadow-sm z-20">
                              Cover
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
                      className="w-full gap-2 border-dashed rounded-xl h-10 text-xs font-medium"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-4 h-4 text-primary" />
                      )}
                      {uploading ? "Compression & Envoi WebP..." : "Ajouter des photos au pack"}
                    </Button>
                  </div>

                  {/* Included Products Box */}
                  <div className="p-4 border border-border/70 rounded-2xl bg-card space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" /> Soins Inclus ({editing.items.length}) *
                      </h3>
                      <span className="text-[10px] text-primary font-bold">Sélectionnez les références</span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Filtrer les produits par nom..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-xl"
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

                    {/* Products Checklist */}
                    <div className="space-y-1.5 max-h-[190px] overflow-y-auto border border-border/60 rounded-xl p-2.5 bg-muted/10">
                      {products
                        .filter((p) => p.active)
                        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((p) => {
                          const isChecked = editing.items.some((i) => i.product_id === p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-3 text-xs cursor-pointer p-2 rounded-xl transition-all border ${
                                isChecked
                                  ? "bg-primary/5 border-primary/30"
                                  : "hover:bg-background border-transparent"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleProduct(p.id)}
                                className="rounded-md"
                              />
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/60 shrink-0 bg-muted">
                                <img
                                  src={p.images[0] || "/placeholder.svg"}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">{p.price} DH</p>
                              </div>
                            </label>
                          );
                        })}
                    </div>

                    {/* Weight selectors for chosen products */}
                    {editing.items.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Grammage / Variante par soin
                        </label>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {editing.items.map((item) => {
                            const prod = products.find((p) => p.id === item.product_id);
                            if (!prod) return null;

                            const weights =
                              prod.weight_prices && prod.weight_prices.length > 0
                                ? prod.weight_prices.map((wp) => String(wp.weight))
                                : prod.weight
                                ? [String(prod.weight)]
                                : [];

                            return (
                              <div
                                key={item.product_id}
                                className="flex items-center justify-between gap-3 p-2 bg-muted/30 rounded-xl border border-border/50 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={prod.images[0] || "/placeholder.svg"}
                                    alt={prod.name}
                                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate text-[11px] text-foreground">{prod.name}</p>
                                    <p className="text-[9px] text-muted-foreground">
                                      {getProductPriceForWeight(prod, item.selected_weight)} DH
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-muted-foreground">Poids :</span>
                                  {weights.length === 0 ? (
                                    <span className="text-[10px] text-muted-foreground font-medium">Unique</span>
                                  ) : (
                                    <select
                                      value={item.selected_weight || weights[0] || ""}
                                      onChange={(e) => updateProductWeight(item.product_id, e.target.value)}
                                      className="border border-input bg-background rounded-lg px-2 py-0.5 text-xs focus:ring-1 focus:ring-primary/20 focus:border-primary focus:outline-none"
                                    >
                                      {weights.map((w) => (
                                        <option key={w} value={w}>
                                          {w}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Savings Calculator */}
                    {editing.items.length > 0 && (
                      <div className="p-3.5 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-2xl border border-primary/20 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Valeur cumulée des soins :</span>
                          <span className="font-semibold line-through text-muted-foreground">
                            {editing.items.reduce((s, item) => {
                              const prod = products.find((p) => p.id === item.product_id);
                              if (!prod) return s;
                              return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                            }, 0)}{" "}
                            DH
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-primary">Prix coffret proposé :</span>
                          <span className="font-bold text-sm text-primary">{editing.price} DH</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-primary/10">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Avantage client immédiat :
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {editing.items.reduce((s, item) => {
                              const prod = products.find((p) => p.id === item.product_id);
                              if (!prod) return s;
                              return s + getProductPriceForWeight(prod, item.selected_weight) * (item.quantity || 1);
                            }, 0) - editing.price}{" "}
                            DH
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Multi-Language Content Tabs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-5 border border-border/70 rounded-2xl bg-card space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                      <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" /> Rituels, Descriptions & Traductions
                      </h3>
                      <span className="text-[10px] text-muted-foreground">FR / AR / EN</span>
                    </div>

                    <Tabs defaultValue="fr" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-5 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="fr" className="rounded-lg text-xs py-2 font-medium">
                          Français (FR)
                        </TabsTrigger>
                        <TabsTrigger value="ar" className="rounded-lg text-xs py-2 font-medium">
                          العربية (AR)
                        </TabsTrigger>
                        <TabsTrigger value="en" className="rounded-lg text-xs py-2 font-medium">
                          English (EN)
                        </TabsTrigger>
                      </TabsList>

                      {/* FR Content */}
                      <TabsContent value="fr" className="space-y-4 mt-0 focus-visible:ring-0">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">
                            Description & Bienfaits du coffret (Français) *
                          </label>
                          <Textarea
                            value={editing.description}
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                            placeholder="Accroche commerciale résumant la promesse et les bienfaits du pack..."
                            rows={3}
                            className="rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              Rituel d'application & Ordre des soins (Français)
                            </label>
                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Section 'Rituel' de la fiche</span>
                          </div>
                          <Textarea
                            value={editing.ritual || editing.long_description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditing({ ...editing, ritual: val, long_description: val });
                            }}
                            placeholder="Détaillez le rituel d'utilisation pas à pas (ordre des soins, matin/soir, synergies des produits)..."
                            rows={7}
                            className="rounded-xl text-sm"
                          />
                        </div>
                      </TabsContent>

                      {/* AR Content */}
                      <TabsContent value="ar" className="space-y-4 mt-0 focus-visible:ring-0" dir="rtl">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block text-right">
                            اسم الباقة (بالعربية)
                          </label>
                          <Input
                            value={editing.name_ar}
                            onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                            placeholder="اسم الباقة بالعربية..."
                            className="text-right rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block text-right">
                            الوصف المختصر والفوائد (بالعربية)
                          </label>
                          <Textarea
                            value={editing.description_ar}
                            onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })}
                            placeholder="اكتب وصفاً موجزاً وجذاباً للباقة وفوائدها..."
                            rows={3}
                            className="text-right rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">يظهر في خانة طقوس الاستخدام</span>
                            <label className="text-xs font-semibold text-right flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              طقوس وطريقة الاستعمال للباقة (بالعربية)
                            </label>
                          </div>
                          <Textarea
                            value={editing.ritual_ar || editing.long_description_ar}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditing({ ...editing, ritual_ar: val, long_description_ar: val });
                            }}
                            placeholder="شرح مفصل لطريقة الاستخدام خطوة بخطوة وترتيب المنتجات..."
                            rows={7}
                            className="text-right rounded-xl text-sm"
                          />
                        </div>
                      </TabsContent>

                      {/* EN Content */}
                      <TabsContent value="en" className="space-y-4 mt-0 focus-visible:ring-0">
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">
                            Pack Name (English)
                          </label>
                          <Input
                            value={editing.name_en}
                            onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                            placeholder="Pack name in English..."
                            className="rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">
                            Short Description (English)
                          </label>
                          <Textarea
                            value={editing.description_en}
                            onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                            placeholder="Short overview of the pack benefits..."
                            rows={3}
                            className="rounded-xl text-sm"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              Application Ritual & Usage Steps (English)
                            </label>
                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">'Ritual' tab section</span>
                          </div>
                          <Textarea
                            value={editing.ritual_en || editing.long_description_en}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditing({ ...editing, ritual_en: val, long_description_en: val });
                            }}
                            placeholder="Detailed explanation of the ritual steps and product sequence..."
                            rows={7}
                            className="rounded-xl text-sm"
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-11 text-sm font-medium"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-premium flex-1 rounded-xl h-11 gap-2 text-sm font-medium shadow-md"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing.id ? "Enregistrer les modifications" : "Créer le coffret"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!packToDelete || isBulkDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setPackToDelete(null);
            setIsBulkDeleting(false);
          }
        }}
      >
        <AlertDialogContent
          className="rounded-3xl p-6"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="font-serif text-xl font-bold">
              {isBulkDeleting ? `Supprimer ${selectedIds.length} coffrets` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {isBulkDeleting
                ? `Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedIds.length} packs ?`
                : "Êtes-vous sûr de vouloir supprimer définitivement ce pack ?"}
              <br />
              Cette action est irréversible et supprimera le pack de la boutique en ligne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5 pt-2">
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-medium"
            >
              Supprimer {isBulkDeleting ? `(${selectedIds.length})` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminPacks;
