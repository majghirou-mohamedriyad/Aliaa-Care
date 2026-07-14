import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ScrollToTop } from "./components/ScrollToTop";
import { LanguageSelector } from "./components/LanguageSelector";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminGuard } from "./components/auth/AdminGuard";
import { GuestGuard } from "./components/auth/GuestGuard";
import { ClientLayout } from "./components/layout/ClientLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { SEOProvider } from "./seo/provider/SEOProvider";

import { lazy, Suspense } from "react";

// Client Pages
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const PackDetail = lazy(() => import("./pages/PackDetail"));
const Packs = lazy(() => import("./pages/Packs"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth Pages
const Login = lazy(() => import("./pages/Auth/Login"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminFinances = lazy(() => import("./pages/AdminFinances"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminPacks = lazy(() => import("./pages/AdminPacks"));
const AdminPromoCodes = lazy(() => import("./pages/AdminPromoCodes"));
const AdminPackaging = lazy(() => import("./pages/AdminPackaging"));
const AdminPromotions = lazy(() => import("./pages/AdminPromotions"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5, // 5 minutes par défaut
    },
  },
});

const URLNormalizer = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    const lowerPath = pathname.toLowerCase();
    
    // Handle specific aliases
    if (lowerPath === '/boutique' || lowerPath === '/shop') {
      navigate('/products' + search, { replace: true });
      return;
    }

    // General case normalization (redirect to lowercase)
    if (pathname !== lowerPath) {
      navigate(lowerPath + search, { replace: true });
    }
  }, [pathname, search, navigate]);

  return null;
};

const HostnameRedirect = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isAdminDomain = hostname.startsWith('admin.');

    if (isAdminDomain) {
      // Redirect from root to admin or login on admin subdomain
      if (pathname === '/') {
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/auth/login", { replace: true });
        }
      }
    } else if (!isLocalhost) {
      // Block admin access on non-admin domains (except localhost)
      if (pathname.startsWith('/admin')) {
        navigate("/", { replace: true });
      }
    }
  }, [navigate, pathname, isAdmin, isLoading]);

  return null;
};

import { useBanner } from "@/hooks/useBanner";

const ClientGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: banner, isLoading: isBannerLoading } = useBanner();
  const { isAdmin, isLoading: isAuthLoading } = useAuth();
  
  if (isBannerLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (banner?.maintenance_mode && !isAdmin) {
    return <Maintenance />;
  }

  return <>{children}</>;
};

// import ServerError from "./pages/ServerError";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <URLNormalizer />
          <HostnameRedirect />
          <ScrollToTop />
          <LanguageSelector />
          <SEOProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <Routes>
                {/* Client Routes */}
                <Route path="/" element={<ClientGuard><ClientLayout /></ClientGuard>}>
                  <Route index element={<Index />} />
                  <Route path="products" element={<Products />} />
                  <Route path="product/:slug" element={<ProductDetail />} />
                  <Route path="about" element={<About />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="packs" element={<Packs />} />
                  <Route path="pack/:slug" element={<PackDetail />} />
                  <Route path="track-order" element={<TrackOrder />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/auth/login" element={<GuestGuard><Login /></GuestGuard>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="finances" element={<AdminFinances />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="packs" element={<AdminPacks />} />
                  <Route path="promo-codes" element={<AdminPromoCodes />} />
                  <Route path="packaging" element={<AdminPackaging />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SEOProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
