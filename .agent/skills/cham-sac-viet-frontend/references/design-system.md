# Chạm Sắc Việt design system reference

## Verified palette

The supplied palette image gives these verified HEX values:

| Role candidate | HEX | RGB |
| --- | --- | --- |
| Golden yellow | `#EEA53B` | 238, 165, 59 |
| Turquoise | `#52BCBF` | 82, 188, 191 |
| Deep blue | `#335797` | 51, 87, 151 |
| Purple | `#72327E` | 114, 50, 126 |
| Magenta | `#B12069` | 177, 32, 105 |
| Hot pink | `#CE337F` | 206, 51, 127 |
| Rose | `#D44A89` | 212, 74, 137 |
| Red | `#D52841` | 213, 40, 65 |

Use these as the starting token set. Select a background and text color based on contrast and the specific section; do not place body text directly on saturated swatches without checking readability. Treat role assignment as contextual rather than assuming all eight colors belong on every screen.

## Typography assets

Available files under `frontend/src/assets/font/`: `BeVietnamPro-Regular`, `BeVietnamPro-Bold`, `BeVietnamPro-Black`, `BeVietnamPro-Thin`, `BeVietnamPro-Italic`, `Baloo2-ExtraBold`, `Coiny-Regular`, `Nunito-Bold`, and `UTM-Flavour`. Define only the weights actually used, use a stable fallback stack, and avoid synthetic bolding where a matching file exists.

## Visual rules

- Pair a readable sans-serif UI face with a distinctive display face instead of using decorative type for long text.
- Prefer solid color fields, outlined shapes, layered silhouettes, and intentional diagonal/asymmetric composition over generic cards and gradients.
- Use thick outlines and offset/layered shadows sparingly as emphasis; keep interactive hit areas and text visually clean.
- Decorative artwork should support the section's meaning and hierarchy, not obscure controls or API-driven content.
- Establish tokens in the existing stylesheet/configuration location; do not create duplicate token systems.

## Brand synchronization is mandatory

The website is a digital surface for the supplied publications. Do not merely borrow the HEX values. Each substantial page should intentionally reuse at least three of the following publication signals, selected according to content hierarchy:

1. a supplied wordmark/logo or brand artwork;
2. the magenta/pink field family;
3. the blue + cream sticker-like wordmark treatment;
4. gold/red/turquoise geometric planes;
5. thick cream and purple contour/offset outline;
6. floating circles, sweeping white strokes, flags, blossom figures, dice-like objects, or related motifs from the key visuals;
7. display typography with a playful, hand-lettered or chunky personality;
8. deliberate diagonal/asymmetric composition.

Three signals is a minimum for a major branded surface, not a requirement to overcrowd every component. Utility screens such as validation or payment may simplify the composition while retaining palette, typography, contour language, and a small brand anchor.

## Asset mapping

Use the repository asset that matches the intended role:

| Asset role | Source location | Usage rule |
| --- | --- | --- |
| Wordmark / transparent brand mark | `project-brief/.../Key visuals/Untitled_Artwork 370.png` | Prefer as an `<img>`/background layer with preserved aspect ratio; treat transparent pixels as intentional; never recreate with plain text. |
| Full composition / hero reference | `project-brief/.../Key visuals/bia_Chạm_sắc_Việt.png` and `Chạm_sắc_Việt-03..07.png` | Use as an art-directed hero/background only when crop and focal point are controlled; do not stretch square artwork into a banner. |
| Palette | `project-brief/.../pallet_Chạm_sắc_Việt.png` | Use verified swatches in `design tokens`; choose text pairings by contrast. |
| Production fonts | `frontend/src/assets/font/` | Load the repository font files; do not substitute arbitrary web fonts. |

Use relative imports from the frontend source when an asset is copied into frontend assets. If an asset remains outside the frontend build graph, do not reference a local absolute Windows path in production code; copy only the intended asset with the user's scope or report the integration step.

## Observed artwork principles

The key visuals repeatedly use a magenta field, a large central Chạm Sắc Việt wordmark, white sticker-like contouring, deep purple outer contour, red/gold/turquoise geometric planes, floating circles, five-petal blossom figures, dice-like cultural objects, flags, and sweeping white accent strokes. Wide artwork uses a left/right split composition; square artwork centers the wordmark and lets decorative objects orbit it.

Translate those principles into responsive UI deliberately:

- Use the wordmark or brand mark as a focal anchor, not as a repeated background texture.
- Use magenta as a strong section/hero field and reserve turquoise/gold/red for emphasis, status, or rhythm.
- Recreate simple planes, circles, strokes, and offset outlines with CSS only when the supplied image does not already contain the exact brand artwork.
- On narrow screens, crop/reposition decorative objects while keeping the headline and primary action visible; never let an illustration hide form fields or navigation.
- Use the supplied key visual as an image asset only when its composition suits the container. Do not stretch a square asset into a wide hero; use `object-fit: cover` only with an intentional focal position.

## Suggested token starting point

Use tokens in the existing CSS system or verified Tailwind configuration, adapting names to project conventions:

```css
:root {
  --brand-gold: #eea53b;
  --brand-turquoise: #52bcbf;
  --brand-blue: #335797;
  --brand-purple: #72327e;
  --brand-magenta: #b12069;
  --brand-pink: #ce337f;
  --brand-rose: #d44a89;
  --brand-red: #d52841;
  --ink: #211832;
  --paper: #fffdf8;
  --outline: #72327e;
}
```

Do not treat `--ink`, `--paper`, outline width, radii, or shadows as verified brand tokens; choose them to preserve contrast and document any estimate. A useful starting rhythm is 4/8px spacing increments, 1–2px UI borders, 3–6px expressive outlines, and small-to-medium radii unless the supplied asset calls for a hard-edged plane.
