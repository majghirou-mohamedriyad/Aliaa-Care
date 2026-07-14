import { SEOContextType } from "./types";

export const DEFAULT_SEO_CONFIG: SEOContextType = {
  baseUrl: "https://aliaacare.com",
  brandName: "ALIAA Care",
  defaultLogo: "https://aliaacare.com/LOGOWEB.png",
  defaultMeta: {
    title: "ALIAA Care | Bien-être naturel féminin",
    description: "Découvrez notre gamme de soins et d'infusions naturels spécialement conçus pour accompagner le bien-être féminin à chaque étape de la vie.",
    image: "https://aliaacare.com/LOGOWEB.png",
    locale: "fr_FR",
    language: "fr",
    robots: "index, follow",
  },
  socialLinks: [
    "https://www.instagram.com/aliaacare/",
    "https://www.tiktok.com/@aliaacare",
    "https://wa.me/212699928463",
  ],
  contactDetails: {
    telephone: "+212 6 99 92 84 63",
  },
};
