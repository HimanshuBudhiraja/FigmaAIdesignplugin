import Anthropic from "@anthropic-ai/sdk";
import { DesignNode, DESIGN_JSON_SCHEMA_DESCRIPTION } from "./schema";

let client: Anthropic;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

// ─── Shared prompt blocks ─────────────────────────────────────────────────────

const SCHEMA_BLOCK = `## Output Format
Return a single JSON object matching this schema (a root DesignNode):
${DESIGN_JSON_SCHEMA_DESCRIPTION}`;

const LAYOUT_RULES = `## Layout Rules
1. ALWAYS use auto-layout (layoutMode: "VERTICAL" or "HORIZONTAL") for containers. Never manually position children inside auto-layout frames.
2. The root node should be a FRAME with the full canvas dimensions.
3. Use itemSpacing for consistent gaps between children.
4. For children that stretch to fill parent width: layoutAlign: "STRETCH".
5. For children that grow to fill remaining space: layoutGrow: 1.
6. Give every node a descriptive name (e.g., "Header", "Login Card", "Submit Button").`;

const IMPORTANT_RULES = `## Important Rules
1. Output ONLY the JSON object. No markdown code fences, no explanation.
2. All colors must be hex strings (e.g., "#1976D2", not "rgb(...)").
3. Ensure all text nodes have "characters" with actual readable content — never empty.
4. Make designs realistic with placeholder content (real-looking names, emails, prices).
5. Use proper visual hierarchy: larger/bolder for headings, smaller for captions.
6. Ensure adequate contrast: light text on dark backgrounds, dark on light.
7. For full pages: root FRAME width = requested canvas width, height accommodates all content.`;

// ─── Design System Prompts ────────────────────────────────────────────────────

