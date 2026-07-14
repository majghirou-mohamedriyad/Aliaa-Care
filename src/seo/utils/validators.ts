/**
 * Vérifie si une chaîne est une URL absolue valide.
 */
export function isValidAbsoluteUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

/**
 * Normalise un chemin de route en URL absolue par rapport au domaine de base.
 */
export function toAbsoluteUrl(baseUrl: string, path: string): string {
  if (isValidAbsoluteUrl(path)) return path;
  
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
}
