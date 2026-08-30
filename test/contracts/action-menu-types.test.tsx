import { createRef } from "react";
import { describe, expect, it } from "vitest";

import {
  ActionMenu,
  MoreIcon,
  type ActionMenuAlign,
  type ActionMenuItem,
  type ActionMenuItemTone,
  type ActionMenuProps,
  type ActionMenuSide,
} from "../../src";

const triggerRef = createRef<HTMLButtonElement>();
const portal = document.createElement("div");
const tone = "destructive" satisfies ActionMenuItemTone;
const side = "top" satisfies ActionMenuSide;
const align = "end" satisfies ActionMenuAlign;
const items = [
  { label: "Edit", onSelect: () => undefined },
  { label: "Delete", tone, onSelect: () => undefined },
  { label: "Unavailable", disabled: true, onSelect: () => undefined },
] satisfies readonly ActionMenuItem[];

const uncontrolled = (
  <ActionMenu
    ref={triggerRef}
    align={align}
    className="photo-actions"
    data-track="photo-options"
    defaultOpen
    icon={<MoreIcon />}
    items={items}
    label="Photo options"
    portalContainer={portal}
    side={side}
    sideOffset={8}
    style={{ transformOrigin: "top right" }}
  />
);

const controlledProps = {
  label: "Controlled options",
  icon: <MoreIcon />,
  items,
  open: true,
  onOpenChange: () => undefined,
} satisfies ActionMenuProps;

const controlled = <ActionMenu {...controlledProps} disabled />;

// @ts-expect-error controlled ActionMenu requires onOpenChange
const missingControlledChange = <ActionMenu label="Options" icon={<MoreIcon />} items={items} open />;

const bothStateModes = (
  // @ts-expect-error controlled and uncontrolled state props are mutually exclusive
  <ActionMenu
    defaultOpen
    icon={<MoreIcon />}
    items={items}
    label="Options"
    onOpenChange={() => undefined}
    open
  />
);

const richLabelItems = [
  // @ts-expect-error item labels are strings so every item has stable text
  { label: <span>Edit</span>, onSelect: () => undefined },
] satisfies readonly ActionMenuItem[];

const withChildren = (
  // @ts-expect-error ActionMenu owns its children through icon and items
  <ActionMenu icon={<MoreIcon />} items={items} label="Options">
    Unexpected content
  </ActionMenu>
);

void missingControlledChange;
void bothStateModes;
void richLabelItems;
void withChildren;

describe("ActionMenu type contract", () => {
  it("accepts typed items, placement, state modes, native root props, and a trigger ref", () => {
    expect([uncontrolled, controlled]).toHaveLength(2);
  });
});
