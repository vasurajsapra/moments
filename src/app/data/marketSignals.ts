export type MarketSignal = {
  time: string;
  symbol: string;

  priceDeviation: number;
  volumeRatio: number;

  label: string;
};

export const marketSignals: MarketSignal[] = [
  {
    time: "09:15",
    symbol: "RELIANCE",
    priceDeviation: 0.18,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "09:30",
    symbol: "RELIANCE",
    priceDeviation: 0.28,
    volumeRatio: 1.2,
    label: "Activity increasing",
  },
  {
    time: "09:42",
    symbol: "RELIANCE",
    priceDeviation: 0.55,
    volumeRatio: 2.1,
    label: "Volume spike",
  },
  {
    time: "10:00",
    symbol: "RELIANCE",
    priceDeviation: 0.62,
    volumeRatio: 2.3,
    label: "Momentum building",
  },
  {
    time: "10:29",
    symbol: "RELIANCE",
    priceDeviation: 0.82,
    volumeRatio: 2.6,
    label: "Event reaction",
  },

  {
    time: "09:15",
    symbol: "TCS",
    priceDeviation: 0.15,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "10:00",
    symbol: "TCS",
    priceDeviation: 0.32,
    volumeRatio: 1.3,
    label: "Momentum building",
  },
  {
    time: "10:18",
    symbol: "TCS",
    priceDeviation: 0.68,
    volumeRatio: 2.1,
    label: "Unusual movement",
  },

  {
    time: "09:15",
    symbol: "INFY",
    priceDeviation: 0.12,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "10:20",
    symbol: "INFY",
    priceDeviation: 0.28,
    volumeRatio: 1.3,
    label: "Activity increasing",
  },
  {
    time: "10:47",
    symbol: "INFY",
    priceDeviation: 0.54,
    volumeRatio: 1.8,
    label: "Earnings reaction",
  },

  {
    time: "09:15",
    symbol: "HDFCBANK",
    priceDeviation: 0.10,
    volumeRatio: 0.9,
    label: "Market open",
  },
  {
    time: "10:30",
    symbol: "HDFCBANK",
    priceDeviation: 0.22,
    volumeRatio: 1.1,
    label: "Normal activity",
  },

  {
    time: "09:15",
    symbol: "ICICIBANK",
    priceDeviation: 0.08,
    volumeRatio: 0.9,
    label: "Market open",
  },
  {
    time: "10:30",
    symbol: "ICICIBANK",
    priceDeviation: 0.16,
    volumeRatio: 0.9,
    label: "Normal activity",
  },

  {
    time: "09:15",
    symbol: "SBIN",
    priceDeviation: 0.14,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "10:15",
    symbol: "SBIN",
    priceDeviation: 0.36,
    volumeRatio: 1.4,
    label: "Buying activity",
  },
  {
    time: "10:36",
    symbol: "SBIN",
    priceDeviation: 0.61,
    volumeRatio: 2.2,
    label: "Volume acceleration",
  },

  {
    time: "09:15",
    symbol: "ITC",
    priceDeviation: 0.10,
    volumeRatio: 0.9,
    label: "Market open",
  },

  {
    time: "09:15",
    symbol: "BHARTIARTL",
    priceDeviation: 0.16,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "10:30",
    symbol: "BHARTIARTL",
    priceDeviation: 0.42,
    volumeRatio: 1.6,
    label: "Momentum building",
  },
  {
    time: "10:52",
    symbol: "BHARTIARTL",
    priceDeviation: 0.73,
    volumeRatio: 2.4,
    label: "Price + volume anomaly",
  },

  {
    time: "09:15",
    symbol: "HINDUNILVR",
    priceDeviation: 0.10,
    volumeRatio: 0.9,
    label: "Market open",
  },

  {
    time: "09:15",
    symbol: "LT",
    priceDeviation: 0.13,
    volumeRatio: 1.0,
    label: "Market open",
  },
  {
    time: "10:20",
    symbol: "LT",
    priceDeviation: 0.35,
    volumeRatio: 1.4,
    label: "Momentum building",
  },
  {
    time: "10:41",
    symbol: "LT",
    priceDeviation: 0.58,
    volumeRatio: 1.9,
    label: "Unusual movement",
  },
];