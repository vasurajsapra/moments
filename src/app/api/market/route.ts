import { NextResponse } from "next/server";

import {
  fetchLiveMarketData,
  getMarketSignals,
  getStockRelationships,
} from "../../lib/marketData";


export async function GET(
  request: Request
) {

  const { searchParams } =
    new URL(request.url);

  const symbol =
    searchParams.get(
      "symbol"
    );

  const symbols =
    searchParams.get(
      "symbols"
    );

  const search =
    searchParams.get(
      "search"
    );


  try {

    // =====================================================
    // DYNAMIC SEARCH
    // =====================================================

    if (search) {

      const response =
        await fetch(
          `http://127.0.0.1:5000/search?q=${encodeURIComponent(
            search
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return NextResponse.json(
          {
            error:
              data.error ??
              "Search failed",
          },
          {
            status:
              response.status,
          }
        );

      }

      return NextResponse.json(
        data
      );
    }


    // =====================================================
    // SINGLE DYNAMIC STOCK
    // =====================================================

    if (symbol) {

      const response =
        await fetch(
          `http://127.0.0.1:5000/stock/${encodeURIComponent(
            symbol
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return NextResponse.json(
          {
            error:
              data.error ??
              `Unable to fetch ${symbol}`,
          },
          {
            status:
              response.status,
          }
        );

      }

      return NextResponse.json(
        data
      );
    }


    // =====================================================
    // WATCHLIST MARKET DATA
    // =====================================================

    if (symbols) {

      const response =
        await fetch(
          `http://127.0.0.1:5000/market?symbols=${encodeURIComponent(
            symbols
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return NextResponse.json(
          {
            error:
              data.error ??
              "Market data request failed",
          },
          {
            status:
              response.status,
          }
        );

      }

      return NextResponse.json({

        stocks:
          data.stocks ?? [],

        events:
          data.events ?? [],

        replay:
          data.replay ?? [],

        signals:
          getMarketSignals(),

        relationships:
          getStockRelationships(),

        timestamp:
          data.timestamp,

        source:
          data.source ??
          "yfinance",

      });
    }


    // =====================================================
    // DEFAULT MARKET DATA
    // =====================================================

    const liveData =
      await fetchLiveMarketData();


    return NextResponse.json({

      stocks:
        liveData.stocks,

      events:
        liveData.events,

      replay:
        liveData.replay,

      signals:
        getMarketSignals(),

      relationships:
        getStockRelationships(),

      timestamp:
        liveData.timestamp,

      source:
        liveData.source,

    });

  } catch (error) {

    console.error(
      "Market API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to fetch market data",
      },
      {
        status: 500,
      }
    );

  }
}