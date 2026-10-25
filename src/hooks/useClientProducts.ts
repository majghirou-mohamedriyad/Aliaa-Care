import { useProducts, DbProduct } from "@/hooks/useProducts";
import { useCategories, DbCategory } from "@/hooks/useCategories";
import { useBanner } from "@/hooks/useBanner";

export interface ClientProduct {
  id: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  slug: string;
  collection: string; // primary category id
  collections?: string[];
  price: number;
  originalPrice?: number;
  description: string;
  description_ar?: string | null;
  description_en?: string | null;
  longDescription: string;
  longDescription_ar?: string | null;
  longDescription_en?: string | null;
  materials: string;
  materials_ar?: string | null;
  materials_en?: string | null;
  weight?: number;
  weight_prices?: { weight: number; price: number }[];
  stock: number;
  images: string[];
  featured?: boolean;
  new?: boolean;
  free_shipping?: boolean;
  flavors?: string[];
  flavors_ar?: string[] | null;
  flavors_en?: string[] | null;
}

export interface ClientCollection {
  id: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  slug: string;
  description: string;
  description_ar?: string | null;
  description_en?: string | null;
  image: string;
  heroImage?: string;
}

function toClientProduct(p: DbProduct): ClientProduct {
  return {
    id: p.id,
    name: p.name,
    name_ar: p.name_ar,
    name_en: p.name_en,
    slug: p.slug,
    collection: p.category_ids[0] || "",
    collections: p.category_ids,
    price: p.price,
    originalPrice: p.original_price ?? undefined,
    description: p.description || "",
    description_ar: p.description_ar,
    description_en: p.description_en,
    longDescription: p.long_description || "",
    longDescription_ar: p.long_description_ar,
    longDescription_en: p.long_description_en,
    materials: p.materials || "",
    materials_ar: p.materials_ar,
    materials_en: p.materials_en,
    weight: p.weight ?? undefined,
    weight_prices: (p.weight_prices as { weight: number; price: number }[]) ?? undefined,
    stock: p.stock,
    images: p.images.length > 0 ? p.images : ["/placeholder.svg"],
    featured: p.featured ?? false,
    new: p.is_new ?? false,
    free_shipping: p.free_shipping ?? false,
    flavors: p.flavors || [],
    flavors_ar: p.flavors_ar,
    flavors_en: p.flavors_en,
  };
}

function toClientCollection(c: DbCategory): ClientCollection {
  return {
    id: c.id,
    name: c.name,
    name_ar: c.name_ar,
    name_en: c.name_en,
    slug: c.slug,
    description: c.description || "",
    description_ar: c.description_ar,
    description_en: c.description_en,
    image: c.image || "/placeholder.svg",
    heroImage: c.image || "/placeholder.svg",
  };
}

export function useClientProducts() {
  const { data: rawProducts = [], isLoading: productsLoading } = useProducts();
  const { data: rawCategories = [], isLoading: categoriesLoading } = useCategories();
  const { data: bannerData } = useBanner();

  const isLoading = productsLoading || categoriesLoading;

  const clientProducts = rawProducts
    .filter((p) => p.active && p.visible)
    .map(toClientProduct);

  const clientCollections = rawCategories
    .filter((c) => c.active)
    .map(toClientCollection);

  const banner = bannerData || { enabled: false, message: "" };

  const getProductBySlug = (slug: string) => clientProducts.find((p) => p.slug === slug);
  const getCollectionBySlug = (slug: string) => clientCollections.find((c) => c.slug === slug);
  const getFeaturedProducts = () => clientProducts.filter((p) => p.featured);
  const getNewProducts = () => clientProducts.filter((p) => p.new);
  const getRelatedProducts = (productId: string, limit = 4) => {
    const product = clientProducts.find((p) => p.id === productId);
    if (!product) return [];
    return clientProducts
      .filter((p) => p.collection === product.collection && p.id !== productId)
      .slice(0, limit);
  };

  const isOutOfStock = (productId: string) => {
    const p = rawProducts.find((p) => p.id === productId);
    return p ? !p.active || p.stock <= 0 : true;
  };

  return {
    products: clientProducts,
    collections: clientCollections,
    banner,
    isLoading,
    getProductBySlug,
    getCollectionBySlug,
    getFeaturedProducts,
    getNewProducts,
    getRelatedProducts,
    isOutOfStock,
  };
}
