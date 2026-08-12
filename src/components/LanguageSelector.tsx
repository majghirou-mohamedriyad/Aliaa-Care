import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { t } from "@/i18n/translations";

const languages: { code: Language; label: string; native: string; flag: string }[] = [
  { code: "fr", label: "Français", native: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", native: "العربية", flag: "🇲🇦" },
];

import { useLocation } from "react-router-dom";

export const LanguageSelector = () => {
  const { hasChosen, setLanguage } = useLanguage();
  const location = useLocation();

  const isAdminOrAuth = location.pathname.startsWith("/admin") || 
                        location.pathname.startsWith("/auth") || 
                        window.location.hostname.startsWith("admin.");

  if (hasChosen || isAdminOrAuth) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-background rounded-lg shadow-2xl p-8 md:p-12 max-w-md w-full text-center"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-2">
            ALIAA
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {t("lang.chooseLanguage", "fr")} / Choose your language / اختاري لغتك
          </p>

          <div className="space-y-3">
            {languages.map((lang, i) => (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={() => handleSelect(lang.code)}
                className="w-full flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent hover:border-primary/30 transition-all duration-300 group"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="flex-1 text-left text-base font-medium text-foreground group-hover:text-primary transition-colors">
                  {lang.native}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
