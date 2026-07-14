import { useEffect } from "react";
import { useSEOContext } from "../provider/SEOProvider";
import { MetaOptions } from "../types";
import { buildMetaTags } from "../utils/metaBuilder";
import { updateTitle, updateMetaTags } from "../utils/headManager";
import { EXCLUDED_PATHS } from "../constants";

export function useMeta(options: MetaOptions) {
  const { defaultMeta, brandName } = useSEOContext();

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Check if path is in excluded lists
    const isExcluded = Array.from(EXCLUDED_PATHS).some((excluded) =>
      currentPath.toLowerCase().startsWith(excluded.toLowerCase())
    );

    const title = options.title || defaultMeta.title;
    const finalTitle = title.includes(brandName) ? title : `${title} | ${brandName}`;

    // If page is private/excluded, override robots to noindex, nofollow
    const robots = isExcluded ? "noindex, nofollow" : (options.robots || defaultMeta.robots);

    updateTitle(finalTitle);

    const tags = buildMetaTags(
      {
        ...options,
        title: finalTitle,
        robots,
        ogUrl: options.ogUrl || window.location.href,
      },
      defaultMeta.image,
      defaultMeta.locale,
      brandName
    );

    updateMetaTags(tags);
  }, [options, defaultMeta, brandName]);
}
