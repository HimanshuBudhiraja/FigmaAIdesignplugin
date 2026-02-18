import { hexToRgb, hexToSolidPaint, hexToOpacity } from "./colors";
import { normalizeFontWeight } from "./fonts";

interface Fill {
  type: "SOLID" | "GRADIENT_LINEAR";
  color?: string;
  opacity?: number;
  gradientStops?: { color: string; position: number }[];
}

interface Effect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR";
  color?: string;
  offset?: { x: number; y: number };
  blur?: number;
  spread?: number;
}

interface DesignNode {
  type: "FRAME" | "TEXT" | "RECTANGLE" | "ELLIPSE" | "GROUP" | "COMPONENT";
  name?: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  layoutAlign?: "STRETCH" | "INHERIT";
  layoutGrow?: number;
  backgroundColor?: string;
  fills?: Fill[];
  opacity?: number;
  cornerRadius?: number;
  cornerRadii?: [number, number, number, number];
  strokeColor?: string;
  strokeWeight?: number;
  effects?: Effect[];
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "Regular" | "Medium" | "Bold" | "Light";
  textColor?: string;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
  lineHeight?: number;
  letterSpacing?: number;
  children?: DesignNode[];
}

let nodeCount = 0;

/**
 * Renders the full design tree onto the Figma canvas.
 * Returns the root SceneNode and total node count.
 */
export function renderDesign(
  design: DesignNode,
  parent: BaseNode & ChildrenMixin
): { root: SceneNode; nodeCount: number } {
  nodeCount = 0;
  const root = renderNode(design, parent);
  return { root, nodeCount };
}

/**
 * Recursively renders a DesignNode into a Figma SceneNode.
 */
function renderNode(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): SceneNode {
  let figmaNode: SceneNode;

  switch (node.type) {
    case "FRAME":
      figmaNode = renderFrame(node, parent);
      break;
    case "TEXT":
      figmaNode = renderText(node, parent);
      break;
    case "RECTANGLE":
      figmaNode = renderRectangle(node, parent);
      break;
    case "ELLIPSE":
      figmaNode = renderEllipse(node, parent);
      break;
    case "COMPONENT":
      figmaNode = renderComponent(node, parent);
      break;
    case "GROUP":
      figmaNode = renderGroup(node, parent);
      break;
    default:
      // Fallback: treat unknown types as frames
      figmaNode = renderFrame(node, parent);
      break;
  }

  nodeCount++;

  // Set common properties
  if (node.name) {
    figmaNode.name = node.name;
  }

  if (node.opacity !== undefined && "opacity" in figmaNode) {
    (figmaNode as any).opacity = node.opacity;
  }

  return figmaNode;
}

function renderFrame(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): FrameNode {
  const frame = figma.createFrame();
  parent.appendChild(frame);

  // Size
  frame.resize(node.width, node.height);

  // Position (only for non-auto-layout parents)
  if (node.x !== undefined) frame.x = node.x;
  if (node.y !== undefined) frame.y = node.y;

  // Background
  if (node.backgroundColor) {
    frame.fills = [hexToSolidPaint(node.backgroundColor)];
  } else if (node.fills && node.fills.length > 0) {
    frame.fills = convertFills(node.fills);
  } else {
    frame.fills = [];
  }

  // Corner radius
  applyCornerRadius(frame, node);

  // Stroke
  applyStroke(frame, node);

  // Effects
  applyEffects(frame, node);

  // Auto-layout — must be set BEFORE alignment/spacing
  if (node.layoutMode && node.layoutMode !== "NONE") {
    frame.layoutMode = node.layoutMode;

    if (node.primaryAxisAlignItems) {
      frame.primaryAxisAlignItems = node.primaryAxisAlignItems;
    }
    if (node.counterAxisAlignItems) {
      frame.counterAxisAlignItems = node.counterAxisAlignItems;
    }
    if (node.itemSpacing !== undefined) {
      frame.itemSpacing = node.itemSpacing;
    }
    if (node.paddingTop !== undefined) frame.paddingTop = node.paddingTop;
    if (node.paddingRight !== undefined) frame.paddingRight = node.paddingRight;
    if (node.paddingBottom !== undefined) frame.paddingBottom = node.paddingBottom;
    if (node.paddingLeft !== undefined) frame.paddingLeft = node.paddingLeft;

    // Set primary axis sizing to AUTO so the frame grows with content
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "FIXED";
  }

  // Render children
  if (node.children) {
    for (const child of node.children) {
      const childNode = renderNode(child, frame);

      // Set layout child properties AFTER appending to parent
      if (node.layoutMode && node.layoutMode !== "NONE") {
        if (child.layoutAlign && "layoutAlign" in childNode) {
          (childNode as any).layoutAlign = child.layoutAlign;
        }
        if (child.layoutGrow !== undefined && "layoutGrow" in childNode) {
          (childNode as any).layoutGrow = child.layoutGrow;
        }
      }
    }
  }

  return frame;
}

