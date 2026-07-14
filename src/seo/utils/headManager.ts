import { HeadMetaTag } from "./metaBuilder";

const DATA_SEO_ATTR = "data-seo";

/**
 * Nettoie tous les éléments injectés par le SEO (meta, link, script).
 */
export function clearSeoElements(): void {
  if (typeof document === "undefined") return;

  const elements = document.querySelectorAll(`[${DATA_SEO_ATTR}]`);
  elements.forEach((el) => el.remove());
}

/**
 * Met à jour le titre du document.
 */
export function updateTitle(title: string): void {
  if (typeof document === "undefined") return;
  document.title = title;
}

/**
 * Met à jour la balise link canonical.
 */
export function updateCanonical(url: string | null): void {
  if (typeof document === "undefined") return;

  // Cherche s'il existe déjà un link canonical
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (url) {
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute(DATA_SEO_ATTR, "true");
      document.head.appendChild(link);
    }
    link.href = url;
  } else {
    // Si la page est exclue, on retire le lien s'il existe
    if (link) {
      link.remove();
    }
  }
}

/**
 * Injecte de nouvelles balises méta de façon propre.
 */
export function updateMetaTags(tags: HeadMetaTag[]): void {
  if (typeof document === "undefined") return;

  // Supprimer uniquement les balises méta avec l'attribut data-seo
  const existingMetas = document.querySelectorAll(`meta[${DATA_SEO_ATTR}]`);
  existingMetas.forEach((el) => el.remove());

  // Injecter les nouvelles balises méta
  tags.forEach((tag) => {
    const el = document.createElement("meta");
    el.setAttribute(DATA_SEO_ATTR, "true");
    
    if (tag.name) {
      el.setAttribute("name", tag.name);
    }
    if (tag.property) {
      el.setAttribute("property", tag.property);
    }
    el.setAttribute("content", tag.content);
    
    document.head.appendChild(el);
  });
}

/**
 * Injecte un ou plusieurs objets de données structurées JSON-LD.
 */
export function updateStructuredData(schemas: Record<string, any>[]): void {
  if (typeof document === "undefined") return;

  // Supprimer les anciens scripts de données structurées avec data-seo
  const existingScripts = document.querySelectorAll(`script[type="application/ld+json"][${DATA_SEO_ATTR}]`);
  existingScripts.forEach((el) => el.remove());

  // Injecter les nouveaux scripts
  schemas.forEach((schema) => {
    if (!schema || Object.keys(schema).length === 0) return;
    
    const el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute(DATA_SEO_ATTR, "true");
    el.text = JSON.stringify(schema);
    
    document.head.appendChild(el);
  });
}
