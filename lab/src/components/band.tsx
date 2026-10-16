import type { LabBand } from "../catalog-types";

export const bandElementId = (band: string) => `band-${band}`;

export function Band({
  band: { id, label, Specimens },
  onSelect,
  selected,
}: {
  band: LabBand;
  selected: boolean;
  onSelect: () => void;
}) {
  const labelId = `${bandElementId(id)}-label`;

  return (
    <section
      aria-labelledby={labelId}
      className="lab-band"
      data-selected={selected || undefined}
      id={bandElementId(id)}
    >
      <h2 className="lab-band-label">
        <button
          aria-controls="lab-inspector-body"
          aria-current={selected || undefined}
          className="lab-band-select base-focus-ring base-type-mono"
          id={labelId}
          onClick={onSelect}
          type="button"
        >
          {label}
        </button>
      </h2>
      <div className="lab-band-specimens">
        <Specimens />
      </div>
    </section>
  );
}
