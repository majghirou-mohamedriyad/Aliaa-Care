import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft,
  ShoppingBag, 
  Trash2, 
  Share2, 
  Truck, 
  CheckCircle2, 
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Leaf,
  Scale,
  Plus
} from "lucide-react";

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
import { DirectOrderForm } from "@/components/DirectOrderForm";
import { useBanner } from "@/hooks/useBanner";
import { cn } from "@/lib/utils";

const Cart = () => {
  const { items, updateQuantity, removeItem, getSubtotal, addItem, clearCart } = useCart();
  const { products = [] } = useClientProducts();
  const { toast } = useToast();
  const { getTieredDiscount, getTieredPromos } = useActivePromotions();
  const { banner } = useBanner();
  const { t, lang } = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderNumber: string;
    total: number;
    customerName: string;
    phone: string;
  } | null>(null);

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
  const nextTierPromo = tieredPromos.find((p) => p.min_items > totalItems);

  // Dynamic Free Shipping threshold calculation
  const freeShippingThreshold = Number(banner?.free_shipping_threshold ?? 500);
  const hasFreeShippingItem = items.some((item) => !!item.product.free_shipping);
  const isFreeShipping = hasFreeShippingItem || subtotal >= freeShippingThreshold;
  const shippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = isFreeShipping ? 100 : Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const cartProductIds = items.map((item) => item.product.id);
  const upsellProducts = products
    .filter((p) => !cartProductIds.includes(p.id) && p.stock > 0)
    .slice(0, 3);

  // If order was submitted successfully from the direct form
  if (submittedOrder) {
    const rawMsg = (lang === 'ar'
      ? `السلام عليكم علياء كير، لقد قمت بتأكيد طلبي رقم #${submittedOrder.orderNumber} بمجموع ${submittedOrder.total.toLocaleString()} درهم. أريد تأكيد طلبي وشكراً!`
      : lang === 'en'
      ? `Hello Aliaa Care, I placed order #${submittedOrder.orderNumber} for ${submittedOrder.total.toLocaleString()} DH. I would like to confirm my delivery.`
      : `Bonjour Aliaa Care, j'ai passé ma commande #${submittedOrder.orderNumber} d'un montant de ${submittedOrder.total.toLocaleString()} DH. Je souhaite confirmer ma livraison.`);
    const whatsappUrl = `https://wa.me/212699928463?text=${encodeURIComponent(rawMsg)}`;

    return (
      <>
        <MetaManager title={lang === 'ar' ? "تم تأكيد طلبك" : lang === 'en' ? "Order Confirmed" : "Commande confirmée"} />
        <div className="container-narrow py-14 sm:py-20 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }} 
            className="max-w-xl mx-auto space-y-6"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-2">
                {lang === 'ar' ? "تم تسجيل الطلب بنجاح" : lang === 'en' ? "Order Placed Successfully" : "Commande Enregistrée"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground font-bold">
                {lang === 'ar' ? `شكراً لك ${submittedOrder.customerName} !` : lang === 'en' ? `Thank you ${submittedOrder.customerName}!` : `Merci ${submittedOrder.customerName} !`}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md mx-auto">
                {lang === 'ar' ? "سنتواصل معك هاتفياً أو عبر الواتساب لتأكيد موعد الإرسال والتوصيل." : lang === 'en' ? "We will contact you shortly to confirm your delivery." : "Nous vous contacterons bientôt par téléphone ou WhatsApp pour confirmer la livraison."}
              </p>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl p-5 sm:p-6 text-sm space-y-3 text-left rtl:text-right shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-border/60">
                <span className="text-muted-foreground">{lang === 'ar' ? "رقم الطلب :" : lang === 'en' ? "Order number:" : "Numéro de commande :"}</span>
                <span className="font-mono font-bold text-primary text-base">#{submittedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground pb-3 border-b border-border/60">
                <span>{lang === 'ar' ? "طريقة الدفع :" : lang === 'en' ? "Payment method:" : "Mode de paiement :"}</span>
                <span className="font-medium text-foreground">{lang === 'ar' ? "الدفع عند الاستلام" : lang === 'en' ? "Cash on Delivery" : "Paiement en espèces à la livraison"}</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-bold text-base sm:text-lg text-foreground">
                <span>{lang === 'ar' ? "المجموع الكلي للدفع :" : lang === 'en' ? "Total to pay on delivery:" : "Total à payer à la livraison :"}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-sans text-xl">{submittedOrder.total.toLocaleString()} DH</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>{lang === 'ar' ? "تأكيد الطلب فوراً عبر الواتساب" : lang === 'en' ? "Confirm instantly via WhatsApp" : "Confirmer instantanément sur WhatsApp"}</span>
              </a>

              <Button asChild variant="outline" size="lg" className="w-full rounded-xl py-6 text-xs sm:text-sm tracking-wider uppercase border-border/80 hover:bg-muted/30">
                <Link to="/products">
                  {lang === 'ar' ? "متابعة التسوق" : lang === 'en' ? "Continue Shopping" : "Continuer mes achats"}
                  <ArrowRight className="ltr:ml-2 rtl:mr-2 w-4 h-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  // Écran Panier Vide
  if (items.length === 0) {
    return (
      <>
        <MetaManager title={t("cart.yourCart") || "Mon Panier"} />
        <div className="container-narrow py-20 sm:py-28 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }} 
            className="max-w-md mx-auto space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">{t("cart.empty")}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{t("cart.emptyDesc")}</p>
            </div>
            <div className="pt-2">
              <Button asChild size="lg" className="rounded-xl px-8 py-6 text-xs sm:text-sm tracking-wider uppercase btn-premium shadow-md shadow-primary/10">
                <Link to="/products" className="flex items-center gap-2">
                  <span>{t("cart.startShopping")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaManager title={t("cart.yourCart") || "Mon Panier"} />
      
      {/* Fil d'Ariane Minimaliste et Chic */}
      <div className="container-full py-4 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            {lang === 'ar' ? "الرئيسية" : lang === 'en' ? "Home" : "Accueil"}
          </Link>
          <span className="text-border/80">/</span>
          <Link to="/products" className="hover:text-foreground transition-colors">
            {t("common.shop")}
          </Link>
          <span className="text-border/80">/</span>
          <span className="text-foreground font-medium">{t("cart.yourCart")}</span>
        </div>
      </div>

      <section className="py-8 md:py-14">
        <div className="container-full">
          
          {/* En-tête de la page Panier */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-border/60">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  {t("cart.yourCart")}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {totalItems} {totalItems > 1 ? "articles" : "article"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {lang === 'ar' ? "راجع المنتجات في سلتك وأكمل طلبك بسرعة وسهولة." : "Vérifiez vos soins et passez votre commande express en quelques secondes."}
              </p>
            </div>

            {/* Actions : Partager / Vider */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                onClick={handleShareCart}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs tracking-wider uppercase gap-2 border-border/80 text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? "مشاركة السلة" : lang === 'en' ? "Share Cart" : "Partager"}</span>
              </Button>

              <Button
                onClick={() => {
                  clearCart();
                  toast({
                    title: lang === 'ar' ? "تم تفريغ السلة" : "Panier vidé",
                    description: lang === 'ar' ? "تمت إزالة جميع المنتجات من سلتك." : "Tous les articles ont été retirés de votre panier.",
                  });
                }}
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
                title={lang === 'ar' ? "تفريغ السلة" : "Vider le panier"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? "تفريغ" : "Vider"}</span>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Colonne Gauche : Liste des articles & Jauges & Upsell */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Jauge Dynamique de Livraison Offerte & Remise Volume */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-muted/20 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isFreeShipping ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
                    )}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      {isFreeShipping ? (
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">
                          {lang === 'ar' 
                            ? "مبروك! لقد حصلت على توصيل مجاني لكافة مدن المغرب 🎉" 
                            : lang === 'en'
                            ? "Congratulations! You've unlocked Free Shipping 🎉"
                            : "Félicitations ! Vous bénéficiez de la livraison 100% offerte 🎉"}
                        </p>
                      ) : (
                        <p className="text-foreground font-medium">
                          {lang === 'ar' ? (
                            <>أضف ما قيمته <strong className="text-primary font-bold">{shippingRemaining} درهم</strong> للحصول على توصيل مجاني !</>
                          ) : lang === 'en' ? (
                            <>Add <strong className="text-primary font-bold">{shippingRemaining} DH</strong> more to unlock Free Shipping!</>
                          ) : (
                            <>Plus que <strong className="text-primary font-bold">{shippingRemaining} DH</strong> pour débloquer la livraison gratuite !</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-muted-foreground shrink-0">
                    {shippingProgress}%
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/40">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isFreeShipping 
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-xs" 
                        : "bg-gradient-to-r from-primary/80 to-primary"
                    )}
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>

                {/* Motivation Remise Volume Tiered */}
                {nextTierPromo && (
                  <div className="flex items-center gap-2 pt-1 text-xs text-primary font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? `أضف ${nextTierPromo.min_items - totalItems} منتج إضافي للاستفادة من خصم ${nextTierPromo.discount_percent}% على السلة بأكملها!`
                        : `Ajoutez encore ${nextTierPromo.min_items - totalItems} article(s) pour obtenir -${nextTierPromo.discount_percent}% de remise immédiate !`}
                    </span>
                  </div>
                )}
              </div>

              {/* Liste des Soins du Panier (Design Cartes de Luxe) */}
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemProductName = getTranslated(item.product, "name", lang);
                  
                  // Calcul du prix unitaire selon le poids sélectionné
                  let unitPrice = item.product.price;
                  if (item.selectedWeight && (item.product as any).weight_prices) {
                    const wp = (item.product as any).weight_prices.find((w: any) => String(w.weight) === String(item.selectedWeight));
                    if (wp) {
                      unitPrice = wp.price;
                    }
                  }
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <motion.div
                      key={`${item.product.id}-${item.selectedWeight || 'default'}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      className="group p-4 sm:p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all duration-200 shadow-xs space-y-4"
                    >
                      <div className="flex gap-4 sm:gap-5 items-start">
                        {/* Image du produit avec effet hover */}
                        <Link 
                          to={`/product/${item.product.slug}`} 
                          className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-muted/20 border border-border/60 shrink-0 group/img"
                        >
                          <img 
                            src={item.product.images[0]} 
                            alt={itemProductName} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" 
                          />
                        </Link>

                        {/* Détails du produit */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <Link 
                              to={`/product/${item.product.slug}`} 
                              className="font-serif text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block"
                            >
                              {itemProductName}
                            </Link>
                            
                            {/* Bouton supprimer discret et élégant */}
                            <button 
                              onClick={() => removeItem(item.product.id, item.selectedWeight)} 
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0" 
                              title={lang === 'ar' ? "حذف المنتج" : "Supprimer"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Chips Métadonnées (Poids, Livraison offerte) */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.selectedWeight && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                                <Scale className="w-3 h-3 text-muted-foreground/80" />
                                {/^\d+(\.\d+)?$/.test(String(item.selectedWeight).trim()) ? `${item.selectedWeight} g` : item.selectedWeight}
                              </span>
                            )}

                            {item.product.free_shipping && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <Truck className="w-3 h-3 shrink-0" />
                                <span>{t("common.freeShipping")}</span>
                              </span>
                            )}
                          </div>

                          {/* Goûts / Parfums sélectionnés */}
                          {item.selectedFlavors && item.selectedFlavors.length > 0 && (
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                {lang === 'ar' ? "النكهة :" : "Parfum :"}
                              </span>
                              {item.selectedFlavors.map((flavor, i) => (
                                <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
                                  {flavor}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Parfums spécifiques pour packs */}
                          {item.packItemFlavors && Object.keys(item.packItemFlavors).length > 0 && (
                            <div className="pt-1.5 space-y-1">
                              {(item.product as any).items?.map((packItem: any) => {
                                const flavors = item.packItemFlavors?.[packItem.product_name];
                                if (!flavors || flavors.length === 0) return null;
                                const packItemTranslatedName = getTranslated({ name: packItem.product_name, name_ar: packItem.product_name_ar, name_en: packItem.product_name_en }, "name", lang);
                                return (
                                  <div key={packItem.product_id} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground/80">{packItemTranslatedName} :</span>
                                    <span className="text-primary font-medium">{flavors.join(", ")}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Barre inférieure de la carte : Sélecteur de quantité & Prix */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <div className="flex items-center gap-3">
                          <QuantitySelector 
                            quantity={item.quantity} 
                            onQuantityChange={(qty) => updateQuantity(item.product.id, qty, undefined, undefined, item.selectedWeight)} 
                            className="h-9 bg-background rounded-lg border border-border"
                          />
                          {item.quantity > 1 && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              ({unitPrice.toLocaleString()} DH / unité)
                            </span>
                          )}
                        </div>

                        <div className="text-end">
                          <span className="text-base sm:text-lg font-bold font-sans text-foreground">
                            {lineTotal.toLocaleString()} DH
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Produits Complémentaires (Upsell "Complétez votre rituel") */}
              {upsellProducts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-border/60 space-y-4">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                      {lang === 'ar' ? "أكملي روتينكِ للعناية" : lang === 'en' ? "Complete your ritual" : "Complétez votre rituel"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar' ? "منتجات تكمل روتينكِ الطبيعي :" : lang === 'en' ? "Treatments that pair well with your cart:" : "Soins recommandés pour sublimer vos résultats :"}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
                        <div key={p.id} className="group flex flex-col justify-between border border-border/70 p-3 bg-card rounded-2xl hover:border-primary/40 hover:shadow-xs transition-all">
                          <div className="space-y-2">
                            <Link to={`/product/${p.slug}`} className="aspect-[4/5] w-full block rounded-xl overflow-hidden bg-muted/20 relative">
                              <img src={p.images[0]} alt={getTranslated(p, "name", lang)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            </Link>
                            <div>
                              <Link to={`/product/${p.slug}`} className="font-serif text-xs sm:text-sm font-semibold hover:text-primary transition-colors line-clamp-1 block">
                                {getTranslated(p, "name", lang)}
                              </Link>
                              <p className="text-xs font-bold text-primary mt-0.5">{p.price} DH</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            {hasOptions ? (
                              <Button asChild variant="outline" size="sm" className="w-full text-[10px] sm:text-xs tracking-wider uppercase rounded-xl py-2 h-9 border-border/80 hover:bg-muted/30">
                                <Link to={`/product/${p.slug}`}>
                                  {lang === 'ar' ? "اختيار" : "Choisir"}
                                </Link>
                              </Button>
                            ) : (
                              <Button onClick={handleQuickAdd} variant="outline" size="sm" className="w-full text-[10px] sm:text-xs tracking-wider uppercase rounded-xl py-2 h-9 border-primary/20 text-primary hover:bg-primary/10">
                                <Plus className="w-3.5 h-3.5 me-1" />
                                {lang === 'ar' ? "إضافة" : "Ajouter"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bouton Continuer mes achats */}
              <div className="pt-2">
                <Link to="/products" className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{t("cart.continueShopping")}</span>
                </Link>
              </div>
            </div>

            {/* Colonne Droite : Formulaire de commande directe intégré */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.15 }} 
              className="lg:col-span-5"
            >
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Formulaire de commande directe du Panier */}
                <DirectOrderForm 
                  isCart={true} 
                  onSuccess={(orderData) => setSubmittedOrder(orderData)} 
                />

                <div className="text-center pt-2">
                  <Link 
                    to="/checkout" 
                    className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                  >
                    {lang === 'ar' 
                      ? "أو الانتقال إلى صفحة إتمام الطلب الكلاسيكية" 
                      : lang === 'en' 
                      ? "Or proceed via classic checkout page" 
                      : "Ou passer par la page de commande classique"}
                  </Link>
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
