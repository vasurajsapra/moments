"use client";

import {
  ChevronRight,
  Activity,
  BarChart3,
  Zap,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Stock } from "../../types/stock";

type MomentStock = Stock & {
  attentionScore: number;
};

type MomentsRankingProps = {
  stocks: MomentStock[];
  replayMinutes: number;
  onSelectStock: (stock: Stock) => void;
};

export default function MomentsRanking({
  stocks,
  replayMinutes,
  onSelectStock,
}: MomentsRankingProps) {
  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      mins
    ).padStart(2, "0")}`;
  };

  const getSignalStrength = (value: number) => {
    if (value >= 75) return "Strong";
    if (value >= 45) return "Moderate";
    return "Low";
  };

  const getMomentReason = (stock: MomentStock) => {
    const reasons: string[] = [];

    if (stock.priceDeviation >= 0.7) {
      reasons.push("unusual price movement");
    } else if (stock.priceDeviation >= 0.5) {
      reasons.push("a meaningful price deviation");
    }

    if (stock.volumeRatio >= 2.5) {
      reasons.push(
        `${stock.volumeRatio.toFixed(1)}× normal volume`
      );
    } else if (stock.volumeRatio >= 2) {
      reasons.push(
        `${stock.volumeRatio.toFixed(1)}× normal volume`
      );
    } else if (stock.volumeRatio >= 1.4) {
      reasons.push("elevated trading activity");
    }

    if (stock.eventRelevance >= 0.7) {
      reasons.push("a relevant market event");
    }

    if (reasons.length === 0) {
      return `Activity in ${stock.symbol} is different from its normal pattern.`;
    }

    if (reasons.length === 1) {
      return `${stock.symbol} is showing ${reasons[0]}.`;
    }

    if (reasons.length === 2) {
      return `${stock.symbol} is showing ${reasons[0]} alongside ${reasons[1]}.`;
    }

    return `${stock.symbol} combines ${reasons[0]}, ${reasons[1]}, and ${reasons[2]}.`;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High attention";
    if (score >= 60) return "Worth watching";
    return "Low attention";
  };

  return (
    <section className="mt-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Moments worth noticing
            </h2>

            <span className="rounded-full border border-[#00d9a5]/15 bg-[#00d9a5]/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#00d9a5]/70">
              Live ranking
            </span>
          </div>

          <p className="mt-1 text-sm text-white/35">
            The strongest changes in your watchlist right now.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/25">
          <Clock3 className="h-3.5 w-3.5" />
          {minutesToTime(replayMinutes)}
        </div>
      </div>

      <div className="grid gap-3">
        {stocks.length > 0 ? (
          stocks.map((stock, index) => {
            const priceSignal = Math.round(
              Math.min(
                Math.max(stock.priceDeviation * 100, 0),
                100
              )
            );

            const volumeSignal = Math.round(
              Math.min(
                Math.max(
                  ((stock.volumeRatio - 1) / 2.5) * 100,
                  0
                ),
                100
              )
            );

            const eventSignal = Math.round(
              Math.min(
                Math.max(stock.eventRelevance * 100, 0),
                100
              )
            );

            const hasStrongPriceSignal =
              priceSignal >= 70;

            const hasStrongVolumeSignal =
              volumeSignal >= 70;

            const hasStrongEventSignal =
              eventSignal >= 70;

            const signalCount = [
              hasStrongPriceSignal,
              hasStrongVolumeSignal,
              hasStrongEventSignal,
            ].filter(Boolean).length;

            const directionIcon = stock.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            );

            return (
              <button
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="group rounded-2xl border border-white/10 bg-[#101512] p-5 text-left transition hover:border-[#00d9a5]/20 hover:bg-[#111a16]"
              >
                <div className="flex items-start gap-5">
                  {/* Ranking */}
                  <div className="w-8 shrink-0 pt-1 text-sm text-white/20">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {stock.symbol}
                      </span>

                      <span className="truncate text-xs text-white/30">
                        {stock.name}
                      </span>
                    </div>

                    {/* Price movement */}
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          stock.positive
                            ? "text-[#00d9a5]"
                            : "text-red-400"
                        }`}
                      >
                        {directionIcon}
                        {stock.percent}
                      </span>

                      <span className="text-xs text-white/25">
                        {stock.change}
                      </span>

                      <span className="text-xs text-white/15">
                        ·
                      </span>

                      <span className="text-xs text-white/30">
                        Detected {stock.eventTime}
                      </span>
                    </div>

                    {/* Why it matters */}
                    <div className="mt-4 rounded-xl border border-[#00d9a5]/10 bg-[#00d9a5]/[0.025] px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-[#00d9a5]" />

                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00d9a5]">
                          Why this matters
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-5 text-white/45">
                        {getMomentReason(stock)}
                      </p>

                      {signalCount >= 2 && (
                        <p className="mt-1 text-[11px] text-white/25">
                          {signalCount} independent signals are
                          contributing to this Moment.
                        </p>
                      )}
                    </div>

                    {/* Signals */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Signal
                        icon={
                          <Activity className="h-3.5 w-3.5" />
                        }
                        label="Price anomaly"
                        value={priceSignal}
                      />

                      <Signal
                        icon={
                          <BarChart3 className="h-3.5 w-3.5" />
                        }
                        label="Volume anomaly"
                        value={volumeSignal}
                      />

                      <Signal
                        icon={
                          <Zap className="h-3.5 w-3.5" />
                        }
                        label="Event relevance"
                        value={eventSignal}
                      />
                    </div>

                    {/* Signal interpretation */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {hasStrongPriceSignal && (
                        <SignalBadge>
                          Price anomaly
                        </SignalBadge>
                      )}

                      {hasStrongVolumeSignal && (
                        <SignalBadge>
                          Volume spike
                        </SignalBadge>
                      )}

                      {hasStrongEventSignal && (
                        <SignalBadge>
                          Relevant event
                        </SignalBadge>
                      )}

                      {signalCount === 0 && (
                        <span className="text-[10px] text-white/20">
                          No dominant signal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attention score */}
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
                        Attention
                      </div>

                      <div
                        className={`mt-1 text-2xl font-semibold ${
                          stock.attentionScore >= 80
                            ? "text-[#00d9a5]"
                            : stock.attentionScore >= 60
                            ? "text-white"
                            : "text-white/50"
                        }`}
                      >
                        {stock.attentionScore}
                      </div>

                      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/20">
                        {getScoreLabel(
                          stock.attentionScore
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[#00d9a5]" />
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#101512] p-10 text-center">
            <p className="text-sm text-white/35">
              No moments detected in your watchlist.
            </p>

            <p className="mt-1 text-xs text-white/20">
              Replay the market to discover meaningful changes.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Signal({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-wider text-white/25">
          {icon}

          <span className="truncate">
            {label}
          </span>
        </div>

        <span className="shrink-0 text-xs font-semibold text-white/60">
          {value}
        </span>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-[#00d9a5]/60 transition-all duration-500"
          style={{
            width: `${value}%`,
          }}
        />
      </div>

      <div className="mt-1.5 text-[9px] uppercase tracking-wider text-white/15">
        {getSignalLabel(value)}
      </div>
    </div>
  );
}

function getSignalLabel(value: number) {
  if (value >= 75) return "Strong";
  if (value >= 45) return "Moderate";
  return "Low";
}

function SignalBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-[#00d9a5]/10 bg-[#00d9a5]/[0.04] px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-[#00d9a5]/55">
      {children}
    </span>
  );
}