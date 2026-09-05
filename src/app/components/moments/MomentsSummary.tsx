"use client";

import {
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Stock } from "../../types/stock";

type MomentStock = Stock & {
  attentionScore: number;
};

type MomentsSummaryProps = {
  stocks: MomentStock[];
  onViewMoments: () => void;
  onSelectStock: (stock: Stock) => void;
};

export default function MomentsSummary({
  stocks,
  onViewMoments,
  onSelectStock,
}: MomentsSummaryProps) {
  const topMoments = stocks
    .filter(
      (stock) =>
        stock.attentionScore >= 50
    )
    .slice(0, 3);

  if (topMoments.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-[#101512] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            <Sparkles className="h-4 w-4 text-white/30" />
          </div>

          <div>
            <div className="text-sm font-semibold">
              Moments
            </div>

            <div className="mt-1 text-xs text-white/30">
              No unusual changes detected yet.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#00d9a5]/15 bg-[#0d1511]">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00d9a5]/10">
            <Sparkles className="h-4 w-4 text-[#00d9a5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                Moments
              </h2>

              <span className="rounded-full bg-[#00d9a5]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#00d9a5]">
                {topMoments.length} worth noticing
              </span>
            </div>

            <p className="mt-1 text-xs text-white/35">
              We found changes that may deserve your attention.
            </p>
          </div>

        </div>

        <button
          onClick={onViewMoments}
          className="flex items-center gap-2 self-start rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/50 transition hover:border-[#00d9a5]/20 hover:text-[#00d9a5] md:self-auto"
        >
          View all

          <ArrowRight className="h-3.5 w-3.5" />
        </button>

      </div>

      <div className="grid divide-y divide-white/5 md:grid-cols-3 md:divide-x md:divide-y-0">

        {topMoments.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() =>
              onSelectStock(stock)
            }
            className="group p-5 text-left transition hover:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between">

              <span className="text-sm font-semibold">
                {stock.symbol}
              </span>

              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                  stock.attentionScore >= 80
                    ? "bg-[#00d9a5]/10 text-[#00d9a5]"
                    : "bg-white/5 text-white/50"
                }`}
              >
                {stock.attentionScore}
              </span>

            </div>

            <div className="mt-1 text-xs text-white/25">
              {stock.name}
            </div>

            <div className="mt-4 flex items-center justify-between">

              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  stock.positive
                    ? "text-[#00d9a5]"
                    : "text-red-400"
                }`}
              >
                {stock.positive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}

                {stock.percent}
              </div>

              <span className="text-[10px] text-white/20 transition group-hover:text-[#00d9a5]">
                Inspect
              </span>

            </div>
          </button>
        ))}

      </div>
    </section>
  );
}