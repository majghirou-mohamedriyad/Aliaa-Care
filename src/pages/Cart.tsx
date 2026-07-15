import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, Share2 } from "lucide-react";

import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useActivePromotions } from "@/hooks/usePromotions";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import { getTranslated } from "@/utils/translationUtils";
import { MetaManager } from "@/seo/components/MetaManager";
import { useClientProducts } from "@/hooks/useClientProducts";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/data/products";

const Cart = () => {
  const { items, updateQuantity, removeItem, getSubtotal, addItem } = useCart();
  const { products = [] } = useClientProducts();
  const { toast } = useToast();
  const { getTieredDiscount, getTieredPromos } = useActivePromotions();
  const { t, lang } = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  // Import shared cart
  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (shareParam && products.length > 0) {
      try {
        const decodedJson = decodeURIComponent(atob(shareParam));
        const sharedItems = JSON.parse(decodedJson);
        
        if (Array.isArray(sharedItems)) {
          sharedItems.forEach((sharedItem: any) => {
            const product = products.find((p) => p.id === sharedItem.id);
            if (product) {
              addItem(product as unknown as Product, sharedItem.q, sharedItem.f, undefined, sharedItem.w);
            }
          });

          // Clear query param from URL
          searchParams.delete("share");
          setSearchParams(searchParams);

          toast({
            title: lang === 'ar' ? "تم استيراد السلة المشتركة" : lang === 'en' ? "Shared cart imported" : "Panier partagé importé !",
            description: lang === 'ar' ? "تمت إضافة المنتجات المشتركة إلى سلتك." : lang === 'en' ? "The shared products have been added to your cart." : "Les produits partagés ont été ajoutés à votre panier.",
          });
        }
      } catch (e) {
        console.error("Failed to parse shared cart link:", e);
      }
    }
  }, [searchParams, products, addItem, setSearchParams, lang, toast]);

  const handleShareCart = async () => {
    const sharedData = items.map((item) => ({
      id: item.product.id,
      q: item.quantity,
      w: item.selectedWeight,
      f: item.selectedFlavors,
    }));
    
    try {
      const base64 = btoa(encodeURIComponent(JSON.stringify(sharedData)));
      const shareUrl = `${window.location.origin}/cart?share=${base64}`;
      const title = lang === 'ar' ? "سلة تسوق علياء كير" : lang === 'en' ? "Aliaa Care Shopping Cart" : "Panier Aliaa Care";
      const text = lang === 'ar' ? "لقد شاركت سلة تسوقي معك من علياء كير!" : lang === 'en' ? "I shared my Aliaa Care shopping cart with you!" : "Je partage mon panier d'achat Aliaa Care avec vous !";

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: lang === 'ar' ? "تم نسخ رابط السلة" : lang === 'en' ? "Cart link copied" : "Lien du panier copié !",
          description: lang === 'ar' ? "يمكنك الآن مشاركته مع من تحب." : lang === 'en' ? "You can now share it with anyone." : "Vous pouvez maintenant le partager par message ou WhatsApp.",
        });
      }
    } catch (e) {
      console.error("Failed to share cart:", e);
      if (e instanceof Error && e.name !== "AbortError") {
        // Fallback to clipboard in case of error
        try {
          const base64 = btoa(encodeURIComponent(JSON.stringify(sharedData)));
          const shareUrl = `${window.location.origin}/cart?share=${base64}`;
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: lang === 'ar' ? "تم نسخ رابط السلة" : lang === 'en' ? "Cart link copied" : "Lien du panier copié !",
            description: lang === 'ar' ? "يمكنك الآن مشاركته مع من تحب." : lang === 'en' ? "You can now share it with anyone." : "Vous pouvez maintenant le partager par message ou WhatsApp.",
          });
        } catch (clipErr) {
          console.error("Fallback clipboard also failed:", clipErr);
        }
      }
    }
  };

  const subtotal = getSubtotal();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const tieredDiscount = getTieredDiscount(totalItems);
  const tieredPromos = getTieredPromos();
  const discountAmount = Math.round(subtotal * tieredDiscount / 100);
  const total = subtotal - discountAmount;

  const cartProductIds = items.map((item) => item.product.id);
  const upsellProducts = products
    .filter((p) => !cartProductIds.includes(p.id) && p.stock > 0)
    .slice(0, 3);

  if (items.length === 0) {
    return (
      <>
        <MetaManager title={t("cart.yourCart") || "Mon Panier"} />
        <div className="container-narrow py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
            <h1 className="font-serif text-4xl mb-4">{t("cart.empty")}</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("cart.emptyDesc")}</p>
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/products">{t("cart.startShopping")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaManager title={t("cart.yourCart") || "Mon Panier"} />
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">{t("common.shop")}</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{t("cart.yourCart")}</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-serif text-4xl md:text-5xl mb-12">
            {t("cart.yourCart")}
          </motion.h1>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="space-y-0">
                {items.map((item, index) => (
                  <motion.div key={`${item.product.id}-${item.selectedWeight || 'default'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }} className="flex gap-6 py-8 border-b border-border">
                    <Link to={`/product/${item.product.slug}`} className="w-28 h-32 md:w-36 md:h-44 flex-shrink-0 overflow-hidden bg-muted/30 group">
                      <img src={item.product.images[0]} alt={getTranslated(item.product, "name", lang)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </Link>
                      <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Link to={`/product/${item.product.slug}`} className="font-serif text-lg md:text-xl hover:text-primary transition-colors">{getTranslated(item.product, "name", lang)}</Link>
                        {item.selectedWeight && (
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            Poids: {/^\d+(\.\d+)?$/.test(String(item.selectedWeight).trim()) ? `${item.selectedWeight} g` : item.selectedWeight}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{getTranslated(item.product, "description", lang)}</p>
                        
                        {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                              {lang === 'ar' ? "النكهات المختارة :" : 
                               lang === 'en' ? "Selected flavor(s) :" : 
                               "Goût(s) sélectionné(s) :"}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.selectedFlavors.map((flavor, i) => (
                                <span key={i} className="text-[11px] px-2 py-0.5 bg-muted rounded-full">
                                  {flavor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.packItemFlavors && Object.keys(item.packItemFlavors).length > 0 && (
                          <div className="mt-3 space-y-3">
                            <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                              {lang === 'ar' ? "تفاصيل النكهات :" : 
                               lang === 'en' ? "Flavor details :" : 
                               "Détails des goûts :"}
                            </p>
                            {(item.product as any).items?.map((packItem: any) => {
                              const flavors = item.packItemFlavors?.[packItem.product_name];
                              if (!flavors || flavors.length === 0) return null;
                              const packItemTranslatedName = getTranslated({ name: packItem.product_name, name_ar: packItem.product_name_ar, name_en: packItem.product_name_en }, "name", lang);
                              return (
                                <div key={packItem.product_id} className="pl-3 border-l-2 border-primary/20">
                                  <p className="text-xs font-medium">{packItemTranslatedName}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {flavors.map((f: string, i: number) => (
                                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(() => {
                          let price = item.product.price;
                          if (item.selectedWeight && (item.product as any).weight_prices) {
                            const wp = (item.product as any).weight_prices.find((w: any) => String(w.weight) === String(item.selectedWeight));
                            if (wp) {
                              price = wp.price;
                            }
                          }
                          return <p className="font-serif text-lg mt-3">{price.toLocaleString()} DH</p>;
                        })()}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <QuantitySelector 
                          quantity={item.quantity} 
                          onQuantityChange={(qty) => updateQuantity(item.product.id, qty, undefined, undefined, item.selectedWeight)} 
                        />
                        <button onClick={() => removeItem(item.product.id, item.selectedWeight)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Complementary Products (Upsell) */}
              {upsellProducts.length > 0 && (
                <div className="mt-12 pt-10 border-t border-border">
                  <h3 className="font-serif text-2xl mb-2">
                    {lang === 'ar' ? "أكمل طلبك" : lang === 'en' ? "Complete your order" : "Complétez votre commande"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {lang === 'ar' ? "قد تعجبك هذه المنتجات أيضاً :" : lang === 'en' ? "You might also like these products:" : "Ces produits pourraient également vous plaire :"}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {upsellProducts.map((p) => {
                      const hasOptions = (p.flavors && p.flavors.length > 0) || (p.weight_prices && p.weight_prices.length > 0);
                      
                      const handleQuickAdd = () => {
                        const defaultWeight = p.weight_prices?.[0]?.weight || p.weight || undefined;
                        addItem(p as unknown as Product, 1, undefined, undefined, defaultWeight);
                        toast({
                          title: lang === 'ar' ? "تمت الإضافة إلى السلة" : lang === 'en' ? "Added to cart" : "Ajouté au panier",
                          description: `${getTranslated(p, "name", lang)}`,
                        });
                      };

                      return (
                        <div key={p.id} className="group flex flex-col justify-between border border-border/50 p-4 bg-muted/5 rounded hover:shadow-md transition-all">
                          <div className="space-y-3">
                            <Link to={`/product/${p.slug}`} className="aspect-[4/5] w-full block rounded overflow-hidden bg-muted/40 relative">
                              <img src={p.images[0]} alt={getTranslated(p, "name", lang)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </Link>
                            <div>
                              <Link to={`/product/${p.slug}`} className="font-serif text-sm font-semibold hover:text-primary transition-colors line-clamp-1 block">
                                {getTranslated(p, "name", lang)}
                              </Link>
                              <p className="text-xs text-muted-foreground mt-1 font-bold">{p.price} DH</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            {hasOptions ? (
                              <Button asChild variant="outline" size="sm" className="w-full text-xs tracking-wider uppercase rounded-none py-4 border-primary/20 text-primary hover:bg-primary/5">
                                <Link to={`/product/${p.slug}`}>
                                  {lang === 'ar' ? "عرض الخيارات" : lang === 'en' ? "View options" : "Voir les options"}
                                </Link>
                              </Button>
                            ) : (
                              <Button onClick={handleQuickAdd} variant="outline" size="sm" className="w-full text-xs tracking-wider uppercase rounded-none py-4 border-primary/20 text-primary hover:bg-primary/5">
                                {lang === 'ar' ? "إضافة سريعة" : lang === 'en' ? "Quick add" : "Ajout rapide"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link to="/products" className="inline-flex items-center gap-2 mt-8 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />{t("cart.continueShopping")}
              </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl mb-8">{t("cart.summary")}</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span>{subtotal.toLocaleString()} DH</span>
                  </div>
                  {tieredDiscount > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>{t("cart.tieredDiscount")} (-{tieredDiscount}%)</span>
                      <span>-{discountAmount.toLocaleString()} DH</span>
                    </div>
                  )}
                  {tieredPromos.length > 0 && tieredDiscount === 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      💡 {tieredPromos[0].tier_rules?.[0] && t("cart.addMoreToGetDiscount").replace("{qty}", (tieredPromos[0].tier_rules[0].min_qty - totalItems).toString()).replace("{percent}", tieredPromos[0].tier_rules[0].discount_percent.toString())}
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-4 mb-8">
                  <div className="flex justify-between font-serif text-xl">
                    <span>{t("cart.total")}</span>
                    <span>{total.toLocaleString()} DH</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="lg" className="flex-1 rounded-none h-[56px] text-sm tracking-[0.15em] uppercase btn-premium flex items-center justify-center">
                    <Link to="/checkout">{t("cart.checkout")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4.5 h-4.5" /></Link>
                  </Button>
                  <Button 
                    onClick={handleShareCart}
                    variant="outline" 
                    size="lg" 
                    className="w-[56px] h-[56px] rounded-none border-primary/20 text-primary hover:bg-primary/5 p-0 flex items-center justify-center shrink-0"
                    title={lang === 'ar' ? "مشاركة السلة" : lang === 'en' ? "Share Cart" : "Partager le panier"}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">{t("cart.shipping")}</p>
                    <p className="text-xs text-muted-foreground">{t("cart.deliveryMorocco")}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Cart;

