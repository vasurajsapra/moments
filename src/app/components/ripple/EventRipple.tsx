"use client";

import {
  ArrowDown,
  ArrowUp,
  CircleDot,
  Link2,
  Zap,
  Activity,
  Clock3,
} from "lucide-react";

import { Stock } from "../../types/stock";
import { StockRelationship } from "../../data/stockRelationships";

type ReplayEvent = {
  time: string;
  symbol: string;
  title: string;
  description: string;
};

type AttentionStock = Stock & {
  attentionScore: number;
};

type EventRippleProps = {
  events: ReplayEvent[];
  stocks: AttentionStock[];
  relationships: StockRelationship[];
  replayMinutes: number;
  onSelectStock: (stock: Stock) => void;
};

export default function EventRipple({
  events,
  stocks,
  relationships,
  replayMinutes,
  onSelectStock,
}: EventRippleProps) {
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time
      .split(":")
      .map(Number);

    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      mins
    ).padStart(2, "0")}`;
  };

  /*
   * Only events that have actually happened
   * by the selected replay position.
   */
  const visibleEvents = events
    .filter(
      (event) =>
        timeToMinutes(event.time) <=
        replayMinutes
    )
    .sort(
      (a, b) =>
        timeToMinutes(b.time) -
        timeToMinutes(a.time)
    );

  /*
   * Instead of blindly using the latest event,
   * find the event that has the strongest connection
   * to an actual stock signal.
   */
  const rankedEvents = visibleEvents
    .map((event) => {
      const stock = stocks.find(
        (item) =>
          item.symbol === event.symbol
      );

      if (!stock) {
        return {
          event,
          stock: null,
          score: 0,
        };
      }

      const minutesSinceEvent = Math.max(
        replayMinutes -
          timeToMinutes(event.time),
        0
      );

      const recency = Math.max(
        0,
        100 -
          (minutesSinceEvent / 90) * 100
      );

      const priceSignal =
        Math.min(
          Math.max(
            stock.priceDeviation * 100,
            0
          ),
          100
        );

      const volumeSignal = Math.min(
        Math.max(
          ((stock.volumeRatio - 1) /
            2.5) *
            100,
          0
        ),
        100
      );

      const eventSignal =
        stock.eventRelevance * 100;

      const score =
        priceSignal * 0.35 +
        volumeSignal * 0.3 +
        eventSignal * 0.2 +
        recency * 0.15;

      return {
        event,
        stock,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected =
    rankedEvents[0];

  if (!selected) {
    return (
      <section className="mt-6">
        <div className="rounded-3xl border border-white/10 bg-[#101512] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00d9a5]/10">
            <Clock3 className="h-5 w-5 text-[#00d9a5]" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Waiting for a market event
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            Replay the market to discover when
            an event entered your watchlist.
          </p>

          <div className="mt-5 text-xs text-white/20">
            Replay position:{" "}
            {minutesToTime(replayMinutes)}
          </div>
        </div>
      </section>
    );
  }

  const latestEvent =
    selected.event;

  const affectedStock =
    selected.stock;

  /*
   * Relationships originating from the
   * event's stock.
   */
  const rippleRelationships =
    relationships
      .filter(
        (relationship) =>
          relationship.source ===
          latestEvent.symbol
      )
      .sort(
        (a, b) =>
          b.strength - a.strength
      );

  /*
   * Only show related stocks that exist
   * in the current watchlist.
   */
  const relatedStocks =
    rippleRelationships
      .map((relationship) => {
        const stock = stocks.find(
          (item) =>
            item.symbol ===
            relationship.target
        );

        if (!stock) {
          return null;
        }

        return {
          stock,
          relationship,
        };
      })
      .filter(
        (
          item
        ): item is {
          stock: AttentionStock;
          relationship: StockRelationship;
        } => item !== null
      );

  const minutesSinceEvent =
    Math.max(
      replayMinutes -
        timeToMinutes(
          latestEvent.time
        ),
      0
    );

  const eventIsRecent =
    minutesSinceEvent <= 15;

  return (
    <section className="mt-6">
      {/* HEADER */}
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00d9a5]/10">
            <Zap className="h-4 w-4 text-[#00d9a5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                Event Ripple
              </h2>

              {eventIsRecent && (
                <span className="rounded-full border border-[#00d9a5]/15 bg-[#00d9a5]/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#00d9a5]/70">
                  Recent
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-white/35">
              Follow how this market event can
              ripple through your watchlist.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#101512] p-6">
        {/* EVENT SOURCE */}

        <div className="rounded-2xl border border-[#00d9a5]/20 bg-[#00d9a5]/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00d9a5]/10">
              <Zap className="h-5 w-5 text-[#00d9a5]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00d9a5]">
                  Market Event
                </span>

                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                  {latestEvent.time}
                </span>

                <span className="text-[10px] text-white/20">
                  {minutesSinceEvent === 0
                    ? "Happening now"
                    : `${minutesSinceEvent}m ago`}
                </span>
              </div>

              <h3 className="mt-2 text-lg font-semibold text-white">
                {latestEvent.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-white/40">
                {latestEvent.description}
              </p>
            </div>
          </div>
        </div>

        {/* RIPPLE TIMELINE */}

        <div className="relative mt-6">
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-white/10" />

          {/* SOURCE */}

          <div className="relative flex gap-4">
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00d9a5]/30 bg-[#101512]">
              <CircleDot className="h-4 w-4 text-[#00d9a5]" />
            </div>

            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">
                    {latestEvent.symbol}
                  </span>

                  <span className="ml-2 text-xs text-white/30">
                    Event source
                  </span>
                </div>

                <span className="text-xs text-white/25">
                  {latestEvent.time}
                </span>
              </div>

              <p className="mt-2 text-xs text-white/35">
                The event entered the market here.
              </p>
            </div>
          </div>

          {/* DIRECT IMPACT */}

          {affectedStock && (
            <div className="relative mt-4 flex gap-4">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#101512]">
                {affectedStock.positive ? (
                  <ArrowUp className="h-4 w-4 text-[#00d9a5]" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-400" />
                )}
              </div>

              <button
                onClick={() =>
                  onSelectStock(
                    affectedStock
                  )
                }
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-[#00d9a5]/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">
                      Direct market reaction
                    </span>

                    <span
                      className={`ml-2 text-xs font-medium ${
                        affectedStock.positive
                          ? "text-[#00d9a5]"
                          : "text-red-400"
                      }`}
                    >
                      {affectedStock.percent}
                    </span>
                  </div>

                  <span className="text-xs text-white/25">
                    {affectedStock.price}
                  </span>
                </div>

                <p className="mt-2 text-xs text-white/35">
                  {affectedStock.symbol} is showing
                  the strongest connection to this
                  event at the current replay position.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-white/30">
                    Attention {affectedStock.attentionScore}
                  </span>

                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-white/30">
                    Price signal{" "}
                    {Math.round(
                      affectedStock.priceDeviation *
                        100
                    )}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* SIGNAL */}

          {affectedStock && (
            <div className="relative mt-4 flex gap-4">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#101512]">
                <Activity className="h-4 w-4 text-[#00d9a5]" />
              </div>

              <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Trading signal
                  </span>

                  <span className="text-sm font-semibold text-[#00d9a5]">
                    {affectedStock.volumeRatio.toFixed(
                      1
                    )}
                    ×
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-white/35">
                  Trading activity is{" "}
                  {affectedStock.volumeRatio >= 2
                    ? "significantly"
                    : affectedStock.volumeRatio >=
                      1.4
                    ? "moderately"
                    : "not significantly"}{" "}
                  above the normal baseline.
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-[#00d9a5]/60 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          ((affectedStock.volumeRatio -
                            1) /
                            2.5) *
                            100,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* RELATIONSHIP RIPPLE */}

          <div className="relative mt-4 flex gap-4">
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#101512]">
              <Link2 className="h-4 w-4 text-white/50" />
            </div>

            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    Potential ripple
                  </div>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Related stocks that may deserve
                    attention next.
                  </p>
                </div>

                {relatedStocks.length > 0 && (
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-white/25">
                    {relatedStocks.length} linked
                  </span>
                )}
              </div>

              {relatedStocks.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {relatedStocks
                    .slice(0, 4)
                    .map(
                      ({
                        stock,
                        relationship,
                      }) => {
                        const strength =
                          Math.round(
                            relationship.strength *
                              100
                          );

                        return (
                          <button
                            key={
                              stock.symbol
                            }
                            onClick={() =>
                              onSelectStock(
                                stock
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-[#00d9a5]/20 hover:bg-[#00d9a5]/5"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] font-semibold">
                              {stock.symbol.slice(
                                0,
                                3
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                  {
                                    stock.symbol
                                  }
                                </span>

                                <span
                                  className={`text-[10px] ${
                                    stock.positive
                                      ? "text-[#00d9a5]"
                                      : "text-red-400"
                                  }`}
                                >
                                  {
                                    stock.percent
                                  }
                                </span>
                              </div>

                              <div className="mt-1 text-[10px] text-white/30">
                                {
                                  relationship.relationship
                                }
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[9px] uppercase tracking-wider text-white/20">
                                Link
                              </div>

                              <div className="mt-1 text-xs font-semibold text-white/60">
                                {strength}%
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-white/30">
                    No mapped relationships detected
                    for this event.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/20">
            <Clock3 className="h-3.5 w-3.5" />
            Replay position{" "}
            {minutesToTime(replayMinutes)}
          </div>

          <span className="text-[10px] text-white/20">
            Ripple strength is based on mapped relationships
          </span>
        </div>
      </div>
    </section>
  );
}