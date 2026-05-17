# TradingView Alert Setup

The Pine script (`malaysian_strategy.pine`) declares these `alertcondition`s
you can attach to your chart and route to the webhook:

- `★ HIGH BUY Signal`
- `★ HIGH SELL Signal`
- `● MED BUY Signal`
- `● MED SELL Signal`
- `○ LOW BUY Signal`
- `○ LOW SELL Signal`
- `⏸ Accumulation Started`
- `▶ Accumulation Ended`

For each alert you set up, use one of the message templates below. The
dashboard's alert feed parses these JSON fields and displays them with
color-coded tier badges.

---

## Webhook URL (use the same for every alert)

```
https://YOUR-WORKER.workers.dev/webhook?secret=YOUR_SECRET
```

Replace `YOUR-WORKER.workers.dev` and `YOUR_SECRET` with the values from
your Cloudflare deployment.

---

## Message templates

Paste these into the **Message** field when creating each alert. The
`{{...}}` placeholders are TradingView's built-in variables — they get
replaced with real values when the alert fires.

### ★ HIGH BUY

```json
{
  "symbol": "{{ticker}}",
  "tier": "HIGH",
  "direction": "BUY",
  "strategy": "SNRC1+LS",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ★ HIGH SELL

```json
{
  "symbol": "{{ticker}}",
  "tier": "HIGH",
  "direction": "SELL",
  "strategy": "SNRC1+LS",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ● MED BUY

```json
{
  "symbol": "{{ticker}}",
  "tier": "MED",
  "direction": "BUY",
  "strategy": "SNRC1/QMR/QMC/DOM",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ● MED SELL

```json
{
  "symbol": "{{ticker}}",
  "tier": "MED",
  "direction": "SELL",
  "strategy": "SNRC1/QMR/QMC/DOM",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ○ LOW BUY (counter-trend)

```json
{
  "symbol": "{{ticker}}",
  "tier": "LOW",
  "direction": "BUY",
  "strategy": "SNRC2/SRR",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ○ LOW SELL (counter-trend)

```json
{
  "symbol": "{{ticker}}",
  "tier": "LOW",
  "direction": "SELL",
  "strategy": "SNRC2/RSS",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "exchange": "{{exchange}}",
  "time": "{{timenow}}"
}
```

### ⏸ Accumulation Started

```json
{
  "symbol": "{{ticker}}",
  "tier": "ACC",
  "direction": "STAND_ASIDE",
  "strategy": "Accumulating",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "time": "{{timenow}}"
}
```

### ▶ Accumulation Ended

```json
{
  "symbol": "{{ticker}}",
  "tier": "INFO",
  "direction": "RESUMING",
  "strategy": "Accumulation ended",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "time": "{{timenow}}"
}
```

---

## TradingView placeholders cheat-sheet

| Placeholder | What it becomes |
| --- | --- |
| `{{ticker}}` | The symbol (e.g. `XAUUSD`) |
| `{{exchange}}` | The exchange (e.g. `OANDA`) |
| `{{close}}` | Latest close price |
| `{{high}}`, `{{low}}`, `{{open}}` | Bar OHLC |
| `{{volume}}` | Bar volume |
| `{{interval}}` | Timeframe (e.g. `15`, `60`, `240`) |
| `{{time}}` | Bar time (ISO) |
| `{{timenow}}` | Alert fire time (ISO) |
| `{{plot("name")}}` | Custom plot value from your Pine script |

Full reference:
https://www.tradingview.com/support/solutions/43000531021/

---

## Reduce noise — one alert per chart per timeframe

If you put the same Pine script on 5 symbols × 5 timeframes = 25 charts,
you'll get a flood of alerts. Recommended approach:

1. Create alerts only on the timeframes you actually act on (probably 1H
   and 4H for entries, 15m for confirmation).
2. Use `Once Per Bar Close` (not `Once Per Bar`) so you don't fire mid-bar.
3. Start with just `HIGH BUY` and `HIGH SELL` — those are the rare,
   high-quality setups.

You can always add more alerts later once you see the firing frequency.

---

## Free vs. paid TradingView

| Plan | Webhooks | Alerts/chart | Notes |
| --- | --- | --- | --- |
| **Free** | ❌ | 1 | Webhooks disabled |
| **Essential** ($15/mo) | ✅ | 20 | Minimum for this setup |
| **Plus** ($30/mo) | ✅ | 100 | If you trade many symbols |
| **Premium** ($60/mo) | ✅ | 400 | Overkill for one trader |

The free plan still works for *seeing* alerts inside TradingView, but
without webhooks the dashboard's alert feed will stay empty. Everything
else on the dashboard (live charts, signal matrix, countdown timers,
4-step checklist) works regardless.
