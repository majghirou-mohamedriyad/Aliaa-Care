import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, ArrowRight, ShoppingBag, MessageSquare, Flame } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { FlashCountdown } from "@/components/FlashCountdown";
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
      <>
        <div className="container-wide py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">{t("productDetail.notFound")}</h1>
          <p className="text-muted-foreground mb-8">{t("productDetail.notFoundDesc")}</p>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/products">{t("index.viewAllProducts")}</Link>
          </Button>
        </div>
      </>
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
  const discountedPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

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
            price: discountedPrice >= freeShippingThreshold ? 0 : 40,
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
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">{t("common.shop")}</Link>
          <span className="text-border">/</span>
          {collection && (
            <>
              <Link to={`/products?collection=${collection.slug}`} className="hover:text-foreground transition-colors">{getTranslated(collection, "name", lang)}</Link>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground">{getTranslated(product, "name", lang)}</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div
                className="relative aspect-square max-h-[500px] overflow-hidden bg-muted/20 group cursor-zoom-in rounded-lg border border-border"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]}
                    alt={getTranslated(product, "name", lang)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isZooming ? "scale(2)" : "scale(1)"
                    }}
                    className="w-full h-full object-contain p-2 transition-transform duration-200 ease-out"
                  />
                </AnimatePresence>
                {product.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute start-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/90 backdrop-blur-md hover:bg-background transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-full shadow-sm">
                      <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                    </button>
                    <button onClick={nextImage} className="absolute end-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/90 backdrop-blur-md hover:bg-background transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-full shadow-sm">
                      <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {product.images.map((_, index) => (
                        <button key={index} onClick={() => setCurrentImageIndex(index)}
                          className={cn("w-6 h-0.5 transition-all duration-500", index === currentImageIndex ? "bg-foreground" : "bg-foreground/20 hover:bg-foreground/40")} />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-10">
                  {product.new && (
                    <span className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase bg-foreground text-background rounded-sm">{t("common.new")}</span>
                  )}
                  {product.stock === 0 && (
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground rounded-sm">{t("common.outOfStock")}</span>
                  )}
                </div>
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)}
                      className={cn("w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 border border-border",
                        index === currentImageIndex ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100")}>
                      <img src={image} alt={`${getTranslated(product, "name", lang)} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="lg:col-span-7 lg:sticky lg:top-28 lg:self-start">
              {collection && (
                <Link to={`/products?collection=${collection.slug}`}
                  className="inline-block text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3 hover:text-primary/80 transition-colors">{getTranslated(collection, "name", lang)}</Link>
              )}
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 leading-tight break-words">{getTranslated(product, "name", lang)}</h1>
              {(() => {
                const discount = getProductDiscount(product.id, product.collections || []);
                const basePrice = getBasePrice();
                const originalPrice = product.originalPrice;
                const hasOriginal = originalPrice && originalPrice > basePrice;
                const promoDiscount = discount > 0 ? discount : (hasOriginal ? Math.round((1 - basePrice / originalPrice) * 100) : 0);
                const flashPromo = getFlashPromos().find(fp =>
                  fp.target_type === "all" ||
                  (fp.target_type === "specific_products" && fp.product_ids?.includes(product.id))
                );
                return (
                  <div className="mb-8">
                    {promoDiscount > 0 ? (
                      <div className="flex items-baseline gap-4">
                        <p className="text-3xl font-sans font-bold text-destructive tracking-tight">
                          {Math.round(basePrice * (1 - promoDiscount / 100)).toLocaleString()}<span className="text-lg font-medium text-muted-foreground/70 ml-1.5">DH</span>
                        </p>
                        <p className="text-lg font-sans text-muted-foreground line-through opacity-60">
                          {basePrice.toLocaleString()}<span className="text-sm ml-1">DH</span>
                        </p>
                        <span className="px-2 py-1 text-xs font-semibold bg-destructive text-destructive-foreground rounded-sm self-center">-{promoDiscount}%</span>
                      </div>
                    ) : hasOriginal ? (
                      <div className="flex items-baseline gap-4">
                        <p className="text-3xl font-sans font-bold text-foreground tracking-tight">
                          {basePrice.toLocaleString()}<span className="text-lg font-medium text-muted-foreground/70 ml-1.5">DH</span>
                        </p>
                        <p className="text-lg font-sans text-muted-foreground line-through opacity-60">
                          {originalPrice.toLocaleString()}<span className="text-sm ml-1">DH</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-3xl font-sans font-bold text-foreground tracking-tight">
                        {basePrice.toLocaleString()}<span className="text-lg font-medium text-muted-foreground/70 ml-1.5">DH</span>
                      </p>
                    )}
                    {flashPromo && (
                      <div className="mt-3">
                        <FlashCountdown endsAt={flashPromo.ends_at} label="Offre flash" />
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-sm">
                        <p className="text-destructive text-sm font-medium">{t("common.outOfStock")}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="w-12 h-px bg-border mb-8" />
              <p className="text-muted-foreground leading-normal mb-10 whitespace-pre-wrap">{getTranslated(product, "longDescription", lang)}</p>
              <div className="space-y-5 mb-10 pb-10 border-b border-border">
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-1.5">{t("productDetail.ingredients")}</span>
                  <span className="text-sm text-foreground whitespace-pre-wrap">{getTranslated(product, "materials", lang)}</span>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                   {product.weight_prices && product.weight_prices.length > 1 ? (
                    <div>
                      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-3">
                        {lang === 'ar' ? "اختر الوزن" : lang === 'en' ? "Choose weight" : "Choisir le poids"}
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {product.weight_prices.map((wp) => (
                          <button
                            key={wp.weight}
                            type="button"
                            onClick={() => setSelectedWeight(wp.weight)}
                            className={cn(
                              "px-4 py-2 text-xs font-semibold tracking-wider uppercase border transition-all duration-300",
                              String(selectedWeight) === String(wp.weight)
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border hover:border-foreground bg-transparent text-foreground"
                            )}
                          >
                            {formatWeight(wp.weight)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (product.weight || (product.weight_prices && product.weight_prices.length === 1)) && (
                      <div>
                        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-1.5">{t("common.netWeight")}</span>
                        <span className="text-sm text-foreground">
                          {t("common.netWeight")} : {formatWeight(product.weight || product.weight_prices?.[0]?.weight)}
                        </span>
                      </div>
                    )
                  )}

                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-3">
                      {lang === 'ar' ? "السعر" : lang === 'en' ? "Price" : "Prix"}
                    </span>
                    <div className="text-2xl font-sans font-bold text-foreground">
                      {discountedPrice.toLocaleString()}<span className="text-sm font-medium text-muted-foreground/70 ml-1.5">DH</span>
                      {discount > 0 && (
                        <span className="text-sm font-sans text-muted-foreground line-through opacity-60 ml-2">
                          {basePrice.toLocaleString()} DH
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className={cn("grid gap-6 mb-8", product.flavors && product.flavors.length > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
              <div className="flex items-center gap-2 sm:gap-3 w-full mb-3">
                <QuantitySelector
                  quantity={quantity}
                  className="h-12 sm:h-14 shrink-0 bg-background"
                  onQuantityChange={(q) => {
                    setQuantity(q);
                    const currentFlavors = getTranslated(product, "flavors", lang) as string[];
                    if (currentFlavors && currentFlavors.length > 0) {
                      const newFlavors = [...selectedFlavors];
                      if (newFlavors.length < q) {
                        const defaultFlavor = currentFlavors[0];
                        while (newFlavors.length < q) newFlavors.push(defaultFlavor);
                      } else if (newFlavors.length > q) {
                        newFlavors.splice(q);
                      }
                      setSelectedFlavors(newFlavors);
                    }
                  }}
                />
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 rounded-none h-12 sm:h-14 text-xs sm:text-sm tracking-[0.1em] sm:tracking-[0.15em] uppercase py-0 flex items-center justify-center gap-2 btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="truncate">{product.stock === 0 ? t("common.unavailable") : t("common.addToCart")}</span>
                </Button>
              </div>

                <div className="grid grid-cols-[1fr_auto] gap-3 w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-none h-12 sm:h-14 text-xs sm:text-sm tracking-normal sm:tracking-[0.05em] uppercase group px-3"
                    onClick={handleWishlistToggle}
                  >
                    <Heart className={cn("w-4 h-4 me-2 shrink-0 transition-all duration-300 group-hover:scale-110", inWishlist && "fill-primary text-primary")} />
                    <span className="sm:hidden">{inWishlist ? (lang === 'ar' ? "محفوظ" : lang === 'en' ? "Saved" : "Sauvegardé") : (lang === 'ar' ? "المفضلة" : lang === 'en' ? "Favorites" : "Favoris")}</span>
                    <span className="hidden sm:inline">{inWishlist ? t("productDetail.saved") : t("productDetail.addToFavorites")}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-12 sm:w-16 rounded-none h-12 sm:h-14 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 shrink-0 group flex items-center justify-center p-0"
                    onClick={() => {
                      const phone = "212699928463";
                      const url = window.location.href;
                      const weightText = selectedWeight ? ` (Poids : ${/^\d+(\.\d+)?$/.test(String(selectedWeight).trim()) ? `${selectedWeight}g` : selectedWeight})` : "";
                      const message = encodeURIComponent(`Bonjour Aliaa Care, j'aimerais avoir plus d'informations sur le produit : ${getTranslated(product, "name", lang)}${weightText}\nPrix : ${discountedPrice} DH\nLien : ${url}`);
                      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                    }}
                    title={t("productDetail.whatsappQuestion")}
                  >
                    <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                  </Button>
                </div>
              </div>
              
              {/* FOMO Stock Alert */}
              {product.stock > 0 && product.stock < 5 && (
                <div className="mt-4 flex items-center gap-2 text-destructive animate-pulse bg-destructive/5 border border-destructive/10 px-4 py-3 rounded">
                  <Flame className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs font-semibold tracking-wide">
                    {lang === 'ar' 
                      ? `عجّل! المتبقي ${product.stock} قطع فقط في المخزون!` 
                      : lang === 'en' 
                      ? `Hurry up! Only ${product.stock} items left in stock!` 
                      : `Dépêchez-vous ! Plus que ${product.stock} exemplaires disponibles en stock !`
                    }
                  </p>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-border">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">{t("productDetail.shipping")}</p>
                  <p className="text-xs text-muted-foreground">{t("productDetail.freeShipping").replace("500", freeShippingThreshold.toString())}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="py-20 md:py-28 bg-linen">
          <div className="container-full">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("productDetail.youMayAlsoLike")}</p>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">{t("productDetail.moreFrom")} {getTranslated(collection as any, "name", lang)}</h2>
              </div>
              <Link to={`/products?collection=${collection?.slug}`}
                className="hidden md:flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                {t("common.viewAll")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-10">
              {relatedProducts.map((p, index) => <ProductCard key={p.id} product={p} index={index} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;

