from flask import Flask, jsonify, request
from flask_cors import CORS

import yfinance as yf
import requests

from datetime import datetime, timezone


app = Flask(__name__)
CORS(app)


# =============================================================
# DEFAULT WATCHLIST
# =============================================================

DEFAULT_SYMBOLS = [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "SBIN.NS",
    "ITC.NS",
    "BHARTIARTL.NS",
    "HINDUNILVR.NS",
    "LT.NS",
]


# =============================================================
# SYMBOL HELPERS
# =============================================================

def clean_symbol(symbol):

    if not symbol:
        return ""

    return (
        symbol
        .strip()
        .upper()
        .replace(" ", "")
    )


def display_symbol(symbol):

    symbol = clean_symbol(symbol)

    if symbol.endswith(".NS"):
        return symbol[:-3]

    if symbol.endswith(".BO"):
        return symbol[:-3]

    return symbol


def normalize_symbol(symbol):

    return (
        clean_symbol(symbol)
        .replace(".NS", "")
        .replace(".BO", "")
    )


def get_currency(ticker, ticker_symbol):

    try:

        fast_info = ticker.fast_info

        currency = fast_info.get(
            "currency"
        )

        if currency:
            return currency

    except Exception:
        pass


    if (
        ticker_symbol.endswith(".NS")
        or ticker_symbol.endswith(".BO")
    ):
        return "INR"


    return ""


def get_ticker_name(
    ticker,
    fallback
):

    try:

        info = ticker.info

        name = (
            info.get("longName")
            or info.get("shortName")
        )

        if name:
            return name

    except Exception:
        pass


    return fallback


# =============================================================
# SIGNAL CALCULATION
# =============================================================

def calculate_signals(history):

    if history.empty:

        return {
            "priceDeviation": 0,
            "volumeRatio": 0,
        }


    closes = (
        history["Close"]
        .dropna()
    )


    volumes = (
        history["Volume"]
        .dropna()
    )


    if len(closes) < 2:

        return {
            "priceDeviation": 0,
            "volumeRatio": 0,
        }


    current_price = float(
        closes.iloc[-1]
    )


    previous_price = float(
        closes.iloc[-2]
    )


    if previous_price != 0:

        price_change_percent = abs(
            (
                current_price
                - previous_price
            )
            / previous_price
        ) * 100

    else:

        price_change_percent = 0


    price_deviation = min(
        price_change_percent / 3.0,
        1.0
    )


    current_volume = float(
        volumes.iloc[-1]
    )


    baseline_volumes = volumes.iloc[
        -21:-1
    ]


    if len(baseline_volumes) > 0:

        average_volume = float(
            baseline_volumes.mean()
        )

    else:

        average_volume = current_volume


    if average_volume > 0:

        volume_ratio = (
            current_volume
            / average_volume
        )

    else:

        volume_ratio = 0


    return {

        "priceDeviation":
            round(
                price_deviation,
                4
            ),

        "volumeRatio":
            round(
                volume_ratio,
                2
            ),

    }


# =============================================================
# NEWS
# =============================================================

def get_news(
    ticker_symbol
):

    try:

        ticker = yf.Ticker(
            ticker_symbol
        )


        news_items = ticker.get_news(
            count=5
        )


        events = []


        for item in news_items:

            content = item.get(
                "content",
                {}
            )


            title = (
                content.get("title")
                or item.get("title")
                or "Market update"
            )


            publisher = (
                content.get("provider")
                or {}
            )


            if isinstance(
                publisher,
                dict
            ):

                publisher_name = (
                    publisher.get(
                        "displayName"
                    )
                )

            else:

                publisher_name = None


            published_timestamp = (
                content.get("pubDate")
                or item.get(
                    "providerPublishTime"
                )
            )


            events.append({

                "symbol":
                    display_symbol(
                        ticker_symbol
                    ),

                "title":
                    title,

                "publisher":
                    publisher_name
                    or "Yahoo Finance",

                "type":
                    "news",

                "relevance":
                    0.75,

                "publishedAt":
                    published_timestamp,

            })


        return events


    except Exception as error:

        print(
            f"News error for "
            f"{ticker_symbol}: {error}"
        )

        return []


# =============================================================
# FETCH SINGLE STOCK
# =============================================================

