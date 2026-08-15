import React from "react";
import ReactDOM from "react-dom/client";

import { BASE_THEME_ATTRIBUTE, isBaseTheme } from "@calebhill/base";
import "@calebhill/base/styles.css";

function FixtureApp() {
  const theme = "light";

  return (
    <div className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: theme }}>
      fixture:{isBaseTheme(theme) ? theme : "invalid"}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<FixtureApp />);
