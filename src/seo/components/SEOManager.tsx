import React, { useMemo } from "react";
import { useSEOContext } from "../provider/SEOProvider";
import { useCanonical } from "../hooks/useCanonical";
import { useMeta } from "../hooks/useMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import { toAbsoluteUrl } from "../utils/validators";

// Schemas
import { getOrganizationSchema } from "../schema/organization";
import { getWebSiteSchema } from "../schema/website";
import { getWebPageSchema } from "../schema/webpage";
import { getProductSchema } from "../schema/product";
import { getCollectionSchema } from "../schema/collection";
import { getItemListSchema } from "../schema/itemList";
import { getBreadcrumbSchema } from "../schema/breadcrumb";
import { getFAQSchema } from "../schema/faq";

interface SEOManagerProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  type?: "home" | "product" | "pack" | "collection" | "standard";
  breadcrumbItems?: { name: string; item: string }[];
  productData?: any;
  itemListData?: any;
  faqItems?: { question: string; answer: string }[];
  collectionData?: any;
}

export const SEOManager: React.FC<SEOManagerProps> = React.memo(({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType,
  type = "standard",
  breadcrumbItems,
  productData,
  itemListData,
  faqItems,
  collectionData,
}) => {
  const context = useSEOContext();
  const currentPath = canonicalPath || window.location.pathname;
  const absoluteUrl = toAbsoluteUrl(context.baseUrl, currentPath);

  // Meta & Canonical hooks
  useCanonical(currentPath);
  useMeta({
    title,
    description,
    canonicalPath,
    ogImage,
    ogType,
    ogUrl: absoluteUrl,
  });

  // Build JSON-LD structured data list
  const schemas = useMemo(() => {
    const list: Record<string, any>[] = [];

    // 1. WebPage Schema (All public pages)
    list.push(
      getWebPageSchema({
        name: title || context.defaultMeta.title,
        description: description || context.defaultMeta.description,
        url: absoluteUrl,
      })
    );

    // 2. Breadcrumb Schema (All public pages when list is supplied)
    if (breadcrumbItems && breadcrumbItems.length > 0) {
      const formattedItems = breadcrumbItems.map((item) => ({
        name: item.name,
        item: toAbsoluteUrl(context.baseUrl, item.item),
      }));
      list.push(getBreadcrumbSchema(formattedItems));
    }

    // 3. Organization & Website (Home only)
    if (type === "home") {
      list.push(
        getOrganizationSchema({
          name: context.brandName,
          logo: context.defaultLogo,
          url: context.baseUrl,
          telephone: context.contactDetails?.telephone,
          email: context.contactDetails?.email,
          sameAs: context.socialLinks,
        })
      );
      list.push(
        getWebSiteSchema({
          name: context.brandName,
          url: context.baseUrl,
          description: context.defaultMeta.description,
        })
      );
    }

    // 4. Product Schema (Product or Pack page)
    if ((type === "product" || type === "pack") && productData) {
      list.push(
        getProductSchema({
          name: productData.name,
          description: productData.description,
          sku: productData.sku,
          brand: context.brandName,
          category: productData.category,
          url: absoluteUrl,
          images: productData.images || [],
          price: productData.price,
          priceCurrency: productData.priceCurrency || "MAD",
          availability: productData.availability || "InStock",
          condition: productData.condition || "NewCondition",
          shippingDetails: productData.shippingDetails,
          merchantReturnPolicy: productData.merchantReturnPolicy,
        })
      );
    }

    // 5. CollectionPage & ItemList (Collections)
    if (type === "collection") {
      list.push(
        getCollectionSchema({
          name: collectionData?.name || title || context.brandName,
          description: collectionData?.description || description,
          url: absoluteUrl,
        })
      );

      if (itemListData) {
        list.push(
          getItemListSchema({
            name: itemListData.name || title || "Liste de produits",
            items: itemListData.items.map((item: any) => ({
              name: item.name,
              url: toAbsoluteUrl(context.baseUrl, item.url),
              image: item.image,
              price: item.price,
            })),
          })
        );
      }
    }

    // 6. FAQPage
    if (faqItems && faqItems.length > 0) {
      list.push(getFAQSchema(faqItems));
    }

    return list;
  }, [
    type,
    title,
    description,
    absoluteUrl,
    breadcrumbItems,
    productData,
    itemListData,
    faqItems,
    collectionData,
    context,
  ]);

  // Inject Structured Data
  useStructuredData(schemas);

  return null;
});

SEOManager.displayName = "SEOManager";
