const statusLabels = {
  stable: "Stable",
  beta: "Beta",
  unstable: "Unstable",
  deprecated: "Deprecated",
} as const;

export type LabStatus = keyof typeof statusLabels;

export function StatusTag({ status }: { status: LabStatus }) {
  return (
    <span className="lab-status-tag base-type-caption" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}
