import { useCallback, useEffect, useState } from "react";

export const DEFAULT_LAB_CATEGORY = "foundations" as const;

export interface LabRoute {
  category: string;
  component?: string;
}

interface RoutableCategory {
  id: string;
  components: ReadonlyArray<{ id: string }>;
}

// CLB-703 documentation URLs named one component per page; they now open that component.
const legacyPrefixes = new Set(["components", "explorations"]);

export function resolveLabRoute(
  hash: string,
  categories: ReadonlyArray<RoutableCategory>,
): LabRoute {
  const fallback = { category: DEFAULT_LAB_CATEGORY };
  if (!hash.startsWith("#/")) return fallback;

  const [first, second, ...rest] = hash.slice(2).split("/");
  if (rest.length > 0) return fallback;

  if (legacyPrefixes.has(first) && second) {
    const owner = categories.find(({ components }) => components.some(({ id }) => id === second));
    return owner ? { category: owner.id, component: second } : fallback;
  }

  const category = categories.find(({ id }) => id === first);
  if (!category) return fallback;

  return second && category.components.some(({ id }) => id === second)
    ? { category: category.id, component: second }
    : { category: category.id };
}

export function labHref({ category, component }: LabRoute) {
  return component ? `#/${category}/${component}` : `#/${category}`;
}

function isSameRoute(first: LabRoute, second: LabRoute) {
  return first.category === second.category && first.component === second.component;
}

export function useLabRoute(categories: ReadonlyArray<RoutableCategory>) {
  const [route, setRoute] = useState(() => resolveLabRoute(window.location.hash, categories));

  useEffect(() => {
    const updateRoute = () => {
      const next = resolveLabRoute(window.location.hash, categories);
      const normalizedHash = labHref(next);
      if (window.location.hash !== normalizedHash) {
        window.history.replaceState(null, "", normalizedHash);
      }
      setRoute((current) => (isSameRoute(current, next) ? current : next));
    };
    // History traversal can fire both events; unchanged routes are ignored above.
    window.addEventListener("hashchange", updateRoute);
    window.addEventListener("popstate", updateRoute);
    updateRoute();

    return () => {
      window.removeEventListener("hashchange", updateRoute);
      window.removeEventListener("popstate", updateRoute);
    };
  }, [categories]);

  const navigate = useCallback((next: LabRoute, { replace = false } = {}) => {
    const href = labHref(next);
    if (window.location.hash !== href) {
      window.history[replace ? "replaceState" : "pushState"](null, "", href);
    }
    setRoute(next);
  }, []);

  return [route, navigate] as const;
}
