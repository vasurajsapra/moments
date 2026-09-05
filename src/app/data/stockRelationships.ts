export type StockRelationship = {
  source: string;
  target: string;
  relationship: string;
  strength: number;
};

export const stockRelationships: StockRelationship[] = [
  {
    source: "RELIANCE",
    target: "BHARTIARTL",
    relationship: "Large-cap market sentiment",
    strength: 0.72,
  },
  {
    source: "RELIANCE",
    target: "TCS",
    relationship: "Institutional risk sentiment",
    strength: 0.58,
  },
  {
    source: "TCS",
    target: "INFY",
    relationship: "IT sector sentiment",
    strength: 0.91,
  },
  {
    source: "INFY",
    target: "TCS",
    relationship: "IT sector sentiment",
    strength: 0.91,
  },
  {
    source: "HDFCBANK",
    target: "ICICIBANK",
    relationship: "Private banking sentiment",
    strength: 0.88,
  },
  {
    source: "ICICIBANK",
    target: "HDFCBANK",
    relationship: "Private banking sentiment",
    strength: 0.88,
  },
  {
    source: "SBIN",
    target: "HDFCBANK",
    relationship: "Banking sector sentiment",
    strength: 0.76,
  },
  {
    source: "SBIN",
    target: "ICICIBANK",
    relationship: "Banking sector sentiment",
    strength: 0.74,
  },
  {
    source: "BHARTIARTL",
    target: "RELIANCE",
    relationship: "Large-cap market sentiment",
    strength: 0.72,
  },
  {
    source: "LT",
    target: "RELIANCE",
    relationship: "Large-cap market sentiment",
    strength: 0.55,
  },
];