import React, { createContext, useContext } from "react";
import { SEOContextType } from "../types";
import { DEFAULT_SEO_CONFIG } from "../defaults";

const SEOContext = createContext<SEOContextType>(DEFAULT_SEO_CONFIG);

export const useSEOContext = () => useContext(SEOContext);

interface SEOProviderProps {
  children: React.ReactNode;
  value?: Partial<SEOContextType>;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({ children, value }) => {
  const mergedValue = React.useMemo(() => {
    if (!value) return DEFAULT_SEO_CONFIG;
    return {
      ...DEFAULT_SEO_CONFIG,
      ...value,
      defaultMeta: {
        ...DEFAULT_SEO_CONFIG.defaultMeta,
        ...value.defaultMeta,
      },
      contactDetails: {
        ...DEFAULT_SEO_CONFIG.contactDetails,
        ...value.contactDetails,
      },
    };
  }, [value]);

  return (
    <SEOContext.Provider value={mergedValue}>
      {children}
    </SEOContext.Provider>
  );
};
