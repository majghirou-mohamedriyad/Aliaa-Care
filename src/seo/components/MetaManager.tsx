import React from "react";
import { MetaOptions } from "../types";
import { useMeta } from "../hooks/useMeta";
import { useCanonical } from "../hooks/useCanonical";

interface MetaManagerProps extends MetaOptions {}

export const MetaManager: React.FC<MetaManagerProps> = React.memo((props) => {
  useMeta(props);
  useCanonical(props.canonicalPath);
  
  return null;
});

MetaManager.displayName = "MetaManager";
