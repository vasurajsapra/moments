import { Stock } from "../types/stock";
import { StockRelationship } from "../data/stockRelationships";
import { timeToMinutes } from "./attentionScore";

type ReplayEvent = {
  time: string;
  symbol: string;
  title: string;
  description: string;
};

type ExplanationInput = {
  stock: Stock;
  currentMinutes: number;
  events: ReplayEvent[];
  relationships: StockRelationship[];
};

export function generateMomentExplanation({
  stock,
  currentMinutes,
  events,
  relationships,
}: ExplanationInput) {
  /*
   * ---------------------------------------------------------
   * FIND RELEVANT EVENTS
   * ---------------------------------------------------------
   */

  const relevantEvents = events.filter(
    (event) =>
      event.symbol === stock.symbol &&
      timeToMinutes(event.time) <=
        currentMinutes
  );

  const latestEvent =
    relevantEvents[
      relevantEvents.length - 1
    ];

  /*
   * ---------------------------------------------------------
   * FIND RELATED STOCKS
   * ---------------------------------------------------------
   */

  const relatedStocks =
    relationships.filter(
      (relationship) =>
        relationship.source ===
        stock.symbol
    );

  const strongestRelationship =
    [...relatedStocks].sort(
      (a, b) =>
        b.strength - a.strength
    )[0];

  /*
   * ---------------------------------------------------------
   * BUILD EXPLANATION SIGNALS
   * ---------------------------------------------------------
   */

  const parts: string[] = [];

  /*
   * PRICE SIGNAL
   */

  if (stock.priceDeviation >= 0.7) {
    parts.push(
      `the price movement is unusually strong, with a ${Math.round(
        stock.priceDeviation * 100
      )}% anomaly signal`
    );
  } else if (
    stock.priceDeviation >= 0.5
  ) {
    parts.push(
      `the price movement is significantly outside its normal pattern`
    );
  } else if (
    stock.priceDeviation >= 0.3
  ) {
    parts.push(
      `the stock is showing a meaningful price deviation`
    );
  }

  /*
   * VOLUME SIGNAL
   */

  if (stock.volumeRatio >= 2.5) {
    parts.push(
      `trading activity is running at ${stock.volumeRatio.toFixed(
        1
      )}× its normal level`
    );
  } else if (
    stock.volumeRatio >= 2
  ) {
    parts.push(
      `trading activity is running at ${stock.volumeRatio.toFixed(
        1
      )}× its normal level`
    );
  } else if (
    stock.volumeRatio >= 1.4
  ) {
    parts.push(
      `trading activity is elevated above its normal baseline`
    );
  }

  /*
   * EVENT SIGNAL
   */

  if (latestEvent) {
    parts.push(
      `a relevant event was detected: "${latestEvent.title}"`
    );
  }

  /*
   * NO STRONG SIGNAL
   */

  if (parts.length === 0) {
    return `${stock.symbol} is currently showing limited unusual activity, so there is no strong signal that requires immediate attention.`;
  }

  /*
   * ---------------------------------------------------------
   * COMBINE SIGNALS
   * ---------------------------------------------------------
   */

  let explanation =
    `${stock.symbol} is worth noticing because ${parts.join(
      ", "
    )}.`;

  /*
   * ---------------------------------------------------------
   * EVENT RECENCY
   * ---------------------------------------------------------
   */

  if (latestEvent) {
    const minutesSinceEvent =
      Math.max(
        currentMinutes -
          timeToMinutes(
            latestEvent.time
          ),
        0
      );

    if (minutesSinceEvent <= 10) {
      explanation +=
        " This event is very recent, so its connection to the current movement deserves close attention.";
    } else if (
      minutesSinceEvent <= 30
    ) {
      explanation +=
        " The event is still recent enough to be a meaningful part of the current signal.";
    } else if (
      minutesSinceEvent <= 60
    ) {
      explanation +=
        " The event is becoming less recent, so its contribution to the attention signal is gradually fading.";
    } else {
      explanation +=
        " Because the event is older, its contribution to the current attention signal is lower.";
    }
  }

  /*
   * ---------------------------------------------------------
   * RELATED STOCK CONTEXT
   * ---------------------------------------------------------
   */

  if (
    latestEvent &&
    strongestRelationship
  ) {
    explanation +=
      ` This may also matter for related stocks through ${strongestRelationship.relationship.toLowerCase()}.`;
  }

  /*
   * ---------------------------------------------------------
   * SIGNAL INTERPRETATION
   * ---------------------------------------------------------
   */

  if (
    stock.priceDeviation >= 0.5 &&
    stock.volumeRatio >= 2
  ) {
    explanation +=
      " The combination of an unusual price move and elevated volume makes this a stronger-than-normal market signal.";
  } else if (
    stock.priceDeviation >= 0.5
  ) {
    explanation +=
      " The price movement alone is strong enough to make this worth investigating.";
  } else if (
    stock.volumeRatio >= 2
  ) {
    explanation +=
      " The unusually high trading activity suggests that participation has increased significantly.";
  }

  return explanation;
}