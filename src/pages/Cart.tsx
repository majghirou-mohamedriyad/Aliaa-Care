import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";

import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/hooks/useCart";
import { useActivePromotions } from "@/hooks/usePromotions";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import { getTranslated } from "@/utils/translationUtils";
import { MetaManager } from "@/seo/components/MetaManager";

const Cart = () => {
  const { items, updateQuantity, removeItem, getSubtotal } = useCart();
  const { getTieredDiscount, getTieredPromos } = useActivePromotions();
  const { t, lang } = useT();
  const subtotal = getSubtotal();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const tieredDiscount = getTieredDiscount(totalItems);
  const tieredPromos = getTieredPromos();
  const discountAmount = Math.round(subtotal * tieredDiscount / 100);
  const total = subtotal - discountAmount;

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
                <Button asChild size="lg" className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                  <Link to="/checkout">{t("cart.checkout")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></Link>
                </Button>
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

