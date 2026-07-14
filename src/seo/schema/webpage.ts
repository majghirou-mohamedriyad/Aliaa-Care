import { WebPageData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getWebPageSchema(data: WebPageData): Record<string, any> {
  return buildJsonLd("WebPage", {
    name: data.name,
    description: data.description,
    url: data.url,
  });
}
