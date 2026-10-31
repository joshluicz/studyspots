# studyspots v0 — brief

> **Reconstructed 2026-10-30.** The original `docs/HANDOFF-2026-10-31.md`, `docs/BRIEF.md`, `PRODUCT.md`, the spec, the plan and
> `docs/design/stage1b-neobrutalist.html` were written in an earlier session and never pushed; they are on no branch of
> `joshluicz/studyspots`. This file is rebuilt from Joshua's instructions of 30 Oct 2026 and the rules he gave as settled.
> Where a line is an assumption rather than his words, it says so.

## The visitor
A student in Singapore, on a phone, standing near Bugis or City Hall MRT with a laptop bag, deciding where to sit for the next
three hours. They have been burned before: a café with two sockets for forty seats, a library level that turned out to be
reference only, a mall atrium that closed at nine.

## The one question they arrive with
"Where near here can I sit and work, and will I get a socket?"

## The single action the page must produce
Open one spot and leave with an answer they trust, then, if they learned something there, tell the next person (a suggestion
on the spot page).

## Hard constraints (Joshua, 30 Oct 2026, his words where quoted)
- "no invented socket counts" — a socket count appears only when a person reported it; the seed carries a status
  (reported / not reported yet), never a number of our own.
- "free tier only" — Cloudflare Pages, Pages Functions and KV, all inside the free plan; nothing metered.
- "no accounts, no rewards" — nothing to sign up for, no points, badges, streaks or leaderboards.
- "one hand-editable data file" — `data/spots.json` is the whole seed; a person with a text editor can add a spot.
- footer "Built by Eitri Brokkr" — the one-line credit linking to eitribrokkr.com, on every page.
- "copy written against Corey Haines' marketingskills" — `copywriting` and `copy-editing` from
  `coreyhaines31/marketingskills` (cloned at build time, commit `820ad2c`), self-check run on every visible word.
- Public Sans, 390×780 as the design viewport, phone first.
- Locked tokens: paper `#F6F1EA`, blue `#1740B6` for actions only, numbers in ink, the status colours.
- Ship to `studyspots.pages.dev` first; `studyspots.org` DNS is at another registrar and gets CNAME records last.

## Done when (his words)
"it is live, works on my phone, Bugis / City Hall is filled from the seed, and a suggestion I submit shows up on the spot."

## May not be shown
- A socket count, a seat count or an opening hour that no source on record states.
- A rating, a ranking, a "top 10", a "best" of anything.
- Anything that implies the operator endorses the listing.
- A photo where a person is the subject or recognisable up close; an operator's own marketing images; a logo other than
  as it stands on the building in a photo. (Joshua asked for photos of each place on 31 Oct: they are freely licensed,
  from Wikimedia Commons, credited with author, date and licence where they appear.)
- A login, a signup, a points balance, an ad.

## Facts about the reader instead of adjectives
- They read standing up, one thumb, 390 pixels wide, often in sunlight.
- They scan for the socket line before the name.
- They distrust a page that claims to know more than it can.
- They will share a screenshot on Telegram if it saves a friend a trip.

## What this is for the agency
The off-niche free tool under rule 2 of the tools programme: its own domain, a one-line footer credit, a live example of a
site built for free. It is not a search strategy on its own and it earns no hours beyond the build.
