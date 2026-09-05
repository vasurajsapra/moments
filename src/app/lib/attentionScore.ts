import { Stock } from "../types/stock";

type AttentionEvent = {
  time: string;
  symbol: string;
  title: string;
  description: string;
};

type ReplayMarketPoint = {
  time: string;
  symbol: string;
  price: number;
  volume: number;
};

export function timeToMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(
  totalMinutes: number
) {
  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

/**
 * Calculate attention from the actual replay data
 * available at the selected market minute.
 *
 * Score:
 *
 * Price anomaly   35%
 * Volume anomaly  30%
 * Event relevance 25%
 * Recency         10%
 */
export function calculateAttentionScore(
  stock: Stock,
  currentMinutes: number,
  events: AttentionEvent[] = [],
  replayData: ReplayMarketPoint[] = []
) {
  // =========================================================
  // FIND CURRENT REPLAY POINTS
  // =========================================================

  const stockReplay =
    replayData
      .filter(
        (point) =>
          point.symbol ===
            stock.symbol &&
          timeToMinutes(
            point.time
          ) <= currentMinutes
      )
      .sort(
        (a, b) =>
          timeToMinutes(
            b.time
          ) -
          timeToMinutes(
            a.time
          )
      );

  const currentPoint =
    stockReplay[0];

  // =========================================================
  // PRICE ANOMALY
  // =========================================================

  let priceSignal =
    stock.priceDeviation * 100;

  if (
    currentPoint &&
    stockReplay.length >= 2
  ) {
    const previousPoint =
      stockReplay[1];

    if (
      previousPoint.price !== 0
    ) {
      const returnPercent =
        Math.abs(
          ((currentPoint.price -
            previousPoint.price) /
            previousPoint.price) *
            100
        );

      /*
       * A 3% one-minute move is treated
       * as an extreme anomaly.
       */

      priceSignal = Math.min(
        (returnPercent / 3) *
          100,
        100
      );
    }
  }

  // =========================================================
  // VOLUME ANOMALY
  // =========================================================

  let volumeSignal = Math.min(
    Math.max(
      ((stock.volumeRatio - 1) /
        2.5) *
        100,
      0
    ),
    100
  );

  if (
    currentPoint &&
    stockReplay.length >= 6
  ) {
    /*
     * Compare the current minute's volume
     * against the previous 20 available
     * observations.
     */

    const baseline =
      stockReplay
        .slice(1, 21)
        .map(
          (point) =>
            point.volume
        )
        .filter(
          (volume) =>
            volume > 0
        );

    if (
      baseline.length > 0 &&
      currentPoint.volume > 0
    ) {
      const averageVolume =
        baseline.reduce(
          (sum, volume) =>
            sum + volume,
          0
        ) /
        baseline.length;

      if (averageVolume > 0) {
        const volumeRatio =
          currentPoint.volume /
          averageVolume;

        /*
         * 3.5x baseline is treated
         * as an extreme volume anomaly.
         */

        volumeSignal = Math.min(
          Math.max(
            ((volumeRatio - 1) /
              2.5) *
              100,
            0
          ),
          100
        );
      }
    }
  }

  // =========================================================
  // EVENTS
  // =========================================================

  const stockEvents =
    events
      .filter(
        (event) =>
          event.symbol ===
            stock.symbol &&
          timeToMinutes(
            event.time
          ) <= currentMinutes
      )
      .sort(
        (a, b) =>
          timeToMinutes(
            b.time
          ) -
          timeToMinutes(
            a.time
          )
      );

  const latestEvent =
    stockEvents[0];

  let eventSignal = 0;
  let recencySignal = 0;

  if (latestEvent) {
    const eventMinutes =
      timeToMinutes(
        latestEvent.time
      );

    const minutesSinceEvent =
      Math.max(
        currentMinutes -
          eventMinutes,
        0
      );

    /*
     * Event relevance is strongest immediately
     * after the event and gradually fades.
     */

    const eventRecency =
      Math.max(
        0,
        100 -
          (minutesSinceEvent /
            90) *
            100
      );

    const eventRelevance =
      stock.eventRelevance * 100;

    eventSignal =
      (eventRelevance *
        eventRecency) /
      100;

    /*
     * Recency has its own smaller contribution.
     */

    recencySignal =
      Math.max(
        0,
        100 -
          (minutesSinceEvent /
            120) *
            100
      );
  }

  // =========================================================
  // FINAL SCORE
  // =========================================================

  const score = Math.round(
    priceSignal * 0.35 +
      volumeSignal * 0.3 +
      eventSignal * 0.25 +
      recencySignal * 0.1
  );

  return Math.min(
    Math.max(score, 0),
    100
  );
}

// ===========================================================
// LABEL
// ===========================================================

export function getScoreLabel(
  score: number
) {
  if (score >= 80) {
    return "HIGH ATTENTION";
  }

  if (score >= 60) {
    return "MEDIUM ATTENTION";
  }

  return "LOW ATTENTION";
}

// ===========================================================
// DESCRIPTION
// ===========================================================

export function getScoreDescription(
  score: number
) {
  if (score >= 80) {
    return "This stock has multiple signals that deserve your attention.";
  }

  if (score >= 60) {
    return "There are meaningful changes, but the signals are less significant.";
  }

  return "Current activity does not indicate a major change.";
}

// ===========================================================
// MARKET SIGNAL
// ===========================================================

export function getMarketSignal(
  symbol: string,
  currentMinutes: number,
  signals: {
    time: string;
    symbol: string;
    priceDeviation: number;
    volumeRatio: number;
    label: string;
  }[]
) {
  const stockSignals =
    signals.filter(
      (signal) =>
        signal.symbol ===
          symbol &&
        timeToMinutes(
          signal.time
        ) <= currentMinutes
    );

  if (
    stockSignals.length === 0
  ) {
    return null;
  }

  return stockSignals[
    stockSignals.length - 1
  ];
}