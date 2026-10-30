# Deploying studyspots (Cloudflare Pages, free tier)

Two ways to get `studyspots.pages.dev` live. Both are free. Pick one.

## A. From a Claude session or your laptop with an API token (fastest)
Needs two environment variables. In a Claude cloud session they go in the environment's settings
(the cloud environment menu in the session title bar, then Edit, under Network secrets or environment
variables); on a laptop, export them in the shell.

| Variable | What it is |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard, any zone or Workers & Pages page, right sidebar |
| `CLOUDFLARE_API_TOKEN` | My Profile, API Tokens, Create Token, template "Edit Cloudflare Workers" (it covers Pages and KV) |

Then, from the repo root:
```sh
npm install
npx wrangler pages project create studyspots --production-branch main
npx wrangler kv namespace create SUGGESTIONS
#   -> prints an id. Paste it into wrangler.toml under [[kv_namespaces]] (uncomment the block).
npm run deploy
#   runs: token gate, seed gate, build, `wrangler pages deploy dist --project-name studyspots`
```
The first deploy of a branch other than `main` is a preview URL (`<hash>.studyspots.pages.dev`);
`npm run deploy -- --branch main` publishes to `studyspots.pages.dev`.

KV binding without editing the file: Workers & Pages, studyspots, Settings, Bindings, add KV namespace,
variable name `SUGGESTIONS`, pick the namespace, then redeploy once.

## B. From the dashboard, no token (Git integration)
Workers & Pages, Create, Pages, Connect to Git, pick `joshluicz/studyspots`.
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Then Settings, Bindings: KV namespace `SUGGESTIONS` (create one under Storage & Databases, KV first).

Every push to `main` deploys. Previews come from other branches.

## After it is live
1. Set `SITE_URL=https://studyspots.org` as a build environment variable once the domain is attached, so the
   canonical tags and the sitemap point at the final host (`npm run build` reads it).
2. Custom domain: Workers & Pages, studyspots, Custom domains, add `studyspots.org` and `www.studyspots.org`.
   Cloudflare then asks for the DNS records below.

## DNS at the registrar (the last step)
`studyspots.org` is registered elsewhere and its DNS is served there (today the A records point at Netlify,
which serves the 2025 site). Add these two records at the registrar:

| Type | Name | Target | Proxy / TTL |
|---|---|---|---|
| CNAME | `www` | `studyspots.pages.dev` | TTL auto or 3600 |
| CNAME | `@` (apex, `studyspots.org`) | `studyspots.pages.dev` | TTL auto or 3600 |

Two caveats:
- Many registrars refuse a CNAME at the apex. If yours does, the options are ALIAS/ANAME (if offered,
  same target), or moving the zone's nameservers to Cloudflare (free; then the apex record is added inside
  Cloudflare and Pages validates it automatically).
- Remove the old A records for `@` and `www` (the Netlify ones) at the same time, or the two will fight.
Propagation is minutes to an hour. Netlify can be switched off afterwards.

## Free tier limits that matter here
Pages: 500 builds a month, unlimited requests. Functions: 100,000 requests a day. KV: 100,000 reads and
1,000 writes a day; each suggestion is two writes (the item and the rate-limit counter), so about 500
suggestions a day before KV writes run out, which is the day to upgrade.
