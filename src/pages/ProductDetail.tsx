import { useParams, Link } from "react-router-dom";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ShoppingBag, 
  Flame, 
  Truck,
  Leaf,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Star,
  MessageCircle,
  Share2
} from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { FlashCountdown } from "@/components/FlashCountdown";
import { DirectOrderForm } from "@/components/DirectOrderForm";
import { useClientProducts } from "@/hooks/useClientProducts";
import { useActivePromotions } from "@/hooks/usePromotions";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/hooks/useT";
import { useBanner } from "@/hooks/useBanner";
import { cn } from "@/lib/utils";
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

const formatWeight = (w: string | number | null | undefined) => {
  if (!w) return "";
  const str = String(w).trim();
  if (!str) return "";
  if (/^\d+(\.\d+)?$/.test(str)) {
    return `${str} g`;
  }
  return str;
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getProductBySlug, getRelatedProducts, collections } = useClientProducts();
  const { getProductDiscount, getFlashPromos } = useActivePromotions();
  const product = getProductBySlug(slug || "");
  const [selectedWeight, setSelectedWeight] = useState<string | number | undefined>(() => {
    if (product?.weight_prices && product.weight_prices.length > 0) {
      return product.weight_prices[0].weight;
    }
    return product?.weight ?? undefined;
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();
  const { t, lang } = useT();
  const { data: banner } = useBanner();
  const freeShippingThreshold = Number(banner?.free_shipping_threshold ?? 500);

  if (!product) {
    return (
      <div className="container-wide py-28 text-center">
        <h1 className="font-serif text-4xl mb-4">{t("productDetail.notFound")}</h1>
        <p className="text-muted-foreground mb-8">{t("productDetail.notFoundDesc")}</p>
        <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
          <Link to="/products">{t("index.viewAllProducts")}</Link>
        </Button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const relatedProducts = getRelatedProducts(product.id);
  const collection = collections.find((c) => c.id === product.collection);

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast({ title: t("productDetail.removedFromFavorites"), description: getTranslated(product, "name", lang) });
    } else {
      addToWishlist(product);
      toast({ title: t("productDetail.addedToFavorites"), description: getTranslated(product, "name", lang) });
    }
  };

  const getBasePrice = () => {
    if (selectedWeight && product.weight_prices && product.weight_prices.length > 0) {
      const wp = product.weight_prices.find((w) => String(w.weight) === String(selectedWeight));
      if (wp) return wp.price;
    }
    return product.price;
  };

  const basePrice = getBasePrice();
  const discount = getProductDiscount(product.id, product.collections || [], false, selectedWeight);
  const originalPrice = product.originalPrice;
  const hasOriginal = originalPrice && originalPrice > basePrice;
  const promoDiscount = discount > 0 ? discount : (hasOriginal ? Math.round((1 - basePrice / originalPrice) * 100) : 0);
  const discountedPrice = promoDiscount > 0 ? Math.round(basePrice * (1 - promoDiscount / 100)) : basePrice;

  const flashPromo = getFlashPromos().find(fp =>
    fp.target_type === "all" ||
    (fp.target_type === "specific_products" && fp.product_ids?.includes(product.id))
  );

  const handleAddToCart = () => {
    addToCart({ ...product, price: discountedPrice }, quantity, selectedFlavors.slice(0, quantity), {}, selectedWeight);
    toast({ title: t("productDetail.addedToCart"), description: `${quantity} × ${getTranslated(product, "name", lang)}` });
    setQuantity(1);
    setSelectedFlavors([]);
  };

  const nextImage = () => setCurrentImageIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1);
  const prevImage = () => setCurrentImageIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const productName = getTranslated(product, "name", lang);
  const productDescription = getTranslated(product, "description", lang) || product.description;
  const productLongDescription = getTranslated(product, "longDescription", lang) || product.longDescription;
  const productMaterials = getTranslated(product, "materials", lang) || product.materials;
  const isAvailable = product.stock > 0;

  return (
    <>
      <SEOManager
        type="product"
        title={productName}
        description={productDescription}
        ogImage={product.images?.[0]}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: "Produits", item: "/products" },
          { name: productName, item: `/product/${product.slug}` },
        ]}
        productData={{
          name: productName,
          description: productDescription,
          sku: product.id,
          category: collection ? getTranslated(collection, "name", lang) : undefined,
          images: product.images,
          price: discountedPrice,
          priceCurrency: "MAD",
          availability: isAvailable ? "InStock" : "OutOfStock",
          shippingDetails: {
            price: (product.free_shipping || discountedPrice >= freeShippingThreshold) ? 0 : 40,
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
          <Link to="/products" className="hover:text-foreground transition-colors">
            {t("common.shop")}
          </Link>
          {collection && (
            <>
              <span className="text-border/80">/</span>
              <Link to={`/products?collection=${collection.slug}`} className="hover:text-foreground transition-colors font-medium">
                {getTranslated(collection, "name", lang)}
              </Link>
            </>
          )}
          <span className="text-border/80">/</span>
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">{productName}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="container-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            
            {/* Colonne Gauche : Galerie Photo "Luxury Apothecary" */}
            <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4 items-start">
              {/* Miniatures verticales (Desktop) */}
              {product.images.length > 1 && (
                <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0 max-h-[580px] overflow-y-auto no-scrollbar">
                  {product.images.map((image, index) => (
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
                        alt={`${productName} thumbnail ${index + 1}`}
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
                      src={product.images[currentImageIndex]}
                      alt={productName}
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
                    {product.new && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold tracking-widest uppercase bg-foreground text-background rounded-full shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        {t("common.new")}
                      </span>
                    )}

                    {product.free_shipping && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase bg-emerald-600 text-white rounded-full shadow-sm">
                        <Truck className="w-3.5 h-3.5" />
                        {t("common.freeShipping")}
                      </span>
                    )}

                    {product.stock === 0 && (
                      <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase bg-destructive text-destructive-foreground rounded-full shadow-sm">
                        {t("common.outOfStock")}
                      </span>
                    )}
                  </div>

                  {/* Flèches de navigation image */}
                  {product.images.length > 1 && (
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
                        {product.images.map((_, index) => (
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
                {product.images.length > 1 && (
                  <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {product.images.map((image, index) => (
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

            {/* Colonne Droite : Informations Produit & Commande "Luxury Apothecary" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              {/* En-tête : Collection + Titre */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {collection && (
                    <Link
                      to={`/products?collection=${collection.slug}`}
                      className="inline-block text-[11px] font-bold tracking-[0.25em] uppercase text-primary hover:text-primary/80 transition-colors"
                    >
                      {getTranslated(collection, "name", lang)}
                    </Link>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.65rem] text-foreground font-bold tracking-tight leading-[1.15]">
                  {productName}
                </h1>

                {productDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {productDescription}
                  </p>
                )}
              </div>

              {/* Bloc Prix Unique Épuré (Sans doublon) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/25 border border-border/60 space-y-3">
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="text-3xl sm:text-4xl font-sans font-extrabold text-foreground tracking-tight">
                    {discountedPrice.toLocaleString()}{" "}
                    <span className="text-lg font-bold text-primary font-serif">DH</span>
                  </span>

                  {promoDiscount > 0 && (
                    <>
                      <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                        {basePrice.toLocaleString()} DH
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded-full">
                        -{promoDiscount}%
                      </span>
                    </>
                  )}
                  {hasOriginal && promoDiscount === 0 && (
                    <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                      {originalPrice.toLocaleString()} DH
                    </span>
                  )}
                </div>

                {/* Offre Flash */}
                {flashPromo && (
                  <div className="pt-1">
                    <FlashCountdown endsAt={flashPromo.ends_at} label="Offre Flash Limitée" />
                  </div>
                )}

                {/* Stock FOMO Alert */}
                {product.stock > 0 && product.stock < 5 && (
                  <div className="flex items-center gap-2 text-destructive animate-pulse bg-destructive/5 border border-destructive/10 px-3.5 py-2 rounded-lg">
                    <Flame className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs font-semibold">
                      {lang === 'ar' 
                        ? `عجّل! المتبقي ${product.stock} قطع فقط في المخزون!` 
                        : lang === 'en' 
                        ? `Hurry up! Only ${product.stock} items left in stock!` 
                        : `Forte demande ! Plus que ${product.stock} exemplaires disponibles.`}
                    </p>
                  </div>
                )}

                {product.stock === 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-bold uppercase tracking-wider">
                    {t("common.outOfStock")}
                  </div>
                )}
              </div>

              {/* Choix du Poids / Contenance */}
              {product.weight_prices && product.weight_prices.length > 1 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground block">
                    {lang === 'ar' ? "اختر الوزن / السعة :" : lang === 'en' ? "Choose Weight / Size:" : "Contenance / Poids :"}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.weight_prices.map((wp) => {
                      const isSelected = String(selectedWeight) === String(wp.weight);
                      return (
                        <button
                          key={wp.weight}
                          type="button"
                          onClick={() => setSelectedWeight(wp.weight)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border flex items-center gap-2",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/80 hover:border-foreground bg-background text-foreground hover:bg-muted/30"
                          )}
                        >
                          <span>{formatWeight(wp.weight)}</span>
                          <span className={cn("text-[11px] opacity-80", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                            ({wp.price} DH)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Choix des Parfums / Goûts */}
              {product.flavors && product.flavors.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground block">
                    {lang === 'ar' ? "اختر النكهة :" : lang === 'en' ? "Choose flavor:" : "Parfum / Goût :"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map((flavor) => {
                      const isSelected = selectedFlavors.includes(flavor);
                      return (
                        <button
                          key={flavor}
                          type="button"
                          onClick={() => setSelectedFlavors([flavor])}
                          className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-medium transition-all border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm font-semibold"
                              : "border-border/80 hover:border-foreground bg-background text-foreground"
                          )}
                        >
                          {flavor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    disabled={product.stock === 0}
                    className="flex-1 rounded-xl h-12 sm:h-14 text-xs sm:text-sm tracking-wider uppercase py-0 flex items-center justify-center gap-2 btn-premium shadow-md shadow-primary/10 disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {product.stock === 0 ? t("common.unavailable") : t("common.addToCart")}
                    </span>
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
                      const weightText = selectedWeight ? ` (Poids : ${formatWeight(selectedWeight)})` : "";
                      const message = encodeURIComponent(`Bonjour Aliaa Care, j'aimerais avoir plus d'informations sur le produit : ${productName}${weightText}\nPrix : ${discountedPrice} DH\nLien : ${url}`);
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

              {/* Accordéons Interactifs "Luxury Apothecary" (Description, Ingrédients, Rituel, Livraison) */}
              <div className="pt-2">
                <Accordion type="single" collapsible defaultValue="description" className="w-full space-y-2">
                  
                  {/* Onglet 1 : Description & Bienfaits */}
                  <AccordionItem value="description" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? "الوصف والفوائد" : lang === 'en' ? "Description & Benefits" : "Description & Bienfaits"}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pb-4">
                      {productLongDescription || productDescription}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Onglet 2 : Ingrédients & Composition */}
                  {productMaterials && (
                    <AccordionItem value="ingredients" className="border border-border/70 rounded-xl px-4 bg-card/60">
                      <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                        <span className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-emerald-600" />
                          {t("productDetail.ingredients")}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                        <p className="whitespace-pre-wrap">{productMaterials}</p>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Onglet 3 : Rituel & Mode d'emploi */}
                  <AccordionItem value="usage" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {lang === 'ar' ? "طقوس الاستخدام" : lang === 'en' ? "Application Ritual" : "Rituel d'application"}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2 pb-4">
                      <p>
                        {lang === 'ar'
                          ? "استخدمي هذا المستحضر بانتظام كجزء من روتينك اليومي للعناية الطبيعية للحصول على أفضل النتائج."
                          : lang === 'en'
                          ? "Incorporate this natural formula into your daily self-care ritual for lasting and revitalizing results."
                          : "Intégrez ce soin dans votre rituel de beauté quotidien pour nourrir, régénérer et sublimer votre corps naturellement."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Onglet 4 : Livraison & Garantie */}
                  <AccordionItem value="shipping" className="border border-border/70 rounded-xl px-4 bg-card/60">
                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-bold text-foreground">
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        {t("productDetail.shipping")} & Retours
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
                        • <strong>Livraison offerte :</strong> {product.free_shipping ? "Oui, la livraison est 100% gratuite sur ce produit !" : `Gratuite dès ${freeShippingThreshold} DH d'achats.`}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </div>

              {/* Formulaire de Commande Directe Express COD (Placé après les informations du produit) */}
              <div id="direct-order-section" className="pt-4 border-t border-border/60">
                <div className="mb-3">
                  <span className="text-xs font-bold tracking-widest uppercase text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Commande Express Directe (Paiement à la livraison)
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remplissez vos coordonnées ci-dessous pour recevoir votre colis à domicile :
                  </p>
                </div>

                <DirectOrderForm
                  product={product}
                  selectedWeight={selectedWeight}
                  selectedFlavors={selectedFlavors}
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
          <p className="text-xs font-medium text-muted-foreground truncate">{productName}</p>
          <p className="text-base font-bold font-sans text-primary">
            {discountedPrice.toLocaleString()} DH
            {selectedWeight && (
              <span className="text-[11px] font-normal text-muted-foreground ml-1">
                ({formatWeight(selectedWeight)})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              document.getElementById('direct-order-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            disabled={product.stock === 0}
            className="h-10 px-4 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg shadow-md"
          >
            {lang === 'ar' ? "اطلب الآن" : lang === 'en' ? "Order Now" : "Commander"}
          </Button>
        </div>
      </div>

      {/* Produits Connexes / Recommandations */}
      {relatedProducts.length > 0 && (
        <section className="py-20 md:py-28 bg-linen border-t border-border/50">
          <div className="container-full">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-2">
                  {t("productDetail.youMayAlsoLike")}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground font-bold">
                  {t("productDetail.moreFrom")} {getTranslated(collection as any, "name", lang)}
                </h2>
              </div>
              <Link
                to={`/products?collection=${collection?.slug}`}
                className="hidden md:flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {t("common.viewAll")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;
