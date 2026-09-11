# 12books Design System

## Direction
A modern reading app with clear navigation, compact hierarchy and purposeful whitespace. White surfaces and a restrained green accent. No serif type, oversized slogans, invented reader feeds or fabricated engagement.

## Typography and color
- Wanted Sans Variable, with native Korean sans-serif fallbacks.
- Page titles 26px / 650, mobile 23px. Section titles 16–18px / 650. Body 14–15px with 1.6–1.7 line height; metadata 12–13px.
- Canvas and surface #ffffff; ink #242424; muted #737373; borders #e9e9e9. Navigation uses neutral ink; shared primary buttons use charcoal.
- Accent #35735a, hover #285c47. Discovery topics use paper-colored surfaces and muted green line art.

## Layout
- Desktop sidebar rests at 80px and expands to 224px on hover or keyboard focus without moving content. Menu items sit at the vertical center; the account avatar remains visible at the bottom. Mobile uses bottom navigation and a 60px header.
- Shared main content max 760px including 40px gutters. No global breadcrumb bar. Home and following use a compact feed switcher.
- Cards 12px radius, buttons 6px, book covers 4px. Buttons 36–44px high.
- Library uses a responsive 4/3/2-column grid, title/author/status beneath each book.
- Reduced motion is respected; focus indicators and keyboard-operable dialogs are required.

## Product behavior
- Search renders before sign-in, requests authentication when a visitor starts searching. Results come from the existing authenticated book-search API.
- Topic buttons are fixed search keywords, NOT a genre API or a curated list of books. Their label must explain keyword search.
- Recent searches stay in sessionStorage, are removable, and are optional.
- Book illustrations are decorative geometric art, not real book covers or user records.
- Home: visitors see a short introduction; members see the discovery feed. Following is a separate feed. Desktop recording starts from the sidebar; mobile recording starts from the header.
- Feed: author and reading range, then the reflection, then a compact linked book summary. Prose is 17px desktop / 16px mobile with 1.8 line height. Long reflections can expand beyond seven lines. Spoiler content is not rendered until explicitly revealed; it can be hidden again. Avoid fabricated interaction buttons; existing counts remain read-only.
- Library: status filters, loaded-book count, cover grid, loading/error/retry/empty states.
- Profile: identity and book grid, with no invented followers or global statistics from partial pagination.
- Posts and follows exist in the backend (Phase 4-5). Likes and comments do not; their counts are read-only until Phase 6 ships the actions.
- Every /api/v1 route except auth needs a session, so visitors cannot be shown real activity — and invented activity must never stand in for it.

## Validation
Lint, TypeScript and production build. Browser checks at desktop and mobile sizes. Authenticated UI flows can be checked with isolated in-browser fixtures; this does not verify a live backend and fixtures must never enter application code or the database.
