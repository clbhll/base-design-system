import React from "react";
import ReactDOM from "react-dom/client";

import { BASE_THEME_ATTRIBUTE, isBaseTheme } from "@calebhill/base";
import "@calebhill/base/styles.css";

function FixtureApp() {
  const theme = "light";

  return (
    <section className="base-type-body" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      fixture:{isBaseTheme(theme) ? theme : "invalid"}{" "}
      <a className="base-link" href="#fixture">
        link
      </a>
      <button className="base-focus-ring base-pressable base-type-action" type="button">
        pressable
      </button>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<FixtureApp />);
