# studyspots

Where to sit and study near Singapore's MRT stations, with what is known about sockets, Wi-Fi, noise
and hours, and what people add. Starting with Bugis / City Hall.

- `data/spots.json` is the whole seed and the only data file. Edit it by hand; every fact carries its source and date.
  Socket counts are never typed in here: a socket fact exists only when a person or the operator reported it.
- `npm run check` verifies the colour tokens (every pair clears WCAG 2.1, every token has a use).
- `npm run seed:validate` fails on a fact without a source or on a socket count.
- `npm run build` renders `dist/` with no framework. `npm run dev` serves it with the suggestions function on a local KV.
- `npm run verify` walks the site at phone width (add `BASE_URL=http://127.0.0.1:8788 ... --api` for the suggestion round trip).
- `npm run deploy` ships to Cloudflare Pages. See `docs/DEPLOY.md`.

Design: `docs/BRIEF.md`, `docs/superpowers/specs/`, `docs/design/renditions-2026-10-31.html` (four renditions of
two screens, contrast computed). Tokens: `src/styles/tokens.css`.

Built by [Eitri Brokkr](https://eitribrokkr.com).
