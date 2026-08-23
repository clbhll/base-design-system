import { CodeSample } from "./code-sample";
import { StatusTag, type LabStatus } from "./status-tag";

export function DocumentHeader({
  importStatement,
  status,
  summary,
  title,
}: {
  title: string;
  summary: string;
  importStatement?: string;
  status?: LabStatus;
}) {
  return (
    <header className="lab-document-header">
      <div className="lab-document-title-row">
        <h1 className="base-type-display">{title}</h1>
        {status ? <StatusTag status={status} /> : null}
      </div>
      <p className="base-type-body-lg">{summary}</p>
      {importStatement ? <CodeSample code={importStatement} /> : null}
    </header>
  );
}
