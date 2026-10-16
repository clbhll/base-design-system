import type { BaseTheme } from "@calebhill/base";
import { createContext, useContext } from "react";

export const CanvasThemeContext = createContext<BaseTheme>("light");

/** The theme of the current canvas surface, for specimens that portal outside it. */
export function useCanvasTheme() {
  return useContext(CanvasThemeContext);
}
