import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ShoppingBag, ArrowLeft, MessageSquare, Heart, ChevronLeft, ChevronRight } from "lucide-react";

import { usePacks } from "@/hooks/usePacks";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useT } from "@/hooks/useT";
import { useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { Product } from "@/data/products";
import { useActivePromotions } from "@/hooks/usePromotions";
import { getTranslated } from "@/utils/translationUtils";
import { SEOManager } from "@/seo/components/SEOManager";

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
      <>
        <div className="container-wide py-28 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </div>
      </>
    );
  }

  if (!pack) {
    return (
      <>
        <div className="container-wide py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">{t("pack.notFound")}</h1>
          <p className="text-muted-foreground mb-8">{t("pack.notFoundDesc")}</p>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/products">{t("index.viewAllProducts")}</Link>
          </Button>
        </div>
      </>
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
        images: pack.images && pack.images.length > 0 ? pack.images : [firstImage],
        packItemFlavors: selectedPackFlavors[i] || {},
        items: pack.items,
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
      const firstImage = pack.items[0]?.product_image || pack.image;
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
        images: pack.images && pack.images.length > 0 ? pack.images : [firstImage],
        items: pack.items,
      } as any);
      toast({ title: t("productDetail.addedToFavorites"), description: getTranslated(pack, "name", lang) });
    }
  };

  const packName = getTranslated(pack, "name", lang);
  const packDescription = getTranslated(pack, "description", lang) || pack.description;
  const packImages = pack.images && pack.images.length > 0 ? pack.images : [firstImage];

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
            price: discountedPrice >= 500 ? 0 : 40,
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
      <div className="container-wide pt-6 pb-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />{t("pack.backHome")}
        </Link>
      </div>

      <section className="container-wide pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
            <div className="relative aspect-square overflow-hidden bg-muted/30 rounded-lg border border-border group">
              {pack.images && pack.images.length > 0 ? (
                <img 
                  src={pack.images[currentImageIndex]} 
                  alt={getTranslated(pack, "name", lang)} 
                  className="w-full h-full object-cover"
                />
              ) : pack.items.length >= 3 ? (
                <div className="grid grid-cols-2 grid-rows-2 h-full gap-1">
                  {pack.items.slice(0, 4).map((item) => {
                    const itemTranslatedName = getTranslated({ name: item.product_name, name_ar: item.product_name_ar, name_en: item.product_name_en }, "name", lang);
                    return (
                      <img key={item.id} src={item.product_image || "/placeholder.svg"} alt={itemTranslatedName} className="w-full h-full object-cover" />
                    );
                  })}
                </div>
              ) : (
                <img src={firstImage} alt={getTranslated(pack, "name", lang)} className="w-full h-full object-cover" />
              )}

              {pack.images && pack.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute start-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md hover:bg-background transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-full shadow-sm">
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button onClick={nextImage} className="absolute end-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md hover:bg-background transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-full shadow-sm">
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>

            {pack.images && pack.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {pack.images.map((image, index) => (
                  <button 
                    key={index} 
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300",
                      index === currentImageIndex ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={image} alt={`${getTranslated(pack, "name", lang)} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground rounded-sm flex items-center gap-1.5">
                <Package className="w-3 h-3" />{t("common.pack")}
              </span>
              {savings > 0 && (
                <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase bg-foreground text-background rounded-sm">
                  {t("common.save")} {savings.toFixed(0)} DH
                </span>
              )}
              {discount > 0 && (
                <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground rounded-sm">
                  -{discount}%
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">{getTranslated(pack, "name", lang)}</h1>
            <p className="text-muted-foreground leading-normal mb-6 whitespace-pre-wrap">{getTranslated(pack, "long_description", lang) || getTranslated(pack, "description", lang)}</p>
            <div className="flex items-baseline gap-4 mb-8">
              {discount > 0 ? (
                <>
                  <span className="text-3xl font-sans font-bold text-destructive tracking-tight">
                    {discountedPrice.toLocaleString()}<span className="text-lg font-medium text-muted-foreground/70 ml-1.5">DH</span>
                  </span>
                  <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                    {pack.price.toLocaleString()}<span className="text-sm ml-1">DH</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-sans font-bold text-foreground tracking-tight">
                    {pack.price.toLocaleString()}<span className="text-lg font-medium text-muted-foreground/70 ml-1.5">DH</span>
                  </span>
                  {savings > 0 && (
                    <span className="text-lg font-sans text-muted-foreground line-through opacity-60">
                      {totalValue.toLocaleString()}<span className="text-sm ml-1">DH</span>
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold tracking-[0.1em] uppercase text-foreground mb-4">
                {t("pack.contents")} ({pack.items.length} {t("pack.productsCount")})
              </h3>
              <div className="space-y-3">
                {pack.items.map((item) => {
                  const itemTranslatedName = getTranslated({ name: item.product_name, name_ar: item.product_name_ar, name_en: item.product_name_en }, "name", lang);
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                      <img src={item.product_image || "/placeholder.svg"} alt={itemTranslatedName} className="w-14 h-14 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{itemTranslatedName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("common.netWeight")}: {item.selected_weight || item.product_weight || "Standard"}
                        </p>
                        
                        {/* Flavor selection for pack items */}
                        {item.product_flavors && item.product_flavors.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {Array.from({ length: quantity }).map((_, packIdx) => (
                              <div key={packIdx} className="space-y-1.5 border-t border-border/40 pt-2 first:border-0 first:pt-0">
                                {quantity > 1 && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary block">
                                    Pack {packIdx + 1}
                                  </span>
                                )}
                                {Array.from({ length: item.quantity || 1 }).map((_, i) => {
                                  const currentFlavors = getTranslated(item, "product_flavors", lang) as string[];
                                  if (!currentFlavors || currentFlavors.length === 0) return null;
                                  
                                  const packSelections = selectedPackFlavors[packIdx] || {};
                                  const selections = packSelections[item.product_name || ""] || [];
                                  const currentVal = selections[i] || currentFlavors[0];

                                  return (
                                    <div key={i} className="flex flex-col gap-1">
                                      {item.quantity > 1 && (
                                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Unité {i + 1}</span>
                                      )}
                                      <select
                                        className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer rounded"
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
                      <span className="text-sm text-muted-foreground">{getItemPrice(item).toLocaleString()} DH</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <QuantitySelector quantity={quantity} onQuantityChange={setQuantity} />
              <Button size="lg" className="flex-1 w-full rounded-none text-sm tracking-[0.15em] uppercase py-6" onClick={handleAddToCart}>
                <ShoppingBag className="w-4 h-4 ltr:mr-2 rtl:ml-2" />{t("common.addToCart")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button variant="outline" size="lg" className="rounded-none flex-1 py-6 text-sm tracking-[0.1em] uppercase" onClick={handleWishlistToggle}>
                <Heart className={cn("w-4 h-4 ltr:mr-3 rtl:ml-3 transition-all duration-300", inWishlist && "fill-primary text-primary")} />
                {inWishlist ? t("productDetail.saved") : t("productDetail.addToFavorites")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-none flex-1 py-6 text-sm tracking-[0.1em] uppercase border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 transition-colors"
                onClick={() => {
                  const phone = "212699928463";
                  const url = window.location.href;
                  const message = encodeURIComponent(`Bonjour Aliaa Care, j'aimerais avoir plus d'informations sur le pack : ${getTranslated(pack, "name", lang)}\nPrix : ${pack.price} DH\nLien : ${url}`);
                  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
                }}
              >
                <WhatsAppIcon className="w-4 h-4 ltr:mr-3 rtl:ml-3" />
                Question WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default PackDetail;

