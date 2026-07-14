import { useEffect } from "react";
import { useSEOContext } from "../provider/SEOProvider";
import { EXCLUDED_PATHS } from "../constants";
import { toAbsoluteUrl } from "../utils/validators";
import { updateCanonical } from "../utils/headManager";

export function useCanonical(path?: string) {
  const { baseUrl } = useSEOContext();

  useEffect(() => {
    // If path is not supplied, use current location
    const currentPath = path !== undefined ? path : window.location.pathname;
    
    // Check if path is in excluded lists
    const isExcluded = Array.from(EXCLUDED_PATHS).some((excluded) =>
      currentPath.toLowerCase().startsWith(excluded.toLowerCase())
    );

    if (isExcluded) {
      updateCanonical(null);
    } else {
      const absoluteUrl = toAbsoluteUrl(baseUrl, currentPath);
      updateCanonical(absoluteUrl);
    }
  }, [path, baseUrl]);
}
