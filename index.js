/**
 * MalaysianTrade — TradingView Alerts Webhook Receiver
 *
 * Cloudflare Worker that:
 *   1. POST /webhook        ← receives alerts from TradingView
 *   2. GET  /alerts         ← serves recent alerts to the dashboard
 *   3. DELETE /alerts       ← clears all alerts (dashboard button)
 *   4. GET  /               ← health check
 *
 * Auth: a shared secret in the webhook URL prevents anyone else
 *       from spamming your endpoint. You set it in wrangler.toml
 *       as the WEBHOOK_SECRET binding.
 *
 * Storage: Cloudflare KV (free tier: 100k reads/day, 1k writes/day —
 *          plenty for an alert feed). Keeps the last 200 alerts.
 */

const MAX_ALERTS = 200;
const ALERTS_KEY = 'alerts:recent';

// CORS — allow dashboard to fetch from anywhere (GitHub Pages, localhost, etc.)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra },
  });
}

async function getAlerts(env) {
  const raw = await env.ALERTS.get(ALERTS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveAlerts(env, alerts) {
  await env.ALERTS.put(ALERTS_KEY, JSON.stringify(alerts));
}

// Parse the alert body — TradingView can send JSON or plain text.
// We try JSON first; if it fails, store as plain text in `message`.
function parseAlert(text) {
  text = (text || '').trim();
  if (!text) return null;

  try {
    const obj = JSON.parse(text);
    return {
      id: crypto.randomUUID(),
      received_at: new Date().toISOString(),
      ...obj,
    };
  } catch {
    return {
      id: crypto.randomUUID(),
      received_at: new Date().toISOString(),
      message: text,
    };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ─── HEALTH CHECK ──────────────────────────────────────
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        ok: true,
        service: 'malaysiantrade-webhooks',
        endpoints: {
          'POST /webhook?secret=...': 'receive a TradingView alert',
          'GET  /alerts':              'list recent alerts',
          'DELETE /alerts':            'clear all alerts',
        },
      });
    }

    // ─── WEBHOOK RECEIVER ──────────────────────────────────
    if (url.pathname === '/webhook' && method === 'POST') {
      // Verify shared secret — TradingView appends ?secret=YOUR_SECRET
      const providedSecret = url.searchParams.get('secret');
      if (!env.WEBHOOK_SECRET || providedSecret !== env.WEBHOOK_SECRET) {
        return json({ error: 'invalid or missing secret' }, 401);
      }

      const bodyText = await request.text();
      const alert = parseAlert(bodyText);
      if (!alert) {
        return json({ error: 'empty body' }, 400);
      }

      // Append, cap at MAX_ALERTS, save
      const alerts = await getAlerts(env);
      alerts.unshift(alert);
      if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;
      await saveAlerts(env, alerts);

      return json({ ok: true, id: alert.id });
    }

    // ─── LIST ALERTS ───────────────────────────────────────
    if (url.pathname === '/alerts' && method === 'GET') {
      const alerts = await getAlerts(env);
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      return json({ count: alerts.length, alerts: alerts.slice(0, limit) });
    }

    // ─── CLEAR ALERTS ──────────────────────────────────────
    if (url.pathname === '/alerts' && method === 'DELETE') {
      // Optional: require secret here too if you want
      const providedSecret = url.searchParams.get('secret');
      if (env.WEBHOOK_SECRET && providedSecret !== env.WEBHOOK_SECRET) {
        return json({ error: 'invalid secret' }, 401);
      }
      await saveAlerts(env, []);
      return json({ ok: true, cleared: true });
    }

    return json({ error: 'not found' }, 404);
  },
};
