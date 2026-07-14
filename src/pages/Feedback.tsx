import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Heart, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEOManager } from "@/seo/components/SEOManager";
import typoImg from "@/assets/TYPO02 PNG.png";

interface FeedbackItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
}

interface OrderFeedbackData {
  customer_name: string;
  order_number: string;
  items: FeedbackItem[];
}

export default function Feedback() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderFeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ratings state
  const [serviceRating, setServiceRating] = useState<number>(0);
  const [hoveredService, setHoveredService] = useState<number>(0);
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [hoveredProducts, setHoveredProducts] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  // Step indicator
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError("Référence de commande manquante.");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc("get_order_for_feedback", {
          target_order_id: orderId,
        });

        if (rpcError) throw rpcError;

        if (data && data.length > 0) {
          const orderData = data[0] as unknown as OrderFeedbackData;
          setOrder(orderData);
          
          // Initialize product ratings
          const initialRatings: Record<string, number> = {};
          orderData.items.forEach((item) => {
            const key = item.product_id || item.product_name;
            initialRatings[key] = 0;
          });
          setProductRatings(initialRatings);
        } else {
          setError("Commande introuvable ou déjà évaluée.");
        }
      } catch (err: any) {
        console.error("Error fetching order for feedback:", err);
        setError("Impossible de charger les détails de la commande.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const handleProductRating = (productKey: string, rating: number) => {
    setProductRatings((prev) => ({
      ...prev,
      [productKey]: rating,
    }));
  };

  const handleProductHover = (productKey: string, rating: number) => {
    setHoveredProducts((prev) => ({
      ...prev,
      [productKey]: rating,
    }));
  };

  const nextStep = () => {
    if (currentStep === 1 && serviceRating === 0) {
      setError("Veuillez évaluer notre service global.");
      return;
    }
    setError(null);
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all products are rated
    const unratedProducts = order?.items.filter(
      (item) => !productRatings[item.product_id || item.product_name]
    );

    if (unratedProducts && unratedProducts.length > 0) {
      setError("Veuillez évaluer tous les produits reçus.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("customer_feedbacks").insert({
        order_id: orderId,
        service_rating: serviceRating,
        product_ratings: productRatings,
        comment: comment.trim() || null,
      });

      if (insertError) throw insertError;
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setError("Une erreur est survenue lors de l'envoi de votre avis. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C5A28E] mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Chargement de votre enquête...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-50 text-red-700 p-6 sm:p-8 rounded-2xl max-w-md border border-red-100 shadow-sm mx-auto">
          <h2 className="font-serif text-2xl mb-3 font-bold">Oups !</h2>
          <p className="text-sm mb-6 leading-relaxed">{error}</p>
          <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-6 w-full sm:w-auto">
            <Link to="/">Retour à la boutique</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOManager title="Donnez votre avis" description="Évaluez votre expérience avec Aliaa Natural Care." />
      <div className="min-h-screen bg-[#FDFCFB] py-8 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between items-center">
        
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#F7F2EC] rounded-full blur-3xl opacity-70 pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#FBF9F6] rounded-full blur-3xl opacity-70 pointer-events-none -z-10 animate-pulse duration-[8000ms] delay-2000" />

        {/* Brand Header */}
        <header className="mb-6 sm:mb-8 text-center w-full z-10 flex flex-col items-center">
          <Link to="/" className="hover:opacity-80 transition-opacity flex items-center justify-center">
            <img src={typoImg} alt="ALIAA CARE" className="h-16 sm:h-24 w-auto pointer-events-none" />
          </Link>
        </header>

        {/* Main Card Container */}
        <div className="max-w-xl w-full z-10 flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="feedback-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/80 backdrop-blur-md border border-[#F3EFEA] rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl shadow-neutral-100/50 w-full"
              >
                {/* Steps indicator */}
                <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Étape {currentStep} sur 3
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          step === currentStep 
                            ? "w-8 bg-[#C5A28E]" 
                            : step < currentStep 
                            ? "w-2 bg-[#C5A28E]/40" 
                            : "w-2 bg-neutral-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Form Steps */}
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <h2 className="font-serif text-2xl sm:text-3xl text-neutral-800 font-semibold leading-snug">
                          Note du Service Global
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-sm mx-auto">
                          Bonjour <span className="font-semibold text-neutral-800">{order?.customer_name}</span>, évaluez l'expérience globale de votre commande <span className="font-mono text-neutral-700 bg-neutral-50 px-1.5 py-0.5 rounded text-xs">#{order?.order_number}</span>.
                        </p>
                      </div>

                      <div className="bg-[#FAF6F0]/60 p-6 sm:p-8 rounded-2xl border border-[#FAF6F0] flex flex-col items-center justify-center">
                        <div className="flex justify-center items-center gap-1.5 sm:gap-3">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= (hoveredService || serviceRating);
                            return (
                              <button
                                type="button"
                                key={star}
                                onClick={() => setServiceRating(star)}
                                onMouseEnter={() => setHoveredService(star)}
                                onMouseLeave={() => setHoveredService(0)}
                                className="p-1 transition-transform active:scale-95 hover:scale-115 focus:outline-none"
                              >
                                <Star
                                  className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-200 ${
                                    isFilled
                                      ? "fill-[#D4AF37] text-[#D4AF37]"
                                      : "text-muted-foreground/20 fill-transparent"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="h-6 mt-4">
                          {serviceRating > 0 && (
                            <span className="text-xs sm:text-sm text-[#C5A28E] font-semibold bg-[#FAF6F0] px-4 py-1 rounded-full shadow-sm">
                              {serviceRating === 5
                                ? "Excellent ! 😍"
                                : serviceRating === 4
                                ? "Très bien 👍"
                                : serviceRating === 3
                                ? "Bien 🙂"
                                : serviceRating === 2
                                ? "Moyen 😐"
                                : "Insuffisant 😞"}
                            </span>
                          )}
                        </div>
                      </div>

                      {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

                      <Button
                        onClick={nextStep}
                        className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        Continuer
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <h2 className="font-serif text-2xl sm:text-3xl text-neutral-800 font-semibold leading-snug">
                          Note des Produits
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                          Attribuez une note pour chaque produit reçu :
                        </p>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {order?.items.map((item) => {
                          const key = item.product_id || item.product_name;
                          const currentRating = productRatings[key] || 0;
                          const currentHover = hoveredProducts[key] || 0;
                          
                          return (
                            <div
                              key={key}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-neutral-50/50 border border-neutral-100 gap-3"
                            >
                              <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-medium text-neutral-800 text-sm">{item.product_name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Quantité : {item.quantity}</p>
                              </div>
                              <div className="flex items-center justify-center gap-1 shrink-0">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isFilled = star <= (currentHover || currentRating);
                                  return (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => handleProductRating(key, star)}
                                      onMouseEnter={() => handleProductHover(key, star)}
                                      onMouseLeave={() => handleProductHover(key, 0)}
                                      className="p-1 transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                                    >
                                      <Star
                                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-200 ${
                                          isFilled
                                            ? "fill-[#D4AF37] text-[#D4AF37]"
                                            : "text-muted-foreground/20 fill-transparent"
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          className="flex-1 border-neutral-200 hover:bg-neutral-50 py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Retour
                        </Button>
                        <Button
                          onClick={nextStep}
                          className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-md"
                        >
                          Continuer
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <h2 className="font-serif text-2xl sm:text-3xl text-neutral-800 font-semibold leading-snug">
                          Votre Commentaire
                        </h2>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                          Quelque chose à ajouter ou à nous suggérer ?
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#C5A28E]" />
                          Votre message (facultatif)
                        </label>
                        <Textarea
                          placeholder="Exprimez-vous ici..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[140px] rounded-2xl border-neutral-100 bg-[#FAF9F6]/30 focus:border-[#C5A28E] focus:ring-1 focus:ring-[#C5A28E] resize-none"
                        />
                      </div>

                      {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={prevStep}
                          disabled={isSubmitting}
                          className="flex-1 border-neutral-200 hover:bg-neutral-50 py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Retour
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-md"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            <>
                              Envoyer l'avis
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="feedback-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="bg-white/80 backdrop-blur-md border border-[#F3EFEA] rounded-3xl p-8 sm:p-12 text-center shadow-xl max-w-md mx-auto w-full"
              >
                <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C5A28E]">
                  <Heart className="w-8 h-8 fill-current animate-pulse" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-neutral-800 mb-4">
                  Merci infiniment !
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  Votre précieux retour a bien été enregistré. Vos avis nous aident chaque jour à améliorer la qualité de nos soins et services.
                </p>
                <div className="space-y-4">
                  <Button asChild className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-3 rounded-xl shadow-md">
                    <a href="https://aliaacare.com">Retourner au site</a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 text-center w-full z-10">
          <p className="text-[10px] text-muted-foreground tracking-wider">
            © {new Date().getFullYear()} ALIAA Care. Tous droits réservés.
          </p>
        </footer>
      </div>
    </>
  );
}
