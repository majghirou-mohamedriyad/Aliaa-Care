import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Tag, Check, X, Loader2 } from "lucide-react";

import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAddOrder } from "@/hooks/useOrders";
import { useValidatePromoCode, useIncrementPromoUsage, PromoCode } from "@/hooks/usePromoCodes";
import { useT } from "@/hooks/useT";
import { sendOrderWhatsAppNotification } from "@/lib/whatsapp";
import livraisonData from "@/data/livraison.json";
import { cn } from "@/lib/utils";
import { getTranslated } from "@/utils/translationUtils";
import { useBanner } from "@/hooks/useBanner";



const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: banner } = useBanner();
  const { items, getSubtotal, clearCart } = useCart();
  const addOrder = useAddOrder();
  const validatePromo = useValidatePromoCode();
  const incrementUsage = useIncrementPromoUsage();
  const { t, lang } = useT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", region: "", city: "", postalCode: "", country: "Maroc", notes: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = getSubtotal();

  // Calculate discount
  const getDiscount = () => {
    if (!appliedPromo) return 0;

    const discountFactor = (Number(appliedPromo.discount_percent) || 0) / 100;

    if (appliedPromo.applies_to === "all") {
      return subtotal * discountFactor;
    }

    // Calculate discount only on eligible items
    let eligibleTotal = 0;
    const promoProductIds = appliedPromo.product_ids || [];
    const promoPackIds = appliedPromo.pack_ids || [];

    for (const item of items) {
      // Determine if item is a pack or a product
      // Packs usually have a specific collection or flag, but here we can check if it's in pack_ids or product_ids
      const isProductEligible = (appliedPromo.applies_to === "products" || appliedPromo.applies_to === "custom") &&
        promoProductIds.includes(item.product.id);

      const isPackEligible = (appliedPromo.applies_to === "packs" || appliedPromo.applies_to === "custom") &&
        promoPackIds.includes(item.product.id);

      if (isProductEligible || isPackEligible) {
        eligibleTotal += item.product.price * item.quantity;
      }
    }

    return eligibleTotal * discountFactor;
  };

  const discount = Math.round(getDiscount());
  const afterDiscount = Math.max(0, subtotal - discount);

  // Calculate shipping based on selected city in livraisonData
  const selectedCity = livraisonData.find(c => c.nom === formData.city);
  const baseShipping = selectedCity ? selectedCity.livraison : 45;
  const freeShippingThreshold = Number(banner?.free_shipping_threshold ?? 500);
  const isFreeDelivery = afterDiscount >= freeShippingThreshold;

  const shipping = isFreeDelivery ? 0 : (formData.city === "" ? 0 : baseShipping);

  const total = afterDiscount + shipping;

  if (items.length === 0) {
    return (
      <>
        <div className="container-narrow py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-serif text-4xl mb-4">{t("checkout.noItems")}</h1>
            <p className="text-muted-foreground mb-8">{t("checkout.emptyCart")}</p>
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/products">{t("cart.startShopping")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const name = e.target.name;
    let value = e.target.value;

    // Filter phone number to only accept digits and limit to 10 characters
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Automatically resolve region as "Maroc" when city is selected
      if (name === "city") {
        newData.region = "Maroc";
      }
      return newData;
    });

    if (name === "email") {
      setEmailError("");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError("");
    try {
      const promo = await validatePromo.mutateAsync(promoInput);

      // Temporary check for eligible items
      let isEligible = promo.applies_to === "all";
      if (!isEligible) {
        const promoProductIds = promo.product_ids || [];
        const promoPackIds = promo.pack_ids || [];
        isEligible = items.some(item =>
          (promo.applies_to === "products" || promo.applies_to === "custom") && promoProductIds.includes(item.product.id) ||
          (promo.applies_to === "packs" || promo.applies_to === "custom") && promoPackIds.includes(item.product.id)
        );
      }

      if (!isEligible) {
        setPromoError(t("checkout.promoNotApplicable"));
        return;
      }

      setAppliedPromo(promo);
      setPromoInput("");
      toast({ title: t("checkout.promoApplied"), description: `-${promo.discount_percent}%` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("checkout.promoInvalid");
      setPromoError(message);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for required fields
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: t("checkout.orderError"),
        description: t("checkout.requiredFields"),
        variant: "destructive"
      });
      return;
    }

    // Validate phone number length (must be 10 digits)
    if (formData.phone.length !== 10) {
      toast({
        title: t("checkout.orderError"),
        description: t("checkout.phoneInvalid"),
        variant: "destructive"
      });
      return;
    }

    // Email validation (only if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailError(t("checkout.emailInvalid"));
        toast({
          title: t("checkout.orderError"),
          description: t("checkout.emailInvalid"),
          variant: "destructive"
        });
        return;
      }
    }
    setEmailError("");

    setIsSubmitting(true);
    try {
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();
      const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;
      const fullPhone = formData.phone;
      await addOrder.mutateAsync({
        order_number: orderNumber,
        total,
        total_cost: 0,
        customer_name: customerName,
        customer_phone: fullPhone,
        customer_address: formData.address,
        customer_city: formData.city,
        customer_region: formData.region,
        notes: formData.notes,
        items: items.map((i) => {
          let price = i.product.price;
          if (i.selectedWeight && (i.product as any).weight_prices) {
            const wp = (i.product as any).weight_prices.find((w: any) => String(w.weight) === String(i.selectedWeight));
            if (wp) {
              price = wp.price;
            }
          }
          return {
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            unit_price: price,
            cost_price: 0,
            selected_flavors: i.selectedFlavors || [],
            selected_weight: i.selectedWeight,
          };
        }),
      });

      // Send WhatsApp notification
      try {
        const fullPhone = formData.phone;
        const mappedItems = items.map((i) => {
          let price = i.product.price;
          if (i.selectedWeight && (i.product as any).weight_prices) {
            const wp = (i.product as any).weight_prices.find((w: any) => String(w.weight) === String(i.selectedWeight));
            if (wp) {
              price = wp.price;
            }
          }
          return {
            product_name: i.product.name,
            quantity: i.quantity,
            unit_price: price,
            selected_flavors: i.selectedFlavors || [],
            pack_item_flavors: i.packItemFlavors || {},
            selected_weight: i.selectedWeight,
          };
        });

        // 1. Send to the customer
        await sendOrderWhatsAppNotification(
          {
            order_number: orderNumber,
            total,
            customerName,
            phone: fullPhone,
            address: formData.address,
          },
          mappedItems,
          lang // Pass the current language
        );

        // 2. Send copy to admin (212699928463)
        try {
          await sendOrderWhatsAppNotification(
            {
              order_number: orderNumber,
              total,
              customerName: `${customerName} (Admin Copy)`,
              phone: "212699928463",
              address: formData.address,
            },
            mappedItems,
            lang
          );
        } catch (adminWaError) {
          console.error("Failed to send Admin WhatsApp notification:", adminWaError);
        }
      } catch (waError) {
        console.error("Failed to send WhatsApp notification:", waError);
      }

      if (appliedPromo) {
        await incrementUsage.mutateAsync(appliedPromo.id);
      }
      toast({ title: t("checkout.orderSuccess"), description: t("checkout.orderSuccessDesc") });

      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Order submission failed:", error);
      toast({ title: t("checkout.orderError"), description: t("checkout.orderErrorDesc"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/cart" className="hover:text-foreground transition-colors">{t("cart.yourCart")}</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{t("checkout.order")}</span>
        </div>
      </div>



      <section className="py-10 md:py-16">
        <div className="container-full">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-serif text-4xl md:text-5xl mb-12">
            {t("checkout.order")}
          </motion.h1>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-7">
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                <div>
                  <h2 className="font-serif text-xl mb-6">{t("checkout.contactInfo")}</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.firstName")} *</label>
                      <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required maxLength={50} className="rounded-none h-12" autoComplete="given-name" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.lastName")} *</label>
                      <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required maxLength={50} className="rounded-none h-12" autoComplete="family-name" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        {t("checkout.email")} <span className="text-muted-foreground/50 lowercase tracking-normal">({t("common.optional")})</span>
                      </label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} maxLength={100} className={cn("rounded-none h-12", emailError && "border-destructive focus-visible:ring-destructive")} autoComplete="email" />
                      {emailError && <p className="text-xs text-destructive mt-1.5">{emailError}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.phone")} *</label>
                      <Input id="phone" name="phone" type="tel" inputMode="numeric" value={formData.phone} onChange={handleInputChange} required maxLength={10} className="rounded-none h-12 w-full" placeholder="0612345678" autoComplete="tel" />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-xl mb-6">{t("checkout.shippingAddress")}</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.address")} *</label>
                      <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required maxLength={200} className="rounded-none h-12" autoComplete="street-address" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <label htmlFor="city" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.city")} *</label>
                        <input type="hidden" id="city" name="city" value={formData.city} required />

                        {/* Selected value button */}
                        <div
                          onClick={() => setIsOpen(!isOpen)}
                          className="w-full bg-background border border-border px-4 h-12 text-sm flex items-center justify-between cursor-pointer select-none"
                        >
                          <span className={formData.city ? "text-foreground" : "text-muted-foreground"}>
                            {formData.city || "Sélectionner une ville"}
                          </span>
                          <span className="text-muted-foreground text-xs">▼</span>
                        </div>

                        {isOpen && (
                          <>
                            {/* Backdrop to close dropdown on click outside */}
                            <div
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={() => { setIsOpen(false); setSearchQuery(""); }}
                            />

                            {/* Dropdown panel */}
                            <div className="absolute z-50 w-full mt-1 bg-background border border-border shadow-lg max-h-60 flex flex-col">
                              {/* Search bar inside dropdown */}
                              <div className="p-2 border-b border-border bg-muted/20">
                                <input
                                  type="text"
                                  className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Rechercher une ville..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>

                              {/* Cities list */}
                              <div className="overflow-y-auto flex-1 max-h-48">
                                {(() => {
                                  const filtered = [...livraisonData]
                                    .filter(c => c.nom.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .sort((a, b) => a.nom.localeCompare(b.nom));

                                  return filtered.length > 0 ? (
                                    filtered.map((city) => (
                                      <div
                                        key={city.nom}
                                        className={cn(
                                          "px-4 py-2 text-sm cursor-pointer hover:bg-primary/5 transition-colors text-left",
                                          formData.city === city.nom && "bg-primary/10 font-medium"
                                        )}
                                        onClick={() => {
                                          handleInputChange({
                                            target: { name: "city", value: city.nom }
                                          } as any);
                                          setIsOpen(false);
                                          setSearchQuery("");
                                        }}
                                      >
                                        {city.nom}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                                      Aucune ville trouvée
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <label htmlFor="postalCode" className="block text-xs font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">{t("checkout.postalCode")} *</label>
                        <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required maxLength={10} className="rounded-none h-12" autoComplete="postal-code" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-xl mb-6">{t("checkout.notes")}</h2>
                  <Textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder={t("checkout.notesPlaceholder")} maxLength={500} className="rounded-none min-h-[120px]" />
                </div>

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                  {isSubmitting ? t("checkout.submitting") : <>{t("checkout.submit")}<ArrowRight className="ltr:ml-3 rtl:mr-3 w-4 h-4" /></>}
                </Button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl mb-6">{t("cart.summary")}</h2>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedWeight || 'default'}`} className="flex gap-4">
                      <div className="w-16 h-20 bg-muted/30 overflow-hidden">
                        <img src={item.product.images[0]} alt={getTranslated(item.product, "name", lang)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{getTranslated(item.product, "name", lang)}</p>
                        {item.selectedWeight && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Poids: {/^\d+(\.\d+)?$/.test(String(item.selectedWeight).trim()) ? `${item.selectedWeight} g` : item.selectedWeight}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{t("checkout.qty")} : {item.quantity}</p>
                        {(() => {
                          let price = item.product.price;
                          if (item.selectedWeight && (item.product as any).weight_prices) {
                            const wp = (item.product as any).weight_prices.find((w: any) => String(w.weight) === String(item.selectedWeight));
                            if (wp) {
                              price = wp.price;
                            }
                          }
                          return <p className="text-sm mt-1">{(price * item.quantity).toLocaleString()} DH</p>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Section */}
                {/* <div className="border-t border-border pt-4 mb-4">
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />{t("checkout.promoCode")}
                  </p>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <code className="font-mono font-bold text-sm">{appliedPromo.code}</code>
                        <span className="text-xs text-primary font-medium">-{appliedPromo.discount_percent}%</span>
                      </div>
                      <button onClick={handleRemovePromo} className="p-1 hover:bg-primary/10 rounded transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <Input
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                          placeholder={t("checkout.promoPlaceholder")}
                          maxLength={20}
                          className="rounded-none h-10 font-mono tracking-wider text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-none h-10 px-4 text-xs tracking-[0.1em] uppercase shrink-0"
                          onClick={handleApplyPromo}
                          disabled={validatePromo.isPending || !promoInput.trim()}
                        >
                          {validatePromo.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t("checkout.promoApply")}
                        </Button>
                      </div>
                      {promoError && <p className="text-xs text-destructive mt-1.5">{promoError}</p>}
                    </div>
                  )}
                </div> */}

                <div className="border-t border-border pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span>{subtotal.toLocaleString()} DH</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>{t("checkout.promoDiscount")}</span>
                      <span>-{discount.toLocaleString()} DH</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.shipping")}</span>
                    <span>
                      {isFreeDelivery
                        ? t("cart.free")
                        : (formData.city === ""
                          ? (lang === 'ar' ? "حسب المدينة" : lang === 'en' ? "Depending on city" : "Selon ville")
                          : `${shipping} DH`)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-serif text-xl">
                    <span>{t("cart.total")}</span>
                    <span>{total.toLocaleString()} DH</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">{t("checkout.questions")}</p>
                  <p className="text-sm text-muted-foreground">{t("checkout.contactPhone")} <a href="tel:0699928463" className="text-foreground underline" dir="ltr">06 99 92 84 63</a></p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Checkout;

