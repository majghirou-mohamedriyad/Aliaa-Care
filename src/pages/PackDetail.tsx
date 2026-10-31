import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ShoppingBag, 
  ArrowLeft, 
  ArrowRight,
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Truck,
  Leaf,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Star,
  MessageCircle,
  BadgePercent,
  Gift,
  Scale,
  Droplets
} from "lucide-react";

import { usePacks } from "@/hooks/usePacks";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/QuantitySelector";
import { DirectOrderForm } from "@/components/DirectOrderForm";
import { useT } from "@/hooks/useT";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useActivePromotions } from "@/hooks/usePromotions";
import { getTranslated } from "@/utils/translationUtils";
import { SEOManager } from "@/seo/components/SEOManager";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const PackDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: packs, isLoading } = usePacks();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { t, lang } = useT();
  const [quantity, setQuantity] = useState(1);
  const [selectedPackFlavors, setSelectedPackFlavors] = useState<Record<number, Record<string, string[]>>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);

  const pack = packs?.find((p) => p.slug === slug && p.active);

  const nextImage = () => {
    if (!pack || !pack.images) return;
    setCurrentImageIndex((prev) => (prev === pack.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (!pack || !pack.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? pack.images.length - 1 : prev - 1));
  };

  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { getProductDiscount } = useActivePromotions();

  const inWishlist = pack ? isInWishlist(pack.id) : false;
  const discount = pack ? getProductDiscount(pack.id, [], true) : 0;
  const discountedPrice = pack ? (discount > 0 ? Math.round(pack.price * (1 - discount / 100)) : pack.price) : 0;

  if (isLoading) {
    return (
      <div className="container-wide py-28 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="container-wide py-28 text-center">
        <h1 className="font-serif text-4xl mb-4">{t("pack.notFound")}</h1>
        <p className="text-muted-foreground mb-8">{t("pack.notFoundDesc")}</p>
        <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
          <Link to="/products">{t("index.viewAllProducts")}</Link>
        </Button>
      </div>
    );
  }

  const getItemPrice = (item: any) => {
    if (item.selected_weight && item.product_weight_prices && item.product_weight_prices.length > 0) {
      const found = item.product_weight_prices.find((wp: any) => String(wp.weight) === String(item.selected_weight));
      if (found) return found.price;
    }
    return item.product_price || 0;
  };

  const totalValue = pack.items.reduce((sum, item) => sum + getItemPrice(item) * (item.quantity || 1), 0);
  const savings = totalValue - pack.price;
  const firstImage = pack.items[0]?.product_image || pack.image;
  const packImages = pack.images && pack.images.length > 0 ? pack.images : [firstImage];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: pack.id,
        name: pack.name,
        name_ar: pack.name_ar || undefined,
        name_en: pack.name_en || undefined,
        slug: pack.slug,
        collection: "",
        price: discountedPrice,
        description: pack.description,
        description_ar: pack.description_ar || undefined,
        description_en: pack.description_en || undefined,
        longDescription: pack.long_description,
        longDescription_ar: pack.long_description_ar || undefined,
        longDescription_en: pack.long_description_en || undefined,
        materials: "",
        images: packImages,
        packItemFlavors: selectedPackFlavors[i] || {},
        items: pack.items,
        free_shipping: pack.free_shipping,
      } as any);
    }
    toast({ title: t("pack.addedToCart"), description: `${getTranslated(pack, "name", lang)} x${quantity}` });
  };

  const handleWishlistToggle = () => {
    if (!pack) return;
    if (inWishlist) {
      removeFromWishlist(pack.id);
      toast({ title: t("productDetail.removedFromFavorites"), description: getTranslated(pack, "name", lang) });
    } else {
      addToWishlist({
        id: pack.id,
        name: pack.name,
        name_ar: pack.name_ar || undefined,
        name_en: pack.name_en || undefined,
        slug: pack.slug,
        collection: "",
        price: discountedPrice,
        description: pack.description,
        description_ar: pack.description_ar || undefined,
        description_en: pack.description_en || undefined,
        longDescription: pack.long_description,
        longDescription_ar: pack.long_description_ar || undefined,
        longDescription_en: pack.long_description_en || undefined,
        materials: "",
        images: packImages,
        items: pack.items,
        free_shipping: pack.free_shipping,
      } as any);
      toast({ title: t("productDetail.addedToFavorites"), description: getTranslated(pack, "name", lang) });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const rawName = getTranslated(pack, "name", lang);
  const packName = rawName.startsWith("(") && (rawName.match(/\(/g) || []).length > (rawName.match(/\)/g) || []).length
    ? rawName.substring(1).trim()
    : rawName;
  const packDescription = getTranslated(pack, "description", lang) || pack.description;
  const packLongDescription = getTranslated(pack, "long_description", lang) || pack.long_description;
  const packRitual = getTranslated(pack, "ritual", lang) || (pack as any).ritual || packLongDescription;

  return (
    <>
      <SEOManager
        type="pack"
        title={packName}
        description={packDescription}
        ogImage={packImages[0]}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: "Packs", item: "/packs" },
          { name: packName, item: `/pack/${pack.slug}` },
        ]}
        productData={{
          name: packName,
          description: packDescription,
          sku: pack.id,
          images: packImages,
          price: discountedPrice,
          priceCurrency: "MAD",
          availability: "InStock",
          shippingDetails: {
            price: (pack.free_shipping || discountedPrice >= 500) ? 0 : 40,
            currency: "MAD",
            deliveryTimeDays: 3,
          },
          merchantReturnPolicy: {
            returnPolicyCategory: "MerchantReturnFiniteReturnPeriod",
            merchantReturnDays: 14,
            returnFees: "ReturnFeesCustomerPaying",
          },
        }}
      />

      {/* Fil d'Ariane épuré */}
      <div className="container-full py-5 border-b border-border/60">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            {lang === 'ar' ? "الرئيسية" : lang === 'en' ? "Home" : "Accueil"}
          </Link>
          <span className="text-border/80">/</span>
          <Link to="/packs" className="hover:text-foreground transition-colors">
            {lang === 'ar' ? "الباقات والعروض" : lang === 'en' ? "Packs & Sets" : "Packs & Coffrets"}
          </Link>
          <span className="text-border/80">/</span>
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">{packName}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="container-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            
            {/* Colonne Gauche : Galerie Photo "Luxury Apothecary" */}
            <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4 items-start">
              {/* Miniatures verticales (Desktop) */}
              {packImages.length > 1 && (
                <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0 max-h-[580px] overflow-y-auto no-scrollbar">
                  {packImages.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-20 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 relative bg-muted/20",
                        index === currentImageIndex 
                          ? "border-primary shadow-sm opacity-100 ring-2 ring-primary/20" 
                          : "border-border/60 opacity-60 hover:opacity-100 hover:border-border"
                      )}
                    >
                      <img
                        src={image}
                        alt={`${packName} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Image Principale avec Zoom et Badges */}
              <div className="flex-1 w-full space-y-3">
                <div
                  className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] max-h-[580px] w-full overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-muted/30 via-muted/10 to-card group cursor-zoom-in shadow-sm flex items-center justify-center"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={packImages[currentImageIndex]}
                      alt={packName}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: isZooming ? "scale(2.2)" : "scale(1)"
                      }}
                      className="w-full h-full object-cover transition-transform duration-150 ease-out select-none"
                    />
                  </AnimatePresence>

                  {/* Badges Flottants de Luxe */}
                  <div className="absolute top-4 start-4 flex flex-col gap-2 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-widest uppercase bg-primary text-primary-foreground rounded-full shadow-sm">
                      <Package className="w-3.5 h-3.5" />
                      {t("common.pack")} ({pack.items.length} soins)
                    </span>

                    {savings > 0 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold tracking-wider uppercase bg-emerald-600 text-white rounded-full shadow-sm">
                        <BadgePercent className="w-3.5 h-3.5" />
                        {t("common.save")} {savings.toFixed(0)} DH
                      </span>
                    )}

                    {pack.free_shipping && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase bg-emerald-600 text-white rounded-full shadow-sm">
                        <Truck className="w-3.5 h-3.5" />
                        {t("common.freeShipping")}
                      </span>
                    )}
                  </div>

                  {/* Flèches de navigation image */}
                  {packImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 rounded-full shadow-md flex items-center justify-center border border-border/60 text-foreground"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 hover:bg-background backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 rounded-full shadow-md flex items-center justify-center border border-border/60 text-foreground"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                      </button>

                      {/* Indicateurs de pagination (Mobile) */}
                      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {packImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              index === currentImageIndex ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Miniatures Défilantes (Mobile) */}
                {packImages.length > 1 && (
                  <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {packImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-200",
                          index === currentImageIndex ? "border-primary" : "border-border/60 opacity-60"
                        )}
                      >
                        <img src={image} alt={`thumb-${index}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite : Informations Pack & Commande "Luxury Apothecary" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              {/* En-tête : Badge Pack + Titre + Étoiles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary">
                    Coffret Soin Naturel Complet
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.65rem] text-foreground font-bold tracking-tight leading-[1.15]">
                  {packName}
                </h1>

                {packDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {packDescription}
                  </p>
                )}
              </div>

              {/* Bloc Prix Unique Épuré */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/25 border border-border/60 space-y-3">
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl sm:text-4xl font-sans font-extrabold text-foreground tracking-tight">
                    {discountedPrice.toLocaleString()}{" "}
                    <span className="text-lg font-bold text-primary font-serif">DH</span>
                  </span>

                  {discount > 0 ? (
                    <>
                      <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                        {pack.price.toLocaleString()} DH
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded-full">
                        -{discount}%
                      </span>
                    </>
                  ) : savings > 0 ? (
                    <>
                      <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                        {totalValue.toLocaleString()} DH
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full">
                        Économie de {savings.toFixed(0)} DH
                      </span>
                    </>
                  ) : null}
                </div>

                {pack.free_shipping && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span>Livraison gratuite offerte pour ce pack partout au Maroc !</span>
                  </p>
                )}
              </div>

              {/* Contenu Détaillé du Coffret (Design "Luxury Coffret Showcase") */}
              <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card/95 to-muted/20 p-4 sm:p-5 shadow-xs space-y-4">
                
                {/* En-tête de la section avec valeur et économie */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <span>{t("pack.contents")}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                          {pack.items.length} {t("pack.productsCount")}
                        </span>
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        {lang === 'ar' ? "جميع المنتجات المتضمنة في هذا الصندوق الفاخر" : lang === 'en' ? "All authentic treatments included in this set" : "Tous les soins d'exception inclus dans votre coffret"}
                      </p>
                    </div>
                  </div>

                  {/* Badge Économie / Valeur totale */}
                  {totalValue > pack.price && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[11px] text-muted-foreground line-through">
                        {totalValue.toLocaleString()} DH
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {savings > 0 ? `-${savings.toFixed(0)} DH` : "Offre Pack"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Liste des soins inclus */}
                <div className="space-y-3">
                  {pack.items.map((item, idx) => {
                    const itemTranslatedName = getTranslated({ name: item.product_name, name_ar: item.product_name_ar, name_en: item.product_name_en }, "name", lang);
                    const itemPrice = getItemPrice(item);
                    const itemQty = item.quantity || 1;

                    return (
                      <div 
                        key={item.id} 
                        className="group relative flex flex-col p-3.5 rounded-xl border border-border/70 bg-background/80 hover:bg-muted/30 hover:border-border transition-all duration-200"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          {/* Miniature du produit avec badge quantité et index */}
                          <div className="relative w-16 h-20 sm:w-18 sm:h-22 rounded-xl overflow-hidden border border-border/60 bg-muted/30 shrink-0 shadow-2xs">
                            <img
                              src={item.product_image || "/placeholder.svg"}
                              alt={itemTranslatedName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Numéro du soin (01, 02...) */}
                            <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded-md bg-background/90 backdrop-blur-xs text-[9px] font-bold text-muted-foreground shadow-2xs">
                              0{idx + 1}
                            </span>
                            {/* Multiplicateur de quantité si > 1 */}
                            {itemQty > 1 && (
                              <span className="absolute bottom-1 end-1 px-1.5 py-0.5 rounded-md bg-foreground text-background text-[10px] font-bold shadow-xs">
                                ×{itemQty}
                              </span>
                            )}
                          </div>

                          {/* Infos du produit */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                                {itemTranslatedName}
                              </h3>
                              <div className="text-end shrink-0">
                                <span className="text-xs sm:text-sm font-bold text-foreground">
                                  {itemPrice.toLocaleString()} DH
                                </span>
                                {itemQty > 1 && (
                                  <span className="block text-[10px] text-muted-foreground">
                                    ({(itemPrice * itemQty).toLocaleString()} DH total)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tags et caractéristiques (Poids / Contenance) */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                                <Scale className="w-3 h-3 text-muted-foreground/80" />
                                {item.selected_weight || item.product_weight || "Standard"}
                              </span>

                              {itemQty > 1 && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                  {itemQty} unités incluses
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Choix des Parfums par unité si disponible */}
                        {item.product_flavors && item.product_flavors.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                            {Array.from({ length: quantity }).map((_, packIdx) => (
                              <div key={packIdx} className="space-y-1.5">
                                {quantity > 1 && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                    <Gift className="w-3 h-3" />
                                    Coffret {packIdx + 1}
                                  </span>
                                )}
                                {Array.from({ length: itemQty }).map((_, i) => {
                                  const currentFlavors = getTranslated(item, "product_flavors", lang) as string[];
                                  if (!currentFlavors || currentFlavors.length === 0) return null;
                                  
                                  const packSelections = selectedPackFlavors[packIdx] || {};
                                  const selections = packSelections[item.product_name || ""] || [];
                                  const currentVal = selections[i] || currentFlavors[0];

                                  return (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                                        <Droplets className="w-3 h-3 text-primary" />
                                        {itemQty > 1 ? `Parfum (soin ${i + 1}) :` : "Parfum au choix :"}
                                      </span>
                                      <select
                                        className="w-full sm:max-w-[220px] bg-background border border-border/80 hover:border-primary/50 text-xs py-1.5 px-2.5 rounded-lg font-medium text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                        value={currentVal}
                                        onChange={(e) => {
                                          const newSelections = [...selections];
                                          while (newSelections.length <= i) newSelections.push(currentFlavors[0]);
                                          newSelections[i] = e.target.value;
                                          
                                          setSelectedPackFlavors({
                                            ...selectedPackFlavors,
                                            [packIdx]: {
                                              ...packSelections,
                                              [item.product_name || ""]: newSelections
                                            }
                                          });
                                        }}
                                      >
                                        {currentFlavors.map((f) => (
                                          <option key={f} value={f}>{f}</option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bandeau Récapitulatif d'Économie */}
                {savings > 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'ar' 
                        ? `توفر ${savings.toFixed(0)} درهم بشراء هذه الباقة مقارنة بسعر المنتجات الفردية.` 
                        : lang === 'en'
                        ? `Save ${savings.toFixed(0)} DH with this bundle compared to buying items individually.`
                        : `Vous économisez ${savings.toFixed(0)} DH avec ce coffret par rapport au prix unitaire des soins.`}
                    </span>
                  </div>
                )}
              </div>

              {/* Boutons d'Action Panier + Favoris + WhatsApp */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    className="h-12 sm:h-14 shrink-0 bg-background rounded-xl border border-border"
                  />
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    className="flex-1 rounded-xl h-12 sm:h-14 text-xs sm:text-sm tracking-wider uppercase py-0 flex items-center justify-center gap-2 btn-premium shadow-md shadow-primary/10"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t("common.addToCart")}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2.5">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlistToggle}
                    className="rounded-xl h-11 text-xs tracking-wider uppercase border-border/80 hover:bg-muted/40"
                  >
                    <Heart className={cn("w-4 h-4 me-2 transition-all duration-300", inWishlist && "fill-primary text-primary")} />
                    <span>{inWishlist ? t("productDetail.saved") : t("productDetail.addToFavorites")}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const phone = "212699928463";
                      const url = window.location.href;
                      const message = encodeURIComponent(`Bonjour Aliaa Care, j'aimerais avoir plus d'informations sur le pack : ${packName}\nPrix : ${pack.price} DH\nLien : ${url}`);
                      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                    }}
                    className="rounded-xl h-11 px-4 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
                    title={t("productDetail.whatsappQuestion")}
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </div>
              </div>

              {/* Accordéons Interactifs "Luxury Apothecary" (Avant le formulaire) */}
              <div className="pt-2">
                <Accordion type="single" collapsible defaultValue="description" className="w-full space-y-2">
                  
                  {/* Onglet 1 : Description & Bienfaits du Pack */}
                  <AccordionItem value="description" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? "الوصف والفوائد" : lang === 'en' ? "Pack Description & Benefits" : "Description & Bienfaits du Pack"}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pb-4">
                      {packDescription || packLongDescription}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Onglet 2 : Rituel d'application & Ordre des soins */}
                  <AccordionItem value="usage" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? "طقوس الاستخدام والترتيب" : lang === 'en' ? "Application Ritual & Steps" : "Rituel d'application"}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                      {packRitual ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{packRitual}</p>
                      ) : (
                        <p className="leading-relaxed">
                          {lang === 'ar'
                            ? "للحصول على أفضل النتائج، اتبعي خطوات الاستخدام الموصى بها لكل منتج في هذه الباقة بانتظام."
                            : lang === 'en'
                            ? "For optimal results, follow the recommended steps using each product in this pack in synergy as part of your daily self-care ritual."
                            : "Pour une efficacité optimale, utilisez les soins de ce coffret en synergie selon votre routine quotidienne bien-être."}
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Onglet 3 : Livraison & Garantie */}
                  <AccordionItem value="shipping" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        Livraison & Modalités
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2 pb-4">
                      <p>
                        • <strong>Délais d'expédition :</strong> 24h à 48h ouvrées partout au Maroc.
                      </p>
                      <p>
                        • <strong>Mode de paiement :</strong> En espèces au livreur après réception de votre commande.
                      </p>
                      <p>
                        • <strong>Livraison offerte :</strong> {pack.free_shipping ? "Oui, la livraison est 100% gratuite pour ce pack !" : "Gratuite dès 500 DH d'achats."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </div>

              {/* Formulaire de Commande Directe Express COD */}
              <div id="direct-order-section" className="pt-4 border-t border-border/60">
                <div className="mb-3">
                  <span className="text-xs font-bold tracking-widest uppercase text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Commande Express Directe (Paiement à la livraison)
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remplissez vos coordonnées ci-dessous pour recevoir votre coffret à domicile :
                  </p>
                </div>

                <DirectOrderForm
                  product={{
                    id: pack.id,
                    name: pack.name,
                    name_ar: pack.name_ar || undefined,
                    name_en: pack.name_en || undefined,
                    slug: pack.slug,
                    price: pack.price,
                    images: packImages,
                    free_shipping: pack.free_shipping,
                  }}
                  initialQuantity={quantity}
                  discountedPrice={discountedPrice}
                />
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Barre d'Action Flottante Fixe sur Mobile (Sticky Bottom Bar) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{packName}</p>
          <p className="text-base font-bold font-sans text-primary">
            {discountedPrice.toLocaleString()} DH
            <span className="text-[10px] text-muted-foreground font-normal ml-1">Pack complet</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              document.getElementById('direct-order-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-10 px-4 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg shadow-md"
          >
            {lang === 'ar' ? "اطلب الآن" : lang === 'en' ? "Order Now" : "Commander"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default PackDetail;