function renderText(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): TextNode {
  const text = figma.createText();
  parent.appendChild(text);

  // Font must be set before characters
  const family = node.fontFamily || "Roboto";
  const style = normalizeFontWeight(node.fontWeight);

  try {
    text.fontName = { family, style };
  } catch {
    // Fallback if font isn't loaded
    text.fontName = { family: "Inter", style: "Regular" };
  }

  // Set text content
  text.characters = node.characters || "Text";

  // Size
  if (node.width) text.resize(node.width, node.height || 20);

  // Position
  if (node.x !== undefined) text.x = node.x;
  if (node.y !== undefined) text.y = node.y;

  // Font size
  if (node.fontSize) text.fontSize = node.fontSize;

  // Text color
  if (node.textColor) {
    text.fills = [hexToSolidPaint(node.textColor)];
  }

  // Alignment
  if (node.textAlignHorizontal) {
    text.textAlignHorizontal = node.textAlignHorizontal;
  }

  // Line height
  if (node.lineHeight) {
    text.lineHeight = { value: node.lineHeight, unit: "PIXELS" };
  }

  // Letter spacing
  if (node.letterSpacing) {
    text.letterSpacing = { value: node.letterSpacing, unit: "PIXELS" };
  }

  // Text auto-resize: width is fixed, height adjusts
  text.textAutoResize = "HEIGHT";

  return text;
}

function renderRectangle(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): RectangleNode {
  const rect = figma.createRectangle();
  parent.appendChild(rect);

  rect.resize(node.width, node.height);

  if (node.x !== undefined) rect.x = node.x;
  if (node.y !== undefined) rect.y = node.y;

  // Fills
  if (node.backgroundColor) {
    rect.fills = [hexToSolidPaint(node.backgroundColor)];
  } else if (node.fills && node.fills.length > 0) {
    rect.fills = convertFills(node.fills);
  }

  applyCornerRadius(rect, node);
  applyStroke(rect, node);
  applyEffects(rect, node);

  return rect;
}

function renderEllipse(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): EllipseNode {
  const ellipse = figma.createEllipse();
  parent.appendChild(ellipse);

  ellipse.resize(node.width, node.height);

  if (node.x !== undefined) ellipse.x = node.x;
  if (node.y !== undefined) ellipse.y = node.y;

  if (node.backgroundColor) {
    ellipse.fills = [hexToSolidPaint(node.backgroundColor)];
  } else if (node.fills && node.fills.length > 0) {
    ellipse.fills = convertFills(node.fills);
  }

  applyEffects(ellipse, node);

  return ellipse;
}

