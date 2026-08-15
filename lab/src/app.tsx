import { BASE_THEME_ATTRIBUTE } from "@calebhill/base";
import "@calebhill/base/styles.css";

export function App() {
  return (
    <main style={{ display: "grid", gap: "1rem", maxWidth: "40rem", margin: "4rem auto" }}>
      <section className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: "light" }}>
        <h1>Base package foundation</h1>
        <p>Light theme tokens loaded through the public stylesheet export.</p>
      </section>
      <section className="base-theme-probe" {...{ [BASE_THEME_ATTRIBUTE]: "dark" }}>
        <h2>Dark theme contract</h2>
        <p>The lab uses the same package entry future components will use.</p>
      </section>
    </main>
  );
}
