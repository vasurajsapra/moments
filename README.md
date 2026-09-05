# Moments

This document explains the reasoning behind Moments — the trade-offs, the things a linter or an AI tool won't tell you to do, and the judgement calls made along the way. It's organized around the five things that matter most when reviewing a submission like this: engineering depth, product interpretation, edge-case handling, code quality, and originality.

## Description 

Moments is a live market intelligence dashboard that identifies which stocks in a watchlist actually deserve a trader's attention, and explains why. Instead of showing raw prices, it computes an Attention Score for every stock by blending price anomaly, volume anomaly, news relevance, and recency into a single weighted signal. A Market Replay timeline lets users scrub back through the trading day and watch that signal evolve minute by minute, while an Event Ripple view shows how a news event on one stock propagates to related stocks. Built with Next.js on the frontend and a Python/Flask service that pulls live data from Yahoo Finance.

## 1. Engineering Depth

**Architecture.** Moments is split into two processes on purpose: a Next.js frontend/API layer and a standalone Flask service that owns all `yfinance` calls. `yfinance` is synchronous, occasionally slow, and prone to rate-limiting/flaky responses from Yahoo — none of which should ever block Next.js's request/response cycle or its build. Isolating it behind an internal HTTP boundary (`127.0.0.1:5000`) means the data-fetching layer can be restarted, rate-limited, cached, or swapped for a different provider without touching the frontend, and a slow or crashed market service degrades to "offline" instead of taking the UI down with it.

**Correctness.** The attention score isn't a single black-box number — it's decomposed into four independently-computed signals (price anomaly, volume anomaly, event relevance, recency) that are each clamped to `[0, 100]` before being blended with fixed weights. This makes the score auditable: `SignalBreakdown.tsx` and the moment explanation generator can show *why* a stock scored what it did by re-deriving the same four numbers, rather than reverse-engineering a single opaque output.

**Reliability.** The frontend never depends on a single data source being available. `mergedStocks` in `page.tsx` merges three independent inputs — the static/local watchlist, live quotes from the Flask service, and (when scrubbing the timeline) historical replay points — with clear precedence: replay data wins during scrubbing, live data wins when caught up to "now," and the local seed data is the fallback when neither is available. This means the UI always renders something sensible regardless of which data sources succeeded.

**Scalability.** Attention scoring and event matching run in `O(n)` per stock per render, memoized with `useMemo` and keyed on the actual dependencies that change (replay minute, live data, events) rather than recomputing on every render. The market service takes symbols as a batched, deduplicated list (`/market?symbols=...`) instead of one request per stock, so adding watchlist entries doesn't multiply network round-trips.

## 2. Product & Problem Interpretation

The brief-level version of this problem is "show live stock prices." The more interesting problem is: **traders don't have time to watch forty tickers — they need the system to tell them which four matter right now, and why.** That reframing drove most of the product decisions:

- **Attention Score over raw alerts.** A binary "up/down X%" alert is noisy and ignores context (a stock jumping 2% after a 0.1% average day is very different from a stock jumping 2% on an average day). The score blends magnitude, unusualness relative to baseline, and freshness of the trigger, so it ranks *significance* rather than just movement.
- **Explanations, not just scores.** A number alone still requires the user to go dig for the "why." `momentExplanation.ts` generates a plain-language narrative from the same signals driving the score, so the ranking is self-justifying.
- **Market Replay as a first-class feature, not a debugging tool.** Real trading decisions are made by understanding *sequence* — what moved first, what followed. Letting a user scrub back through the day and watch the attention signal evolve is a materially different (and more useful) product than a static end-of-day dashboard.
- **Event Ripple.** Markets are correlated, not independent — sector peers move together, and a supplier's news affects a customer's stock. Modeling relationships explicitly (`stockRelationships.ts`) and surfacing "this may also matter for X because Y" was a deliberate bet that *contagion* is as important to show as the primary signal.

## 3. Edge Cases & Resilience

