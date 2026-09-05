"use client";

import {
  Activity,
  ChevronRight,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  TrendingDown,
  TrendingUp,
  Volume2,
} from "lucide-react";

type ReplayEvent = {
  time: string;
  symbol: string;
  title: string;
  description: string;
};

type ReplayMarketPoint = {
  time: string;
  symbol: string;
  price: number;
  volume: number;
};

type MarketReplayProps = {
  replayMinutes: number;
  startMinutes: number;
  endMinutes: number;
  isPlaying: boolean;
  progress: number;
  currentEvent: ReplayEvent | undefined;
  visibleEvents: ReplayEvent[];
  replayData: ReplayMarketPoint[];

  onPlayPause: () => void;
  onReset: () => void;
  onJumpToNow: () => void;
  onInspectEvent: (event: ReplayEvent) => void;

  // NEW
  onReplaySeek: (minutes: number) => void;
};

function timeToMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatVolume(volume: number) {
  if (volume >= 10000000) {
    return `${(
      volume / 10000000
    ).toFixed(1)}Cr`;
  }

  if (volume >= 100000) {
    return `${(
      volume / 100000
    ).toFixed(1)}L`;
  }

  if (volume >= 1000) {
    return `${(
      volume / 1000
    ).toFixed(1)}K`;
  }

  return volume.toLocaleString(
    "en-IN"
  );
}

