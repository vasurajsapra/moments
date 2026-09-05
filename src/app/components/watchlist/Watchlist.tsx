"use client";

import {
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Stock } from "../../types/stock";

type WatchlistProps = {
  watchlist: Stock[];
  onAddStock: () => void;
  onRemoveStock: (symbol: string) => void;
};

export default function Watchlist({
  watchlist,
  onAddStock,
  onRemoveStock,
}: WatchlistProps) {
  return (
    <section className="mt-6">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Your watchlist
          </h2>

          <p className="mt-1 text-sm text-white/35">
            Track the stocks you care about.
          </p>
        </div>

        <button
          onClick={onAddStock}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add stock
        </button>
      </div>

      {/* Watchlist table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101512]">
        {/* Table header */}
        <div className="hidden grid-cols-[1fr_150px_130px_80px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-wider text-white/25 md:grid">
          <span>Stock</span>
          <span>Price</span>
          <span>Change</span>
          <span />
        </div>

        {/* Stocks */}
        {watchlist.map((stock) => (
          <div
            key={stock.symbol}
            className="grid grid-cols-1 gap-3 border-b border-white/5 px-5 py-4 last:border-0 md:grid-cols-[1fr_150px_130px_80px] md:items-center md:gap-4"
          >
            {/* Stock */}
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">
                  {stock.symbol}
                </span>

                {stock.moment && (
                  <span className="rounded-md bg-[#00d9a5]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#00d9a5]">
                    Moment
                  </span>
                )}
              </div>

              <div className="mt-1 text-xs text-white/30">
                {stock.name}
              </div>
            </div>

            {/* Price */}
            <div className="text-sm font-medium text-white">
              {stock.price}
            </div>

            {/* Change */}
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                stock.positive
                  ? "text-[#00d9a5]"
                  : "text-red-400"
              }`}
            >
              {stock.positive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}

              {stock.percent}
            </div>

            {/* Remove */}
            <div>
              <button
                onClick={() => onRemoveStock(stock.symbol)}
                className="rounded-lg p-2 text-white/20 transition hover:bg-red-400/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {watchlist.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-white/35">
              Your watchlist is empty.
            </p>

            <button
              onClick={onAddStock}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00d9a5] px-4 py-2 text-sm font-semibold text-[#07100c]"
            >
              <Plus className="h-4 w-4" />
              Add a stock
            </button>
          </div>
        )}
      </div>
    </section>
  );
}