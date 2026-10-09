import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { usePromotions, useCreatePromotion, useUpdatePromotion, useDeletePromotion, useBulkDeletePromotions, Promotion, TierRule } from "@/hooks/usePromotions";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { usePacks } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Zap, Tag, Percent, ShoppingCart, Star, Loader2, AlertTriangle, Search, Calendar, Clock, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

const PROMO_TYPES = [
  { value: "percentage", label: "Réduction %", icon: Percent },
  /* { value: "flash", label: "Offre Flash", icon: Zap },
  { value: "buy_x_get_y", label: "X acheté Y offert", icon: ShoppingCart },
  { value: "tiered", label: "Palier de réduction", icon: Tag },
  { value: "product_of_day", label: "Produit du jour", icon: Star }, */
];

const defaultForm = {
  name: "",
  type: "percentage",
  discount_percent: 10,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  is_flash: false,
  buy_quantity: 2,
  get_quantity: 1,
  get_product_id: "" as string | null,
  buy_product_id: "" as string,
  tier_rules: [{ min_qty: 3, discount_percent: 10 }, { min_qty: 5, discount_percent: 20 }] as TierRule[],
  target_type: "all",
  product_ids: [] as string[],
  category_ids: [] as string[],
  pack_ids: [] as string[],
  target_weights: {} as Record<string, string[]>,
  active: true,
};

