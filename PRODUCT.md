# studyspots

> Reconstructed 2026-10-30 from Joshua's 30 Oct instructions; the earlier PRODUCT.md was never pushed. See `docs/BRIEF.md`.

**One line.** A page per study spot around Singapore's MRT stations that says, honestly, what is known about sockets,
Wi-Fi, noise and hours, and lets whoever is sitting there now add what they learned.

## v0 scope
- One area: **Bugis / City Hall**. One area page, one page per spot, one home page that points at the area.
- Data: `data/spots.json`, hand-editable, the only seed. Each fact carries where it came from and when it was checked.
- Suggestions: a free-text box on every spot page. Sent to a Pages Function, stored in KV under the spot, rendered back on
  the spot page on the next load and shown immediately to the person who sent it. No account, no moderation queue in v0;
  length limit, honeypot, per-IP rate limit, and a `/api/suggestions/<spot>` GET so the list is readable.
- Hosting: Cloudflare Pages (free), Pages Functions (free), KV (free). Nothing else.
- Credit: footer "Built by Eitri Brokkr" on every page.

## What v0 does not do
Accounts, rewards, ratings, photos, maps, search, more than one area, moderation UI, analytics beyond Cloudflare's own.

## Data model (`data/spots.json`)
```
{
  "areas": [ { "slug": "bugis-city-hall", "name": "Bugis / City Hall", "stations": ["Bugis", "City Hall"], "intro": "..." } ],
  "spots": [ {
      "slug": "national-library-building", "area": "bugis-city-hall",
      "name": "National Library Building", "kind": "Public library", "address": "100 Victoria Street, Singapore 188064",
      "hours": { "text": "...", "source": "https://...", "checked": "2026-10-30" },
      "facts": {
        "sockets": { "status": "reported" | "unknown", "value": "plenty" | "some" | "few" | "none" | null, "reports": 1, "source": "..." },
        "wifi":    { "status": ..., "value": "yes" | "no" | null, ... },
        "noise":   { "status": ..., "value": "quiet" | "medium" | "noisy" | null, ... },
        "food":    { "status": ..., "value": "allowed" | "not allowed" | null, ... }
      },
      "notes": ["verbatim line from the operator's page, with its source"],
      "sources": [ { "url": "...", "checked": "2026-10-30", "says": "..." } ]
  } ]
}
```
Rules: a `value` exists only when `status` is `reported` and `source` names who reported it. `reports` is a count of
sources, never an estimate. A socket **count** is never a field.

## Build
`node scripts/build.mjs` renders `dist/` from the seed and the templates in `src/`. No framework, no bundler.
`npm run check` runs the token gate; `npm run verify` builds, serves and walks the three pages at 390 wide.

## Measured at 60 days (tools programme rule 3)
Referring domains, Cloudflare Analytics visits, and the suggestion count (whether a stranger used it).
