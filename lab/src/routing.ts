import { useEffect, useState } from "react";

export const DEFAULT_LAB_PATH = "/foundations" as const;

export function resolveLabPath(hash: string, validPaths: ReadonlySet<string>) {
  const path = hash.startsWith("#/") ? hash.slice(1) : DEFAULT_LAB_PATH;
  if (path === "/explorations/toast" && validPaths.has("/components/toast")) return "/components/toast";
  return validPaths.has(path) ? path : DEFAULT_LAB_PATH;
}

export function labHref(path: string) {
  return `#${path}`;
}

export function useLabPath(validPaths: ReadonlySet<string>) {
  const [path, setPath] = useState(() => resolveLabPath(window.location.hash, validPaths));

  useEffect(() => {
    const readPath = () => resolveLabPath(window.location.hash, validPaths);
    const updatePath = () => setPath(readPath());
    window.addEventListener("hashchange", updatePath);

    const normalizedHash = labHref(readPath());
    if (window.location.hash !== normalizedHash) {
      window.history.replaceState(null, "", normalizedHash);
    }

    return () => window.removeEventListener("hashchange", updatePath);
  }, [validPaths]);

  return path;
}
