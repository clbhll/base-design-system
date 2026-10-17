import { BASE_THEME_ATTRIBUTE, ToastProvider } from "@calebhill/base";
import { useEffect, useRef } from "react";
import "@calebhill/base/styles.css";

import { getLabCategory, labCategories, labComponentDocs } from "./catalog";
import { Band, bandElementId } from "./components/band";
import { CategoryTabs, panelId, tabId } from "./components/category-tabs";
import { Inspector } from "./components/inspector";
import { labSurfaces, SurfaceControl, useLabSurface } from "./components/surface-control";
import { DevTools } from "./dev-tools";
import { useLabRoute } from "./routing";

export function App() {
  const [route, navigate] = useLabRoute(labCategories);
  const [surface, setSurface] = useLabSurface();
  const category = getLabCategory(route.category);
  const selectedBand =
    category.bands.find(({ id }) => id === route.band) ?? category.bands[0];
  const theme = labSurfaces[surface].theme;

  useEffect(() => {
    document.title = `${category.label} — Base`;
  }, [category.label]);

  // Selecting a band from its label keeps the reader's place; every other route change
  // (load, tab, link, Back/Forward) moves to the named band or the top of the category.
  const keepScroll = useRef(false);
  useEffect(() => {
    if (keepScroll.current) {
      keepScroll.current = false;
      return;
    }
    if (route.band) document.getElementById(bandElementId(route.band))?.scrollIntoView?.();
    else window.scrollTo?.(0, 0);
  }, [route]);

  return (
    <>
      <a
        className="lab-skip-link base-focus-ring"
        href="#lab-canvas"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("lab-canvas")?.focus();
        }}
      >
        Skip to canvas
      </a>
      <ToastProvider theme={theme}>
        <div className="lab-app-shell">
          <header className="lab-topbar">
            <div className="lab-topbar-start">
              <h1 className="lab-brand base-type-heading-sm">Base</h1>
              <SurfaceControl onChange={setSurface} surface={surface} />
            </div>
            <CategoryTabs
              active={category.id}
              categories={labCategories}
              onSelect={(id, options) => {
                if (id !== category.id) navigate({ category: id }, options);
              }}
            />
            <a
              className="lab-repository-link base-focus-ring base-type-mono"
              href="https://github.com/clbhll/base-design-system"
            >
              View source
            </a>
          </header>
          <main className="lab-canvas" id="lab-canvas" tabIndex={-1}>
            <div
              aria-labelledby={tabId(category.id)}
              className="lab-canvas-surface"
              data-lab-surface={surface}
              data-testid="lab-canvas-surface"
              id={panelId(category.id)}
              role="tabpanel"
              {...{ [BASE_THEME_ATTRIBUTE]: theme }}
            >
              {category.bands.map((band) => (
                <Band
                  band={band}
                  key={band.id}
                  onSelect={() => {
                    keepScroll.current = true;
                    navigate({ category: category.id, band: band.id }, { replace: true });
                  }}
                  selected={band.id === selectedBand.id}
                />
              ))}
            </div>
          </main>
          <Inspector docs={labComponentDocs[selectedBand.componentId]} />
        </div>
      </ToastProvider>
      <DevTools />
    </>
  );
}
