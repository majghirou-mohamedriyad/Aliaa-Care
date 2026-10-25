import chayNifasImg from "@/assets/chay-nifas.jpeg";
import coffretImg from "@/assets/coffret-aliaa.webp";
import guideImg from "@/assets/about-pic.png";
import coffretTisanesImg from "@/assets/coffret-tisanes.png";
import gommageCorpsImg from "@/assets/gommage-corps.jpeg";
import coffretArganImg from "@/assets/coffret-argan.jpeg";
import deodorantsImg from "@/assets/deodorants.jpeg";
import shampooingImg from "@/assets/shampooing.jpeg";
import eauDeRoseImg from "@/assets/eau-de-rose.jpeg";
import infusionHerbaleImg from "@/assets/infusion-herbale.jpeg";
import selsDeBainImg from "@/assets/sels-de-bain.jpeg";
import laitCorporelImg from "@/assets/lait-corporel.jpeg";
import selsDeBain2Img from "@/assets/sels-de-bain-2.jpeg";

export interface Collection {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  image: string;
  heroImage?: string;
}

export interface Product {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  slug: string;
  collection: string;
  collections?: string[];
  price: number;
  originalPrice?: number;
  description: string;
  description_ar?: string;
  description_en?: string;
  longDescription: string;
  longDescription_ar?: string;
  longDescription_en?: string;
  materials: string;
  materials_ar?: string;
  materials_en?: string;
  weight?: string | number;
  stock?: number;
  images: string[];
  featured?: boolean;
  new?: boolean;
  flavors?: string[];
  free_shipping?: boolean;
}

export const collections: Collection[] = [
  {
    id: "tisanes",
    name: "Tisanes & Infusions",
    slug: "tisanes",
    description: "Mélanges de plantes naturelles pour le bien-être féminin",
    image: infusionHerbaleImg,
    heroImage: infusionHerbaleImg,
  },
  {
    id: "soins-corps",
    name: "Soins du Corps",
    slug: "soins-corps",
    description: "Soins naturels pour nourrir et sublimer votre peau",
    image: laitCorporelImg,
    heroImage: laitCorporelImg,
  },
  {
    id: "coffrets",
    name: "Coffrets",
    slug: "coffrets",
    description: "Coffrets cadeaux avec une sélection de nos meilleurs produits",
    image: coffretTisanesImg,
    heroImage: coffretTisanesImg,
  },
  {
    id: "nouveautes",
    name: "Nouveautés",
    slug: "nouveautes",
    description: "Les dernières additions à notre collection",
    image: eauDeRoseImg,
    heroImage: eauDeRoseImg,
  },
];