def fetch_single_stock(
    ticker_symbol,
    include_name=True
):

    ticker_symbol = clean_symbol(
        ticker_symbol
    )


    if not ticker_symbol:

        return None


    try:

        print(
            f"Fetching {ticker_symbol}"
        )


        ticker = yf.Ticker(
            ticker_symbol
        )


        # -----------------------------------------------------
        # INTRADAY
        # -----------------------------------------------------

        intraday = ticker.history(
            period="1d",
            interval="1m"
        )


        history = intraday


        # -----------------------------------------------------
        # DAILY FALLBACK
        # -----------------------------------------------------

        if history.empty:

            history = ticker.history(
                period="5d",
                interval="1d"
            )


        if history.empty:

            print(
                f"No data for "
                f"{ticker_symbol}"
            )

            return None


        # -----------------------------------------------------
        # LATEST
        # -----------------------------------------------------

        latest = history.iloc[-1]


        price = float(
            latest["Close"]
        )


        volume = int(
            latest["Volume"]
        )


        # -----------------------------------------------------
        # CHANGE
        # -----------------------------------------------------

        if len(history) >= 2:

            previous_price = float(
                history.iloc[-2]["Close"]
            )


            if previous_price != 0:

                percent_change = (
                    (
                        price
                        - previous_price
                    )
                    / previous_price
                ) * 100

            else:

                percent_change = 0

        else:

            percent_change = 0


        # -----------------------------------------------------
        # SIGNALS
        # -----------------------------------------------------

        signals = calculate_signals(
            history
        )


        # -----------------------------------------------------
        # NAME
        # -----------------------------------------------------

        if include_name:

            name = get_ticker_name(
                ticker,
                display_symbol(
                    ticker_symbol
                )
            )

        else:

            name = display_symbol(
                ticker_symbol
            )


        # -----------------------------------------------------
        # CURRENCY
        # -----------------------------------------------------

        currency = get_currency(
            ticker,
            ticker_symbol
        )


        stock = {

            "symbol":
                display_symbol(
                    ticker_symbol
                ),

            "name":
                name,

            "yahooSymbol":
                ticker_symbol,

            "price":
                round(
                    price,
                    2
                ),

            "volume":
                volume,

            "percentChange":
                round(
                    percent_change,
                    2
                ),

            "priceDeviation":
                signals[
                    "priceDeviation"
                ],

            "volumeRatio":
                signals[
                    "volumeRatio"
                ],

            "currency":
                currency,

        }


        # -----------------------------------------------------
        # REPLAY
        # -----------------------------------------------------

        replay = []


        if not intraday.empty:

            for timestamp, row in (
                intraday.iterrows()
            ):

                try:

                    close_price = float(
                        row["Close"]
                    )


                    minute_volume = int(
                        row["Volume"]
                    )


                    if close_price <= 0:

                        continue


                    if timestamp.tzinfo:

                        timestamp_ist = (
                            timestamp
                            .tz_convert(
                                "Asia/Kolkata"
                            )
                        )

                    else:

                        timestamp_ist = (
                            timestamp
                            .tz_localize(
                                "UTC"
                            )
                            .tz_convert(
                                "Asia/Kolkata"
                            )
                        )


                    replay.append({

                        "time":
                            timestamp_ist.strftime(
                                "%H:%M"
                            ),

                        "symbol":
                            display_symbol(
                                ticker_symbol
                            ),

                        "price":
                            round(
                                close_price,
                                2
                            ),

                        "volume":
                            minute_volume,

                    })


                except Exception as error:

                    print(
                        "Replay error:",
                        error
                    )

                    continue


        # -----------------------------------------------------
        # NEWS
        # -----------------------------------------------------

        events = get_news(
            ticker_symbol
        )


        return {

            "stock":
                stock,

            "events":
                events,

            "replay":
                replay,

        }


    except Exception as error:

        print(
            f"Stock fetch error for "
            f"{ticker_symbol}: {error}"
        )

        return None


# =============================================================
# YAHOO FINANCE SEARCH
# =============================================================

def yahoo_search(
    query
):

    url = (
        "https://query1.finance.yahoo.com/"
        "v1/finance/search"
    )


    params = {

        "q":
            query,

        "quotesCount":
            20,

        "newsCount":
            0,

        "enableFuzzyQuery":
            "true",

    }


    headers = {

        "User-Agent":
            "Mozilla/5.0 "
            "(Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"

    }


    try:

        print(
            f"Yahoo HTTP search: {query}"
        )


        response = requests.get(

            url,

            params=params,

            headers=headers,

            timeout=10,

        )


        print(
            "Yahoo HTTP status:",
            response.status_code
        )


        if response.status_code != 200:

            print(
                "Yahoo search response:",
                response.text[:500]
            )

            return []


        data = response.json()


        quotes = (
            data
            .get("quotes", [])
        )


        results = []


        for quote in quotes:

            symbol = (
                quote.get("symbol")
                or ""
            )


            if not symbol:

                continue


            quote_type = (
                quote.get(
                    "quoteType"
                )
                or ""
            ).upper()


            if quote_type not in {
                "",
                "EQUITY",
                "ETF",
                "MUTUALFUND",
                "INDEX",
                "CRYPTOCURRENCY",
                "FUTURE",
                "CURRENCY",
            }:

                continue


            name = (
                quote.get(
                    "longname"
                )
                or quote.get(
                    "longName"
                )
                or quote.get(
                    "shortname"
                )
                or quote.get(
                    "shortName"
                )
                or symbol
            )


            results.append({

                "symbol":
                    display_symbol(
                        symbol
                    ),

                "yahooSymbol":
                    symbol,

                "name":
                    name,

                "exchange":
                    quote.get(
                        "exchange"
                    ),

                "type":
                    quote_type
                    or "EQUITY",

            })


        return results


    except Exception as error:

        print(
            "Yahoo HTTP search error:",
            error
        )

        return []


