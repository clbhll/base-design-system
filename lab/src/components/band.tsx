import type { LabBand } from "../catalog-types";

export function Band({ band: { label, Specimens }, id }: { band: LabBand; id: string }) {
  const labelId = `${id}-label`;

  return (
    <section aria-labelledby={labelId} className="lab-band">
      <h3 className="lab-band-label base-type-mono" id={labelId}>
        {label}
      </h3>
      <div className="lab-band-specimens">
        <Specimens />
      </div>
    </section>
  );
}
