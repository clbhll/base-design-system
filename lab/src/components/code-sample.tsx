export function CodeSample({ code }: { code: string }) {
  return (
    <pre className="lab-code-sample base-type-mono">
      <code>{code}</code>
    </pre>
  );
}
