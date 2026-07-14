import { useEffect } from "react";
import { updateStructuredData } from "../utils/headManager";
import { EXCLUDED_PATHS } from "../constants";

export function useStructuredData(schemas: Record<string, any>[]) {
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Check if path is in excluded lists
    const isExcluded = Array.from(EXCLUDED_PATHS).some((excluded) =>
      currentPath.toLowerCase().startsWith(excluded.toLowerCase())
    );

    if (isExcluded) {
      updateStructuredData([]);
    } else {
      updateStructuredData(schemas);
    }

    return () => {
      // Clean up when unmounting
      updateStructuredData([]);
    };
  }, [schemas]);
}
