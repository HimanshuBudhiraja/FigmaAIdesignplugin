/**
 * Converts a hex color string to Figma's RGB format (0-1 range).
 * Supports "#RGB", "#RRGGBB", and "#RRGGBBAA" formats.
 */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");

  // Expand shorthand "#RGB" → "RRGGBB"
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  // Take only the first 6 chars (ignore alpha if present)
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Extracts alpha from an 8-char hex string ("#RRGGBBAA").
 * Returns 1 if no alpha channel.
 */
export function hexToOpacity(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length === 8) {
    return parseInt(h.substring(6, 8), 16) / 255;
  }
  return 1;
}

/**
 * Creates a Figma SolidPaint from a hex color string.
 */
export function hexToSolidPaint(hex: string, opacity?: number): SolidPaint {
  return {
    type: "SOLID",
    color: hexToRgb(hex),
    opacity: opacity ?? hexToOpacity(hex),
  };
}

/**
 * Material Design color palette for reference.
 */
export const MATERIAL_COLORS = {
  primary: "#1976D2",
  primaryDark: "#1565C0",
  primaryLight: "#BBDEFB",
  secondary: "#FF4081",
  surface: "#FFFFFF",
  background: "#FAFAFA",
  error: "#D32F2F",
  success: "#388E3C",
  warning: "#F57C00",
  onPrimary: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
  textDisabled: "#BDBDBD",
  divider: "#E0E0E0",
} as const;
