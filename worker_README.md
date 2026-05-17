# MalaysianTrade Webhook Receiver

A tiny Cloudflare Worker (~150 lines) that:

- Receives TradingView alert webhooks at `POST /webhook?secret=...`
- Stores the last 200 alerts in Cloudflare KV
- Serves them to the dashboard at `GET /alerts`

**Cost: $0.** Cloudflare's free tier covers 100,000 requests/day on Workers
and 100,000 reads + 1,000 writes/day on KV — orders of magnitude more than
any trading dashboard needs.

---

## Deployment (one-time, ~10 minutes)

### 1. Install Wrangler (Cloudflare's CLI)

```bash
npm install -g wrangler
```

If you don't have Node.js, install it from [nodejs.org](https://nodejs.org)
first.

### 2. Sign in to Cloudflare

```bash
wrangler login
```

Opens a browser, asks you to authorize. If you don't have a Cloudflare
account, sign up free at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
— no credit card needed.

### 3. Create the KV namespace (alert storage)

```bash
cd worker
wrangler kv namespace create ALERTS
```

You'll see output like:

```
🌀 Creating namespace with title "malaysiantrade-webhooks-ALERTS"
✨ Success!
[[kv_namespaces]]
binding = "ALERTS"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

**Copy the `id` value.** Open `wrangler.toml` in this folder and replace
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID` with that id.

### 4. Set your webhook secret

This is what authorizes incoming alerts — only requests with the correct
secret in the URL will be accepted. Pick something long and random:

```bash
wrangler secret put WEBHOOK_SECRET
```

When prompted, paste something like: `mtrade_a8f7d9e2b4c6h1j3k5l7m9n2p4q6r8s0`
(any long random string — make one at [random.org](https://www.random.org/strings/)
or just mash the keyboard). **Save this — you'll paste it into TradingView too.**

### 5. Deploy

```bash
wrangler deploy
```

You'll get a URL like:

```
https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev
```

**That's your webhook receiver.** Save the URL — both TradingView and the
dashboard need it.

### 6. Test it

```bash
# Health check
curl https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev/

# Should return: {"ok":true,"service":"malaysiantrade-webhooks",...}

# Simulate an alert (replace SECRET with what you set)
curl -X POST "https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev/webhook?secret=SECRET" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"XAUUSD","tier":"HIGH","direction":"BUY","price":4715.42,"strategy":"SNRC1+LS"}'

# Fetch alerts
curl https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev/alerts
```

If the test alert shows up, you're done with the backend.

---

## Configure the dashboard

Open `index.html` in this repo and find this line near the top of the
`<script>` block:

```js
const WEBHOOK_BASE = '';  // ← paste your worker URL here
```

Paste your Worker URL (no trailing slash, no `/webhook` or `/alerts`):

```js
const WEBHOOK_BASE = 'https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev';
```

Commit, push, GitHub Pages redeploys, and your dashboard now polls
that URL every 10 seconds for new alerts.

---

## Configure TradingView alerts

Webhook alerts require a **paid TradingView plan** (Essential and up,
~$15/mo). On the free plan, alerts work but webhook delivery is disabled.

For each Pine `alertcondition` in `malaysian_strategy.pine`:

1. On your chart, click the **alarm clock icon** (top toolbar) → **Create Alert**
2. **Condition**: `Malaysian Strategy [SNR + Setups]` → pick the alert
   (e.g. `★ HIGH BUY Signal`)
3. **Notifications** tab → **Webhook URL** (toggle on):

   ```
   https://malaysiantrade-webhooks.YOUR-SUBDOMAIN.workers.dev/webhook?secret=YOUR_SECRET
   ```

4. **Message** field — paste JSON so the dashboard can parse it:

   ```json
   {
     "symbol": "{{ticker}}",
     "tier": "HIGH",
     "direction": "BUY",
     "strategy": "SNRC1+LS",
     "price": {{close}},
     "timeframe": "{{interval}}",
     "time": "{{timenow}}"
   }
   ```

   TradingView replaces `{{ticker}}`, `{{close}}`, etc. at fire time.

5. **Create**.

Repeat for the other alert conditions (`HIGH SELL`, `MED BUY`, `MED SELL`,
etc.) — change the `tier` and `direction` fields in the message accordingly.

There's a full list of alert templates in [`../docs/ALERTS.md`](../docs/ALERTS.md).

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `curl` test returns `401 invalid secret` | Secret in URL doesn't match the one you `wrangler secret put`. Re-run step 4. |
| TradingView says "webhook failed" | Your URL is wrong, or you're on the free plan (webhooks disabled). Check Cloudflare dashboard → Workers → Logs. |
| Alerts show on Worker `/alerts` endpoint but not on dashboard | `WEBHOOK_BASE` in `index.html` is empty or wrong. Check browser console. |
| KV namespace ID error on deploy | Forgot step 3, or didn't paste the id into `wrangler.toml`. |

For Worker logs in real time:

```bash
wrangler tail
```

---

## Updating the worker later

After edits to `index.js`:

```bash
wrangler deploy
```

Takes about 5 seconds.
