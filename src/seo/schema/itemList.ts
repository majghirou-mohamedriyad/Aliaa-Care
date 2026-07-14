import { ItemListData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getItemListSchema(data: ItemListData): Record<string, any> {
  const itemListElement = data.items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: item.url,
    name: item.name,
    image: item.image,
  }));

  return buildJsonLd("ItemList", {
    name: data.name,
    itemListElement: itemListElement.length > 0 ? itemListElement : undefined,
  });
}
