"use client";

import { Check, X, Zap } from "lucide-react";

import { Stock } from "../../types/stock";
import { StockRelationship } from "../../data/stockRelationships";
import { generateMomentExplanation } from "../../lib/momentExplanation";

type ReplayEvent = {
  time: string;
  symbol: string;
  title: string;
  description: string;
};

type MomentModalProps = {
  stock: Stock | null;
  attentionScore: number;
  currentMinutes: number;
  events: ReplayEvent[];
  relationships: StockRelationship[];
  onClose: () => void;
};

export default function MomentModal({
  stock,
  attentionScore,
  currentMinutes,
  events,
  relationships,
  onClose,
}: MomentModalProps) {
  if (!stock) {
    return null;
  }

  const explanation =
    generateMomentExplanation({
      stock,
      currentMinutes,
      events,
      relationships,
    });

  const latestEvent = events
    .filter(
      (event) =>
        event.symbol ===
          stock.symbol &&
        timeToMinutes(event.time) <=
          currentMinutes
    )
    .at(-1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d1511] shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-white/10 p-6">

          <div>
            <div className="flex items-center gap-3">

              <span className="text-xl font-semibold">
                {stock.symbol}
              </span>

              <span
                className={`text-sm font-medium ${
                  stock.positive
                    ? "text-[#00d9a5]"
                    : "text-red-400"
                }`}
              >
                {stock.percent}
              </span>

            </div>

            <p className="mt-1 text-sm text-white/35">
              {stock.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <div className="p-6">

          {/* WHY THIS MATTERS */}

          <div className="rounded-2xl border border-[#00d9a5]/15 bg-[#00d9a5]/5 p-5">

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00d9a5]">

              <Zap className="h-4 w-4" />

              Why this matters

            </div>

            <p className="mt-3 text-sm leading-6 text-white/65">
              {explanation}
            </p>

          </div>

          {/* DETECTED EVENT */}

          {latestEvent && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25">
                    Detected event
                  </div>

                  <div className="mt-1 text-sm font-semibold text-white">
                    {latestEvent.title}
                  </div>
                </div>

                <span className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-white/35">
                  {latestEvent.time}
                </span>

              </div>

              <p className="mt-2 text-xs leading-5 text-white/35">
                {latestEvent.description}
              </p>

            </div>
          )}

          {/* SIGNALS */}

          <div className="mt-5 grid grid-cols-3 gap-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

              <div className="text-[10px] uppercase tracking-wider text-white/25">
                Price anomaly
              </div>

              <div className="mt-2 text-lg font-semibold">
                {Math.round(
                  stock.priceDeviation * 100
                )}
              </div>

              <div className="mt-1 text-[10px] text-white/25">
                deviation signal
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

              <div className="text-[10px] uppercase tracking-wider text-white/25">
                Volume
              </div>

              <div className="mt-2 text-lg font-semibold">
                {stock.volumeRatio.toFixed(
                  1
                )}
                ×
              </div>

              <div className="mt-1 text-[10px] text-white/25">
                vs normal activity
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

              <div className="text-[10px] uppercase tracking-wider text-white/25">
                Event relevance
              </div>

              <div className="mt-2 text-lg font-semibold">
                {Math.round(
                  stock.eventRelevance *
                    100
                )}
              </div>

              <div className="mt-1 text-[10px] text-white/25">
                contextual signal
              </div>

            </div>

          </div>

          {/* ATTENTION SCORE */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-xs uppercase tracking-wider text-white/25">
                  Attention Score
                </div>

                <div className="mt-1 text-sm text-white/40">
                  Signals combined into one priority score.
                </div>

              </div>

              <div className="text-3xl font-semibold text-[#00d9a5]">
                {attentionScore}
              </div>

            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-[#00d9a5] transition-all"
                style={{
                  width: `${attentionScore}%`,
                }}
              />

            </div>

            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-white/25">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>

          </div>

          {/* SCORE BREAKDOWN */}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">

            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
              How the score is calculated
            </div>

            <div className="space-y-3">

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">
                  Price anomaly
                </span>

                <span className="text-xs text-white/30">
                  35%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">
                  Volume anomaly
                </span>

                <span className="text-xs text-white/30">
                  30%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">
                  Event relevance
                </span>

                <span className="text-xs text-white/30">
                  25%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">
                  Recency
                </span>

                <span className="text-xs text-white/30">
                  10%
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-5">

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-[#00d9a5] px-4 py-2.5 text-sm font-semibold text-[#07100c]"
          >
            <Check className="h-4 w-4" />
            View Stock
          </button>

        </div>

      </div>
    </div>
  );
}

function timeToMinutes(
  time: string
) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}