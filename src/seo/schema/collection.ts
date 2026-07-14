import { CollectionPageData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getCollectionSchema(data: CollectionPageData): Record<string, any> {
  return buildJsonLd("CollectionPage", {
    name: data.name,
    description: data.description,
    url: data.url,
  });
}
