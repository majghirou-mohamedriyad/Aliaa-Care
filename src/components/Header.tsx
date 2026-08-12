import { Heart, Menu, X, Settings, Globe, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/hooks/useWishlist";
import { CartIcon } from "@/components/CartIcon";
import { useClientProducts } from "@/hooks/useClientProducts";
import { useT } from "@/hooks/useT";
import { useBanner } from "@/hooks/useBanner";
import { useLanguage, Language } from "@/hooks/useLanguage";
import typoImg from "@/assets/TYPO02 PNG.png";
import { getTranslated } from "@/utils/translationUtils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const langOptions: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ar", label: "AR", flag: "🇲🇦" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useWishlist();
  const { collections } = useClientProducts();
  const { t, lang } = useT();
  const { data: banner } = useBanner();
  const { language, setLanguage } = useLanguage();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 bg-background/95 backdrop-blur-md",
        scrolled
          ? "border-b border-border shadow-sm"
          : "border-b border-transparent"
      )}
    >
      {/* Announcement Bar */}
      {banner?.enabled && (
        <div 
          className="bg-primary py-2 overflow-hidden border-b border-primary/20 text-center relative"
          style={{ color: banner.text_color }}
        >
          {banner.scrolling_enabled ? (
            <div className="flex whitespace-nowrap animate-scroll">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] px-8">
                  {banner.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
              {banner.message}
            </div>
          )}
        </div>
      )}

      <nav className="container-full">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center h-16 md:h-20 shrink-0 hover:opacity-80 transition-opacity duration-300">
            {/* <img src={logoImg} alt="ALIAA Natural Care" className="h-14 md:h-12 w-auto" /> */}
            <img src={typoImg} alt="ALIAA CARE" className="h-16 md:h-24 max-h-14 md:max-h-18 w-auto scale-125 origin-left object-contain pointer-events-none" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">
                    {t("common.collections")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {collections.map((collection) => (
                        <li key={collection.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/products?collection=${collection.slug}`}
                              className={cn(
                                "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="text-sm font-medium leading-none">{getTranslated(collection, "name", lang)}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{getTranslated(collection, "description", lang)}</p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link to="/products" className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline">
              {t("common.shop")}
            </Link>

            <Link to="/packs" className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline">
              {t("common.ourPacks")}
            </Link>

            <Link to="/about" className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline">
              {t("common.ourStory")}
            </Link>

            <Link to="/track-order" className="text-xs font-medium tracking-[0.15em] uppercase text-primary hover:text-primary/80 transition-colors duration-300 flex items-center gap-1.5 border border-primary/20 px-3 py-1.5 rounded-full bg-primary/5">
              {t("common.trackOrder")}
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-accent transition-colors duration-300 group flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{language}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {langOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.code}
                    onClick={() => setLanguage(opt.code)}
                    className={cn("flex items-center gap-2", language === opt.code && "bg-accent")}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/wishlist" className="relative p-2 hover:bg-accent transition-colors duration-300 group">
                  <Heart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <AnimatePresence>
                    {items.length > 0 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {items.length > 9 ? "9+" : items.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {items.length === 0 ? (
                  <p className="text-sm">{t("header.wishlistEmpty")}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{items.length} {t("header.savedItems")}</p>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-xs text-muted-foreground truncate">{getTranslated(item, "name", lang)}</p>
                      ))}
                      {items.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{items.length - 3} {t("header.more")}</p>
                      )}
                    </div>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>

            <CartIcon />

            <button
              className="md:hidden p-2 hover:bg-accent transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden border-t border-border overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="py-8 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground/50 px-2 mb-3">{t("common.collections")}</p>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  className="block w-full text-left px-2 py-2.5 text-sm hover:bg-accent transition-colors duration-300"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(`/products?collection=${collection.slug}`);
                  }}
                >
                  {getTranslated(collection, "name", lang)}
                </button>
              ))}
            </div>
            <div className="pt-6 border-t border-border space-y-1">
              {[
                { to: "/products", label: t("common.shop") },
                { to: "/packs", label: t("common.ourPacks") },
                { to: "/track-order", label: t("common.trackOrder") },
                { to: "/about", label: t("common.ourStory") },
                { to: "/cart", label: t("common.cart") },
              ].map((link) => (
                <button
                  key={link.to}
                  className="block w-full text-left px-2 py-2.5 text-sm font-medium hover:bg-accent transition-colors duration-300"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(link.to);
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
