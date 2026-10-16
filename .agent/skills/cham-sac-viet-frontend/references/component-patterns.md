# Component patterns

Use these as decision guidance, not a mandatory component inventory.

## Brand-first composition pattern

For a branded page, compose layers in this order:

1. semantic page background/surface;
2. large color plane or controlled artwork field;
3. decorative geometry/motifs with `aria-hidden` and `pointer-events: none`;
4. wordmark or focal illustration with preserved aspect ratio;
5. readable content surface and primary action;
6. utility/navigation controls with visible focus.

Keep decorative layers out of the reading order. Do not place important text over busy artwork unless a stable contrast surface or contour makes it readable. On mobile, hide or simplify non-essential motifs rather than shrinking the wordmark and content until they are unusable.

## Publication-inspired component language

- Buttons may use solid palette fills, a cream/purple contour, or a controlled offset shadow; keep labels short and Vietnamese.
- Section dividers can use angled planes, circles, or sweeping strokes from the visual family instead of generic horizontal rules.
- Cards should feel like illustrated content panels: a clear color block, intentional border/outline, image treatment, and one clear action. Do not create a uniform grid of identical white cards when the reference composition calls for a poster-like rhythm.
- Hero sections should have one focal wordmark/heading, one supporting message, and one primary action. Decorative objects should orbit or frame that focal area, not compete with it.

## Page shell

Keep a stable shell for header/navigation, main content, and footer. Make the current navigation state clear, support keyboard access, and avoid putting essential navigation inside decorative artwork. On small screens, collapse navigation into a labeled control with a predictable focus order.

## Hero and section headers

Use one dominant heading per page, a concise supporting sentence, and one primary action when a primary action exists. Section headings should establish hierarchy without repeating the same oversized display treatment everywhere. Use supplied artwork as an anchored visual layer with explicit `alt` text or empty alt when purely decorative.

## Buttons and forms

Create consistent primary, secondary, and quiet/destructive variants only when the product needs them. Buttons must have stable dimensions across loading states and must not become ambiguous icon-only controls. Form fields need labels, errors adjacent to the field, input types/autocomplete where relevant, and a summary or focus strategy for submit failures.

## Data and feedback

For API-backed content, design loading, empty, error, retry, and success states as part of the component. Avoid layout jumps where practical. Do not display raw server errors to users; preserve useful diagnostic details in logs where the project supports it.

## Decorative layers

Keep shapes and illustrations in separate layers with controlled z-indexes and pointer-event behavior. Decorative layers must not intercept clicks, reduce contrast, or make the DOM order inaccessible. Prefer CSS shapes for simple geometry and supplied image assets for brand-specific artwork.
