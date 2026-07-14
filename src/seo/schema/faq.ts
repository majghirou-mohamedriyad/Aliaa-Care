import { FAQItem } from "../types";
import { buildJsonLd } from "../utils/schemaBuilder";

export function getFAQSchema(items: FAQItem[]): Record<string, any> {
  const mainEntity = items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  }));

  return buildJsonLd("FAQPage", {
    mainEntity: mainEntity.length > 0 ? mainEntity : undefined,
  });
}
