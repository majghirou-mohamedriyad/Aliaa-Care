import { OrganizationData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getOrganizationSchema(data: OrganizationData): Record<string, any> {
  return buildJsonLd("Organization", {
    name: data.name,
    logo: data.logo,
    url: data.url,
    email: data.email,
    telephone: data.telephone,
    sameAs: data.sameAs,
    address: data.address ? {
      "@type": "PostalAddress",
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressCountry: data.address.addressCountry,
      postalCode: data.address.postalCode,
    } : undefined,
  });
}