export default function MarketReplay({
  replayMinutes,
  startMinutes,
  endMinutes,
  isPlaying,
  progress,
  currentEvent,
  visibleEvents,
  replayData,
  onPlayPause,
  onReset,
  onJumpToNow,
  onInspectEvent,
  onReplaySeek,
}: MarketReplayProps) {
  // =========================================================
  // CURRENT REPLAY DATA
  // =========================================================

  const visibleReplayData =
    replayData.filter(
      (point) =>
        timeToMinutes(point.time) <=
        replayMinutes
    );

  const latestBySymbol =
    new Map<
      string,
      ReplayMarketPoint
    >();

  visibleReplayData.forEach(
    (point) => {
      latestBySymbol.set(
        point.symbol,
        point
      );
    }
  );

  const currentSnapshot =
    Array.from(
      latestBySymbol.values()
    ).sort(
      (a, b) =>
        b.volume - a.volume
    );

  // =========================================================
  // PREVIOUS DATA
  // =========================================================

  const previousBySymbol =
    new Map<
      string,
      ReplayMarketPoint
    >();

  replayData
    .filter(
      (point) =>
        timeToMinutes(point.time) <
        replayMinutes
    )
    .forEach((point) => {
      previousBySymbol.set(
        point.symbol,
        point
      );
    });

  const currentTime =
    minutesToTime(
      replayMinutes
    );

  const hasReplayData =
    replayData.length > 0;

  // =========================================================
  // TOP MOVERS
  // =========================================================

  const movers =
    currentSnapshot
      .map((point) => {
        const previous =
          previousBySymbol.get(
            point.symbol
          );

        let change = 0;

        if (
          previous &&
          previous.price !== 0
        ) {
          change =
            ((point.price -
              previous.price) /
              previous.price) *
            100;
        }

        return {
          ...point,
          change,
        };
      })
      .sort(
        (a, b) =>
          Math.abs(b.change) -
          Math.abs(a.change)
      )
      .slice(0, 4);

  // =========================================================
  // EVENT MARKERS
  // =========================================================

  const timelineEvents =
    visibleEvents
      .slice(0, 6)
      .map((event) => {
        const eventMinutes =
          timeToMinutes(
            event.time
          );

        const eventProgress =
          ((eventMinutes -
            startMinutes) /
            (endMinutes -
              startMinutes)) *
          100;

        return {
          ...event,
          eventProgress:
            Math.min(
              Math.max(
                eventProgress,
                0
              ),
              100
            ),
        };
      });

  return (
    <section className="mt-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00d9a5]/10">
              <Clock3 className="h-4 w-4 text-[#00d9a5]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Market Replay
              </h2>

              <p className="mt-1 text-sm text-white/35">
                Rewind the market and see
                what changed minute by minute.
              </p>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-2">

          <div className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
              Replay time
            </span>

            <span className="ml-2 text-xs font-semibold text-white/70">
              {currentTime}
            </span>
          </div>

          <div
            className={`rounded-full border px-3 py-1.5 ${
              hasReplayData
                ? "border-[#00d9a5]/20 bg-[#00d9a5]/5"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <span
              className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                hasReplayData
                  ? "bg-[#00d9a5]"
                  : "bg-white/20"
              }`}
            />

            <span
              className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                hasReplayData
                  ? "text-[#00d9a5]"
                  : "text-white/25"
              }`}
            >
              {hasReplayData
                ? "Live data"
                : "No replay data"}
            </span>
          </div>

        </div>
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <div className="rounded-3xl border border-white/10 bg-[#101512] p-5 lg:p-6">

        {/* ===================================================
            CONTROLS
        ==================================================== */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={onPlayPause}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00d9a5] text-black transition hover:scale-105"
              aria-label={
                isPlaying
                  ? "Pause replay"
                  : "Play replay"
              }
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>

            <div>
              <div className="text-sm font-semibold">
                {isPlaying
                  ? "Replaying market"
                  : "Market snapshot"}
              </div>

              <div className="mt-1 text-[10px] text-white/30">
                {minutesToTime(
                  startMinutes
                )}{" "}
                —{" "}
                {minutesToTime(
                  endMinutes
                )}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-semibold text-white/45 transition hover:border-white/20 hover:text-white/70"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              onClick={onJumpToNow}
              className="flex items-center gap-2 rounded-xl border border-[#00d9a5]/20 bg-[#00d9a5]/5 px-3 py-2 text-[10px] font-semibold text-[#00d9a5] transition hover:bg-[#00d9a5]/10"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Jump to now
            </button>

          </div>
        </div>

        {/* ===================================================
            REAL DRAGGABLE SLIDER
        ==================================================== */}

        <div className="mt-8">

          <div className="relative">

            {/* Visual progress */}

            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.06]">

              <div
                className="h-full rounded-full bg-[#00d9a5] transition-[width] duration-100"
                style={{
                  width: `${Math.min(
                    Math.max(
                      progress,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

            {/* Event markers */}

            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2">

              {timelineEvents.map(
                (
                  event,
                  index
                ) => (
                  <span
                    key={`${event.symbol}-${event.time}-${index}`}
                    className="absolute top-1/2 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full border border-[#00d9a5]/50 bg-[#101512]"
                    style={{
                      left: `${event.eventProgress}%`,
                    }}
                  />
                )
              )}

            </div>

            {/* ACTUAL INPUT */}

            <input
              type="range"
              min={startMinutes}
              max={endMinutes}
              step={1}
              value={replayMinutes}
              onChange={(event) => {
                onReplaySeek(
                  Number(
                    event.target.value
                  )
                );
              }}
              className="relative z-20 block h-6 w-full cursor-pointer appearance-none bg-transparent"
              aria-label="Market replay timeline"
            />

          </div>

          <div className="mt-2 flex items-center justify-between">

            <span className="text-[9px] font-medium text-white/20">
              {minutesToTime(
                startMinutes
              )}
            </span>

            <span className="text-[10px] font-semibold text-[#00d9a5]">
              {currentTime}
            </span>

            <span className="text-[9px] font-medium text-white/20">
              {minutesToTime(
                endMinutes
              )}
            </span>

          </div>

        </div>

        {/* ===================================================
            MARKET SNAPSHOT
        ==================================================== */}

        {hasReplayData &&
        currentSnapshot.length > 0 ? (
          <div className="mt-7">

            <div className="mb-3 flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#00d9a5]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                  Market snapshot
                </span>
              </div>

              <span className="text-[9px] text-white/20">
                {currentSnapshot.length}{" "}
                stocks replayed
              </span>

            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">

              {movers.map(
                (point) => (
                  <div
                    key={
                      point.symbol
                    }
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/10 hover:bg-white/[0.035]"
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-semibold text-white/70">
                        {point.symbol}
                      </span>

                      {point.change >
                      0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-[#00d9a5]" />
                      ) : point.change <
                        0 ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-white/20" />
                      )}

                    </div>

                    <div className="mt-3 text-base font-semibold">
                      {formatPrice(
                        point.price
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between">

                      <span
                        className={`text-[10px] font-medium ${
                          point.change >
                          0
                            ? "text-[#00d9a5]"
                            : point.change <
                              0
                            ? "text-red-400"
                            : "text-white/25"
                        }`}
                      >
                        {point.change >
                        0
                          ? "+"
                          : ""}
                        {point.change.toFixed(
                          2
                        )}
                        %
                      </span>

                      <span className="text-[9px] text-white/20">
                        {formatVolume(
                          point.volume
                        )}{" "}
                        vol
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">

            <Activity className="mx-auto h-5 w-5 text-white/15" />

            <p className="mt-3 text-xs text-white/30">
              No minute-by-minute market
              observations are available
              for this replay session.
            </p>

          </div>
        )}

        {/* ===================================================
            CURRENT EVENT
        ==================================================== */}

        {currentEvent && (
          <div className="mt-6 rounded-2xl border border-[#00d9a5]/15 bg-[#00d9a5]/[0.035] p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00d9a5]/10">
                <Volume2 className="h-4 w-4 text-[#00d9a5]" />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#00d9a5]">
                    Latest detected event
                  </span>

                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] text-white/30">
                    {currentEvent.time}
                  </span>

                  <span className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] text-white/30">
                    {currentEvent.symbol}
                  </span>

                </div>

                <h3 className="mt-2 text-sm font-semibold text-white/80">
                  {currentEvent.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/30">
                  {currentEvent.description}
                </p>

              </div>

              <button
                onClick={() =>
                  onInspectEvent(
                    currentEvent
                  )
                }
                className="hidden items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/25 transition hover:text-[#00d9a5] sm:flex"
              >
                Inspect
                <ChevronRight className="h-3 w-3" />
              </button>

            </div>
          </div>
        )}

        {/* ===================================================
            REPLAY EVENTS
        ==================================================== */}

        {visibleEvents.length >
          0 && (
          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
                Replay events
              </span>

              <span className="text-[9px] text-white/20">
                {visibleEvents.length}{" "}
                detected
              </span>

            </div>

            <div className="grid gap-2 lg:grid-cols-2">

              {visibleEvents
                .slice(0, 4)
                .map(
                  (
                    event,
                    index
                  ) => (
                    <button
                      key={`${event.symbol}-${event.time}-${index}`}
                      onClick={() =>
                        onInspectEvent(
                          event
                        )
                      }
                      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.015] p-3 text-left transition hover:border-[#00d9a5]/15 hover:bg-[#00d9a5]/[0.025]"
                    >

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[8px] font-semibold text-white/35">
                        {event.symbol.slice(
                          0,
                          3
                        )}
                      </span>

                      <span className="min-w-0 flex-1">

                        <span className="flex items-center gap-2">

                          <span className="text-[10px] font-semibold text-white/55">
                            {event.symbol}
                          </span>

                          <span className="text-[9px] text-white/20">
                            {event.time}
                          </span>

                        </span>

                        <span className="mt-0.5 block truncate text-[10px] text-white/30">
                          {event.title}
                        </span>

                      </span>

                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/15 transition group-hover:translate-x-0.5 group-hover:text-[#00d9a5]" />

                    </button>
                  )
                )}

            </div>
          </div>
        )}

      </div>
    </section>
  );
}