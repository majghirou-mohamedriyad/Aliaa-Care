import { MetaOptions } from "../types";

export interface HeadMetaTag {
  name?: string;
  property?: string;
  content: string;
}

export function buildMetaTags(options: MetaOptions, defaultImage: string, defaultLocale: string, siteName: string): HeadMetaTag[] {
  const tags: HeadMetaTag[] = [];

  // Description
  if (options.description) {
    tags.push({ name: "description", content: options.description });
  }

  // Robots
  if (options.robots) {
    tags.push({ name: "robots", content: options.robots });
  }

  // Open Graph
  tags.push({ property: "og:site_name", content: siteName });
  if (options.title) {
    tags.push({ property: "og:title", content: options.title });
  }
  if (options.description) {
    tags.push({ property: "og:description", content: options.description });
  }
  if (options.ogUrl) {
    tags.push({ property: "og:url", content: options.ogUrl });
  }
  tags.push({ property: "og:type", content: options.ogType || "website" });
  tags.push({ property: "og:image", content: options.ogImage || defaultImage });
  tags.push({ property: "og:locale", content: options.locale || defaultLocale });

  // Twitter Cards
  tags.push({ name: "twitter:card", content: "summary_large_image" });
  if (options.title) {
    tags.push({ name: "twitter:title", content: options.title });
  }
  if (options.description) {
    tags.push({ name: "twitter:description", content: options.description });
  }
  tags.push({ name: "twitter:image", content: options.ogImage || defaultImage });
  if (options.ogUrl) {
    tags.push({ name: "twitter:url", content: options.ogUrl });
  }

  return tags;
}
