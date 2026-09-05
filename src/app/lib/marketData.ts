import { availableStocks } from "../data/mockStocks";
import { replayEvents } from "../data/replayEvents";
import { marketSignals } from "../data/marketSignals";
import { stockRelationships } from "../data/stockRelationships";

export type LiveStockData = {
  symbol: string;
  price: number;
  volume: number;
  percentChange: number;
  priceDeviation: number;
  volumeRatio: number;
};

export type LiveMarketEvent = {
  symbol: string;
  title: string;
  publisher: string;
  relevance: number;
  type: string;
  publishedAt?: string | number;
};

export type ReplayMarketPoint = {
  time: string;
  symbol: string;
  price: number;
  volume: number;
};

export type LiveMarketResponse = {
  stocks: LiveStockData[];
  events: LiveMarketEvent[];
  replay: ReplayMarketPoint[];
  timestamp: string;
  source: string;
};

export function getStocks() {
  return availableStocks;
}

export function getReplayEvents() {
  return replayEvents;
}

export function getMarketSignals() {
  return marketSignals;
}

export function getStockRelationships() {
  return stockRelationships;
}

export async function fetchLiveMarketData(): Promise<LiveMarketResponse> {
  const response = await fetch(
    "http://127.0.0.1:5000/market",
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Market service returned ${response.status}`
    );
  }

  const data = await response.json();

  return {
    stocks: data.stocks ?? [],
    events: data.events ?? [],
    replay: data.replay ?? [],
    timestamp:
      data.timestamp ??
      new Date().toISOString(),
    source:
      data.source ?? "yfinance",
  };
}