"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import Watchlist from "./components/watchlist/Watchlist";
import SearchStocks from "./components/watchlist/SearchStocks";

import MomentsSummary from "./components/moments/MomentsSummary";
import MomentsRanking from "./components/moments/MomentsRanking";
import MomentModal from "./components/moments/MomentModal";

import MarketReplay from "./components/replay/MarketReplay";
import AttentionMap from "./components/attention/AttentionMap";
import EventRipple from "./components/ripple/EventRipple";

import { availableStocks } from "./data/mockStocks";
import { replayEvents } from "./data/replayEvents";

import {
  getStockRelationships,
} from "./lib/marketData";

import {
  calculateAttentionScore,
} from "./lib/attentionScore";

import { Stock } from "./types/stock";


type Tab =
  | "watchlist"
  | "moments"
  | "attention"
  | "ripple";


type MarketEvent = {
  symbol: string;
  title: string;
  publisher: string;
  relevance: number;
  type: string;
  publishedAt?: string | number;
};


type LiveStock = {
  symbol: string;
  price: number;
  volume: number;
  percentChange: number;
  priceDeviation: number;
  volumeRatio: number;
  currency?: string;
  name?: string;
};


type ReplayEvent = {
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


// =============================================================
// HELPERS
// =============================================================

function timeToMinutes(time: string) {
  const [hours, minutes] =
    time.split(":").map(Number);

  return hours * 60 + minutes;
}


function minutesToTime(totalMinutes: number) {
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


function getCurrencySymbol(
  currency?: string
) {
  switch (
    currency?.toUpperCase()
  ) {
    case "INR":
      return "₹";

    case "USD":
      return "$";

    case "GBP":
      return "£";

    case "EUR":
      return "€";

    case "JPY":
      return "¥";

    case "AUD":
      return "A$";

    case "CAD":
      return "C$";

    case "CHF":
      return "CHF ";

    case "HKD":
      return "HK$";

    case "SGD":
      return "S$";

    default:
      return currency
        ? `${currency} `
        : "";
  }
}


function normalizeSymbol(
  symbol: string
) {
  return symbol
    .replace(".NS", "")
    .replace(".BO", "")
    .toUpperCase();
}


// =============================================================
// PAGE
// =============================================================

export default function Home() {

  // ===========================================================
  // WATCHLIST
  // ===========================================================

  const [stocks, setStocks] =
    useState<Stock[]>(
      availableStocks
    );


  // ===========================================================
  // LIVE MARKET DATA
  // ===========================================================

  const [liveStocks, setLiveStocks] =
    useState<LiveStock[]>([]);

  const [liveEvents, setLiveEvents] =
    useState<MarketEvent[]>([]);

  const [replayData, setReplayData] =
    useState<ReplayMarketPoint[]>([]);

  const [isLive, setIsLive] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);


  // ===========================================================
  // UI
  // ===========================================================

  const [activeTab, setActiveTab] =
    useState<Tab>("watchlist");

  const [isSearchOpen, setIsSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedStock, setSelectedStock] =
    useState<Stock | null>(null);


  // ===========================================================
  // MARKET REPLAY
  // ===========================================================

  const startMinutes =
    9 * 60 + 15;

  const endMinutes =
    15 * 60 + 30;

  const [replayMinutes, setReplayMinutes] =
    useState(endMinutes);

  const [isPlaying, setIsPlaying] =
    useState(false);


  // ===========================================================
  // LOAD LIVE MARKET DATA
  // ===========================================================

  useEffect(() => {

    let mounted = true;


    async function loadMarketData() {

      try {

        const symbols =
          stocks
            .map(
              (stock) =>
                stock.symbol
            )
            .filter(Boolean)
            .join(",");


        const endpoint =
          symbols
            ? `/api/market?symbols=${encodeURIComponent(
                symbols
              )}`
            : "/api/market";


        const response =
          await fetch(
            endpoint,
            {
              cache: "no-store",
            }
          );


        if (!response.ok) {

          throw new Error(
            `API returned ${response.status}`
          );

        }


        const data =
          await response.json();


        if (!mounted) {
          return;
        }


        setLiveStocks(
          data.stocks ?? []
        );


        setLiveEvents(
          data.events ?? []
        );


        setReplayData(
          data.replay ?? []
        );


        setLastUpdated(
          data.timestamp ?? null
        );


        setIsLive(true);

      } catch (error) {

        console.error(
          "Failed to load live market data:",
          error
        );


        if (mounted) {

          setIsLive(false);

        }

      }

    }


    loadMarketData();


    const interval =
      setInterval(
        loadMarketData,
        15000
      );


    return () => {

      mounted = false;

      clearInterval(
        interval
      );

    };

  }, [stocks]);


  // ===========================================================
  // REPLAY PLAYER
  // ===========================================================

  useEffect(() => {

    if (!isPlaying) {
      return;
    }


    const interval =
      setInterval(() => {

        setReplayMinutes(
          (current) => {

            if (
              current >=
              endMinutes
            ) {

              setIsPlaying(
                false
              );

              return endMinutes;

            }


            return current + 1;

          }
        );

      }, 500);


    return () => {

      clearInterval(
        interval
      );

    };

  }, [
    isPlaying,
    endMinutes,
  ]);


  // ===========================================================
  // REPLAY-AWARE WATCHLIST
  // ===========================================================

  const mergedStocks =
    useMemo(() => {

      if (
        liveStocks.length === 0
      ) {

        return stocks;

      }


      return stocks.map(
        (stock) => {

          // ---------------------------------------------------
          // FIND LIVE STOCK
          // ---------------------------------------------------

          const liveStock =
            liveStocks.find(
              (item) =>
                normalizeSymbol(
                  item.symbol
                ) ===
                normalizeSymbol(
                  stock.symbol
                )
            );


          // ---------------------------------------------------
          // LIVE NEWS FOR STOCK
          // ---------------------------------------------------

          const stockEvents =
            liveEvents.filter(
              (event) =>
                normalizeSymbol(
                  event.symbol
                ) ===
                normalizeSymbol(
                  stock.symbol
                )
            );


          const liveEventRelevance =
            stockEvents.length > 0
              ? Math.max(
                  ...stockEvents.map(
                    (event) =>
                      event.relevance
                  )
                )
              : 0;


          // ---------------------------------------------------
          // REPLAY POINTS
          // ---------------------------------------------------

          const stockReplay =
            replayData
              .filter(
                (point) =>
                  normalizeSymbol(
                    point.symbol
                  ) ===
                    normalizeSymbol(
                      stock.symbol
                    ) &&
                  timeToMinutes(
                    point.time
                  ) <=
                    replayMinutes
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


          const replayPoint =
            stockReplay[0];


          // =================================================
          // REPLAY MODE
          // =================================================

          if (replayPoint) {

            const previousPoint =
              replayData
                .filter(
                  (point) =>
                    normalizeSymbol(
                      point.symbol
                    ) ===
                      normalizeSymbol(
                        stock.symbol
                      ) &&
                    timeToMinutes(
                      point.time
                    ) <
                      timeToMinutes(
                        replayPoint.time
                      )
                )
                .sort(
                  (a, b) =>
                    timeToMinutes(
                      b.time
                    ) -
                    timeToMinutes(
                      a.time
                    )
                )[0];


            let percentChange = 0;


            if (
              previousPoint &&
              previousPoint.price !== 0
            ) {

              percentChange =
                (
                  (
                    replayPoint.price -
                    previousPoint.price
                  ) /
                  previousPoint.price
                ) *
                100;

            }


            let replayVolumeRatio =
              stock.volumeRatio;


            if (
              previousPoint &&
              previousPoint.volume > 0
            ) {

              replayVolumeRatio =
                replayPoint.volume /
                previousPoint.volume;

            }


            const replayPriceDeviation =
              Math.min(
                Math.abs(
                  percentChange
                ) / 3,
                1
              );


            const previousPrice =
              previousPoint?.price ??
              replayPoint.price;


            const absoluteChange =
              replayPoint.price -
              previousPrice;


            const currency =
              liveStock?.currency ??
              (
                stock.symbol
                  .includes("NSE") ||
                stock.symbol
                  .includes(".NS")
                  ? "INR"
                  : undefined
              );


            const currencySymbol =
              getCurrencySymbol(
                currency
              );


            return {

              ...stock,

              name:
                liveStock?.name ??
                stock.name,

              eventRelevance:
                Math.max(
                  stock.eventRelevance,
                  liveEventRelevance
                ),

              price:
                `${currencySymbol}${replayPoint.price.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}`,

              percent:
                `${
                  percentChange >= 0
                    ? "+"
                    : ""
                }${percentChange.toFixed(
                  2
                )}%`,

              change:
                `${
                  absoluteChange >= 0
                    ? "+"
                    : ""
                }${absoluteChange.toFixed(
                  2
                )}`,

              positive:
                percentChange >=
                0,

              priceDeviation:
                replayPriceDeviation,

              volumeRatio:
                replayVolumeRatio,

            };

          }


          // =================================================
          // LIVE FALLBACK
          // =================================================

          if (!liveStock) {

            return {

              ...stock,

              eventRelevance:
                Math.max(
                  stock.eventRelevance,
                  liveEventRelevance
                ),

            };

          }


          const previousPrice =
            liveStock.percentChange !==
            0
              ? liveStock.price /
                (
                  1 +
                  liveStock.percentChange /
                    100
                )
              : liveStock.price;


          const absoluteChange =
            liveStock.price -
            previousPrice;


          const currencySymbol =
            getCurrencySymbol(
              liveStock.currency
            );


          return {

            ...stock,

            name:
              liveStock.name ??
              stock.name,

            eventRelevance:
              Math.max(
                stock.eventRelevance,
                liveEventRelevance
              ),

            price:
              `${currencySymbol}${liveStock.price.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}`,

            percent:
              `${
                liveStock.percentChange >=
                0
                  ? "+"
                  : ""
              }${liveStock.percentChange.toFixed(
                2
              )}%`,

            change:
              `${
                absoluteChange >=
                0
                  ? "+"
                  : ""
              }${absoluteChange.toFixed(
                2
              )}`,

            positive:
              liveStock.percentChange >=
              0,

            priceDeviation:
              liveStock.priceDeviation,

            volumeRatio:
              liveStock.volumeRatio,

          };

        }
      );

    }, [
      stocks,
      liveStocks,
      liveEvents,
      replayData,
      replayMinutes,
    ]);


  // ===========================================================
  // LIVE NEWS → REPLAY EVENTS
  // ===========================================================

  const liveReplayEvents =
    useMemo<ReplayEvent[]>(() => {

      return liveEvents.map(
        (event) => {

          let time =
            "11:30";


          if (
            event.publishedAt
          ) {

            const date =
              new Date(
                event.publishedAt
              );


            if (
              !Number.isNaN(
                date.getTime()
              )
            ) {

              time =
                date.toLocaleTimeString(
                  "en-IN",
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",

                    hour12:
                      false,

                    timeZone:
                      "Asia/Kolkata",
                  }
                );

            }

          }


          return {

            time,

            symbol:
              normalizeSymbol(
                event.symbol
              ),

            title:
              event.title,

            description:
              `${event.publisher}: ${event.title}`,

          };

        }
      );

    }, [
      liveEvents,
    ]);


  // ===========================================================
  // COMBINE ALL EVENTS
  // ===========================================================

  const allEvents =
    useMemo<ReplayEvent[]>(() => {

      const combined = [
        ...replayEvents,
        ...liveReplayEvents,
      ];


      const seen =
        new Set<string>();


      return combined.filter(
        (event) => {

          const key =
            `${event.symbol}-${event.time}-${event.title}`;


          if (
            seen.has(key)
          ) {

            return false;

          }


          seen.add(key);

          return true;

        }
      );

    }, [
      liveReplayEvents,
    ]);


  // ===========================================================
  // VISIBLE EVENTS
  // ===========================================================

  const visibleEvents =
    useMemo(() => {

      return allEvents
        .filter(
          (event) => {

            const eventMinutes =
              timeToMinutes(
                event.time
              );


            return (
              eventMinutes >=
                startMinutes &&
              eventMinutes <=
                replayMinutes
            );

          }
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

    }, [
      allEvents,
      replayMinutes,
      startMinutes,
    ]);


  const currentEvent =
    visibleEvents[0];


  // ===========================================================
  // REPLAY PROGRESS
  // ===========================================================

  const progress =
    (
      (
        replayMinutes -
        startMinutes
      ) /
      (
        endMinutes -
        startMinutes
      )
    ) *
    100;


  // ===========================================================
  // ATTENTION EVENTS
  // ===========================================================

  const attentionEvents =
    useMemo<ReplayEvent[]>(() => {

      return allEvents.filter(
        (event) =>
          timeToMinutes(
            event.time
          ) <=
          replayMinutes
      );

    }, [
      allEvents,
      replayMinutes,
    ]);


  // ===========================================================
  // ATTENTION SCORES
  // ===========================================================

  const attentionStocks =
    useMemo(() => {

      return mergedStocks
        .map(
          (stock) => ({

            ...stock,

            attentionScore:
              calculateAttentionScore(
                stock,
                replayMinutes,
                attentionEvents,
                replayData
              ),

          })
        )
        .sort(
          (a, b) =>
            b.attentionScore -
            a.attentionScore
        );

    }, [
      mergedStocks,
      replayMinutes,
      attentionEvents,
      replayData,
    ]);


  // ===========================================================
  // MOMENTS
  // ===========================================================

  const momentStocks =
    useMemo(() => {

      return attentionStocks.filter(
        (stock) =>
          stock.attentionScore >=
          50
      );

    }, [
      attentionStocks,
    ]);


  // ===========================================================
  // SEARCH RESULTS
  // ===========================================================

  const searchResults =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (!query) {

        return availableStocks;

      }


      return availableStocks.filter(
        (stock) =>
          stock.symbol
            .toLowerCase()
            .includes(query) ||
          stock.name
            .toLowerCase()
            .includes(query)
      );

    }, [
      searchQuery,
    ]);


  // ===========================================================
  // SELECTED STOCK
  // ===========================================================

  const selectedLiveStock =
    useMemo(() => {

      if (!selectedStock) {
        return null;
      }


      return (
        mergedStocks.find(
          (stock) =>
            normalizeSymbol(
              stock.symbol
            ) ===
            normalizeSymbol(
              selectedStock.symbol
            )
        ) ??
        selectedStock
      );

    }, [
      selectedStock,
      mergedStocks,
    ]);


  // ===========================================================
  // SELECTED SCORE
  // ===========================================================

  const selectedScore =
    useMemo(() => {

      if (
        !selectedLiveStock
      ) {

        return 0;

      }


      return calculateAttentionScore(
        selectedLiveStock,
        replayMinutes,
        attentionEvents,
        replayData
      );

    }, [
      selectedLiveStock,
      replayMinutes,
      attentionEvents,
      replayData,
    ]);


  // ===========================================================
  // SELECTED EVENTS
  // ===========================================================

  const selectedEvents =
    useMemo<ReplayEvent[]>(() => {

      if (
        !selectedLiveStock
      ) {

        return [];

      }


      return allEvents
        .filter(
          (event) =>
            normalizeSymbol(
              event.symbol
            ) ===
              normalizeSymbol(
                selectedLiveStock.symbol
              ) &&
            timeToMinutes(
              event.time
            ) <=
              replayMinutes
        )
        .sort(
          (a, b) =>
            timeToMinutes(
              a.time
            ) -
            timeToMinutes(
              b.time
            )
        );

    }, [
      selectedLiveStock,
      allEvents,
      replayMinutes,
    ]);


  // ===========================================================
  // SEARCH
  // ===========================================================

  const handleSearch =
    () => {

      setIsSearchOpen(
        true
      );

    };


  // ===========================================================
  // ADD STOCK
  // ===========================================================

  const handleAddStock =
    (stock: Stock) => {

      setStocks(
        (current) => {

          const exists =
            current.some(
              (item) =>
                normalizeSymbol(
                  item.symbol
                ) ===
                normalizeSymbol(
                  stock.symbol
                )
            );


          if (exists) {

            return current;

          }


          return [
            ...current,
            stock,
          ];

        }
      );


      setSearchQuery("");

    };


  // ===========================================================
  // REMOVE STOCK
  // ===========================================================

  const handleRemoveStock =
    (symbol: string) => {

      setStocks(
        (current) =>
          current.filter(
            (stock) =>
              normalizeSymbol(
                stock.symbol
              ) !==
              normalizeSymbol(
                symbol
              )
          )
      );


      if (
        selectedStock &&
        normalizeSymbol(
          selectedStock.symbol
        ) ===
          normalizeSymbol(
            symbol
          )
      ) {

        setSelectedStock(
          null
        );

      }

    };


  // ===========================================================
  // TAB CHANGE
  // ===========================================================

  const handleTabChange =
    (tab: Tab) => {

      setActiveTab(
        tab
      );

    };


  // ===========================================================
  // PLAY / PAUSE
  // ===========================================================

  const handlePlayPause =
    () => {

      if (
        replayMinutes >=
        endMinutes
      ) {

        setReplayMinutes(
          startMinutes
        );

        setIsPlaying(
          true
        );

        return;

      }


      setIsPlaying(
        (current) =>
          !current
      );

    };


  // ===========================================================
  // RESET
  // ===========================================================

  const handleReset =
    () => {

      setIsPlaying(
        false
      );

      setReplayMinutes(
        startMinutes
      );

    };


  // ===========================================================
  // JUMP TO NOW
  // ===========================================================

  const handleJumpToNow =
    () => {

      setIsPlaying(
        false
      );

      setReplayMinutes(
        endMinutes
      );

    };


  // ===========================================================
  // SLIDER SEEK
  // ===========================================================

  const handleReplaySeek =
    (minutes: number) => {

      setIsPlaying(
        false
      );


      setReplayMinutes(
        Math.min(
          Math.max(
            minutes,
            startMinutes
          ),
          endMinutes
        )
      );

    };


  // ===========================================================
  // INSPECT EVENT
  // ===========================================================

  const handleInspectEvent =
    (event: ReplayEvent) => {

      const stock =
        mergedStocks.find(
          (item) =>
            normalizeSymbol(
              item.symbol
            ) ===
            normalizeSymbol(
              event.symbol
            )
        );


      if (stock) {

        setSelectedStock(
          stock
        );

      }

    };


  // ===========================================================
  // RENDER
  // ===========================================================

  return (

    <div className="min-h-screen bg-[#080d0b] text-white">

      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <Sidebar
          activeTab={
            activeTab
          }
          momentCount={
            momentStocks.length
          }
          onTabChange={
            handleTabChange
          }
        />


        {/* =====================================================
            MAIN
        ====================================================== */}

        <main className="min-w-0 flex-1">

          <Header
            onSearch={
              handleSearch
            }
          />


          <div className="mx-auto max-w-[1500px] px-6 py-6 lg:px-8">

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  WATCHLIST
                </div>


                <h1 className="text-2xl font-semibold tracking-tight">
                  Your Watchlist
                </h1>


                <p className="mt-1 text-sm text-white/35">
                  Keep track of the
                  stocks that matter
                  to you.
                </p>

              </div>


              {/* =================================================
                  LIVE STATUS
              ================================================== */}

              <div className="flex items-center gap-3">

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2">

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLive
                        ? "bg-[#00d9a5]"
                        : "bg-white/20"
                    }`}
                  />


                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isLive
                        ? "text-[#00d9a5]"
                        : "text-white/30"
                    }`}
                  >
                    {isLive
                      ? "Live"
                      : "Offline"}
                  </span>

                </div>


                {lastUpdated && (

                  <span className="hidden text-[10px] text-white/20 xl:block">

                    Updated{" "}

                    {new Date(
                      lastUpdated
                    ).toLocaleTimeString(
                      "en-IN",
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit",

                        second:
                          "2-digit",
                      }
                    )}

                  </span>

                )}

              </div>

            </div>


            {/* =================================================
                WATCHLIST
            ================================================== */}

            {activeTab ===
              "watchlist" && (

              <>

                <MarketReplay
                  replayMinutes={
                    replayMinutes
                  }

                  startMinutes={
                    startMinutes
                  }

                  endMinutes={
                    endMinutes
                  }

                  isPlaying={
                    isPlaying
                  }

                  progress={Math.min(
                    Math.max(
                      progress,
                      0
                    ),
                    100
                  )}

                  currentEvent={
                    currentEvent
                  }

                  visibleEvents={
                    visibleEvents
                  }

                  replayData={
                    replayData
                  }

                  onPlayPause={
                    handlePlayPause
                  }

                  onReset={
                    handleReset
                  }

                  onJumpToNow={
                    handleJumpToNow
                  }

                  onInspectEvent={
                    handleInspectEvent
                  }

                  onReplaySeek={
                    handleReplaySeek
                  }
                />


                <MomentsSummary
                  stocks={
                    momentStocks
                  }

                  onViewMoments={() =>
                    setActiveTab(
                      "moments"
                    )
                  }

                  onSelectStock={
                    setSelectedStock
                  }
                />


                <Watchlist
                  watchlist={
                    mergedStocks
                  }

                  onAddStock={() =>
                    setIsSearchOpen(
                      true
                    )
                  }

                  onRemoveStock={
                    handleRemoveStock
                  }
                />

              </>

            )}


            {/* =================================================
                MOMENTS
            ================================================== */}

            {activeTab ===
              "moments" && (

              <>

                <MomentsSummary
                  stocks={
                    momentStocks
                  }

                  onViewMoments={() =>
                    setActiveTab(
                      "watchlist"
                    )
                  }

                  onSelectStock={
                    setSelectedStock
                  }
                />


                <MomentsRanking
                  stocks={
                    attentionStocks
                  }

                  replayMinutes={
                    replayMinutes
                  }

                  onSelectStock={
                    setSelectedStock
                  }
                />

              </>

            )}


            {/* =================================================
                ATTENTION
            ================================================== */}

            {activeTab ===
              "attention" && (

              <AttentionMap
                stocks={
                  attentionStocks
                }

                onSelectStock={
                  setSelectedStock
                }
              />

            )}


            {/* =================================================
                EVENT RIPPLE
            ================================================== */}

            {activeTab ===
              "ripple" && (

              <EventRipple
                events={
                  allEvents
                }

                stocks={
                  attentionStocks
                }

                relationships={
                  getStockRelationships()
                }

                replayMinutes={
                  replayMinutes
                }

                onSelectStock={
                  setSelectedStock
                }
              />

            )}

          </div>

        </main>

      </div>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <SearchStocks
        isOpen={
          isSearchOpen
        }

        searchQuery={
          searchQuery
        }

        searchResults={
          searchResults
        }

        watchlist={
          stocks
        }

        onSearchChange={
          setSearchQuery
        }

        onAddStock={
          handleAddStock
        }

        onClose={() => {

          setIsSearchOpen(
            false
          );

          setSearchQuery(
            ""
          );

        }}
      />


      {/* =====================================================
          MOMENT MODAL
      ====================================================== */}

      <MomentModal
        stock={
          selectedLiveStock
        }

        attentionScore={
          selectedScore
        }

        currentMinutes={
          replayMinutes
        }

        events={
          selectedEvents
        }

        relationships={
          getStockRelationships()
        }

        onClose={() =>
          setSelectedStock(
            null
          )
        }
      />

    </div>

  );

}