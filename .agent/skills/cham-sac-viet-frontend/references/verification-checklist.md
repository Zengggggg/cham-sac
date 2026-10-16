# Verification checklist

Run the checks supported by the repository and record the result.

## Static checks

- Frontend lint passes: `npm run lint` from `frontend/`.
- Production build passes: `npm run build` from `frontend/`.
- Backend/API tests and lint pass when frontend changes touch contracts.
- No secrets, debug-only mock data, or accidental generated files are included.

## Browser checks

- The primary route loads without console errors.
- Navigation, forms, API requests, and documented AR entry points behave as specified.
- Loading, empty, validation, unauthorized, server-error, retry, success, and disabled states are understandable.
- Keyboard-only navigation reaches all controls; focus is visible; dialogs can be dismissed.
- Check narrow mobile, tablet, and desktop widths for overflow, clipped artwork, unreadable text, and broken layering.
- Check reduced-motion behavior if animation was added.

## Design review

- Brand fonts load from repository assets and fallbacks are intentional.
- Palette tokens are used consistently and contrast is acceptable.
- Logos and artwork keep their aspect ratios.
- Decorative composition supports rather than hides the content hierarchy.
- The result feels like a coherent Chạm Sắc Việt interface rather than a generic SaaS template or a poster transplanted into a webpage.