- **Market service down / network failure.** The `/api/market` fetch is wrapped in try/catch; on failure the UI flips to an "Offline" badge and keeps rendering the last-known/local state instead of crashing or showing a blank screen.
- **Division-by-zero guards.** Every percent-change and ratio calculation (`attentionScore.ts`, `market_server.py`, `page.tsx`) explicitly checks the denominator (`previousPrice !== 0`, `averageVolume > 0`) before dividing, since illiquid symbols or pre-market data can legitimately return zero.
- **Missing/thin history.** `calculate_signals()` on the Python side returns a neutral zero-signal result if fewer than 2 closing prices are available, rather than throwing on `iloc[-2]` for a freshly-listed or illiquid stock.
- **Partial batch failures.** In `/market`, if `fetch_single_stock` fails for one symbol in a multi-symbol request, that symbol is silently skipped (logged server-side) rather than failing the entire batch — one bad ticker shouldn't take down the whole watchlist.
- **Symbol format inconsistency.** NSE (`.NS`), BSE (`.BO`), and bare symbols are normalized consistently on both the Python side (`clean_symbol`, `normalize_symbol`, `display_symbol`) and the frontend (`normalizeSymbol`) so that live data, replay data, and the local watchlist can be matched reliably regardless of which format each source returns.
- **Duplicate symbols / duplicate events.** Watchlist symbols are deduplicated before being requested (`dict.fromkeys`) and combined replay/live events are deduplicated by a composite `symbol-time-title` key before rendering, to avoid double-counting the same news item from two sources.
- **Replay boundary conditions.** Scrub position is always clamped between market open and close (`Math.min(Math.max(...))`), and play/pause auto-stops and resets cleanly when the timeline reaches the end rather than running past it.
- **Stale closures in intervals.** The live-polling and replay-playback `useEffect` hooks use functional state updates (`setReplayMinutes((current) => ...)`) specifically to avoid stale-closure bugs that are easy to introduce with `setInterval` inside React.

## 4. Code Quality & Simplicity

- **Small, single-responsibility modules.** Scoring logic (`attentionScore.ts`), explanation generation (`momentExplanation.ts`), and data access (`marketData.ts`) are separated so each can be tested, read, and reasoned about independently — `page.tsx` orchestrates state and composition, but doesn't contain business logic itself.
- **No premature abstraction.** There's no generic "signal engine" or plugin system for scoring — four signals with fixed, documented weights are exactly what the product needs today. Over-engineering a configurable scoring framework before there's a second use case would have added complexity without buying real flexibility.
- **Derived state via `useMemo`, not duplicated state.** Merged stocks, attention scores, moment lists, and filtered events are all computed from a small set of source-of-truth state variables rather than being stored and kept in sync by hand — this removes an entire class of "stale UI" bugs.
- **Self-documenting weight constants.** The scoring weights (35/30/25/10) are written inline next to the calculation with a comment explaining the rationale, rather than buried in a config file disconnected from the math they affect.

## 5. Originality & Thoughtfulness

- **Attention Score as the organizing concept**, rather than a plain sortable table, is the core original idea — it turns "here's some data" into "here's what deserves your attention and why," which is closer to how an actual trader thinks.
- **Independent, composable signals** (price, volume, event, recency) were chosen over a single fused ML-style score deliberately — it's less flashy, but every number is traceable and explainable, which matters more for a decision-support tool than raw predictive accuracy would.
- **Replay is treated as a lens on the *same* scoring model**, not a separate feature — `calculateAttentionScore` takes a `currentMinutes` cursor and works identically whether that cursor is "now" or "10:42 AM three hours ago." This kept replay from becoming a parallel, drifting implementation of the live logic.
- **Graceful degradation was treated as a feature, not an afterthought** — the explicit Live/Offline indicator and fallback-to-seed-data behavior were chosen so the product is honest about its data freshness rather than silently showing stale numbers as if they were live.

## Instructions

You need two things running at the same time: the market data service (Python) and the web app (Next.js).

### 1. Start the Market Data Service

```bash
cd market-service
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install flask flask-cors yfinance requests
python market_server.py
```

Leave this terminal running. You should see it print that it's live on:

`http://127.0.0.1:5000`

### 2. Start the Web App

Open a new terminal, and from the project's root folder:

```bash
npm install
npm run dev
```

### 3. Open the App

Go to:

`http://localhost:3000`

in your browser.
