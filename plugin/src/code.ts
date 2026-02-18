import { loadAllFonts } from "./fonts";
import { renderDesign } from "./renderer";

figma.showUI(__html__, { width: 440, height: 600 });

const HISTORY_KEY = "design-history";
const MAX_HISTORY = 5;

interface HistoryEntry {
  id: string;
  prompt: string;
  designName: string;
  designSystem: string;
  timestamp: number;
  design: any;
}

figma.ui.onmessage = async (msg: any) => {
  // ── Render a design onto the canvas ────────────────────────────────────────
  if (msg.type === "render-design" && msg.design) {
    try {
      figma.notify("Loading fonts...");
      await loadAllFonts(msg.design);

      figma.notify("Rendering design...");
      const { root, nodeCount } = renderDesign(msg.design, figma.currentPage);

      figma.viewport.scrollAndZoomIntoView([root]);
      figma.currentPage.selection = [root];
      figma.notify(`Design created! (${nodeCount} nodes)`);

      figma.ui.postMessage({ type: "render-complete", nodeCount });
    } catch (error: any) {
      const msg2 = error.message || "Unknown rendering error";
      figma.notify("Error: " + msg2, { error: true });
      figma.ui.postMessage({ type: "render-error", error: msg2 });
    }
  }

  // ── Save a design to history (or clear all if _clear:true) ──────────────────
  if (msg.type === "save-to-history") {
    try {
      if (msg._clear) {
        await figma.clientStorage.setAsync(HISTORY_KEY, []);
      } else if (msg.entry) {
        const existing: HistoryEntry[] =
          (await figma.clientStorage.getAsync(HISTORY_KEY)) || [];
        const updated = [msg.entry as HistoryEntry, ...existing].slice(0, MAX_HISTORY);
        await figma.clientStorage.setAsync(HISTORY_KEY, updated);
      }
      figma.ui.postMessage({ type: "history-saved" });
    } catch {
      // History is non-critical; silently ignore errors
    }
  }

  // ── Load history list ───────────────────────────────────────────────────────
  if (msg.type === "load-history") {
    try {
      const entries: HistoryEntry[] =
        (await figma.clientStorage.getAsync(HISTORY_KEY)) || [];
      figma.ui.postMessage({ type: "history-loaded", entries });
    } catch {
      figma.ui.postMessage({ type: "history-loaded", entries: [] });
    }
  }
};
