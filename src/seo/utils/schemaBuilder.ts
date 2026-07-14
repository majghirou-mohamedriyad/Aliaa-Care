/**
 * Supprime récursivement les valeurs vides (null, undefined, "", [], {}) d'un objet.
 */
export function cleanSchema<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return undefined as unknown as T;
  }

  if (Array.isArray(obj)) {
    const cleanedArr = obj
      .map((item) => cleanSchema(item))
      .filter((item) => item !== undefined && item !== null && item !== "" && (typeof item !== "object" || Object.keys(item).length > 0));
    return (cleanedArr.length > 0 ? cleanedArr : undefined) as unknown as T;
  }

  if (typeof obj === "object") {
    const cleanedObj: Record<string, any> = {};
    let hasKeys = false;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = cleanSchema(obj[key]);
        if (
          val !== undefined &&
          val !== null &&
          val !== "" &&
          (typeof val !== "object" || Array.isArray(val) || Object.keys(val).length > 0)
        ) {
          cleanedObj[key] = val;
          hasKeys = true;
        }
      }
    }

    return (hasKeys ? cleanedObj : undefined) as unknown as T;
  }

  return obj;
}

/**
 * Encapsule l'objet propre dans le format standard JSON-LD Schema.org.
 */
export function buildJsonLd(type: string, data: Record<string, any>): Record<string, any> {
  const cleaned = cleanSchema(data);
  if (!cleaned || Object.keys(cleaned).length === 0) {
    return {};
  }
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...cleaned,
  };
}
