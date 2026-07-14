export interface MetaOptions {
  title?: string;
  description?: string;
  robots?: string; // e.g. "index, follow" or "noindex, nofollow"
  canonicalPath?: string; // e.g. "/about"
  ogType?: string; // e.g. "website", "product"
  ogImage?: string;
  ogUrl?: string;
  locale?: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string; // Absolute path or URL
}

export interface ProductData {
  name: string;
  description?: string;
  sku?: string;
  gtin?: string;
  mpn?: string;
  brand?: string;
  category?: string;
  url: string;
  images: string[];
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | string;
  condition?: "NewCondition" | "UsedCondition" | string;
  priceValidUntil?: string;
  shippingDetails?: {
    price: number;
    currency: string;
    deliveryTimeDays: number;
  };
  merchantReturnPolicy?: {
    returnPolicyCategory: string;
    merchantReturnDays: number;
    returnFees: string;
  };
}

export interface ItemListData {
  name: string;
  items: {
    name: string;
    url: string;
    image?: string;
    price?: number;
  }[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface OrganizationData {
  name: string;
  logo: string;
  url: string;
  email?: string;
  telephone?: string;
  sameAs?: string[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressCountry?: string;
    postalCode?: string;
  };
}

export interface WebSiteData {
  name: string;
  url: string;
  description?: string;
}

export interface WebPageData {
  name: string;
  description?: string;
  url: string;
}

export interface CollectionPageData {
  name: string;
  description?: string;
  url: string;
}

export interface SEOContextType {
  baseUrl: string;
  brandName: string;
  defaultLogo: string;
  defaultMeta: {
    title: string;
    description: string;
    image: string;
    locale: string;
    language: string;
    robots: string;
  };
  socialLinks: string[];
  contactDetails?: {
    email?: string;
    telephone?: string;
    whatsapp?: string;
  };
}
