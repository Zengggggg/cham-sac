# Product map and repository truth

## Planning map from `api_function.pdf`

The API function document describes planned FE surfaces across Auth, Common, Shop, QnA, Admin, AR, and Legal. Planned FE routes include `/login`, `/register`, `/confirm`, `/forgot-password`, `/home`, `/about-us`, `/contact-us`, `/shop`, `/shop/:id`, `/cart`, `/checkout`, `/payment/:orderId`, `/profile/orders`, `/questions`, `/questions/:id`, `/profile/questions`, `/profile/questions/create`, `/profile/questions/:id/edit`, `/landmarks`, `/landmarks/:id`, `/ar/:landmarkId`, `/ar/:landmarkId/model`, `/admin/*`, `/terms-of-service`, and `/privacy-policy`.

Treat this as a product planning map, not proof that every backend endpoint exists. Before wiring any of these surfaces, verify the real route/controller/service/model/Swagger implementation. The current backend route registration exposes `/chamsacviet/status` and `/chamsacviet/auth/*`; the rest may require a later integration task.

## Product areas

- Auth: login, registration, email OTP verification, resend verification OTP, refresh token, logout, current user, Google login/link.
- Common: home, about, contact, shared sidebar/header/footer.
- Shop: active product listing/detail, cart, checkout, order/payment, order history.
- QnA: heritage questions and personal question sets.
- Admin: contacts, dashboard, products, orders, users, posts/game rules, 3D models, questions.
- AR: landmark discovery, camera/image tracking, 3D model interaction, heritage content.
- Legal/profile: terms, privacy, profile and edit profile.

## Backend models that constrain UI data

`Product`: name, description, non-negative integer VND price, non-negative integer stock, images, status `active|inactive|sold_out`.

`HeritageSite`: name, shortDescription, content, HTTPS targetImageUrl.

`ArModel`: one per heritage site, HTTPS `.glb` model3dUrl, positive defaultScale, vector position/rotation, optional HTTPS thumbnail, status `draft|published|hidden|deleted`.

`GameRule`: one per product, title, summary, content, optional coverImageUrl.

`Order`: customer and shipping address, non-empty items, non-negative integer money values, payment status `unpaid|paid|refunded`, order status `pending|confirmed|shipping|done|cancelled`.

Do not display inactive/sold-out/draft/hidden/deleted public content as available. Treat these enums as UI state inputs, not arbitrary labels.
