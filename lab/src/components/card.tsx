import type { LabComponent } from "../catalog-types";

export const cardId = (component: string) => `card-${component}`;
export const cardButtonId = (component: string) => `card-${component}-open`;

export function Card({
  component: { caption, docs, id, Preview },
  onOpen,
}: {
  component: LabComponent;
  onOpen: () => void;
}) {
  return (
    <li className="lab-card" id={cardId(id)}>
      <div aria-hidden="true" className="lab-card-preview" inert>
        <Preview />
      </div>
      <h2 className="lab-card-title base-type-action">
        <button
          aria-haspopup="dialog"
          className="lab-card-open"
          id={cardButtonId(id)}
          onClick={onOpen}
          type="button"
        >
          {docs.title}
        </button>
      </h2>
      <p className="lab-card-caption base-type-mono">{caption}</p>
    </li>
  );
}
