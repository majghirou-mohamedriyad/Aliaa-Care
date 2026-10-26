import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Search, 
  ChevronDown,
  MessageCircle,
  Clock,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAddOrder } from "@/hooks/useOrders";
import { sendOrderWhatsAppNotification } from "@/lib/whatsapp";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import livraisonData from "@/data/livraison.json";
import { useBanner } from "@/hooks/useBanner";
import { QuantitySelector } from "@/components/QuantitySelector";
import { getTranslated } from "@/utils/translationUtils";

interface DirectOrderFormProps {
  product: {
    id: string;
    name: string;
    name_ar?: string;
    name_en?: string;
    slug: string;
    price: number;
    images: string[];
    free_shipping?: boolean;
    stock?: number;
    weight_prices?: Array<{ weight: string | number; price: number }>;
  };
  selectedWeight?: string | number;
  selectedFlavors?: string[];
  initialQuantity?: number;
  discountedPrice: number;
  onSuccess?: () => void;
}

const formTranslations = {
  fr: {
    badge: "Commande Express Directe",
    title: "Commandez en 30 secondes",
    subtitle: "Paiement à la livraison après réception de votre colis",
    quantity: "Quantité",
    unit: "unité",
    fullName: "Nom & Prénom",
    fullNamePlaceholder: "Ex: Meriem El Alami",
    phone: "Numéro de téléphone",
    phonePlaceholder: "06 XX XX XX XX",
    city: "Ville",
    cityPlaceholder: "Sélectionnez votre ville...",
    searchCity: "Rechercher une ville...",
    noCityFound: "Aucune ville trouvée",
    address: "Adresse complète",
    addressPlaceholder: "Quartier, N° rue, bâtiment...",
    notes: "Note pour le livreur (Optionnel)",
    notesPlaceholder: "Ex: Appeler avant la livraison...",
    subtotal: "Sous-total",
    shipping: "Frais de livraison",
    free: "Gratuit (0 DH)",
    freeShipping: "Gratuit",
    dependingOnCity: "Selon la ville",
    totalToPay: "Total à payer à la livraison",
    submitButton: "Confirmer ma commande",
    submitting: "Enregistrement de la commande...",
    incompleteData: "Informations incomplètes",
    fillRequired: "Veuillez remplir les champs obligatoires",
    errFullName: "Le nom complet est obligatoire",
    errPhone: "Le numéro de téléphone est obligatoire",
    errPhoneDigits: "Le numéro doit comporter 10 chiffres (ex: 06...)",
    errCity: "Veuillez choisir votre ville",
    errAddress: "L'adresse de livraison est obligatoire",
    orderSuccessTitle: "Commande enregistrée avec succès !",
    orderSuccessDesc: "Nous vous contacterons bientôt pour confirmer la livraison.",
    orderErrorTitle: "Erreur de commande",
    orderErrorDesc: "Une erreur est survenue, veuillez réessayer.",
    successBadge: "Commande Enregistrée",
    thankYou: "Merci {name} !",
    yourOrderNumber: "Votre numéro de commande :",
    article: "Article",
    confirmWhatsApp: "Confirmer instantanément sur WhatsApp",
    orderAgain: "Commander à nouveau",
    whatsappMsg: "Bonjour Aliaa Care, j'ai passé la commande #{orderNumber} pour le produit {productName}. Je souhaite confirmer ma livraison.",
  },
  ar: {
    badge: "طلب سريع ومباشر",
    title: "اطلب في 30 ثانية",
    subtitle: "الدفع عند الاستلام",
    quantity: "الكمية المطلوبة",
    unit: "قطعة",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "مثال: مريم العلمي",
    phone: "رقم الهاتف",
    phonePlaceholder: "06 XX XX XX XX",
    city: "المدينة",
    cityPlaceholder: "اختر مدينتك...",
    searchCity: "ابحث عن المدينة...",
    noCityFound: "لا توجد مدينة مطابقة",
    address: "عنوان التوصيل",
    addressPlaceholder: "الحي، رقم المنزل، الشارع...",
    notes: "ملاحظة أو وقت مفضل للاتصال (اختياري)",
    notesPlaceholder: "مثال: يرجى الاتصال قبل الوصول...",
    subtotal: "المجموع الفرعي",
    shipping: "مصاريف التوصيل",
    free: "مجاني (0 درهم)",
    freeShipping: "مجاني",
    dependingOnCity: "حسب المدينة",
    totalToPay: "المجموع الكلي للدفع عند الاستلام",
    submitButton: "اضغط هنا لتأكيد الطلب",
    submitting: "جاري تسجيل طلبكم...",
    incompleteData: "بيانات غير مكتملة",
    fillRequired: "يرجى ملء الحقول الإجبارية",
    errFullName: "الاسم الكامل مطلوب",
    errPhone: "رقم الهاتف مطلوب",
    errPhoneDigits: "رقم الهاتف يجب أن يتكون من 10 أرقام (مثال: 06...)",
    errCity: "المدينة مطلوبة",
    errAddress: "عنوان التوصيل مطلوب",
    orderSuccessTitle: "تم تسجيل طلبك بنجاح!",
    orderSuccessDesc: "سنتواصل معك هاتفياً أو عبر الواتساب لتأكيد الإرسال.",
    orderErrorTitle: "خطأ في تسجيل الطلب",
    orderErrorDesc: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
    successBadge: "تم استلام الطلب بنجاح",
    thankYou: "شكراً لك {name} !",
    yourOrderNumber: "رقم طلبك هو :",
    article: "المنتج",
    confirmWhatsApp: "تأكيد فوري عبر الواتساب",
    orderAgain: "طلب قطعة أخرى",
    whatsappMsg: "السلام عليكم، لقد قمت بطلب المنتج {productName} برقم طلب #{orderNumber}. أريد تأكيد طلبي وشكراً!",
  },
  en: {
    badge: "Direct Express Order",
    title: "Order in 30 seconds",
    subtitle: "Cash on delivery after receiving",
    quantity: "Quantity",
    unit: "unit",
    fullName: "Full Name",
    fullNamePlaceholder: "Ex: Sarah Smith",
    phone: "Phone Number",
    phonePlaceholder: "06 XX XX XX XX",
    city: "City",
    cityPlaceholder: "Select your city...",
    searchCity: "Search city...",
    noCityFound: "No city found",
    address: "Complete Delivery Address",
    addressPlaceholder: "Neighborhood, street, building number...",
    notes: "Delivery Note (Optional)",
    notesPlaceholder: "Ex: Call before arrival...",
    subtotal: "Subtotal",
    shipping: "Shipping Fee",
    free: "Free (0 DH)",
    freeShipping: "Free",
    dependingOnCity: "Depending on city",
    totalToPay: "Total to pay on delivery",
    submitButton: "Confirm My Order",
    submitting: "Processing your order...",
    incompleteData: "Incomplete information",
    fillRequired: "Please fill in all required fields",
    errFullName: "Full name is required",
    errPhone: "Phone number is required",
    errPhoneDigits: "Phone number must be 10 digits (e.g. 06...)",
    errCity: "Please select your city",
    errAddress: "Delivery address is required",
    orderSuccessTitle: "Order successfully placed!",
    orderSuccessDesc: "We will contact you shortly to confirm delivery.",
    orderErrorTitle: "Order error",
    orderErrorDesc: "An unexpected error occurred, please try again.",
    successBadge: "Order Received",
    thankYou: "Thank you {name}!",
    yourOrderNumber: "Your order number:",
    article: "Item",
    confirmWhatsApp: "Confirm immediately on WhatsApp",
    orderAgain: "Order another item",
    whatsappMsg: "Hello Aliaa Care, I placed order #{orderNumber} for {productName}. I would like to confirm my delivery.",
  }
};

