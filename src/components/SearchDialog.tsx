import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Package, Sparkles, ArrowRight, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useClientProducts } from "@/hooks/useClientProducts";
import { usePacks } from "@/hooks/usePacks";
import { useT } from "@/hooks/useT";
import { useActivePromotions } from "@/hooks/usePromotions";
import { getTranslated } from "@/utils/translationUtils";
import { Badge } from "@/components/ui/badge";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "products" | "packs">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { products, collections } = useClientProducts();
  const { data: packs = [] } = usePacks();
  const { t, lang } = useT();
  const { getProductDiscount } = useActivePromotions();

  // Focus input on open & clear query on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setFilterType("all");
    }
  }, [open]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { products: [], packs: [], total: 0 };

    const matchedProducts = products.filter((p) => {
      const nameFr = p.name?.toLowerCase() || "";
      const nameAr = p.name_ar?.toLowerCase() || "";
      const nameEn = p.name_en?.toLowerCase() || "";
      const desc = p.short_description?.toLowerCase() || "";
      const col = collections.find((c) => c.id === p.collection);
      const colName = col?.name?.toLowerCase() || "";
      return nameFr.includes(q) || nameAr.includes(q) || nameEn.includes(q) || desc.includes(q) || colName.includes(q);
    });

    const matchedPacks = packs.filter((pk) => {
      const nameFr = pk.name?.toLowerCase() || "";
      const nameAr = pk.name_ar?.toLowerCase() || "";
      const nameEn = pk.name_en?.toLowerCase() || "";
      const desc = pk.description?.toLowerCase() || "";
      return nameFr.includes(q) || nameAr.includes(q) || nameEn.includes(q) || desc.includes(q);
    });

    const filteredProducts = filterType === "packs" ? [] : matchedProducts;
    const filteredPacks = filterType === "products" ? [] : matchedPacks;

    return {
      products: filteredProducts,
      packs: filteredPacks,
      total: filteredProducts.length + filteredPacks.length,
    };
  }, [query, products, packs, collections, filterType]);

  const handleSelectProduct = (slug: string) => {
    onOpenChange(false);
    navigate(`/product/${slug}`);
  };

  const handleSelectPack = (slug: string) => {
    onOpenChange(false);
    navigate(`/pack/${slug}`);
  };

  // Popular/Featured suggestions when query is empty
  const popularSuggestions = useMemo(() => {
    const featured = products.filter((p) => p.featured || p.new);
    if (featured.length > 0) return { items: featured.slice(0, 4), isPack: false };
    if (products.length > 0) return { items: products.slice(0, 4), isPack: false };
    if (packs.length > 0) return { items: packs.slice(0, 4), isPack: true };
    return { items: [], isPack: false };
  }, [products, packs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl"
        onInteractOutside={() => onOpenChange(false)}
      >
        <DialogTitle className="sr-only">{t("common.search")}</DialogTitle>

        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("header.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm md:text-base outline-none placeholder:text-muted-foreground/60 text-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Tabs if search is active */}
        {query.trim().length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/20 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t("common.all")} ({results.total})
            </button>
            <button
              onClick={() => setFilterType("products")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === "products"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t("common.products")} ({results.products.length})
            </button>
            <button
              onClick={() => setFilterType("packs")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                filterType === "packs"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background/80 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t("common.ourPacks")} ({results.packs.length})
            </button>
          </div>
        )}

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 ? (
            /* Suggestions when no query */
            popularSuggestions.items.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("header.searchSuggestions")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularSuggestions.items.map((item: any) => {
                    const name = getTranslated(item, "name", lang);
                    const isPack = popularSuggestions.isPack;
                    const image = isPack
                      ? (item.images?.[0] || item.image || "/placeholder.svg")
                      : (item.images?.[0] || "/placeholder.svg");
                    const discount = isPack
                      ? getProductDiscount(item.id, [], true)
                      : getProductDiscount(item.id, item.collections || [], false);
                    const hasDiscount = discount > 0 || (item.originalPrice && item.originalPrice > item.price);
                    const effectivePrice = discount > 0 ? Math.round(item.price * (1 - discount / 100)) : item.price;

                    return (
                      <button
                        key={item.id}
                        onClick={() => isPack ? handleSelectPack(item.slug) : handleSelectProduct(item.slug)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/40 text-left transition-all group"
                      >
                        <img
                          src={image}
                          alt={name}
                          className="w-12 h-12 object-cover rounded-lg bg-muted shrink-0 border border-border/40 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-primary">{effectivePrice} DH</span>
                            {hasDiscount && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                {item.originalPrice || item.price} DH
                              </span>
                            )}
                            {isPack && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase text-muted-foreground">
                                Pack
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null
          ) : results.total === 0 ? (
            /* Empty State */
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t("header.searchNoResults")}
              </p>
              <p className="text-xs text-muted-foreground">
                Essayez avec d'autres mots-clés ou consultez notre boutique complète.
              </p>
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/products");
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {t("common.viewAll")} {t("common.products")} &rarr;
              </button>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-4">
              {/* Product Results */}
              {results.products.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    {t("common.products")} ({results.products.length})
                  </p>
                  <div className="space-y-1.5">
                    {results.products.map((product) => {
                      const name = getTranslated(product, "name", lang);
                      const image = product.images?.[0] || "/placeholder.svg";
                      const discount = getProductDiscount(product.id, product.collections || [], false);
                      const effectivePrice = discount > 0 ? Math.round(product.price * (1 - discount / 100)) : product.price;

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product.slug)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-accent/40 text-left transition-all group"
                        >
                          <img
                            src={image}
                            alt={name}
                            className="w-12 h-12 object-cover rounded-lg bg-muted shrink-0 border border-border/40 group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {name}
                              </span>
                              {discount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                  -{discount}%
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-primary">{effectivePrice} DH</span>
                              {discount > 0 && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {product.price} DH
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pack Results */}
              {results.packs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    {t("common.ourPacks")} ({results.packs.length})
                  </p>
                  <div className="space-y-1.5">
                    {results.packs.map((pack) => {
                      const name = getTranslated(pack, "name", lang);
                      const image = pack.images && pack.images.length > 0 ? pack.images[0] : (pack.image || "/placeholder.svg");
                      const discount = getProductDiscount(pack.id, [], true);
                      const effectivePrice = discount > 0 ? Math.round(pack.price * (1 - discount / 100)) : pack.price;

                      return (
                        <button
                          key={pack.id}
                          onClick={() => handleSelectPack(pack.slug)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-accent/40 text-left transition-all group"
                        >
                          <img
                            src={image}
                            alt={name}
                            className="w-12 h-12 object-cover rounded-lg bg-muted shrink-0 border border-border/40 group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {name}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-wider text-muted-foreground border-border">
                                Pack
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-primary">{effectivePrice} DH</span>
                              {discount > 0 && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {pack.price} DH
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("common.shop")} Aliaa Natural Care</span>
          <button
            onClick={() => {
              onOpenChange(false);
              navigate("/products");
            }}
            className="text-primary hover:underline flex items-center gap-1"
          >
            {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