export const products: Product[] = [
  // Tisanes & Infusions
  {
    id: "chay-nifas",
    name: "Chay Nifas",
    slug: "chay-nifas",
    collection: "tisanes",
    collections: ["tisanes"],
    price: 18,
    description: "Mélange de plantes naturelles pour le post-partum",
    longDescription: "Chay Nifas est un mélange traditionnel de plantes naturelles soigneusement sélectionnées pour accompagner les femmes après l'accouchement. Préparation traditionnelle, sans conservateurs. Infusez dans un verre d'eau chaude, laissez infuser 5 à 10 minutes puis dégustez.",
    materials: "Plantes naturelles 100% biologiques",
    weight: 80,
    images: [chayNifasImg, coffretTisanesImg],
    featured: true,
  },
  {
    id: "msakhen",
    name: "Msakhen",
    slug: "msakhen",
    collection: "tisanes",
    collections: ["tisanes"],
    price: 22,
    description: "Mélange réchauffant selon la recette traditionnelle",
    longDescription: "Le Msakhen est une préparation traditionnelle à base de plantes réchauffantes. Préparé selon la recette traditionnelle ancestrale, ce mélange se consomme avec du miel ou du lait. Sans conservateurs, préparation artisanale.",
    materials: "Mélange de plantes naturelles",
    weight: 120,
    images: [coffretTisanesImg, chayNifasImg],
    new: true,
  },
  {
    id: "infusion-herbale",
    name: "Infusion Herbale",
    slug: "infusion-herbale",
    collection: "tisanes",
    collections: ["tisanes"],
    price: 20,
    description: "Mélange de plantes pour le bien-être et la détente",
    longDescription: "Notre Infusion Herbale est un mélange de plantes naturelles soigneusement sélectionnées pour leurs vertus apaisantes et bienfaisantes. Préparation traditionnelle sans conservateurs, à infuser dans de l'eau chaude pour un moment de sérénité.",
    materials: "Mélange de plantes naturelles",
    weight: 120,
    images: [infusionHerbaleImg, chayNifasImg],
    featured: true,
  },
  // Soins du Corps
  {
    id: "gommage-corps",
    name: "Gommage Corps Sucre & Café",
    slug: "gommage-corps-sucre-cafe",
    collection: "soins-corps",
    collections: ["soins-corps"],
    price: 25,
    description: "Exfolie et lisse naturellement, formulé sans parfum",
    longDescription: "Notre Gommage Corps Sucre & Café exfolie en douceur et lisse naturellement la peau. Formulé sans parfum, il convient à tous les types de peaux. Le sucre et le café travaillent en synergie pour éliminer les cellules mortes et stimuler la circulation.",
    materials: "Sucre, café moulu, huiles végétales naturelles",
    weight: 250,
    images: [gommageCorpsImg, laitCorporelImg],
    new: true,
  },
  {
    id: "shampooing-herbal",
    name: "Shampooing Herbal Bio",
    slug: "shampooing-herbal-bio",
    collection: "soins-corps",
    collections: ["soins-corps"],
    price: 35,
    description: "Aloera & infusion de plantes, pour cheveux normaux",
    longDescription: "Notre Shampooing Herbal Bio est formulé à base d'aloera et d'infusion de plantes naturelles. Pour cheveux normaux, il nettoie en douceur tout en nourrissant le cuir chevelu. Sans sulfates, sans parabènes, 100% naturel.",
    materials: "Aloera, infusion de plantes, huiles essentielles naturelles",
    weight: 500,
    images: [shampooingImg, gommageCorpsImg],
    featured: true,
  },
  {
    id: "eau-de-rose",
    name: "Eau de Rose",
    slug: "eau-de-rose",
    collection: "soins-corps",
    collections: ["soins-corps", "nouveautes"],
    price: 18,
    description: "Eau florale bio – Hydrate & apaise",
    longDescription: "Notre Eau de Rose est une eau florale bio obtenue par distillation de pétales de roses. Elle hydrate et apaise la peau naturellement. Utilisez-la comme tonique, brume rafraîchissante ou en soin quotidien pour un teint éclatant.",
    materials: "Eau florale de rose 100% pure et bio",
    weight: 100,
    images: [eauDeRoseImg, laitCorporelImg],
    new: true,
  },
  {
    id: "lait-corporel",
    name: "Lait Corporel Hydratant Bio",
    slug: "lait-corporel-hydratant-bio",
    collection: "soins-corps",
    collections: ["soins-corps"],
    price: 40,
    description: "Noix de coco & huile d'amande douce",
    longDescription: "Notre Lait Corporel Hydratant Bio est formulé à base de noix de coco et d'huile d'amande douce pour une hydratation intense et durable. Sa texture légère pénètre rapidement sans laisser de film gras. Parfait pour les peaux sèches et sensibles.",
    materials: "Noix de coco, huile d'amande douce, beurre de karité",
    weight: 500,
    images: [laitCorporelImg, shampooingImg],
  },
  {
    id: "sels-de-bain",
    name: "Sels de Bain aux Plantes",
    slug: "sels-de-bain-aux-plantes",
    collection: "soins-corps",
    collections: ["soins-corps"],
    price: 22,
    description: "Sels de bain relaxants aux plantes naturelles",
    longDescription: "Nos Sels de Bain aux Plantes offrent un moment de relaxation totale. Enrichis en plantes naturelles aux vertus apaisantes, ils détendent les muscles et adoucissent la peau. Versez une poignée dans votre bain chaud et laissez-vous envelopper de sérénité.",
    materials: "Sels marins, plantes séchées, huiles essentielles",
    weight: 300,
    images: [selsDeBainImg, selsDeBain2Img],
    featured: true,
  },
  {
    id: "deodorants-naturels",
    name: "Déodorants Naturels",
    slug: "deodorants-naturels",
    collection: "soins-corps",
    collections: ["soins-corps", "nouveautes"],
    price: 15,
    description: "Baume gel bio – Menthe, Orange ou Naturel",
    longDescription: "Nos Déodorants Naturels sont formulés sans aluminium ni produits chimiques. Disponibles en trois variantes : Menthe pour la fraîcheur, Orange pour la douceur fruitée, et Naturel pour les peaux sensibles. Protection efficace et respectueuse de votre peau.",
    materials: "Beurre de karité, bicarbonate, huiles essentielles bio",
    weight: 50,
    images: [deodorantsImg, gommageCorpsImg],
    new: true,
  },
  // Coffrets
  {
    id: "coffret-decouverte",
    name: "Coffret Découverte Tisanes",
    slug: "coffret-decouverte",
    collection: "coffrets",
    collections: ["coffrets"],
    price: 65,
    description: "Le coffret complet avec nos 4 tisanes phares",
    longDescription: "Notre Coffret Découverte réunit les 4 tisanes emblématiques d'ALIAA Natural Care. Présenté dans un élégant coffret vert avec guide d'utilisation inclus. Le cadeau parfait pour prendre soin de soi ou offrir à une personne chère.",
    materials: "4 tisanes + guide d'utilisation",
    images: [coffretTisanesImg, guideImg],
    featured: true,
  },
  {
    id: "coffret-argan",
    name: "Coffret Huile d'Argan",
    slug: "coffret-huile-argan",
    collection: "coffrets",
    collections: ["coffrets", "nouveautes"],
    price: 85,
    description: "Trio d'huiles d'argan pures pressées à froid",
    longDescription: "Notre Coffret Huile d'Argan contient un trio d'huiles d'argan 100% pures, pressées à froid. Idéal pour le soin du visage, du corps et des cheveux. Présenté dans un élégant coffret vert ALIAA avec carte descriptive.",
    materials: "3 flacons d'huile d'argan pure + carte descriptive",
    images: [coffretArganImg, coffretTisanesImg],
    new: true,
  },
];

export const getProductsByCollection = (collectionSlug: string): Product[] => {
  return products.filter((product) => product.collection === collectionSlug);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((product) => product.featured);
};

export const getNewProducts = (): Product[] => {
  return products.filter((product) => product.new);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((product) => product.slug === slug);
};

export const getCollectionBySlug = (slug: string): Collection | undefined => {
  return collections.find((collection) => collection.slug === slug);
};

export const getRelatedProducts = (productId: string, limit = 4): Product[] => {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  
  return products
    .filter((p) => p.collection === product.collection && p.id !== productId)
    .slice(0, limit);
};