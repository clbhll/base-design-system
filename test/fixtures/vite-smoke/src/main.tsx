import ReactDOM from "react-dom/client";

import {
  BASE_THEME_ATTRIBUTE,
  Button,
  ButtonLink,
  MoreIcon,
  ProgressBar,
  TextInput,
  TrashIcon,
  type ButtonProps,
  type ProgressBarProps,
  type TextInputProps,
} from "@calebhill/base";
import "@calebhill/base/styles.css";

const buttonProps: ButtonProps = { type: "button" };
const textInputProps: TextInputProps = {
  "aria-label": "Caption",
  error: "Caption is required",
};
const progressBarProps: ProgressBarProps = {
  "aria-label": "Upload progress",
  value: 45,
};

function FixtureApp() {
  return (
    <section className="base-type-body" {...{ [BASE_THEME_ATTRIBUTE]: "light" }}>
      <Button {...buttonProps} data-fixture="button">
        Save
      </Button>
      <ButtonLink href="#fixture">Button link</ButtonLink>
      <Button aria-label="More" size="icon">
        <MoreIcon />
      </Button>
      <Button aria-label="Delete" size="icon" variant="destructive">
        <TrashIcon />
      </Button>
      <TextInput {...textInputProps} />
      <ProgressBar {...progressBarProps} />
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<FixtureApp />);
