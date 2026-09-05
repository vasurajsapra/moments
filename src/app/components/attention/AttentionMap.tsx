"use client";

import { Eye, Zap } from "lucide-react";

import { Stock } from "../../types/stock";

type AttentionStock = Stock & {
  attentionScore: number;
};

type AttentionMapProps = {
  stocks: AttentionStock[];
  onSelectStock: (stock: Stock) => void;
};

export default function AttentionMap({
  stocks,
  onSelectStock,
}: AttentionMapProps) {
  return (
    <section className="mt-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00d9a5]/10">
            <Eye className="h-4 w-4 text-[#00d9a5]" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Attention Map
            </h2>

            <p className="mt-1 text-sm text-white/35">
              See where unusual market activity is concentrated.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#101512] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/25">
              Market activity
            </div>

            <div className="mt-1 text-sm text-white/45">
              Price anomaly × Volume anomaly
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/25">
            <span className="h-2 w-2 rounded-full bg-[#00d9a5]" />
            Higher attention
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-2xl border border-white/5 bg-[#0b110e]">
          {/* Grid */}

          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 h-full w-px bg-white/5" />

            <div className="absolute left-0 top-1/2 h-px w-full bg-white/5" />

            <div className="absolute inset-[25%] border border-white/[0.03]" />
          </div>

          {/* Axis labels */}

          <div className="absolute left-3 top-3 text-[10px] uppercase tracking-wider text-white/20">
            High price anomaly
          </div>

          <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-white/20">
            Low price anomaly
          </div>

          <div className="absolute right-3 top-3 text-right text-[10px] uppercase tracking-wider text-white/20">
            High volume
          </div>

          <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-wider text-white/15">
            PRICE
          </div>

          <div className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wider text-white/20">
            VOLUME →
          </div>

          {/* Stock points */}

          {stocks.map((stock) => {
            const x = Math.min(
              Math.max(stock.volumeRatio / 3.5, 0.08),
              0.92
            );

            const y = Math.min(
              Math.max(stock.priceDeviation, 0.08),
              0.92
            );

            const size =
              stock.attentionScore >= 80
                ? 52
                : stock.attentionScore >= 60
                ? 46
                : 40;

            return (
              <button
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="group absolute -translate-x-1/2 translate-y-1/2 transition-all duration-300"
                style={{
                  left: `${x * 100}%`,
                  bottom: `${y * 100}%`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-[#00d9a5]/10 blur-xl transition group-hover:bg-[#00d9a5]/20"
                  style={{
                    width: size,
                    height: size,
                  }}
                />

                <div
                  className={`relative flex items-center justify-center rounded-full border transition-all ${
                    stock.attentionScore >= 80
                      ? "border-[#00d9a5]/50 bg-[#00d9a5]/15 group-hover:border-[#00d9a5]"
                      : stock.attentionScore >= 60
                      ? "border-white/20 bg-white/10 group-hover:border-[#00d9a5]/50"
                      : "border-white/10 bg-white/5 group-hover:border-white/30"
                  }`}
                  style={{
                    width: size,
                    height: size,
                  }}
                >
                  <span className="text-[9px] font-semibold text-white">
                    {stock.symbol.slice(0, 4)}
                  </span>
                </div>

                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0d1511] px-3 py-2 opacity-0 shadow-xl transition group-hover:opacity-100">
                  <div className="text-xs font-semibold text-white">
                    {stock.symbol}
                  </div>

                  <div className="mt-1 text-[10px] text-white/40">
                    Attention {stock.attentionScore}
                  </div>

                  <div className="mt-1 text-[10px] text-[#00d9a5]">
                    {stock.volumeRatio.toFixed(1)}× volume
                  </div>
                </div>
              </button>
            );
          })}

          {stocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Zap className="mx-auto h-6 w-6 text-white/15" />

                <p className="mt-3 text-sm text-white/30">
                  No stocks to map.
                </p>

                <p className="mt-1 text-xs text-white/20">
                  Add stocks to your watchlist first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/25">
              Price anomaly
            </div>

            <div className="mt-1 text-xs text-white/45">
              How unusual the price movement is.
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/25">
              Volume anomaly
            </div>

            <div className="mt-1 text-xs text-white/45">
              How unusual the trading activity is.
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/25">
              Attention Score
            </div>

            <div className="mt-1 text-xs text-white/45">
              Combined priority for the investor.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}