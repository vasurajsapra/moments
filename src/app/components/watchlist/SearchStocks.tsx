"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  X,
  Plus,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Stock } from "../../types/stock";


type SearchStocksProps = {
  isOpen: boolean;

  searchQuery: string;

  searchResults: Stock[];

  watchlist: Stock[];

  onSearchChange:
    (query: string) => void;

  onAddStock:
    (stock: Stock) => void;

  onClose:
    () => void;
};


type SearchResult = {
  symbol: string;

  yahooSymbol?: string;

  name: string;

  exchange?: string;

  type?: string;

  price?: number;

  currency?: string;
};


export default function SearchStocks({
  isOpen,
  searchQuery,
  searchResults,
  watchlist,
  onSearchChange,
  onAddStock,
  onClose,
}: SearchStocksProps) {

  const [
    dynamicResults,
    setDynamicResults,
  ] = useState<SearchResult[]>([]);


  const [
    isSearching,
    setIsSearching,
  ] = useState(false);


  const [
    searchError,
    setSearchError,
  ] = useState("");


  const [
    addingSymbol,
    setAddingSymbol,
  ] = useState<string | null>(
    null
  );


  // =========================================================
  // SEARCH
  // =========================================================

  useEffect(() => {

    if (!isOpen) {
      return;
    }


    const query =
      searchQuery.trim();


    if (!query) {

      setDynamicResults([]);

      setSearchError("");

      setIsSearching(false);

      return;

    }


    const controller =
      new AbortController();


    const timer =
      setTimeout(
        async () => {

          try {

            setIsSearching(
              true
            );

            setSearchError("");


            // =================================================
            // STEP 1
            // NORMAL SEARCH ENDPOINT
            // =================================================

            const searchResponse =
              await fetch(
                `/api/market?search=${encodeURIComponent(
                  query
                )}`,
                {
                  signal:
                    controller.signal,

                  cache:
                    "no-store",
                }
              );


            let searchData:
              {
                stocks?: SearchResult[];
              } = {};


            try {

              searchData =
                await searchResponse.json();

            } catch {

              searchData = {};

            }


            let results =
              searchData.stocks ?? [];


            // =================================================
            // STEP 2
            // DIRECT TICKER FALLBACK
            //
            // If Yahoo search gives nothing,
            // directly try the ticker.
            //
            // WIPRO
            // WIPRO.NS
            // WIPRO.BO
            // =================================================

            if (
              results.length === 0
            ) {

              const cleanQuery =
                query
                  .trim()
                  .toUpperCase()
                  .replace(
                    /\s+/g,
                    ""
                  );


              const candidates =
                cleanQuery.includes(".")
                  ? [
                      cleanQuery,
                    ]
                  : [
                      `${cleanQuery}.NS`,
                      `${cleanQuery}.BO`,
                      cleanQuery,
                    ];


              for (
                const candidate
                of candidates
              ) {

                try {

                  const response =
                    await fetch(
                      `/api/market?symbol=${encodeURIComponent(
                        candidate
                      )}`,
                      {
                        signal:
                          controller.signal,

                        cache:
                          "no-store",
                      }
                    );


                  if (
                    !response.ok
                  ) {
                    continue;
                  }


                  const data =
                    await response.json();


                  const live =
                    data.stocks?.[0];


                  if (!live) {
                    continue;
                  }


                  results = [

                    {

                      symbol:
                        live.symbol ??
                        candidate
                          .replace(
                            ".NS",
                            ""
                          )
                          .replace(
                            ".BO",
                            ""
                          ),

                      yahooSymbol:
                        live.yahooSymbol ??
                        candidate,

                      name:
                        live.name ??
                        live.symbol ??
                        candidate,

                      exchange:
                        candidate.endsWith(
                          ".NS"
                        )
                          ? "NSE"
                          : candidate.endsWith(
                              ".BO"
                            )
                          ? "BSE"
                          : "",

                      type:
                        "EQUITY",

                      price:
                        Number(
                          live.price ??
                          0
                        ),

                      currency:
                        live.currency ??
                        "",

                    },

                  ];


                  // We found it.
                  break;

                } catch (
                  error
                ) {

                  if (
                    error instanceof
                      DOMException &&
                    error.name ===
                      "AbortError"
                  ) {

                    return;

                  }

                }

              }

            }


            if (
              !controller.signal.aborted
            ) {

              setDynamicResults(
                results
              );

            }

          } catch (
            error
          ) {

            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {

              return;

            }


            console.error(
              "Stock search failed:",
              error
            );


            setDynamicResults([]);

            setSearchError(
              "Unable to search market data."
            );

          } finally {

            if (
              !controller.signal.aborted
            ) {

              setIsSearching(
                false
              );

            }

          }

        },
        350
      );


    return () => {

      clearTimeout(
        timer
      );

      controller.abort();

    };

  }, [
    searchQuery,
    isOpen,
  ]);


  // =========================================================
  // DUPLICATE CHECK
  // =========================================================

  const isAlreadyAdded = (
    symbol: string
  ) => {

    return watchlist.some(
      (stock) =>
        stock.symbol
          .toUpperCase()
          .replace(
            ".NS",
            ""
          )
          .replace(
            ".BO",
            ""
          ) ===
        symbol
          .toUpperCase()
          .replace(
            ".NS",
            ""
          )
          .replace(
            ".BO",
            ""
          )
    );

  };


  // =========================================================
  // CURRENCY
  // =========================================================

  const getCurrencySymbol = (
    currency?: string
  ) => {

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

      case "HKD":
        return "HK$";

      case "SGD":
        return "S$";

      default:
        return currency
          ? `${currency} `
          : "";

    }

  };


  // =========================================================
  // ADD STOCK
  // =========================================================

  const handleAddResult =
    async (
      result: SearchResult
    ) => {

      const symbol =
        result.symbol;


      if (
        isAlreadyAdded(
          symbol
        )
      ) {

        return;

      }


      try {

        setAddingSymbol(
          symbol
        );

        setSearchError("");


        const yahooSymbol =
          result.yahooSymbol ??
          result.symbol;


        // ===================================================
        // FETCH FINAL LIVE DATA
        // ===================================================

        const response =
          await fetch(
            `/api/market?symbol=${encodeURIComponent(
              yahooSymbol
            )}`,
            {
              cache:
                "no-store",
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {

          throw new Error(
            data.error ??
            "Unable to fetch stock"
          );

        }


        const live =
          data.stocks?.[0];


        if (!live) {

          throw new Error(
            "No market data returned"
          );

        }


        const percentChange =
          Number(
            live.percentChange ??
            0
          );


        const price =
          Number(
            live.price ??
            0
          );


        const previousPrice =
          percentChange !== 0
            ? price /
              (
                1 +
                percentChange /
                  100
              )
            : price;


        const absoluteChange =
          price -
          previousPrice;


        const currency =
          live.currency ??
          result.currency ??
          "";


        const currencySymbol =
          getCurrencySymbol(
            currency
          );


        const dynamicStock:
          Stock = {

          symbol:
            live.symbol ??
            result.symbol,

          name:
            live.name ??
            result.name ??
            result.symbol,

          price:
            `${currencySymbol}${price.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}`,

          percent:
            `${
              percentChange >=
              0
                ? "+"
                : ""
            }${percentChange.toFixed(
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
            percentChange >=
            0,

          moment:
            false,

          priceDeviation:
            Number(
              live.priceDeviation ??
              0
            ),

          volumeRatio:
            Number(
              live.volumeRatio ??
              0
            ),

          eventRelevance:
            0,

          eventTime:
            "",

        };


        onAddStock(
          dynamicStock
        );


        onClose();

      } catch (
        error
      ) {

        console.error(
          "Failed to add stock:",
          error
        );


        setSearchError(
          `Unable to fetch ${symbol}.`
        );

      } finally {

        setAddingSymbol(
          null
        );

      }

    };


  // =========================================================
  // CLOSED
  // =========================================================

  if (!isOpen) {

    return null;

  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm"

      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {

          onClose();

        }

      }}
    >

      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d120f] shadow-2xl">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>

            <div className="text-sm font-semibold text-white">
              Add to watchlist
            </div>

            <div className="mt-1 text-xs text-white/30">
              Search stocks and instruments
            </div>

          </div>


          <button
            onClick={
              onClose
            }

            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/5 hover:text-white"
          >

            <X className="h-4 w-4" />

          </button>

        </div>


        {/* ===================================================
            BODY
        ==================================================== */}

        <div className="p-5">

          {/* SEARCH INPUT */}

          <div className="relative">

            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />


            <input
              autoFocus

              value={
                searchQuery
              }

              onChange={(
                event
              ) =>
                onSearchChange(
                  event.target.value
                )
              }

              onKeyDown={(
                event
              ) => {

                if (
                  event.key ===
                  "Escape"
                ) {

                  onClose();

                }

              }}

              placeholder="Search Wipro, Apple, TCS, Nvidia..."

              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#00d9a5]/40"
            />

          </div>


          {/* SEARCHING */}

          {isSearching && (

            <div className="mt-4 flex items-center gap-2 text-xs text-white/30">

              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00d9a5]" />

              Finding market instruments...

            </div>

          )}


          {/* ERROR */}

          {searchError && (

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2.5 text-xs text-red-300/70">

              <AlertCircle className="h-3.5 w-3.5 shrink-0" />

              {searchError}

            </div>

          )}


          {/* =================================================
              POPULAR RESULTS
          ================================================== */}

          {!searchQuery.trim() && (

            <div className="mt-5">

              <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/20">

                Popular in your watchlist

              </div>


              <div className="space-y-1">

                {searchResults
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      stock
                    ) => (

                      <StockRow
                        key={
                          stock.symbol
                        }

                        symbol={
                          stock.symbol
                        }

                        name={
                          stock.name
                        }

                        price={
                          stock.price
                        }

                        added={
                          isAlreadyAdded(
                            stock.symbol
                          )
                        }

                        loading={
                          addingSymbol ===
                          stock.symbol
                        }

                        onAdd={() =>
                          handleAddResult(
                            {
                              symbol:
                                stock.symbol,

                              name:
                                stock.name,
                            }
                          )
                        }
                      />

                    )
                  )}

              </div>

            </div>

          )}


          {/* =================================================
              SEARCH RESULTS
          ================================================== */}

          {searchQuery.trim() && (

            <div className="mt-5">

              <div className="mb-3 flex items-center justify-between">

                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/20">

                  Market results

                </div>


                {dynamicResults.length >
                  0 && (

                  <div className="text-[10px] text-white/20">

                    Live market data

                  </div>

                )}

              </div>


              {dynamicResults.length >
              0 ? (

                <div className="space-y-1">

                  {dynamicResults.map(
                    (
                      result
                    ) => (

                      <StockRow
                        key={
                          result.yahooSymbol ??
                          result.symbol
                        }

                        symbol={
                          result.symbol
                        }

                        name={
                          result.name
                        }

                        exchange={
                          result.exchange
                        }

                        price={
                          result.price !==
                          undefined
                            ? `${getCurrencySymbol(
                                result.currency
                              )}${result.price.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}`
                            : undefined
                        }

                        added={
                          isAlreadyAdded(
                            result.symbol
                          )
                        }

                        loading={
                          addingSymbol ===
                          result.symbol
                        }

                        onAdd={() =>
                          handleAddResult(
                            result
                          )
                        }
                      />

                    )
                  )}

                </div>

              ) : !isSearching &&
                !searchError ? (

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">

                  <Search className="mx-auto h-5 w-5 text-white/15" />

                  <p className="mt-3 text-sm text-white/35">

                    No matching instruments found.

                  </p>

                  <p className="mt-1 text-xs text-white/20">

                    Try a ticker such as WIPRO or TCS.

                  </p>

                </div>

              ) : null}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}


// =============================================================
// STOCK ROW
// =============================================================

function StockRow({
  symbol,
  name,
  price,
  exchange,
  added,
  loading,
  onAdd,
}: {
  symbol: string;
  name: string;
  price?: string;
  exchange?: string;
  added: boolean;
  loading: boolean;
  onAdd: () => void;
}) {

  return (

    <div className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-white/5 hover:bg-white/[0.025]">

      {/* ICON */}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[10px] font-bold text-white/50">

        {symbol.slice(
          0,
          3
        )}

      </div>


      {/* NAME */}

      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">

          <span className="text-sm font-semibold text-white">

            {symbol}

          </span>


          {exchange && (

            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/25">

              {exchange}

            </span>

          )}

        </div>


        <div className="mt-0.5 truncate text-xs text-white/30">

          {name}

        </div>

      </div>


      {/* PRICE */}

      {price && (

        <div className="hidden text-right sm:block">

          <div className="text-[9px] uppercase tracking-wider text-white/15">

            Price

          </div>


          <div className="mt-0.5 text-xs text-white/45">

            {price}

          </div>

        </div>

      )}


      {/* ADD */}

      <button

        onClick={
          onAdd
        }

        disabled={
          added ||
          loading
        }

        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
          added
            ? "bg-white/5 text-white/25"
            : "bg-[#00d9a5]/10 text-[#00d9a5] hover:bg-[#00d9a5]/20"
        }`}
      >

        {loading ? (

          <Loader2 className="h-3.5 w-3.5 animate-spin" />

        ) : added ? (

          <Check className="h-3.5 w-3.5" />

        ) : (

          <Plus className="h-3.5 w-3.5" />

        )}


        {loading
          ? "Fetching"
          : added
          ? "Added"
          : "Add"}

      </button>

    </div>

  );

}