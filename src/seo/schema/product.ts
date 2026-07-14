import { ProductData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getProductSchema(data: ProductData): Record<string, any> {
  const offer: Record<string, any> = {
    "@type": "Offer",
    price: data.price,
    priceCurrency: data.priceCurrency || "MAD",
    priceValidUntil: data.priceValidUntil || new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
    itemCondition: data.condition ? `https://schema.org/${data.condition}` : "https://schema.org/NewCondition",
    availability: data.availability === "OutOfStock" 
      ? "https://schema.org/OutOfStock" 
      : "https://schema.org/InStock",
    url: data.url,
  };

  if (data.shippingDetails) {
    offer.shippingDetails = {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: data.shippingDetails.price,
        currency: data.shippingDetails.currency,
      },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: 0,
          maxValue: 1,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: data.shippingDetails.deliveryTimeDays,
          unitCode: "DAY",
        },
      },
    };
  }

  if (data.merchantReturnPolicy) {
    offer.hasMerchantReturnPolicy = {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "MA",
      returnPolicyCategory: `https://schema.org/${data.merchantReturnPolicy.returnPolicyCategory}`,
      merchantReturnDays: data.merchantReturnPolicy.merchantReturnDays,
      returnFees: `https://schema.org/${data.merchantReturnPolicy.returnFees}`,
    };
  }

  return buildJsonLd("Product", {
    name: data.name,
    description: data.description,
    sku: data.sku,
    gtin: data.gtin,
    mpn: data.mpn,
    brand: data.brand ? {
      "@type": "Brand",
      name: data.brand,
    } : undefined,
    category: data.category,
    image: data.images && data.images.length > 0 ? data.images : undefined,
    offers: data.price !== undefined ? offer : undefined,
  });
}
