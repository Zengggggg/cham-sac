# WebAR flow reference

Source: `Hướng dẫn sử dụng chức năng AR.docx`, backend `arModel`/`heritageSite` models, and the project frontend rules.

## User journey

The documented flow is:

1. Visit the website on a phone.
2. Choose “Trải nghiệm AR” or a landmark.
3. Choose “Bắt đầu AR” and grant browser camera permission.
4. Point the camera at the matching landmark image on a card/document; keep the phone stable and lighting sufficient.
5. When recognized, show the 3D model.
6. Provide rotate, zoom, and pinch/scale controls as supported by the chosen AR implementation.
7. Expose an info/question control beside the model to read heritage content, then allow returning to another landmark.

The user does not need to log in. Button names may change during final UI design, but the intent and fallbacks must remain.

## Required states

Model AR as explicit states rather than one boolean:

`idle → requesting-permission → permission-denied | unsupported → scanning → target-not-found → target-found/loading-model → ready → model-error`.

For each state, provide a short Vietnamese explanation and the next safe action. Do not leave a black camera surface, spinner, or blank model canvas without context. If the camera is denied or unsupported, offer a useful non-camera heritage/landmark page or the documented fallback.

## Data and privacy invariants

- Image tracking is not QR scanning, plane placement, or surface mapping.
- Keep camera frames/video on-device; do not send them to API endpoints.
- Map one recognized `target_index` to one active heritage site/AR model. Do not guess a landmark from arbitrary image similarity in UI code.
- A public experience should use only published/active content and a valid HTTPS `.glb` URL. Handle missing, invalid, unpublished, or failed model assets safely.
- Load a poster/thumbnail first where available, then show model loading progress or feedback.
- Pause/stop tracks and clean up listeners when leaving the AR route or when permission/session ends.
- Preserve orientation and accessible controls; offer a text/info path so the heritage content is not available only through a 3D interaction.
