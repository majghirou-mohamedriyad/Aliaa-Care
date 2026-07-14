import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Heart, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEOManager } from "@/seo/components/SEOManager";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceRating === 0) {
      setError("Veuillez évaluer notre service global.");
      return;
    }

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
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl max-w-md border border-red-100 shadow-sm">
          <h2 className="font-serif text-2xl mb-3 font-bold">Oups !</h2>
          <p className="text-sm mb-6">{error}</p>
          <Button asChild className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-6">
            <Link to="/">Retour à la boutique</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOManager title="Donnez votre avis" description="Évaluez votre expérience avec Aliaa Natural Care." />
      <div className="min-h-screen bg-[#FDFCFB] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#F3EFEA] rounded-full blur-3xl opacity-60 pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#F8F5F0] rounded-full blur-3xl opacity-60 pointer-events-none -z-10" />

        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="feedback-form"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white/70 backdrop-blur-md border border-[#F3EFEA] rounded-3xl p-8 sm:p-10 shadow-xl"
              >
                <div className="text-center mb-10">
                  <span className="text-xs uppercase tracking-widest text-[#C5A28E] font-semibold bg-[#FAF6F0] px-4 py-1.5 rounded-full">
                    Avis Client
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl mt-4 text-neutral-800 font-semibold">
                    Votre expérience compte
                  </h1>
                  <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">
                    Bonjour <span className="font-semibold text-neutral-800">{order?.customer_name}</span>, merci pour votre commande <span className="font-mono text-neutral-800">#{order?.order_number}</span>. Aidez-nous à nous améliorer !
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Service Rating */}
                  <div className="bg-[#FAF6F0]/50 p-6 rounded-2xl border border-[#FAF6F0] transition-all hover:border-[#E8DFD8]">
                    <label className="block text-center font-medium text-neutral-800 mb-4">
                      1. Comment évaluez-vous notre service global ?
                    </label>
                    <div className="flex justify-center items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoveredService || serviceRating);
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setServiceRating(star)}
                            onMouseEnter={() => setHoveredService(star)}
                            onMouseLeave={() => setHoveredService(0)}
                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={`w-10 h-10 transition-colors duration-200 ${
                                isFilled
                                  ? "fill-[#D4AF37] text-[#D4AF37]"
                                  : "text-muted-foreground/30 fill-transparent"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {serviceRating > 0 && (
                      <p className="text-center text-xs text-[#C5A28E] font-medium mt-3">
                        {serviceRating === 5
                          ? "Excellent ! 😍"
                          : serviceRating === 4
                          ? "Très bien 👍"
                          : serviceRating === 3
                          ? "Bien 🙂"
                          : serviceRating === 2
                          ? "Moyen 😐"
                          : "Insuffisant 😞"}
                      </p>
                    )}
                  </div>

                  {/* Product Ratings */}
                  {order?.items && order.items.length > 0 && (
                    <div className="space-y-5">
                      <label className="block font-medium text-neutral-800 mb-2">
                        2. Notez le(s) produit(s) reçu(s) :
                      </label>
                      <div className="space-y-4">
                        {order.items.map((item) => {
                          const key = item.product_id || item.product_name;
                          const currentRating = productRatings[key] || 0;
                          const currentHover = hoveredProducts[key] || 0;
                          
                          return (
                            <div
                              key={key}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-[#F3EFEA] gap-3"
                            >
                              <div className="flex-1">
                                <h3 className="font-medium text-neutral-800 text-sm">{item.product_name}</h3>
                                <p className="text-xs text-muted-foreground">Quantité : {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isFilled = star <= (currentHover || currentRating);
                                  return (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => handleProductRating(key, star)}
                                      onMouseEnter={() => handleProductHover(key, star)}
                                      onMouseLeave={() => handleProductHover(key, 0)}
                                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                    >
                                      <Star
                                        className={`w-6 h-6 transition-colors duration-200 ${
                                          isFilled
                                            ? "fill-[#D4AF37] text-[#D4AF37]"
                                            : "text-muted-foreground/30 fill-transparent"
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
                    </div>
                  )}

                  {/* Comment */}
                  <div className="space-y-3">
                    <label className="block font-medium text-neutral-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#C5A28E]" />
                      Un commentaire ou une suggestion ? (facultatif)
                    </label>
                    <Textarea
                      placeholder="Partagez votre expérience avec nous..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] rounded-xl border-[#FAF6F0] focus:border-[#C5A28E] focus:ring-1 focus:ring-[#C5A28E] resize-none"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-medium py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer mon avis
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="feedback-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="bg-white/80 backdrop-blur-md border border-[#F3EFEA] rounded-3xl p-10 sm:p-12 text-center shadow-xl max-w-md mx-auto"
              >
                <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C5A28E]">
                  <Heart className="w-8 h-8 fill-current animate-pulse" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-neutral-800 mb-4">
                  Merci infiniment !
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  Votre précieux retour a bien été enregistré. Vos avis nous guident au quotidien pour parfaire nos soins naturels et notre service.
                </p>
                <div className="space-y-4">
                  <Button asChild className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white py-2.5 rounded-xl">
                    <a href="https://aliaacare.com">Retourner au site</a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