function renderComponent(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): ComponentNode {
  const comp = figma.createComponent();
  parent.appendChild(comp);

  comp.resize(node.width, node.height);

  if (node.x !== undefined) comp.x = node.x;
  if (node.y !== undefined) comp.y = node.y;

  if (node.backgroundColor) {
    comp.fills = [hexToSolidPaint(node.backgroundColor)];
  } else if (node.fills && node.fills.length > 0) {
    comp.fills = convertFills(node.fills);
  } else {
    comp.fills = [];
  }

  applyCornerRadius(comp, node);
  applyStroke(comp, node);
  applyEffects(comp, node);

  // Auto-layout
  if (node.layoutMode && node.layoutMode !== "NONE") {
    comp.layoutMode = node.layoutMode;
    if (node.primaryAxisAlignItems) comp.primaryAxisAlignItems = node.primaryAxisAlignItems;
    if (node.counterAxisAlignItems) comp.counterAxisAlignItems = node.counterAxisAlignItems;
    if (node.itemSpacing !== undefined) comp.itemSpacing = node.itemSpacing;
    if (node.paddingTop !== undefined) comp.paddingTop = node.paddingTop;
    if (node.paddingRight !== undefined) comp.paddingRight = node.paddingRight;
    if (node.paddingBottom !== undefined) comp.paddingBottom = node.paddingBottom;
    if (node.paddingLeft !== undefined) comp.paddingLeft = node.paddingLeft;
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";
  }

  // Render children
  if (node.children) {
    for (const child of node.children) {
      const childNode = renderNode(child, comp);
      if (node.layoutMode && node.layoutMode !== "NONE") {
        if (child.layoutAlign && "layoutAlign" in childNode) {
          (childNode as any).layoutAlign = child.layoutAlign;
        }
        if (child.layoutGrow !== undefined && "layoutGrow" in childNode) {
          (childNode as any).layoutGrow = child.layoutGrow;
        }
      }
    }
  }

  return comp;
}

function renderGroup(
  node: DesignNode,
  parent: BaseNode & ChildrenMixin
): FrameNode {
  // Figma groups require existing children, so we use a frame with no fill instead
  const frame = figma.createFrame();
  parent.appendChild(frame);

  frame.resize(node.width, node.height);
  frame.fills = [];
  frame.clipsContent = false;

  if (node.x !== undefined) frame.x = node.x;
  if (node.y !== undefined) frame.y = node.y;

  if (node.children) {
    for (const child of node.children) {
      renderNode(child, frame);
    }
  }

  return frame;
}

// --- Helper functions ---

function applyCornerRadius(
  figmaNode: RectangleNode | FrameNode | ComponentNode,
  node: DesignNode
): void {
  if (node.cornerRadii) {
    figmaNode.topLeftRadius = node.cornerRadii[0];
    figmaNode.topRightRadius = node.cornerRadii[1];
    figmaNode.bottomRightRadius = node.cornerRadii[2];
    figmaNode.bottomLeftRadius = node.cornerRadii[3];
  } else if (node.cornerRadius !== undefined) {
    figmaNode.cornerRadius = node.cornerRadius;
  }
}

function applyStroke(
  figmaNode: GeometryMixin,
  node: DesignNode
): void {
  if (node.strokeColor) {
    figmaNode.strokes = [hexToSolidPaint(node.strokeColor)];
    figmaNode.strokeWeight = node.strokeWeight ?? 1;
  }
}

function applyEffects(
  figmaNode: BlendMixin,
  node: DesignNode
): void {
  if (!node.effects || node.effects.length === 0) return;

  const mappedEffects: Array<DropShadowEffect | InnerShadowEffect | BlurEffect> = [];
  for (const effect of node.effects) {
    if (effect.type === "LAYER_BLUR") {
      mappedEffects.push({
        type: "LAYER_BLUR",
        radius: effect.blur || 4,
        visible: true,
      } as BlurEffect);
    } else {
      const color = effect.color ? hexToRgb(effect.color) : { r: 0, g: 0, b: 0 };
      const alpha = effect.color ? hexToOpacity(effect.color) : 0.2;
      mappedEffects.push({
        type: effect.type,
        color: { ...color, a: alpha },
        offset: {
          x: effect.offset?.x ?? 0,
          y: effect.offset?.y ?? 2,
        },
        radius: effect.blur ?? 4,
        spread: effect.spread ?? 0,
        visible: true,
      } as DropShadowEffect | InnerShadowEffect);
    }
  }
  figmaNode.effects = mappedEffects;
}

function convertFills(fills: Fill[]): Paint[] {
  const result: Paint[] = [];
  for (const fill of fills) {
    if (fill.type === "SOLID" && fill.color) {
      result.push(hexToSolidPaint(fill.color, fill.opacity));
    } else if (fill.type === "GRADIENT_LINEAR" && fill.gradientStops) {
      const stops: ColorStop[] = fill.gradientStops.map((stop) => ({
        color: { ...hexToRgb(stop.color), a: 1 },
        position: stop.position,
      }));
      result.push({
        type: "GRADIENT_LINEAR",
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ] as Transform,
        gradientStops: stops,
      } as GradientPaint);
    }
  }
  return result;
}