const AdminPromotions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: promotions = [], isLoading } = usePromotions();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: packs = [] } = usePacks();
  const createMut = useCreatePromotion();
  const updateMut = useUpdatePromotion();
  const deleteMut = useDeletePromotion();
  const { toast } = useToast();

  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(defaultForm);
  const bulkDeletePromos = useBulkDeletePromotions();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [productXSearchOpen, setProductXSearchOpen] = useState(false);
  const [productYSearchOpen, setProductYSearchOpen] = useState(false);

  const action = searchParams.get("action");
  const id = searchParams.get("id");

  // Sync dialog state with URL
  const dialogOpen = action === "edit" || action === "new";

  useEffect(() => {
    if (!dialogOpen) {
      setEditing(null);
      return;
    }

    const draftKey = `promo_draft_${action}_${id || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        setForm(JSON.parse(savedDraft));
        return;
      } catch {
        localStorage.removeItem(draftKey);
      }
    }

    if (action === "new") {
      setForm(defaultForm);
      setEditing(null);
    } else if (action === "edit" && id && promotions.length > 0) {
      const p = promotions.find(promo => promo.id === id);
      if (p) {
        setEditing(p);
        setForm({
          name: p.name,
          type: p.type,
          discount_percent: p.discount_percent,
          starts_at: p.starts_at ? p.starts_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
          ends_at: p.ends_at ? p.ends_at.slice(0, 16) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
          is_flash: p.is_flash,
          buy_quantity: p.buy_quantity || 2,
          get_quantity: p.get_quantity || 1,
          get_product_id: p.get_product_id || "",
          buy_product_id: p.type === "buy_x_get_y"
            ? ((p.product_ids && p.product_ids.length > 0) ? p.product_ids[0] : ((p.pack_ids && p.pack_ids.length > 0) ? p.pack_ids[0] : ""))
            : "",
          tier_rules: p.tier_rules || [{ min_qty: 3, discount_percent: 10 }],
          target_type: p.target_type,
          product_ids: p.product_ids || [],
          category_ids: p.category_ids || [],
          pack_ids: p.pack_ids || [],
          target_weights: (p.target_weights as Record<string, string[]>) || {},
          active: p.active,
        });
      }
    }
  }, [action, id, dialogOpen]);

  // Save draft whenever form changes
  useEffect(() => {
    if (dialogOpen && action) {
      const draftKey = `promo_draft_${action}_${id || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(form));
    }
  }, [form, dialogOpen, action, id]);

  const clearDraft = () => {
    if (action) {
      const draftKey = `promo_draft_${action}_${id || 'new'}`;
      localStorage.removeItem(draftKey);
    }
  };

  const setDialogOpen = (open: boolean) => {
    if (!open) {
      clearDraft();
      setSearchParams({});
    }
  };

  const openCreate = () => { setSearchParams({ action: "new" }); };
  const openEdit = (p: Promotion) => { setSearchParams({ action: "edit", id: p.id }); };

  const filtered = promotions.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const selectableItems = [
    ...products.map(p => ({
      id: p.id,
      name: p.name,
      type: "product" as const,
      image: p.images?.[0] || "/placeholder.svg",
      label: `[Produit] ${p.name}`
    })),
    ...packs.map(p => ({
      id: p.id,
      name: p.name,
      type: "pack" as const,
      image: p.image || "/placeholder.svg",
      label: `[Pack] ${p.name}`
    }))
  ];



  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Le nom est requis", variant: "destructive" });
      return;
    }
    const isBuyXGetY = form.type === "buy_x_get_y";
    if (isBuyXGetY && !form.buy_product_id) {
      toast({ title: "Le produit ou pack acheté (X) est requis", variant: "destructive" });
      return;
    }

    const selectedXIsPack = isBuyXGetY && packs.some(pk => pk.id === form.buy_product_id);
    const selectedYIsPack = isBuyXGetY && packs.some(pk => pk.id === form.get_product_id);

    const payload = {
      name: form.name,
      type: form.type,
      discount_percent: form.discount_percent,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      is_flash: form.type === "flash",
      buy_quantity: isBuyXGetY ? form.buy_quantity : null,
      get_quantity: isBuyXGetY ? form.get_quantity : null,
      get_product_id: isBuyXGetY && form.get_product_id ? form.get_product_id : null,
      tier_rules: form.type === "tiered" ? form.tier_rules : null,
      target_type: isBuyXGetY ? (selectedXIsPack ? "specific_packs" : "specific_products") : form.target_type,
      product_ids: isBuyXGetY
        ? (!selectedXIsPack && form.buy_product_id ? [form.buy_product_id] : [])
        : (form.target_type === "specific_products" ? form.product_ids : []),
      category_ids: (!isBuyXGetY && (form.target_type === "specific_categories" || form.target_type === "all_categories")) ? form.category_ids : [],
      pack_ids: isBuyXGetY
        ? (selectedXIsPack && form.buy_product_id ? [form.buy_product_id] : [])
        : (form.target_type === "specific_packs" ? form.pack_ids : []),
      target_weights: (!isBuyXGetY && form.target_type === "specific_products") ? form.target_weights : null,
      active: form.active,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Promotion modifiée" });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: "Promotion créée" });
      }
      clearDraft();
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur lors de l'enregistrement", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      if (isBulkDeleting) {
        await bulkDeletePromos.mutateAsync(selectedIds);
        toast({ title: `${selectedIds.length} promotions supprimées` });
        setSelectedIds([]);
        setIsBulkDeleting(false);
      } else if (promoToDelete) {
        await deleteMut.mutateAsync(promoToDelete);
        toast({ title: "Promotion supprimée" });
        setPromoToDelete(null);
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === promotions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(promotions.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isActive = (p: Promotion) => {
    if (!p.active) return false;
    const now = new Date();
    return new Date(p.starts_at) <= now && new Date(p.ends_at) > now;
  };

  const toggleProductId = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter(pid => pid !== id)
        : [...f.product_ids, id],
    }));
  };

  const toggleCategoryId = (id: string) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(cid => cid !== id)
        : [...f.category_ids, id],
    }));
  };

  const togglePackId = (id: string) => {
    setForm(f => ({
      ...f,
      pack_ids: f.pack_ids.includes(id)
        ? f.pack_ids.filter(pid => pid !== id)
        : [...f.pack_ids, id],
    }));
  };

  const addTierRule = () => {
    setForm(f => ({ ...f, tier_rules: [...f.tier_rules, { min_qty: 1, discount_percent: 5 }] }));
  };

  const updateTierRule = (i: number, field: keyof TierRule, val: number) => {
    setForm(f => {
      const rules = [...f.tier_rules];
      rules[i] = { ...rules[i], [field]: val };
      return { ...f, tier_rules: rules };
    });
  };

  const removeTierRule = (i: number) => {
    setForm(f => ({ ...f, tier_rules: f.tier_rules.filter((_, idx) => idx !== i) }));
  };

  const typeInfo = (type: string) => PROMO_TYPES.find(t => t.value === type) || PROMO_TYPES[0];

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
            <h1 className="font-serif text-3xl font-bold tracking-tight">Promotions Produits</h1>
            <p className="text-sm text-muted-foreground">{promotions.length} promotion(s)</p>
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
            <Button onClick={openCreate} className="gap-2 rounded-none flex-1 sm:flex-initial">
              <Plus className="w-4 h-4" /> Nouvelle Promotion
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:pl-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une promotion..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 h-10" 
            />
          </div>
          {promotions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <Checkbox 
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Tout sélectionner
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const info = typeInfo(p.type);
            const Icon = info.icon;
            const active = isActive(p);
            const isSelected = selectedIds.includes(p.id);
            return (
              <Card key={p.id} className={`transition-colors ${!active ? "opacity-60" : ""} ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(p.id)}
                      className="mt-1"
                    />
                    <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{p.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{info.label}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {p.discount_percent > 0 && (
                              <Badge variant="secondary" className="text-xs">-{p.discount_percent}%</Badge>
                            )}
                            {p.is_flash && <Badge variant="destructive" className="text-xs">Flash</Badge>}
                            {p.type === "buy_x_get_y" && (
                              <Badge variant="secondary" className="text-xs">{p.buy_quantity} acheté(s) → {p.get_quantity} offert(s)</Badge>
                            )}
                            {p.type === "tiered" && p.tier_rules && (
                              <Badge variant="secondary" className="text-xs">{p.tier_rules.length} palier(s)</Badge>
                            )}
                            <Badge variant={active ? "default" : "outline"} className="text-xs">
                              {active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {new Date(p.starts_at).toLocaleDateString("fr-FR")} → {new Date(p.ends_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setPromoToDelete(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {promotions.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Aucune promotion</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing ? "Modifier la promotion" : "Nouvelle promotion"}</DialogTitle>
             <DialogDescription>
               Configurez les détails et les règles de votre promotion ci-dessous.
             </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Rules & Config */}
              <div className="space-y-6">
                {/* General Info */}
                <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                  <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Détails de la Promotion
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nom de la promotion *</label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      placeholder="Ex: Black Friday -30%" 
                      className="h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      spellCheck={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Type de promotion</label>
                      {/* <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, is_flash: v === "flash" })}>
                        <SelectTrigger className="h-10 focus:ring-1 focus:ring-primary/20 focus:border-primary"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROMO_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}
                      <Input value="Réduction %" readOnly className="h-10 pointer-events-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Réduction (%) *</label>
                      <Input 
                        type="number" 
                        min={1} 
                        max={100} 
                        value={form.discount_percent}
                        onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} 
                        className="h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Statut</label>
                      <div className="flex items-center h-10 gap-3 pl-1">
                        <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                        <span className="text-xs text-muted-foreground">{form.active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Period */}
                <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                  <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Période de validité
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground ml-1">Date de début</span>
                      <Input 
                        type="datetime-local" 
                        value={form.starts_at}
                        onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                        className="h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground ml-1">Date de fin</span>
                      <Input 
                        type="datetime-local" 
                        value={form.ends_at}
                        onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                        className="h-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Targeting */}
              <div className="space-y-6">
                <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                      Cible de la promotion
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      {form.type !== "buy_x_get_y" && (
                        <>
                          <label className="text-xs text-muted-foreground block mb-1">Type de cible</label>
                          <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                            <SelectTrigger className="h-10 focus:ring-1 focus:ring-primary/20 focus:border-primary"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tout (Boutique entière)</SelectItem>
                              <SelectItem value="all_products">Tous les produits</SelectItem>
                              <SelectItem value="all_packs">Tous les packs</SelectItem>
                              <SelectItem value="all_categories">Toutes les catégories</SelectItem>
                              <SelectItem value="specific_products">Produits spécifiques</SelectItem>
                              <SelectItem value="specific_categories">Catégories spécifiques</SelectItem>
                              <SelectItem value="specific_packs">Packs spécifiques</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>

                    <div className="bg-muted/10 border border-border rounded-lg p-3 min-h-[300px]">
                      {form.type === "buy_x_get_y" && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                          <ShoppingCart className="w-12 h-12 text-primary/30 mb-3 animate-pulse" />
                          <p className="text-sm font-medium text-primary">Type "X acheté Y offert" sélectionné</p>
                          <p className="text-xs text-muted-foreground mt-2 max-w-[280px] mx-auto">
                            Le produit acheté (X), sa quantité, le produit offert (Y) et sa quantité sont configurés dans les règles à gauche.
                          </p>
                        </div>
                      )}

                      {form.type !== "buy_x_get_y" && form.target_type === "specific_products" && (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                          {products.map(p => {
                            const isChecked = form.product_ids.includes(p.id);
                            const weights = p.weight_prices && p.weight_prices.length > 0
                              ? p.weight_prices.map(wp => String(wp.weight))
                              : (p.weight ? [String(p.weight)] : []);
                            const selectedWeights = form.target_weights?.[p.id] || [];

                            return (
                              <div key={p.id} className="border border-border/40 rounded p-2 bg-background/50 space-y-2">
                                <label className="flex items-center gap-3 text-sm cursor-pointer">
                                  <Checkbox 
                                    checked={isChecked}
                                    onCheckedChange={() => toggleProductId(p.id)} 
                                  />
                                  <div className="relative w-8 h-8 rounded overflow-hidden border border-border shrink-0 bg-muted">
                                    <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="truncate font-medium text-xs">{p.name}</span>
                                </label>
                                {isChecked && weights.length > 0 && (
                                  <div className="pl-6 pt-1 flex flex-wrap gap-3">
                                    {weights.map(w => {
                                      const isWeightChecked = selectedWeights.includes(w);
                                      return (
                                        <label key={w} className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                          <Checkbox
                                            checked={isWeightChecked}
                                            onCheckedChange={(checked) => {
                                              const newWeights = checked
                                                ? [...selectedWeights, w]
                                                : selectedWeights.filter(sw => sw !== w);
                                              setForm(f => ({
                                                ...f,
                                                target_weights: {
                                                  ...f.target_weights,
                                                  [p.id]: newWeights
                                                }
                                              }));
                                            }}
                                          />
                                          <span>{w}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {form.target_type === "specific_categories" && (
                        <div className="space-y-1 max-h-[350px] overflow-y-auto">
                          {categories.map(c => (
                            <label key={c.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-background p-2 rounded-md transition-colors">
                              <Checkbox checked={form.category_ids.includes(c.id)}
                                onCheckedChange={() => toggleCategoryId(c.id)} />
                              <span className="truncate text-xs">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {form.target_type === "specific_packs" && (
                        <div className="space-y-1 max-h-[350px] overflow-y-auto">
                          {packs.map(p => (
                            <label key={p.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-background p-2 rounded-md transition-colors">
                              <Checkbox checked={form.pack_ids.includes(p.id)}
                                onCheckedChange={() => togglePackId(p.id)} />
                              <span className="truncate text-xs">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {form.target_type === "all" && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                          <Zap className="w-12 h-12 text-primary/30 mb-3" />
                          <p className="text-xs text-muted-foreground">Cette promotion sera appliquée à TOUS les articles (produits et packs) sans exception.</p>
                        </div>
                      )}

                      {form.target_type === "all_products" && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                          <Zap className="w-12 h-12 text-primary/30 mb-3" />
                          <p className="text-xs text-muted-foreground">Cette promotion sera appliquée à tous les produits individuels (hors packs).</p>
                        </div>
                      )}

                      {form.target_type === "all_packs" && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                          <Zap className="w-12 h-12 text-primary/30 mb-3" />
                          <p className="text-xs text-muted-foreground">Cette promotion sera appliquée à tous les packs de produits uniquement.</p>
                        </div>
                      )}

                      {form.target_type === "all_categories" && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center mt-12">
                          <Zap className="w-12 h-12 text-primary/30 mb-3" />
                          <p className="text-xs text-muted-foreground">Cette promotion sera appliquée à tous les produits qui appartiennent à au moins une catégorie.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button variant="outline" className="flex-1 rounded-none h-11" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} className="flex-1 rounded-none h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Enregistrer les modifications" : "Créer la promotion"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={!!promoToDelete || isBulkDeleting} 
        onOpenChange={(open) => { if (!open) { setPromoToDelete(null); setIsBulkDeleting(false); }}}
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
              {isBulkDeleting ? `Supprimer ${selectedIds.length} promotions` : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDeleting 
                ? `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.length} promotions ?` 
                : "Êtes-vous sûr de vouloir supprimer cette promotion ?"
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

export default AdminPromotions;

