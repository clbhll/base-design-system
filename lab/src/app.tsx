import { BASE_THEME_ATTRIBUTE } from "@calebhill/base";
import { useEffect } from "react";
import "@calebhill/base/styles.css";

import { CanvasThemeContext } from "./canvas-theme";
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

  // A deep link names a band; bring it into view once on arrival.
  useEffect(() => {
    if (route.band) document.getElementById(bandElementId(route.band))?.scrollIntoView?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="lab-app-shell">
        <header className="lab-topbar">
          <div className="lab-topbar-start">
            <h1 className="lab-brand base-type-heading-sm">Base</h1>
            <SurfaceControl onChange={setSurface} surface={surface} />
          </div>
          <CategoryTabs
            active={category.id}
            categories={labCategories}
            onSelect={(id) => {
              if (id !== category.id) navigate({ category: id });
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
            <CanvasThemeContext.Provider value={theme}>
              {category.bands.map((band) => (
                <Band
                  band={band}
                  key={band.id}
                  onSelect={() =>
                    navigate({ category: category.id, band: band.id }, { replace: true })
                  }
                  selected={band.id === selectedBand.id}
                />
              ))}
            </CanvasThemeContext.Provider>
          </div>
        </main>
        <Inspector docs={labComponentDocs[selectedBand.componentId]} />
      </div>
      <DevTools />
    </>
  );
}
