# studyspots v0 — plan

> Reconstructed 2026-10-30; the earlier plan was never pushed. One commit per task.

| Task | Produces | Done when |
|---|---|---|
| 0 Scaffold | `package.json`, `src/styles/tokens.css`, `design-tokens.manifest.json`, `scripts/check-tokens.mjs`, Public Sans woff2 under `src/fonts/` with its OFL | `npm run check` prints `clean` |
| 1 Seed | `data/spots.json` for Bugis / City Hall, every fact sourced and dated, sockets never counted | `node scripts/validate-seed.mjs` passes; every spot has ≥1 source |
| 2 Site | `scripts/build.mjs`, `src/templates/*`, `src/styles/site.css`, `dist/` with `/`, the area page, one page per spot, sitemap, robots, 404 | builds with no new colour or size outside tokens; copy self-check logged in `docs/copy-check.md` |
| 3 Suggestions | `functions/api/suggestions/[spot].js`, `wrangler.toml`, the form + `src/js/suggest.js` | `wrangler pages dev` round-trip: POST then GET returns the text; page shows it |
| 4 Verify | `scripts/verify.mjs` (Playwright, 390 wide): no horizontal scroll, footer on every page, 7 Bugis / City Hall spots listed, suggestion appears | script exits 0 and writes `docs/verify/*.png` |
| 5 Deploy | `wrangler pages project create studyspots` + `kv namespace create SUGGESTIONS` + `wrangler pages deploy dist` | `https://studyspots.pages.dev` serves the area page; needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment |
| 6 DNS | the CNAME records for `studyspots.org` and `www` | handed to Joshua as the last step |

Order of work when the Cloudflare credentials are absent: 0 → 1 → 2 → 3 → 4, with 3 and 4 verified against
`wrangler pages dev` locally; 5 and 6 are documented in `docs/DEPLOY.md` and run the moment the token exists.