# =============================================================
# DIRECT INDIAN STOCK SEARCH
# =============================================================

def direct_indian_search(
    query
):

    query = clean_symbol(
        query
    )


    if "." in query:

        candidates = [
            query
        ]

    else:

        candidates = [

            f"{query}.NS",

            f"{query}.BO",

        ]


    results = []


    for candidate in candidates:

        try:

            ticker = yf.Ticker(
                candidate
            )


            # Use daily data here.
            # Search does not need intraday data.

            history = ticker.history(
                period="5d",
                interval="1d"
            )


            if history.empty:

                continue


            name = get_ticker_name(
                ticker,
                display_symbol(
                    candidate
                )
            )


            exchange = ""

            if candidate.endswith(
                ".NS"
            ):

                exchange = "NSE"

            elif candidate.endswith(
                ".BO"
            ):

                exchange = "BSE"


            results.append({

                "symbol":
                    display_symbol(
                        candidate
                    ),

                "yahooSymbol":
                    candidate,

                "name":
                    name,

                "exchange":
                    exchange,

                "type":
                    "EQUITY",

            })


        except Exception as error:

            print(
                f"Direct search error "
                f"{candidate}: {error}"
            )

            continue


    return results


# =============================================================
# SEARCH ENDPOINT
# =============================================================

@app.get("/search")
def search_stocks():

    query = (
        request.args
        .get("q", "")
        .strip()
    )


    if not query:

        return jsonify({
            "stocks": []
        })


    print(
        "\n======================================"
    )

    print(
        f"SEARCH REQUEST: {query}"
    )

    print(
        "======================================"
    )


    # =========================================================
    # 1. YAHOO HTTP SEARCH
    # =========================================================

    results = yahoo_search(
        query
    )


    # =========================================================
    # 2. DIRECT NSE/BSE SEARCH
    # =========================================================

    direct_results = direct_indian_search(
            query
        )


    results.extend(
        direct_results
    )


    # =========================================================
    # 3. DEDUPLICATE
    # =========================================================

    unique_results = []

    seen = set()


    for result in results:

        yahoo_symbol = clean_symbol(
            result.get(
                "yahooSymbol",
                ""
            )
        )


        if not yahoo_symbol:

            continue


        if yahoo_symbol in seen:

            continue


        seen.add(
            yahoo_symbol
        )


        unique_results.append(
            result
        )


    # =========================================================
    # 4. LIMIT
    # =========================================================

    unique_results = unique_results[:20]


    print(
        "SEARCH RESULTS:"
    )


    for result in unique_results:

        print(
            result
        )


    print(
        "======================================\n"
    )


    return jsonify({

        "stocks":
            unique_results

    })


# =============================================================
# SINGLE STOCK
# =============================================================

@app.get(
    "/stock/<path:ticker_symbol>"
)
def get_dynamic_stock(
    ticker_symbol
):

    result = fetch_single_stock(
        ticker_symbol,
        include_name=True
    )


    if result is None:

        return jsonify({

            "error":
                f"Unable to fetch "
                f"{ticker_symbol}"

        }), 404


    return jsonify({

        "stocks":
            [
                result["stock"]
            ],

        "events":
            result["events"],

        "replay":
            result["replay"],

        "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "source":
            "yfinance",

    })


# =============================================================
# MARKET
# =============================================================

@app.get("/market")
def market():

    requested_symbols = (
        request.args.get(
            "symbols"
        )
    )


    if requested_symbols:

        symbols = [

            clean_symbol(
                symbol
            )

            for symbol
            in requested_symbols.split(",")

            if clean_symbol(
                symbol
            )

        ]

    else:

        symbols = DEFAULT_SYMBOLS


    symbols = list(
        dict.fromkeys(
            symbols
        )
    )


    stocks = []

    events = []

    replay = []


    for ticker_symbol in symbols:

        result = fetch_single_stock(
            ticker_symbol,
            include_name=False
        )


        if result is None:

            continue


        stocks.append(
            result["stock"]
        )


        events.extend(
            result["events"]
        )


        replay.extend(
            result["replay"]
        )


    replay.sort(
        key=lambda item: (
            item["time"],
            item["symbol"]
        )
    )


    return jsonify({

        "stocks":
            stocks,

        "events":
            events,

        "replay":
            replay,

        "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "source":
            "yfinance",

    })


# =============================================================
# HEALTH
# =============================================================

@app.get("/health")
def health():

    return jsonify({

        "status":
            "ok"

    })


# =============================================================
# START
# =============================================================

if __name__ == "__main__":

    print(
        "\n========================================"
    )

    print(
        " Moments Market Service"
    )

    print(
        " http://127.0.0.1:5000"
    )

    print(
        "========================================\n"
    )


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )