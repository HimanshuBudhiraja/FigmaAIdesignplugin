export interface Fill {
  type: "SOLID" | "GRADIENT_LINEAR";
  color?: string;
  opacity?: number;
  gradientStops?: { color: string; position: number }[];
}

export interface Effect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR";
  color?: string;
  offset?: { x: number; y: number };
  blur?: number;
  spread?: number;
}

export interface DesignNode {
  type: "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "GROUP" | "COMPONENT";
  name?: string;

  // Positioning & sizing
  x?: number;
  y?: number;
  width: number;
  height: number;

  // Auto-layout (FRAME only)
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;

  // Layout child properties
  layoutAlign?: "STRETCH" | "INHERIT";
  layoutGrow?: number;

  // Appearance
  backgroundColor?: string;
  fills?: Fill[];
  opacity?: number;
  cornerRadius?: number;
  cornerRadii?: [number, number, number, number];

  // Stroke
  strokeColor?: string;
  strokeWeight?: number;

  // Effects
  effects?: Effect[];

  // Text-specific
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "Regular" | "Medium" | "Bold" | "Light";
  textColor?: string;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
  lineHeight?: number;
  letterSpacing?: number;

  // Children
  children?: DesignNode[];
}

export const DESIGN_JSON_SCHEMA_DESCRIPTION = `
{
  "type": "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "GROUP" | "COMPONENT",
  "name": "string (descriptive layer name)",
  "x": "number (optional, position)",
  "y": "number (optional, position)",
  "width": "number (required)",
  "height": "number (required)",
  "layoutMode": "'HORIZONTAL' | 'VERTICAL' | 'NONE' (auto-layout, FRAME only)",
  "primaryAxisAlignItems": "'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'",
  "counterAxisAlignItems": "'MIN' | 'CENTER' | 'MAX'",
  "itemSpacing": "number (gap between children in auto-layout)",
  "paddingTop": "number",
  "paddingRight": "number",
  "paddingBottom": "number",
  "paddingLeft": "number",
  "layoutAlign": "'STRETCH' | 'INHERIT' (for children of auto-layout parents)",
  "layoutGrow": "0 (fixed size) | 1 (fill available space)",
  "backgroundColor": "hex string e.g. '#1976D2'",
  "fills": [{ "type": "SOLID", "color": "#hex", "opacity": 0-1 }],
  "opacity": "0-1",
  "cornerRadius": "number",
  "cornerRadii": "[topLeft, topRight, bottomRight, bottomLeft]",
  "strokeColor": "hex string",
  "strokeWeight": "number",
  "effects": [{
    "type": "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR",
    "color": "hex string",
    "offset": { "x": 0, "y": 2 },
    "blur": 6,
    "spread": 0
  }],
  "characters": "string (TEXT nodes only)",
  "fontSize": "number",
  "fontFamily": "Roboto (default)",
  "fontWeight": "'Regular' | 'Medium' | 'Bold' | 'Light'",
  "textColor": "hex string",
  "textAlignHorizontal": "'LEFT' | 'CENTER' | 'RIGHT'",
  "lineHeight": "number (pixels)",
  "letterSpacing": "number (pixels)",
  "children": [ ...nested DesignNode objects ]
}`;