export const DirectOrderForm = ({
  product,
  selectedWeight,
  selectedFlavors = [],
  initialQuantity = 1,
  discountedPrice,
}: DirectOrderFormProps) => {
  const { toast } = useToast();
  const { data: banner } = useBanner();
  const { lang } = useT();
  const addOrder = useAddOrder();

  // Pick language dictionary with fallback to French
  const tForm = formTranslations[lang as keyof typeof formTranslations] || formTranslations.fr;
  const productName = getTranslated(product, "name", lang);

  const [quantity, setQuantity] = useState(initialQuantity);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [citySearch, setCitySearch] = useState("");
  const [isCityOpen, setIsCityOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderNumber: string;
    total: number;
    customerName: string;
    phone: string;
  } | null>(null);

  // Sync initialQuantity if changed from parent
  useEffect(() => {
    if (initialQuantity > 0) {
      setQuantity(initialQuantity);
    }
  }, [initialQuantity]);

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shipping cost calculation
  const subtotal = discountedPrice * quantity;
  const freeShippingThreshold = Number(banner?.free_shipping_threshold ?? 500);
  const selectedCityData = livraisonData.find((c) => c.nom.toLowerCase() === city.toLowerCase());
  const baseShipping = selectedCityData ? selectedCityData.livraison : 40;
  
  const isFreeShipping = !!product.free_shipping || subtotal >= freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : (city ? baseShipping : 0);
  const total = subtotal + shipping;

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = tForm.errFullName;
    }
    if (!phone.trim()) {
      newErrors.phone = tForm.errPhone;
    } else if (phone.length < 10) {
      newErrors.phone = tForm.errPhoneDigits;
    }
    if (!city.trim()) {
      newErrors.city = tForm.errCity;
    }
    if (!address.trim()) {
      newErrors.address = tForm.errAddress;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: tForm.incompleteData,
        description: tForm.fillRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;
      const customerName = fullName.trim();
      const fullPhone = phone.trim();

      const itemPayload = {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: discountedPrice,
        cost_price: 0,
        selected_flavors: selectedFlavors,
        selected_weight: selectedWeight,
      };

      await addOrder.mutateAsync({
        order_number: orderNumber,
        total,
        total_cost: 0,
        customer_name: customerName,
        customer_phone: fullPhone,
        customer_address: address.trim(),
        customer_city: city.trim(),
        customer_region: "Maroc",
        notes: notes.trim() || undefined,
        items: [itemPayload],
      });

      // Send WhatsApp notifications in parallel (non-blocking)
      const mappedItems = [
        {
          product_name: product.name,
          quantity,
          unit_price: discountedPrice,
          selected_flavors: selectedFlavors,
          selected_weight: selectedWeight,
        },
      ];

      Promise.all([
        sendOrderWhatsAppNotification(
          {
            order_number: orderNumber,
            total,
            customerName,
            phone: fullPhone,
            address: `${address}, ${city}`,
          },
          mappedItems,
          lang
        ),
        sendOrderWhatsAppNotification(
          {
            order_number: orderNumber,
            total,
            customerName: `${customerName} (Direct Order)`,
            phone: "212699928463",
            address: `${address}, ${city}`,
          },
          mappedItems,
          lang
        ),
      ]).catch((err) => {
        console.error("WhatsApp notification error in DirectOrderForm:", err);
      });

      setSubmittedOrder({
        orderNumber,
        total,
        customerName,
        phone: fullPhone,
      });

      toast({
        title: tForm.orderSuccessTitle,
        description: tForm.orderSuccessDesc,
      });
    } catch (error) {
      console.error("Direct order submission failed:", error);
      toast({
        title: tForm.orderErrorTitle,
        description: tForm.orderErrorDesc,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCities = livraisonData
    .filter((c) => c.nom.toLowerCase().includes(citySearch.toLowerCase()))
    .slice(0, 50);

  // Success Confirmation Card
  if (submittedOrder) {
    const rawMsg = tForm.whatsappMsg
      .replace("{orderNumber}", submittedOrder.orderNumber)
      .replace("{productName}", productName);
    const whatsappMsg = encodeURIComponent(rawMsg);

    return (
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl p-4 sm:p-7 text-center space-y-4 animate-in fade-in duration-500">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 mb-1.5">
            {tForm.successBadge}
          </span>
          <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground font-bold leading-tight">
            {tForm.thankYou.replace("{name}", submittedOrder.customerName)}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tForm.yourOrderNumber}{" "}
            <strong className="font-mono text-foreground font-bold">#{submittedOrder.orderNumber}</strong>
          </p>
        </div>

        <div className="bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg p-3.5 sm:p-4 max-w-md mx-auto text-xs sm:text-sm space-y-2 text-left rtl:text-right shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground pb-2 border-b border-border/40 gap-2">
            <span>{tForm.article}</span>
            <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{productName} (x{quantity})</span>
          </div>
          <div className="flex justify-between items-center pt-1 font-bold text-sm sm:text-base text-foreground">
            <span>{tForm.totalToPay}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans text-base sm:text-lg">{submittedOrder.total.toLocaleString()} DH</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1 max-w-md mx-auto">
          <a
            href={`https://wa.me/212699928463?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 sm:py-4 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.99]"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">{tForm.confirmWhatsApp}</span>
          </a>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSubmittedOrder(null);
              setFullName("");
              setPhone("");
              setAddress("");
              setNotes("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            {tForm.orderAgain}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/25 bg-card/70 backdrop-blur-sm p-4 sm:p-6 shadow-sm transition-all overflow-hidden">
      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 mb-4 border-b border-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-primary">
              {tForm.badge}
            </span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl md:text-2xl text-foreground font-bold mt-1 leading-snug">
            {tForm.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {tForm.subtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Quantity selector inside the form */}
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/40 border border-border/50">
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground block truncate">
              {tForm.quantity}
            </span>
            <span className="text-xs text-foreground font-medium truncate block">
              {discountedPrice.toLocaleString()} DH / {tForm.unit}
              {selectedWeight ? ` (${selectedWeight})` : ""}
            </span>
          </div>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={setQuantity}
            className="bg-background h-9 sm:h-10 shrink-0"
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{tForm.fullName} *</span>
          </label>
          <Input
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
            }}
            placeholder={tForm.fullNamePlaceholder}
            className={cn("h-11 bg-background text-base sm:text-sm rounded-md", errors.fullName && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{tForm.phone} *</span>
          </label>
          <Input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={tForm.phonePlaceholder}
            className={cn("h-11 bg-background text-base sm:text-sm rounded-md font-mono tracking-wider", errors.phone && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>

        {/* City (Searchable Selector) */}
        <div className="relative" ref={cityDropdownRef}>
          <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{tForm.city} *</span>
          </label>

          <button
            type="button"
            onClick={() => setIsCityOpen(!isCityOpen)}
            className={cn(
              "w-full h-11 px-3.5 text-base sm:text-sm bg-background border border-input rounded-md flex items-center justify-between transition-colors text-left rtl:text-right min-w-0",
              !city && "text-muted-foreground",
              errors.city && "border-destructive"
            )}
          >
            <span className="truncate">{city || tForm.cityPlaceholder}</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", isCityOpen && "rotate-180")} />
          </button>

          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}

          <AnimatePresence>
            {isCityOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 left-0 right-0 mt-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-border/50 sticky top-0 bg-popover flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={tForm.searchCity}
                    className="w-full text-xs bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                  {citySearch && (
                    <button
                      type="button"
                      onClick={() => setCitySearch("")}
                      className="p-1 hover:bg-muted rounded text-muted-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-border/20 overscroll-contain">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((item) => (
                      <button
                        type="button"
                        key={item.nom}
                        onClick={() => {
                          setCity(item.nom);
                          setIsCityOpen(false);
                          setCitySearch("");
                          if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                        }}
                        className={cn(
                          "w-full px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-accent transition-colors text-left rtl:text-right",
                          city === item.nom && "bg-primary/10 font-bold text-primary"
                        )}
                      >
                        <span className="truncate mr-2 rtl:ml-2 rtl:mr-0">{item.nom}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {isFreeShipping ? tForm.freeShipping : `${item.livraison} DH`}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      {tForm.noCityFound}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{tForm.address} *</span>
          </label>
          <Input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
            }}
            placeholder={tForm.addressPlaceholder}
            className={cn("h-11 bg-background text-base sm:text-sm rounded-md", errors.address && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            <span>{tForm.notes}</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tForm.notesPlaceholder}
            className="bg-background text-base sm:text-xs rounded-md min-h-[55px] resize-none"
          />
        </div>

        {/* Live Calculation Recap */}
        <div className="bg-muted/40 rounded-lg p-3 sm:p-3.5 border border-border/50 text-xs space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <span>{tForm.subtotal} :</span>
            <span className="font-medium text-foreground">{subtotal.toLocaleString()} DH</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{tForm.shipping} :</span>
            <span className={cn("font-medium", isFreeShipping ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground")}>
              {isFreeShipping ? tForm.free : (city ? `${shipping} DH` : tForm.dependingOnCity)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs sm:text-sm font-bold text-foreground">
            <span>{tForm.totalToPay} :</span>
            <span className="text-sm sm:text-base text-primary font-sans font-bold">{total.toLocaleString()} DH</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || product.stock === 0}
          className="w-full h-12 sm:h-14 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-primary/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 px-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
              <span className="truncate">{tForm.submitting}</span>
            </>
          ) : (
            <>
              <span className="truncate">
                {tForm.submitButton} • {total.toLocaleString()} DH
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 rtl:rotate-180" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