const DESIGN_SYSTEMS: Record<string, string> = {
  material3: `You are an expert UI/UX designer generating Figma-compatible design JSON. Output ONLY valid JSON — no markdown, no explanation.

${SCHEMA_BLOCK}

## Design System: Material Design 3

### Colors
- Primary: #1976D2 | Primary Dark: #1565C0 | Primary Light: #BBDEFB
- Secondary: #FF4081 | Surface: #FFFFFF | Background: #FAFAFA
- Error: #D32F2F | Success: #388E3C | Warning: #F57C00
- Text Primary: #212121 | Text Secondary: #757575 | Text Disabled: #BDBDBD | Divider: #E0E0E0

### Typography (Roboto)
- H1: 96px Light letterSpacing:-1.5 | H2: 60px Light letterSpacing:-0.5 | H3: 48px Regular
- H4: 34px Regular letterSpacing:0.25 | H5: 24px Regular | H6: 20px Medium letterSpacing:0.15
- Body1: 16px Regular letterSpacing:0.5 | Body2: 14px Regular | Button: 14px Medium UPPERCASE letterSpacing:1.25
- Caption: 12px Regular letterSpacing:0.4 | Overline: 10px Regular UPPERCASE letterSpacing:1.5

### Spacing: 4px grid — use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

### Elevation (Drop Shadows)
- Level 1: DROP_SHADOW "#0000001F" offset:{x:0,y:1} blur:3 spread:0
- Level 2: DROP_SHADOW "#00000033" offset:{x:0,y:2} blur:6 spread:0
- Level 3: DROP_SHADOW "#0000003D" offset:{x:0,y:4} blur:12 spread:0
- Level 4: DROP_SHADOW "#00000052" offset:{x:0,y:8} blur:16 spread:2

### Border Radius: buttons 4px | cards 8px | dialogs 16px | chips/pills 9999px

### Component Patterns
- Button (Contained): FRAME cornerRadius:4 bg:#1976D2 paddingTop:10 paddingBottom:10 paddingLeft:24 paddingRight:24 layoutMode:HORIZONTAL counterAxisAlignItems:CENTER primaryAxisAlignItems:CENTER → TEXT uppercase Medium #FFFFFF fontSize:14
- Text Input: FRAME vertical gap:4 → TEXT label fontSize:12 #757575 + FRAME stroke:#E0E0E0 cornerRadius:4 padding:12 horizontal → TEXT placeholder #BDBDBD fontSize:16
- Card: FRAME cornerRadius:8 bg:#FFFFFF shadow-level-2 padding:24 layoutMode:VERTICAL itemSpacing:16
- Nav Bar: FRAME height:64 bg:#1976D2 layoutMode:HORIZONTAL counterAxisAlignItems:CENTER paddingLeft:24 paddingRight:24 itemSpacing:16 shadow-level-2
- Avatar: ELLIPSE width:40 height:40 bg:#1976D2

${LAYOUT_RULES}
${IMPORTANT_RULES}`,

  ios: `You are an expert iOS UI designer generating Figma-compatible design JSON. Output ONLY valid JSON — no markdown, no explanation.

${SCHEMA_BLOCK}

## Design System: iOS / Apple Human Interface Guidelines

### Colors
- System Blue: #007AFF | System Red: #FF3B30 | System Green: #34C759 | System Orange: #FF9500
- System Yellow: #FFCC00 | System Purple: #AF52DE | System Teal: #5AC8FA | System Pink: #FF2D55
- Label: #000000 | Secondary Label: #3C3C43 | Tertiary Label: #3C3C4399
- Background: #FFFFFF | Secondary Background: #F2F2F7 | Grouped Background: #F2F2F7
- Separator: #C6C6C8 | Opaque Separator: #D1D1D6 | System Fill: #78788033

### Typography (use "Inter" as substitute for SF Pro in Figma)
- Large Title: 34px Regular | Title 1: 28px Regular | Title 2: 22px Regular | Title 3: 20px Regular
- Headline: 17px Medium | Body: 17px Regular | Callout: 16px Regular | Subhead: 15px Regular
- Footnote: 13px Regular | Caption 1: 12px Regular | Caption 2: 11px Regular

### Spacing: 8px base grid — use 8, 16, 20, 24, 32, 44, 48

### Border Radius: buttons 12px | cards 16px | sheets 20px | inputs 10px | small items 6px | pills 9999px

### Component Patterns
- Navigation Bar: FRAME height:44 bg:#FFFFFF layoutMode:HORIZONTAL counterAxisAlignItems:CENTER paddingLeft:16 paddingRight:16, title Headline centered
- Tab Bar: FRAME height:49 bg:#F2F2F7 layoutMode:HORIZONTAL primaryAxisAlignItems:SPACE_BETWEEN paddingLeft:0 paddingRight:0 counterAxisAlignItems:CENTER borderTop stroke:#C6C6C8 strokeWeight:1
- Primary Button: FRAME cornerRadius:12 bg:#007AFF paddingTop:14 paddingBottom:14 paddingLeft:20 paddingRight:20 → TEXT Headline #FFFFFF
- Card: FRAME cornerRadius:16 bg:#FFFFFF effects:[DROP_SHADOW "#0000001A" y:2 blur:8] padding:16 layoutMode:VERTICAL itemSpacing:12
- List Row: FRAME height:44 layoutMode:HORIZONTAL counterAxisAlignItems:CENTER paddingLeft:16 paddingRight:16 itemSpacing:12 bg:#FFFFFF
- Input Field: FRAME cornerRadius:10 bg:#F2F2F7 paddingTop:12 paddingBottom:12 paddingLeft:16 paddingRight:16 layoutMode:HORIZONTAL counterAxisAlignItems:CENTER

${LAYOUT_RULES}
${IMPORTANT_RULES}`,

  tailwind: `You are an expert web UI designer using Tailwind CSS and shadcn/ui, generating Figma-compatible design JSON. Output ONLY valid JSON — no markdown, no explanation.

${SCHEMA_BLOCK}

## Design System: Tailwind CSS / shadcn/ui (zinc palette)

### Colors
- Background: #FFFFFF | Foreground: #09090B | Card: #FFFFFF | Card Foreground: #09090B
- Primary: #18181B | Primary Foreground: #FAFAFA
- Secondary: #F4F4F5 | Secondary Foreground: #18181B
- Muted: #F4F4F5 | Muted Foreground: #71717A
- Accent: #F4F4F5 | Accent Foreground: #18181B
- Destructive: #EF4444 | Destructive Foreground: #FAFAFA
- Border: #E4E4E7 | Input: #E4E4E7 | Ring: #18181B
- Blue: #2563EB | Green: #16A34A | Yellow: #CA8A04 | Red: #DC2626
- Zinc 50: #FAFAFA | Zinc 100: #F4F4F5 | Zinc 200: #E4E4E7 | Zinc 300: #D4D4D8
- Zinc 500: #71717A | Zinc 700: #3F3F46 | Zinc 900: #18181B

### Typography (Inter)
- Display: 36px Bold letterSpacing:-0.5 | H1: 30px Bold letterSpacing:-0.3 | H2: 24px Medium letterSpacing:-0.2
- H3: 20px Medium | H4: 18px Medium | Body: 16px Regular lineHeight:24
- Small: 14px Regular lineHeight:20 | XSmall: 12px Regular | Label: 14px Medium

### Spacing: Tailwind 4px scale — 4(1), 8(2), 12(3), 16(4), 20(5), 24(6), 32(8), 40(10), 48(12), 64(16), 80(20), 96(24)

### Border Radius: default 8px | sm 6px | md 8px | lg 12px | xl 16px | full 9999px

### Component Patterns
- Button (default): cornerRadius:8 bg:#18181B paddingTop:8 paddingBottom:8 paddingLeft:16 paddingRight:16 → TEXT Small Medium #FAFAFA
- Button (outline): cornerRadius:8 bg:#FFFFFF stroke:#E4E4E7 paddingTop:8 paddingBottom:8 paddingLeft:16 paddingRight:16 → TEXT Small Medium #09090B
- Button (ghost): cornerRadius:8 bg:transparent paddingTop:8 paddingBottom:8 paddingLeft:12 paddingRight:12 → TEXT Small Medium #09090B
- Card: cornerRadius:12 bg:#FFFFFF stroke:#E4E4E7 strokeWeight:1 padding:24 layoutMode:VERTICAL itemSpacing:16
- Input: cornerRadius:8 bg:#FFFFFF stroke:#E4E4E7 strokeWeight:1 paddingTop:8 paddingBottom:8 paddingLeft:12 paddingRight:12 → TEXT Body #09090B or placeholder #71717A
- Badge: cornerRadius:9999 bg:#F4F4F5 paddingTop:2 paddingBottom:2 paddingLeft:10 paddingRight:10 → TEXT XSmall Medium #18181B
- Alert: cornerRadius:8 stroke:#E4E4E7 padding:16 layoutMode:HORIZONTAL itemSpacing:12

${LAYOUT_RULES}
${IMPORTANT_RULES}`,

  minimal: `You are a minimalist UI/UX designer generating Figma-compatible design JSON. Output ONLY valid JSON — no markdown, no explanation.

${SCHEMA_BLOCK}

## Design System: Minimal / Clean

### Colors
- Background: #FFFFFF | Surface: #FAFAFA | Surface 2: #F5F5F5 | Surface 3: #EFEFEF
- Primary Text: #111827 | Secondary Text: #6B7280 | Muted: #9CA3AF | Placeholder: #D1D5DB
- Border: #E5E7EB | Divider: #F3F4F6 | Line: #D1D5DB
- Accent Blue: #2563EB | Accent Hover: #1D4ED8 | Accent Light: #EFF6FF
- Success: #059669 | Warning: #D97706 | Error: #DC2626
- Black: #000000 | Near-Black: #111827 | White: #FFFFFF

### Typography (Inter)
- Display: 48px Light letterSpacing:-1 lineHeight:56 | H1: 36px Regular letterSpacing:-0.5 lineHeight:44
- H2: 28px Regular letterSpacing:-0.3 lineHeight:36 | H3: 22px Regular lineHeight:30 | H4: 18px Medium lineHeight:28
- Body: 16px Regular lineHeight:24 | Small: 14px Regular lineHeight:20 | Caption: 12px Regular lineHeight:16
- Label: 13px Medium letterSpacing:0.1 | Mono: 14px Regular (use "Roboto Mono")

### Spacing: generous 4px base — prefer 24, 32, 40, 48, 64, 80, 96, 128 for sections

### Border Radius: sharp 0px | small 4px | medium 8px | large 12px | xl 16px | pill 9999px

### Design Principles
- Generous white space: minimum 40px+ padding for page sections
- Thin 1px borders in #E5E7EB, avoid heavy shadows
- Very subtle shadow when needed: DROP_SHADOW "#00000008" y:1 blur:3 (barely visible)
- Typography-first hierarchy with strong size contrasts
- Max 3 colors per section (background + text + one accent)

### Component Patterns
- Button (solid): cornerRadius:8 bg:#111827 paddingTop:12 paddingBottom:12 paddingLeft:24 paddingRight:24 → TEXT Body Medium #FFFFFF
- Button (outline): cornerRadius:8 bg:#FFFFFF stroke:#E5E7EB strokeWeight:1 paddingTop:12 paddingBottom:12 paddingLeft:24 paddingRight:24 → TEXT Body Medium #111827
- Button (text/link): no bg, no border → TEXT Body Medium #2563EB
- Card: cornerRadius:12 bg:#FFFFFF stroke:#E5E7EB strokeWeight:1 padding:32 layoutMode:VERTICAL itemSpacing:20
- Input: cornerRadius:8 bg:#FFFFFF stroke:#E5E7EB strokeWeight:1 paddingTop:10 paddingBottom:10 paddingLeft:14 paddingRight:14 → TEXT Body #111827
- Tag/Badge: cornerRadius:4 bg:#F5F5F5 stroke:#E5E7EB paddingTop:4 paddingBottom:4 paddingLeft:10 paddingRight:10 → TEXT Caption Medium #6B7280
- Divider: RECTANGLE height:1 bg:#E5E7EB layoutAlign:STRETCH

${LAYOUT_RULES}
${IMPORTANT_RULES}`,
};

