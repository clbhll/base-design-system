"use client";

import { Agentation } from "agentation";

export function DevTools() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return <Agentation endpoint="http://localhost:4747" />;
}
