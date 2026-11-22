import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

// Holds the React Flow instance so components outside the canvas (like the
// header's Save button) can read the current nodes and edges.
export const editorAtom = atom<ReactFlowInstance | null>(null);
