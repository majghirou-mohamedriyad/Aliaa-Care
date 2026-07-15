import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { useClientProducts } from "@/hooks/useClientProducts";
import { useWishlist } from "@/hooks/useWishlist";
import { useActivePromotions } from "@/hooks/usePromotions";
import { useT } from "@/hooks/useT";
import { FlashCountdown } from "@/components/FlashCountdown";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getTranslated } from "@/utils/translationUtils";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "default" | "large";
}

export const ProductCard = ({ product, index = 0, variant = "default" }: ProductCardProps) => {
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { collections } = useClientProducts();
  const { getProductDiscount, getFlashPromos } = useActivePromotions();
  const { t, lang } = useT();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id);
  const collection = collections.find((c) => c.id === product.collection);
  const hasSecondImage = product.images.length > 1;

  const defaultWeight = product.weight_prices && product.weight_prices.length > 0
    ? product.weight_prices[0].weight
    : product.weight;
  const discount = getProductDiscount(product.id, product.collections || [], false, defaultWeight);
  const originalPrice = product.originalPrice;
  const hasOriginalPrice = originalPrice && originalPrice > product.price;
  const promoDiscount = discount > 0 ? discount : (hasOriginalPrice ? Math.round((1 - product.price / originalPrice) * 100) : 0);
  const flashPromo = getFlashPromos().find(fp =>
    fp.target_type === "all" ||
    (fp.target_type === "specific_products" && fp.product_ids?.includes(product.id))
  );

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast({ title: t("productDetail.removedFromFavorites"), description: getTranslated(product, "name", lang) });
    } else {
      addToWishlist(product);
      toast({ title: t("productDetail.addedToFavorites"), description: getTranslated(product, "name", lang) });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    const discountedPrice = promoDiscount > 0 ? Math.round(product.price * (1 - promoDiscount / 100)) : product.price;
    addToCart({ ...product, price: discountedPrice });
    toast({ title: t("productDetail.addedToCart"), description: getTranslated(product, "name", lang) });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className={cn("relative overflow-hidden bg-muted/50 mb-5 rounded-lg", variant === "large" ? "aspect-square" : "aspect-square")}>
          <img src={product.images[0]} alt={getTranslated(product, "name", lang)} loading="lazy"
            className={cn("w-full h-full object-cover transition-all duration-1000 ease-out", hasSecondImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105")} />
          {hasSecondImage && (
            <img src={product.images[1]} alt={getTranslated(product, "name", lang)} loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:scale-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <button onClick={handleWishlistToggle}
            className={cn("absolute top-5 ltr:right-5 rtl:left-5 p-2.5 rounded-full transition-all duration-500",
              "bg-background/90 backdrop-blur-md hover:bg-background shadow-sm",
              "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
              inWishlist && "opacity-100 translate-y-0")}>
            <Heart className={cn("w-4 h-4 transition-all duration-300", inWishlist ? "fill-primary text-primary scale-110" : "text-foreground")} />
          </button>
          <div className="absolute top-5 ltr:left-5 rtl:right-5 flex flex-col gap-2">
            {product.new && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-foreground text-background rounded-sm">
                {t("common.new")}
              </motion.span>
            )}
            {product.featured && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground rounded-sm">
                {t("common.featured")}
              </motion.span>
            )}
            {promoDiscount > 0 && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground rounded-sm">
                -{promoDiscount}%
              </motion.span>
            )}
            {flashPromo && (
              <FlashCountdown endsAt={flashPromo.ends_at} />
            )}
            {product.stock === 0 && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-destructive text-destructive-foreground rounded-sm">
                {t("common.outOfStock")}
              </motion.span>
            )}
            {product.stock > 0 && product.stock < 5 && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-destructive/90 text-destructive-foreground rounded-sm animate-pulse">
                {lang === 'ar' 
                  ? `متبقي ${product.stock} فقط!` 
                  : lang === 'en' 
                  ? `Only ${product.stock} left!` 
                  : `Plus que ${product.stock} restants !`
                }
              </motion.span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
            <span className="px-6 py-2.5 text-xs font-medium tracking-[0.15em] uppercase bg-background/95 backdrop-blur-md text-foreground shadow-lg rounded-sm">
              {t("common.viewProduct")}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            {collection && (
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/70">{getTranslated(collection, "name", lang)}</p>
            )}
            <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors leading-snug">{getTranslated(product, "name", lang)}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground/80 leading-relaxed italic line-clamp-2 h-10">
            {getTranslated(product, "description", lang)}
          </p>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex flex-col">
              {promoDiscount > 0 ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-sans font-bold text-destructive tracking-tight">
                    {Math.round(product.price * (1 - promoDiscount / 100)).toLocaleString()}<span className="text-sm font-medium text-muted-foreground/70 ml-1">DH</span>
                  </p>
                  <p className="text-xs font-sans text-muted-foreground line-through opacity-70">
                    {product.price.toLocaleString()}<span className="text-[10px] ml-0.5">DH</span>
                  </p>
                </div>
              ) : hasOriginalPrice ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-sans font-bold text-foreground tracking-tight">
                    {product.price.toLocaleString()}<span className="text-sm font-medium text-muted-foreground/70 ml-1">DH</span>
                  </p>
                  <p className="text-xs font-sans text-muted-foreground line-through opacity-70">
                    {originalPrice.toLocaleString()}<span className="text-[10px] ml-0.5">DH</span>
                  </p>
                </div>
              ) : (
                <p className="text-xl font-sans font-bold text-foreground tracking-tight">
                  {product.price.toLocaleString()}<span className="text-sm font-medium text-muted-foreground/70 ml-1">DH</span>
                </p>
              )}
              {product.weight && (
                <p className="text-[10px] text-muted-foreground/50 tracking-wider uppercase font-medium">
                  {/^\d+(\.\d+)?$/.test(String(product.weight).trim()) ? `${product.weight}g` : product.weight}
                </p>
              )}
            </div>

            <Button
              size="sm"
              disabled={product.stock === 0}
              className={cn(
                "rounded-none text-[10px] tracking-[0.1em] uppercase px-3 sm:px-5 h-10 transition-all duration-300",
                product.stock === 0 ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg translate-y-0 hover:-translate-y-0.5"
              )}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:ltr:mr-2 sm:rtl:ml-2" />
              <span className="hidden sm:inline">{product.stock === 0 ? t("common.outOfStockShort") : t("common.add")}</span>
            </Button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
