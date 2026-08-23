import { useEffect } from "react";
import "@calebhill/base/styles.css";

import { getLabDocument, labDocumentPaths, labDocuments } from "./component-registry";
import { DevTools } from "./dev-tools";
import { labHref, useLabPath } from "./routing";

const groupLabels = {
  foundations: "Foundations",
  components: "Components",
} as const;

export function App() {
  const path = useLabPath(labDocumentPaths);
  const activeDocument = getLabDocument(path);
  const { Document } = activeDocument;

  useEffect(() => {
    document.title = `${activeDocument.label} — Base`;
  }, [activeDocument.label]);

  return (
    <>
      <a className="lab-skip-link base-focus-ring" href="#lab-document">
        Skip to document
      </a>
      <div className="lab-app-shell">
        <aside className="lab-sidebar">
          <header className="lab-brand">
            <span className="base-type-heading-md">Base</span>
            <span className="base-type-caption">Alpha React component library</span>
          </header>
          <nav aria-label="Base documentation">
            {(Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((group) => (
              <section className="lab-nav-group" key={group}>
                <h2 className="base-type-caption">{groupLabels[group]}</h2>
                <ul>
                  {labDocuments
                    .filter((document) => document.group === group)
                    .map((document) => (
                      <li key={document.path}>
                        <a
                          aria-current={document.path === path ? "page" : undefined}
                          className="lab-nav-link base-focus-ring base-type-body-sm"
                          href={labHref(document.path)}
                        >
                          {document.label}
                        </a>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </nav>
          <a
            className="lab-repository-link base-focus-ring base-type-body-sm"
            href="https://github.com/clbhll/base-design-system"
          >
            View source
          </a>
        </aside>
        <main className="lab-document" id="lab-document">
          <Document />
        </main>
      </div>
      <DevTools />
    </>
  );
}
