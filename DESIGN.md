# 12books Design System

## Direction
A modern reading app with clear navigation, compact hierarchy and purposeful whitespace. White surfaces and a restrained green accent. No serif type, oversized slogans, invented reader feeds or fabricated engagement.

## Typography and color
- Wanted Sans Variable, with native Korean sans-serif fallbacks.
- Page titles 26px / 650, mobile 23px. Section titles 16–18px / 650. Body 14–15px with 1.6–1.7 line height; metadata 12–13px.
- Canvas #fafbf9; surface #ffffff; ink #202a25; muted #727c75; borders #e8ece7.
- Accent #35735a, hover #285c47. Pastels are reserved for search topic illustrations.

## Layout
- Sidebar 224px, tablet rail 80px, mobile bottom navigation and 60px header.
- Main content max 1160px including 40px gutters. Primary content plus 240px context rail; single column below 960px.
- Cards 12px radius, controls 8px, book covers 4px. Buttons 36–44px high.
- Library uses a responsive 4/3/2-column grid, title/author/status beneath each book.
- Reduced motion is respected; focus indicators and keyboard-operable dialogs are required.

## Product behavior
- Search renders before sign-in, requests authentication when a visitor starts searching. Results come from the existing authenticated book-search API.
- Topic buttons are fixed search keywords, NOT a genre API or a curated list of books. Their label must explain keyword search.
- Recent searches stay in sessionStorage, are removable, and are optional.
- Book illustrations are decorative geometric art, not real book covers or user records.
- Home: visitors see a short product introduction; members see current reading with direct page editing, then the following timeline and an explore list below it.
- Feed: posts flow as a quiet list, not tiles. Author, book, page range, then the words. Spoilers stay covered until tapped, because the server sends the text and lets the screen decide.
- Library: status filters, loaded-book count, cover grid, loading/error/retry/empty states.
- Profile: identity and book grid, with no invented followers or global statistics from partial pagination.
- Posts and follows exist in the backend (Phase 4-5). Likes and comments do not; their counts are read-only until Phase 6 ships the actions.
- Every /api/v1 route except auth needs a session, so visitors cannot be shown real activity — and invented activity must never stand in for it.

## Validation
Lint, TypeScript and production build. Browser checks at desktop and mobile sizes. Authenticated UI flows can be checked with isolated in-browser fixtures; this does not verify a live backend and fixtures must never enter application code or the database.
