import { ReactNode, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { CustomCursor } from "../CustomCursor";
import { ScrollToTopButton } from "../ScrollToTopButton";
import { WhatsAppButton } from "../WhatsAppButton";
import { FloatingCartButton } from "../FloatingCartButton";
import { useLanguage } from "@/hooks/useLanguage";

interface LayoutProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const ClientLayout = () => {
  const language = useLanguage((s) => s.language);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="min-h-screen flex flex-col">
      <CustomCursor />
      <Header />
      <motion.main
        className="flex-1"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Outlet />
      </motion.main>
      <Footer />
      <FloatingCartButton />
      <ScrollToTopButton />
      <WhatsAppButton />
    </div>
  );
};
