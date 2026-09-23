/* Cloudflare Worker: proxies the categorisation tool's AI lookup to a
   Power Automate flow, same role top-talent-proxy plays for Top Talent
   Planner — keeps the flow's signed HTTP-trigger URL (with its sig=
   token) out of the public GitHub Pages frontend entirely.

   Set the flow URL as a secret (never commit it):
     wrangler secret put POWER_AUTOMATE_AI_URL

   See ../DEPLOY.md for the full setup. */

const ALLOWED_ORIGIN = 'https://fuserecruitment.github.io';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/categorise' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.POWER_AUTOMATE_AI_URL) {
      return json({ error: 'Worker is missing the POWER_AUTOMATE_AI_URL secret' }, 500);
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }

    let flowResponse;
    try {
      flowResponse = await fetch(env.POWER_AUTOMATE_AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch {
      return json({ error: 'Failed to reach the Power Automate flow' }, 502);
    }

    if (!flowResponse.ok) {
      return json({ error: 'Flow returned ' + flowResponse.status }, 502);
    }

    // Pass the flow's response straight through — it already returns
    // { "reply": "..." } per AI_LOOKUP_BUILD_SPEC.md.
    const data = await flowResponse.text();
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  },
};
