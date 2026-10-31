# Direction, ruled 2026-10-31

**Joshua, verbatim:** *"i personally like the memphis you showed because of the colours. i don't like the morphisms.
i'm bored of the rounded pills…"*

Board he judged: `docs/design/renditions-2026-10-31.html` (Neobrutalist, Neomorphism, Glassmorphism, Memphis; area
page and spot page each, 390×780, same copy). Also on the private canvas sent the same day.

## What the ruling takes
- **Memphis's colours**, given a job: one fill per kind of place. Yellow `#F7C948` libraries (and the active filter),
  pink `#F28DB2` malls and shopping complexes, teal `#5BC8C2` cafés, white for anything else.
- Memphis's other marks: the dotted tray behind the list, the circle-triangle-squiggle shapes above the hero, the
  filled band on a spot page.
- Ink borders and hard offset shadows stay (the Memphis rendition already had them).

## What the ruling drops
- **Rounded pills**, everywhere: filter chips, fact chips, status chips, buttons. Every corner is square (`--radius: 0`).
- **Both morphisms**: no shadow-only edges, no translucency, no blur.

## The constraint the colours bring (computed 2026-10-30, enforced by `scripts/verify.mjs`)
Every word on a fill is ink. Muted grey and blue fail on the fills: muted on yellow 4.49, on pink 3.09, on teal 3.51;
blue on pink 3.77, on teal 4.29. So status colours sit on white chips, links never sit on a fill, and the kind line on a
card is ink. The verifier computes the contrast of every visible text node against its real background on every page.

## Honest risk carried from the board
Pattern noise competes with the facts, and the fills could be read as status. The fills mean kind of place only; the
kind is also printed on every card, so colour is never the only signal.
