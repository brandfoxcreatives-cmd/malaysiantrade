# MalaysianTrade — Live Dashboard

A multi-symbol, multi-timeframe trading dashboard that re-implements the
[Malaysian Strategy](./malaysian_strategy.pine) signal logic from Pine Script
in vanilla JavaScript, so you can monitor entries and stop-losses across
your whole watchlist in one screen — without TradingView open.

**Live demo (after GitHub Pages is enabled):**
`https://brandfoxcreatives-cmd.github.io/malaysiantrade/`

---

## What it does

For each symbol on the watchlist, across `5m / 15m / 30m / 1H / 4H`, it shows:

| Column | Meaning |
| --- | --- |
| **STRATEGY** | Which Malaysian setup is active — `SNRC1+LS`, `QMR`, `QMC`, `DOM BRK`, `SNRC2`, `SRR`, `RSS`, or `—` |
| **TIER** | `★ HIGH` / `▲ MED` / `✕ LOW` / `⏸ ACC` (accumulation) |
| **DIRECTION** | `▲ BUY` or `▼ SELL` |
| **ENTRY** | Current close when a signal is live |
| **STOP LOSS** | Computed from recent swing + 0.3 × ATR buffer |
| **RISK** | Entry minus stop, in price and % |

Plus:

- **4-step methodology checklist** (Fresh SNR → Liquidity Sweep →
  RBR/DBD pattern → HTF engulf) with live `✓` status and execution verdict
- **H1 / H4 bias** indicators
- **Multi-TF countdown timers** for next candle close
- **All-symbols summary matrix** — scan every pair × every TF at once
- **Min-confidence filter** (`HIGH ONLY` / `MEDIUM` / `ALL`)

Default watchlist: `XAUUSD`, `BTCUSD`, `OILUSD`, `NDX`. You can add any
ticker from the side panel — common aliases (`EURUSD`, `ETHUSD`, `USDJPY`,
`DXY`, `NAS100`, `SPX`) are auto-mapped to Yahoo Finance symbols.

---

## Quick start (local)

It's a single static HTML file with zero build step.

```bash
# clone
git clone https://github.com/brandfoxcreatives-cmd/malaysiantrade.git
cd malaysiantrade

# open directly
open index.html             # macOS
xdg-open index.html         # Linux
start index.html            # Windows

# or serve it locally (some browsers block CORS proxy from file://)
python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## Deploy on GitHub Pages (recommended)

After your first push:

1. Go to **Settings → Pages**
2. Under **Source**, pick **GitHub Actions**
3. The workflow in `.github/workflows/deploy.yml` will build and publish
   on every push to `main`
4. Your dashboard goes live at
   `https://brandfoxcreatives-cmd.github.io/malaysiantrade/`

That's it — no Node, no build, no env vars.

---

## How the strategy logic works

The dashboard ports the core signal hierarchy from
[`malaysian_strategy.pine`](./malaysian_strategy.pine):

**HIGH confidence** — book's "no-brainer" setups
1. `SNRC1` + engulfing + liquidity sweep at fresh SNR

**MEDIUM confidence** — good setups
1. `SNRC1` (without LS, at fresh SNR)
2. `QMR` (quasimodo reversal)
3. `QMC` (quasimodo continuation, drives ≥ 4)
4. `DOM BRK` (dominant breakout candle + engulf)

**LOW confidence** — counter-trend
1. `SNRC2`
2. `RSS` / `SRR` (broken-level retests)

Plus accumulation detection: when ATR contracts below 60% of its 50-bar
average AND price stays within a 0.5% band for 20 bars, the dashboard
flags `⏸ ACC` and suppresses signals — same logic as the Pine version.

---

## Data source & limitations

- **Data**: Yahoo Finance public OHLC, fetched through a free CORS proxy
  every 30 seconds
- **Symbol mapping**: `XAUUSD → GC=F`, `BTCUSD → BTC-USD`,
  `OILUSD → CL=F`, `NDX → ^NDX`, plus FX (`EURUSD=X` etc.)
- **4H bars** are aggregated client-side from 1H Yahoo data (Yahoo doesn't
  natively serve 4H)

**Limitations to know:**

1. The dashboard **cannot read your TradingView chart, alerts, or open
   positions.** TradingView has no public API for that. This tool is an
   independent re-computation that should agree with your Pine indicator on
   the same symbol/timeframe.
2. Gold prices may drift a few dollars from `OANDA:XAUUSD` because Yahoo
   uses futures (`GC=F`), not spot. The strategy signals still hold.
3. The free CORS proxy can throttle under heavy traffic. If you see
   `ERR · RETRYING`, it usually recovers on the next 30-second cycle. For
   production, swap `fetchYahoo` in `index.html` for your own data feed
   (Twelve Data, Polygon, Alpaca, etc.).

---

## File structure

```
malaysiantrade/
├── index.html                    ← the dashboard (single-file SPA)
├── malaysian_strategy.pine       ← original Pine v6 source
├── README.md                     ← this file
├── LICENSE                       ← MIT
├── .gitignore
├── setup.sh                      ← one-command push to GitHub
├── docs/
│   └── ALERTS.md                 ← TradingView webhook setup + templates
├── worker/                       ← Cloudflare Worker (alert receiver)
│   ├── index.js
│   ├── wrangler.toml
│   └── README.md                 ← deploy in ~10 minutes, free tier
└── .github/
    └── workflows/
        └── deploy.yml            ← auto-publish to GitHub Pages
```

---

## New in v2: TradingView chart + webhook alerts

**Embedded TradingView chart** — the dashboard now includes a live
TradingView chart on the active symbol. Two modes:

- **PUBLIC CHART** — TradingView's free widget. Live prices, built-in
  indicators only. Works out of the box, no login needed.
- **MY LAYOUT** — your saved TradingView chart (default: `3EBRo3Ch`).
  Shows your custom Malaysian Strategy indicator and drawings, *but only
  if you're already logged into TradingView in this browser*. No
  password sharing — it just rides your existing session.

Set your chart ID in **⚙ CONFIG**.

**Webhook alerts feed** — receive TradingView alerts in real time on a
right-side panel, color-coded by confidence tier (HIGH/MED/LOW/ACC).
Requires:

1. A TradingView paid plan (Essential, ~$15/mo) — free plan disables webhooks
2. A free Cloudflare Worker (~10 min setup, see [`worker/README.md`](./worker/README.md))
3. Alerts configured in TradingView (see [`docs/ALERTS.md`](./docs/ALERTS.md))

Once set up, the dashboard polls for new alerts every 10 seconds and
flashes incoming ones with a green pop animation.

---

## Roadmap

- [ ] Pluggable data adapters (Polygon, Twelve Data, Binance, OANDA REST)
- [ ] Position tracking (manually mark entries → live P&L)
- [ ] Browser notifications when a HIGH signal fires
- [ ] CSV export of signal history
- [ ] Save watchlist between sessions (when deployed on a real host with
  storage — current build keeps state in memory only)

---

## License

MIT — see [`LICENSE`](./LICENSE).

The Pine strategy is based on:
- *Malaysian Strategy* by fxpinaytrader
- *Trading SNR the Malaysian Way 2.0*

Use at your own risk. Not financial advice.
