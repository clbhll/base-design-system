export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export function PropsTable({ props }: { props: ReadonlyArray<PropDefinition> }) {
  return (
    <section className="lab-document-section">
      <h2 className="base-type-heading-md">Props</h2>
      <div className="lab-props-table-wrap">
        <table className="lab-props-table base-type-body-sm">
          <caption>Public props</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Default</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((property) => (
              <tr key={property.name}>
                <th scope="row">
                  <code className="base-type-mono">{property.name}</code>
                </th>
                <td>
                  <code className="base-type-mono">{property.type}</code>
                </td>
                <td>
                  {property.defaultValue ? (
                    <code className="base-type-mono">{property.defaultValue}</code>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{property.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
