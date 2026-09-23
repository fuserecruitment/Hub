# Deploying the AI proxy worker

Same role as `top-talent-proxy` plays for Top Talent Planner: it sits between
the static site (`index.html`, on GitHub Pages) and the Power Automate flow,
holding the flow's signed HTTP-trigger URL (the one with `sig=...` in it) as
a secret so it never has to be committed to this public repo.

## One-time setup — dashboard (no installs needed)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Workers** → give it the name `bullhorn-category-proxy` → **Deploy** (the default "Hello World" is fine, you'll replace it next).
2. Open the new Worker → **Edit code** (Quick Edit) → replace the whole file with the contents of `src/index.js` in this folder → **Deploy**.
3. Back on the Worker's page → **Settings** → **Variables and Secrets** → **Add** → name `POWER_AUTOMATE_AI_URL`, type **Secret**, paste the flow's HTTP-trigger URL (the one with `sig=...` in it) as the value → **Deploy**.
4. Your worker's URL is shown at the top of the Worker's page — should be
   `https://bullhorn-category-proxy.marketing-1b3.workers.dev` (same
   `workers.dev` subdomain as `top-talent-proxy`, since it's the same
   Cloudflare account).

## One-time setup — Wrangler CLI (alternative, needs Node.js)

1. Install Wrangler:
   ```
   npm install -g wrangler
   ```
2. From this `worker/` folder, log in to your Cloudflare account:
   ```
   wrangler login
   ```
3. Set the flow's HTTP-trigger URL as a Worker secret (paste the full URL,
   including its `sig=` signature, when prompted — Cloudflare stores it
   encrypted, it's never written to a file here):
   ```
   wrangler secret put POWER_AUTOMATE_AI_URL
   ```
4. Deploy:
   ```
   wrangler deploy
   ```

## Wire it up to the frontend

Open `../index.html`, find `const FLOW_URL = ...` near the top of the
`<script>` block, and set it to your worker's URL plus the route:

```js
const FLOW_URL = 'https://bullhorn-category-proxy.marketing-1b3.workers.dev/api/categorise';
```

Commit and push — GitHub Pages picks it up automatically. This URL has no
secret in it, so it's safe to commit.

## Redeploying after a code change

```
wrangler deploy
```

## Rotating the Power Automate signature later

When you regenerate the flow's trigger URL/signature after training, just
re-run step 3 above with the new URL — nothing on the frontend needs to
change, since the browser only ever talks to the worker's stable URL.

## CORS

The worker only allows requests from `https://fuserecruitment.github.io`
(see `ALLOWED_ORIGIN` in `src/index.js`). If you need to test from a local
dev server, temporarily add your `http://localhost:PORT` origin there.
