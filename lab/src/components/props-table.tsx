import { InspectorSection } from "./inspector-section";

export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export function PropsTable({ props }: { props: ReadonlyArray<PropDefinition> }) {
  return (
    <InspectorSection title="Props">
      <div className="lab-props-table-wrap">
        <table className="lab-props-table base-type-body-sm">
          <caption>Public props</caption>
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {props.map((property) => (
              <tr key={property.name}>
                <th scope="row">
                  <code className="base-type-mono">{property.name}</code>
                </th>
                <td>
                  <code className="lab-props-type base-type-mono">{property.type}</code>
                  {property.defaultValue ? (
                    <span className="lab-props-default">
                      Default <code className="base-type-mono">{property.defaultValue}</code>
                    </span>
                  ) : null}
                  <span className="lab-props-description">{property.description}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InspectorSection>
  );
}
