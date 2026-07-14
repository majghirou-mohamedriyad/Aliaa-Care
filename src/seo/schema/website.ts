import { WebSiteData } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getWebSiteSchema(data: WebSiteData): Record<string, any> {
  return buildJsonLd("WebSite", {
    name: data.name,
    url: data.url,
    description: data.description,
  });
}
