import { BreadcrumbItem } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.item,
  }));

  return buildJsonLd("BreadcrumbList", {
    itemListElement: itemListElement.length > 0 ? itemListElement : undefined,
  });
}
