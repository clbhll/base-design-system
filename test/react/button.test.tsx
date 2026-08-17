import { readFileSync } from "node:fs";
import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import postcss from "postcss";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button,
  ButtonLink,
  MoreIcon,
  TrashIcon,
  type ButtonVariant,
} from "../../src";

const variants = [
  "primary",
  "secondary",
  "subtle",
  "destructive",
  "text",
  "text-accent",
] as const satisfies readonly ButtonVariant[];

afterEach(cleanup);

describe("Button", () => {
  it("uses native button defaults, forwards its ref, and composes foundation classes", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
    expect(ref.current).toHaveAttribute("type", "button");
    expect(ref.current).toHaveClass(
      "base-button",
      "base-button-primary",
      "base-button-default",
      "base-focus-ring",
      "base-pressable",
      "base-type-action",
    );
  });

  it.each(variants)("renders the %s variant class", (variant) => {
    render(<Button variant={variant}>{variant}</Button>);

    expect(screen.getByRole("button", { name: variant })).toHaveClass(
      `base-button-${variant}`,
    );
  });

  it("supports both sizes plus consumer classes and native attributes", () => {
    const { rerender } = render(
      <Button className="consumer-action" data-track="save" type="submit">
        Save
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "base-button-default",
      "consumer-action",
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-track", "save");
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");

    rerender(
      <Button aria-label="More actions" size="icon">
        <MoreIcon />
      </Button>,
    );

    expect(screen.getByRole("button", { name: "More actions" })).toHaveClass(
      "base-button-icon",
    );
  });

  it("preserves native click and disabled behavior", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

describe("ButtonLink", () => {
  it("uses anchor semantics, defaults to secondary, and preserves native props", () => {
    const ref = createRef<HTMLAnchorElement>();

    render(
      <ButtonLink
        ref={ref}
        href="#destination"
        target="_blank"
        rel="noreferrer"
        className="consumer-link"
        data-track="destination"
      >
        Destination
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Destination" });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute("href", "#destination");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link).toHaveAttribute("data-track", "destination");
    expect(link).toHaveClass(
      "base-button",
      "base-button-secondary",
      "base-button-default",
      "base-focus-ring",
      "base-pressable",
      "base-type-action",
      "consumer-link",
    );
  });

  it("supports the labeled icon size", () => {
    render(
      <ButtonLink aria-label="Delete item" href="#delete" size="icon" variant="destructive">
        <TrashIcon />
      </ButtonLink>,
    );

    expect(screen.getByRole("link", { name: "Delete item" })).toHaveClass(
      "base-button-destructive",
      "base-button-icon",
    );
  });
});

describe("action icons", () => {
  it.each([
    [MoreIcon, "more"],
    [TrashIcon, "trash"],
  ] as const)("gives the %s icon decorative current-color defaults with overrideable SVG props", (Icon, name) => {
    const { container, rerender } = render(<Icon data-icon={name} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-icon", name);
    expect(container.querySelector("[fill='currentColor'], [stroke='currentColor']")).not.toBeNull();

    rerender(<Icon aria-hidden="false" focusable="true" height="16" width="16" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "false");
    expect(container.querySelector("svg")).toHaveAttribute("focusable", "true");
    expect(container.querySelector("svg")).toHaveAttribute("height", "16");
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  });
});

describe("action accessibility", () => {
  it.each(["light", "dark"] as const)("is axe-clean in the %s theme", async (theme) => {
    const { container } = render(
      <section data-base-theme={theme}>
        <Button>Save</Button>
        <Button disabled>Unavailable</Button>
        <Button aria-label="More actions" size="icon" variant="subtle">
          <MoreIcon />
        </Button>
        <ButtonLink href="#details">View details</ButtonLink>
      </section>,
    );

    expect(
      (await axe(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toHaveLength(0);
  });
});

describe("button stylesheet contract", () => {
  const stylesheet = postcss.parse(
    readFileSync("src/styles/components/button.css", "utf8"),
  );

  function declarations(selector: string) {
    const values = new Map<string, string>();
    stylesheet.walkRules(selector, (rule) => {
      rule.walkDecls((declaration) => {
        values.set(declaration.prop, declaration.value);
      });
    });
    return values;
  }

  it("defines intrinsic component anatomy through package-owned selectors", () => {
    const common = declarations(".base-button");
    expect(common.get("align-items")).toBe("center");
    expect(common.get("display")).toBe("inline-flex");
    expect(common.get("gap")).toBe("var(--base-ref-space-1)");
    expect(common.get("justify-content")).toBe("center");
    expect(common.get("text-decoration")).toBe("none");
    expect(common.get("user-select")).toBe("none");
    expect(common.get("white-space")).toBe("nowrap");
    expect(declarations(".base-button-default").get("height")).toBe("2.5rem");
    expect(declarations(".base-button-default").get("padding-inline")).toBe(
      "var(--base-ref-space-5)",
    );
    expect(declarations(".base-button-icon").get("height")).toBe("2.25rem");
    expect(declarations(".base-button-icon").get("width")).toBe("2.25rem");
  });

  it("uses only semantic Base colors for the six variants and disabled state", () => {
    const css = readFileSync("src/styles/components/button.css", "utf8");

    for (const variant of variants) {
      expect(css).toContain(`.base-button-${variant}`);
    }
    expect(css).toContain("var(--base-color-danger-subtle)");
    expect(css).toContain("var(--base-color-danger)");
    expect(css).toContain("var(--base-color-surface-disabled)");
    expect(css).toContain("var(--base-color-text-disabled)");
    expect(css).not.toMatch(/(?:^|[,{]\s*)(?:html|body|\*)\b/m);
    expect(css).not.toContain("@tailwind");
  });

  it("guards hover feedback behind fine-pointer capability", () => {
    const hoverSelectors: string[] = [];
    stylesheet.walkRules((rule) => {
      if (rule.selector.includes(":hover")) hoverSelectors.push(rule.selector);
    });

    expect(hoverSelectors.length).toBeGreaterThan(0);
    for (const selector of hoverSelectors) {
      const rule = [...stylesheet.nodes]
        .flatMap((node) => (node.type === "atrule" ? node.nodes ?? [] : []))
        .find((node) => node.type === "rule" && node.selector === selector);
      expect(rule?.parent).toMatchObject({
        type: "atrule",
        name: "media",
        params: "(hover: hover) and (pointer: fine)",
      });
      expect(selector).toContain(":not(:disabled)");
    }
  });
});
