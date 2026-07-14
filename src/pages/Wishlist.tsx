import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/hooks/useT";
import { MetaManager } from "@/seo/components/MetaManager";

const Wishlist = () => {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useT();

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product, 1);
    toast({ title: t("productDetail.addedToCart"), description: product.name });
  };

  return (
    <>
      <MetaManager title={t("wishlist.title") || "Favoris"} />
      <div className="container-full py-12 md:py-20">
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">{t("wishlist.title")}</h1>
          <p className="text-muted-foreground">
            {items.length === 0
              ? t("wishlist.empty")
              : `${items.length} ${t("header.savedItems")}`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
            <p className="text-muted-foreground mb-8">{t("wishlist.emptyDesc")}</p>
            <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
              <Link to="/products">{t("wishlist.discoverShop")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {items.length > 1 && (
              <div className="flex justify-end mb-6">
                <Button variant="ghost" size="sm" onClick={() => { clearWishlist(); toast({ title: t("wishlist.cleared") }); }}
                  className="text-xs text-muted-foreground hover:text-destructive">
                  {t("wishlist.removeAll")}
                </Button>
              </div>
            )}
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
                    className="flex gap-5 p-4 border border-border rounded-lg bg-card">
                    <Link to={`/product/${item.slug}`} className="shrink-0">
                      <img src={item.images[0]} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.slug}`} className="font-serif text-lg hover:text-primary transition-colors">{item.name}</Link>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                      <p className="font-serif text-foreground mt-2">{item.price.toLocaleString()} DH</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="rounded-none text-xs" onClick={() => handleAddToCart(item)}>
                        <ShoppingBag className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" />{t("common.add")}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive"
                        onClick={() => { removeItem(item.id); toast({ title: t("wishlist.removed") }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Wishlist;

