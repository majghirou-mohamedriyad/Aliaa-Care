import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export const FloatingCartButton = () => {
  const itemCount = useCart((state) => state.getItemCount());
  const subtotal = useCart((state) => state.getSubtotal());
  const location = useLocation();

  // Hide button if cart is empty OR user is already on /cart or /checkout page
  if (itemCount === 0 || location.pathname === "/cart" || location.pathname === "/checkout") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2 group"
      >
        <Link
          to="/cart"
          aria-label="Mon Panier"
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-300 ring-2 ring-primary/40"
        >
          {/* Pulsing Outer Ring when Cart has items */}
          {itemCount > 0 && (
            <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping pointer-events-none" />
          )}

          {/* Cart Icon */}
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform group-hover:scale-110" />

          {/* Item Count Badge */}
          <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full shadow-md z-20 border-2 border-background animate-pulse">
            {itemCount}
          </span>
        </Link>

        {/* Hover / Active Total Price Pill */}
        {itemCount > 0 && (
          <Link
            to="/cart"
            className="hidden sm:flex items-center px-3 py-1.5 bg-background/95 backdrop-blur-md border border-border shadow-md rounded-full text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <span>{subtotal.toLocaleString()} DH</span>
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