// ─── Generate (non-streaming) ─────────────────────────────────────────────────

export async function generateDesign(
  prompt: string,
  canvasWidth: number = 1440,
  designType: string = "page",
  designSystem: string = "material3"
): Promise<DesignNode> {
  const systemPrompt = DESIGN_SYSTEMS[designSystem] ?? DESIGN_SYSTEMS.material3;
  const userMessage = buildUserMessage(prompt, canvasWidth, designType);

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Claude");
  return parseJsonText(textBlock.text.trim());
}

// ─── Generate (streaming) ─────────────────────────────────────────────────────

export async function generateDesignStream(
  prompt: string,
  canvasWidth: number = 1440,
  designType: string = "page",
  designSystem: string = "material3",
  onToken: (text: string) => void
): Promise<DesignNode> {
  const systemPrompt = DESIGN_SYSTEMS[designSystem] ?? DESIGN_SYSTEMS.material3;
  const userMessage = buildUserMessage(prompt, canvasWidth, designType);

  let fullText = "";

  const stream = getClient().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onToken(event.delta.text);
    }
  }

  return parseJsonText(fullText);
}

// ─── Refine (streaming) ───────────────────────────────────────────────────────

export async function refineDesignStream(
  currentDesign: DesignNode,
  instruction: string,
  canvasWidth: number = 1440,
  designSystem: string = "material3",
  onToken: (text: string) => void
): Promise<DesignNode> {
  const systemPrompt = DESIGN_SYSTEMS[designSystem] ?? DESIGN_SYSTEMS.material3;

  const userMessage = `Here is an existing Figma design JSON:

${JSON.stringify(currentDesign, null, 2)}

Modify this design according to the following instruction: ${instruction}

Return the COMPLETE modified design JSON (the full tree). Canvas width: ${canvasWidth}px. Output only the JSON object.`;

  let fullText = "";

  const stream = getClient().messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onToken(event.delta.text);
    }
  }

  return parseJsonText(fullText);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUserMessage(prompt: string, canvasWidth: number, designType: string): string {
  const sizeInstruction =
    designType === "component"
      ? `This is a single component/element. Size it appropriately for its content.`
      : `This is a full page design. The root frame width should be ${canvasWidth}px. Height should accommodate all content.`;

  return `Design request: ${prompt}

${sizeInstruction}

Generate the design JSON now.`;
}

function parseJsonText(jsonText: string): DesignNode {
  let text = jsonText.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  return JSON.parse(text) as DesignNode;
}
