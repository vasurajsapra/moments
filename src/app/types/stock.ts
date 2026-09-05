export type Stock = {
  symbol: string;
  name: string;
  price: string;
  percent: string;
  change: string;
  positive: boolean;
  moment: boolean;

  priceDeviation: number;
  volumeRatio: number;
  eventRelevance: number;
  eventTime: string;
};