/**
 * Font loading utilities for the Figma plugin.
 * Figma requires fonts to be loaded before they can be used on text nodes.
 */

interface DesignNode {
  type: string;
  fontFamily?: string;
  fontWeight?: string;
  children?: DesignNode[];
}

type FontStyle = "Regular" | "Medium" | "Bold" | "Light";

const VALID_WEIGHTS: FontStyle[] = ["Regular", "Medium", "Bold", "Light"];

/**
 * Maps a fontWeight string to a valid Figma font style.
 */
export function normalizeFontWeight(weight?: string): FontStyle {
  if (!weight) return "Regular";
  const w = weight as FontStyle;
  if (VALID_WEIGHTS.indexOf(w) !== -1) return w;
  return "Regular";
}

/**
 * Recursively collects all unique font family + weight combinations
 * from the design tree. Returns them as FontName objects.
 */
export function collectFonts(node: DesignNode): FontName[] {
  const fontSet = new Map<string, FontName>();

  function walk(n: DesignNode) {
    if (n.type === "TEXT") {
      const family = n.fontFamily || "Roboto";
      const style = normalizeFontWeight(n.fontWeight);
      const key = `${family}::${style}`;
      if (!fontSet.has(key)) {
        fontSet.set(key, { family, style });
      }
    }
    if (n.children) {
      for (const child of n.children) {
        walk(child);
      }
    }
  }

  walk(node);

  // Always include Roboto Regular as a fallback
  const defaultKey = "Roboto::Regular";
  if (!fontSet.has(defaultKey)) {
    fontSet.set(defaultKey, { family: "Roboto", style: "Regular" });
  }

  return Array.from(fontSet.values());
}

/**
 * Loads all required fonts in parallel.
 * Must be called before rendering any text nodes.
 */
export async function loadAllFonts(node: DesignNode): Promise<void> {
  const fonts = collectFonts(node);
  const loadPromises = fonts.map((font) =>
    figma.loadFontAsync(font).catch(() => {
      // If the requested font fails, we'll fall back to Inter Regular
      console.log(`Font not available: ${font.family} ${font.style}, will use fallback`);
      return figma.loadFontAsync({ family: "Inter", style: "Regular" });
    })
  );
  await Promise.all(loadPromises);
}
