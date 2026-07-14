import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  History,
  Calendar,
  ShoppingBag,
  ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrackOrder } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr, enUS, arMA } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useT } from "@/hooks/useT";
import { useLanguage } from "@/hooks/useLanguage";

const locales = {
  fr: fr,
  en: enUS,
  ar: arMA,
};

import { SEOManager } from "@/seo/components/SEOManager";

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const { data: order, isLoading, isError } = useTrackOrder(searchQuery);
  const { t } = useT();
  const { language } = useLanguage();

  const statusConfig = {
    pending: { label: t("status.pending"), color: "text-amber-600 bg-amber-50", icon: Clock },
    confirmed: { label: t("status.confirmed"), color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
    shipped: { label: t("status.shipped"), color: "text-purple-600 bg-purple-50", icon: Truck },
    delivered: { label: t("status.delivered"), color: "text-green-600 bg-green-50", icon: CheckCircle },
    cancelled: { label: t("status.cancelled"), color: "text-red-600 bg-red-50", icon: XCircle },
  };

  const pageTitle = t("common.trackOrder") || "Suivre ma commande";
  const pageDesc = "Suivez l'état de votre commande en temps réel en saisissant votre numéro de commande.";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearchQuery(orderNumber.trim());
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "PPP à HH:mm", { locale: locales[language] || fr });
    } catch (e) {
      return date;
    }
  };

  return (
    <>
      <SEOManager
        title={pageTitle}
        description={pageDesc}
        breadcrumbItems={[
          { name: "Accueil", item: "/" },
          { name: pageTitle, item: "/track-order" },
        ]}
      />
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6">{t("trackOrder.title")}</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t("trackOrder.desc")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl border border-white p-2 rounded-2xl shadow-xl max-w-lg mx-auto mb-16"
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={t("trackOrder.placeholder")}
                  maxLength={50}
                  className="pl-12 h-14 bg-transparent border-none focus-visible:ring-0 text-lg font-medium"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl btn-premium" disabled={isLoading}>
                {isLoading ? t("trackOrder.searching") : t("trackOrder.button")}
              </Button>
            </form>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-10"
              >
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </motion.div>
            ) : order ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Order Summary Header */}
                <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-mono font-bold">
                      <ShoppingBag className="w-5 h-5" />
                      #{order.order_number}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      {t("trackOrder.placedOn")} {formatDate(order.created_at)}
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold ${statusConfig[order.status]?.color}`}>
                    {(() => {
                      const Icon = statusConfig[order.status]?.icon || Package;
                      return <Icon className="w-5 h-5" />;
                    })()}
                    {statusConfig[order.status]?.label || order.status}
                  </div>
                </div>

                {/* Timeline and Details */}
                <div className="grid md:grid-cols-5 gap-8">
                  {/* Left: Timeline */}
                  <div className="md:col-span-3 bg-white rounded-3xl p-8 border border-border shadow-sm space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <History className="w-5 h-5 text-primary" />
                      <h3 className="font-serif text-xl">{t("trackOrder.history")}</h3>
                    </div>

                    <div className="relative ps-8 space-y-10 before:absolute before:start-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                      {/* Initial step */}
                      <div className="relative">
                        <div className="absolute -start-[27px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{t("trackOrder.orderReceived")}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* History steps */}
                      {order.status_history?.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          <div className="absolute -start-[27px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                          <div className="space-y-1">
                            <p className="font-semibold text-lg">{step.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(step.date)}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {/* Final step prediction if not delivered */}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="relative opacity-40 grayscale">
                          <div className="absolute -start-[27px] top-1 w-4 h-4 rounded-full bg-muted ring-4 ring-white" />
                          <div className="space-y-1">
                            <p className="font-semibold text-lg">{t("trackOrder.estimatedDelivery")}</p>
                            <p className="text-sm text-muted-foreground">{t("trackOrder.soon")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Summary */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-linen rounded-3xl p-8 border border-primary/10 space-y-6">
                      <h3 className="font-serif text-xl mb-4">{t("trackOrder.summary")}</h3>
                      <div className="space-y-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="font-medium">
                              {(item.quantity * item.unit_price).toLocaleString()} DH
                            </span>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-primary/10 flex justify-between items-baseline">
                          <span className="text-lg font-serif">{t("trackOrder.total")}</span>
                          <span className="text-2xl font-serif text-primary">
                            {order.total.toLocaleString()} DH
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary text-white rounded-3xl p-8 space-y-4 shadow-lg shadow-primary/20">
                      <h4 className="font-serif text-lg">{t("trackOrder.needHelp")}</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {t("trackOrder.helpDesc")}
                      </p>
                      <Button asChild className="w-full bg-white text-primary hover:bg-white/90 rounded-xl py-6 font-semibold">
                        <a href="https://wa.me/212699928463" target="_blank" rel="noopener noreferrer">
                          {t("trackOrder.contactWhatsApp")}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : searchQuery && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-3xl border border-dashed border-border"
              >
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{t("trackOrder.notFound")}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-8">
                  {t("trackOrder.notFoundDesc").replace("{id}", searchQuery.length > 50 ? `${searchQuery.substring(0, 50)}...` : searchQuery)}
                </p>
                <Button variant="outline" onClick={() => setSearchQuery(null)}>
                  {t("trackOrder.retry")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Recommended Section */}
      <section className="py-20 border-t border-border">
        <div className="container-full">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("common.collections")}</p>
              <h2 className="font-serif text-3xl md:text-4xl">{t("trackOrder.waitingTitle")}</h2>
            </div>
            <Button asChild variant="ghost" className="group">
              <Link to="/products" className="flex items-center gap-2">
                {t("trackOrder.discoverNew")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default TrackOrder;

