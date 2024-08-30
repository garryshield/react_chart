import { Defined } from "@definedfi/sdk";
import {
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
} from "@/public/static/charting_library";
import {
  makeApiRequest,
  checkInterval,
  intervals,
  generateSymbol,
} from "./helpers";
import timestring from "timestring";

export var lastCandleTime: number = 0;
let searchSymbol: any;
let selectSymbol: any;

export const sdk = new Defined("02d56ee969a64918856f696cdfd130b1de5c40d3");

const configurationData = {
  supported_resolutions: [
    "1",
    "5",
    "15",
    "30",
    "60",
    "240",
    "1D",
    "1W",
    // "1M",
  ],
  supported_marks: true,
  supports_timescale_marks: false,
  supports_time: true,
};

export function formatBars(response: any) {
  const data = response.data;
  let dfArray: any[] = [];
  if (data && data.getBars) {
    var df = data.getBars;

    // Remove rows with null/undefined values in 'v' and 'c'
    lastCandleTime = df.t[0] as number;

    dfArray = df.c.map((cValue: number, index: number) => ({
      c: cValue,
      v: df.v[index],
      h: df.h[index],
      l: df.l[index],
      o: df.o[index],
      t: df.t[index],
    }));

    // Filter the array to remove rows where either c or v is null
    dfArray = dfArray.filter((row: any, index: number) => {
      let prevRow: any;
      if (index == 0) {
        prevRow = dfArray[0];
        return dfArray[0];
      } else {
        prevRow = dfArray[index - 1];
      }

      if (
        row.v == null ||
        row.c == null ||
        (prevRow.o == row.o &&
          prevRow.h == row.h &&
          prevRow.l == row.l &&
          prevRow.c == row.c &&
          row.o == row.h &&
          row.o == row.l &&
          row.o == row.c)
        // (row.v == 0 && row.o == row.h && row.o == row.l && row.o == row.c)
      )
        // check volume and compare current volume and prev volume
        return;
      return row;
    });
  } else {
    dfArray = [];
  }
  return dfArray;
}

export default {
  onReady: (callback: any) => {
    console.log("[onReady]: Method call");
    setTimeout(() => callback(configurationData));
  },

  searchSymbols: async (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: SearchSymbolsCallback
  ) => {
    console.log(
      "[onSearchSymbols]: Method call",
      userInput,
      exchange,
      symbolType
    );

    const searchSymbols = (symbols: any) => {
      if (symbols == null || symbols.length == 0) return [];
      const symbolInfo = symbols.map((symbol: any) => {
        const chainlogo =
          symbol.token.networkId == 1 ? "/ethereum.png" : "/solana.png";
        const network = symbol.token.networkId == 1 ? "ethereum" : "solana";

        const filterSymbol = {
          symbol: symbol.token.symbol + "/" + network,
          description: symbol.token.name,
          exchange: symbol.exchanges[0].name,
          ticker: symbol.token.symbol + ":" + network,
          type: "crypto",
          logo_urls: [symbol.token.imageLargeUrl, chainlogo],
          exchange_logo: symbol.exchanges[0].iconUrl,
        };
        return filterSymbol;
      });
      return symbolInfo;
    };

    const query = `query FilterTokens($filters: TokenFilters, $statsType: TokenPairStatisticsType, $phrase: String, $tokens: [String], $rankings: [TokenRanking], $limit: Int, $offset: Int) {\n  filterTokens(\n    filters: $filters\n    statsType: $statsType\n    phrase: $phrase\n    tokens: $tokens\n    rankings: $rankings\n    limit: $limit\n    offset: $offset\n  ) {\n    results {\n      exchanges {\n        ...ExchangeModel\n        __typename\n      }\n      liquidity\n     pair {\n        ...PairModel\n        __typename\n      }\n      priceUSD\n      quoteToken\n     token {\n        address\n        decimals\n        id\n        name\n        networkId\n        symbol\n        isScam\n        imageThumbUrl\n        imageSmallUrl\n        imageLargeUrl\n        info {\n          ...BaseTokenInfo\n          __typename\n        }\n        __typename\n      }\n      volume1\n      volume12\n      volume24\n      volume4\n      __typename\n    }\n    count\n    page\n    __typename\n  }\n}\n\nfragment ExchangeModel on Exchange {\n  address\n  color\n  exchangeVersion\n  id\n  name\n  networkId\n  tradeUrl\n  iconUrl\n  enabled\n  __typename\n}\n\nfragment PairModel on Pair {\n  address\n  exchangeHash\n  fee\n  id\n  networkId\n  tickSpacing\n  token0\n  token1\n  __typename\n}\n\nfragment BaseTokenInfo on TokenInfo {\n  address\n  circulatingSupply\n  id\n  imageLargeUrl\n  imageSmallUrl\n  imageThumbUrl\n  isScam\n  name\n  networkId\n  symbol\n  totalSupply\n  description\n  __typename\n}`;
    const variables = {
      filters: {
        network: [1, 1399811149],
        volume24: { gte: 1000 },
      },
      phrase: `${userInput}`,
      rankings: [{ attribute: "volume24", direction: "DESC" }],
      limit: 10,
      statsType: "FILTERED",
    };

    const { data } = await makeApiRequest(query, variables);
    console.log(data);
    
    if (data == null || data == undefined) onResultReadyCallback([]);

    const results = searchSymbols(data?.filterTokens.results);
    searchSymbol = data?.filterTokens.results;

    onResultReadyCallback(results);
  },

  resolveSymbol: async (
    symbolName: string,
    onSymbolResolvedCallback: ResolveCallback,
    onResolveErrorCallback: Function
  ) => {
    try {
      console.log("[onResolveSymbol]: Method call", symbolName, searchSymbol);

      const splitSymbol = symbolName.split(":");
      const networkId = splitSymbol[1] == "ethereum" ? 1 : 1399811149;
      const filterNetwork = searchSymbol.filter(
        (symbol: any) => symbol.token.networkId == networkId
      );
      const symbol = filterNetwork.find(
        (symbol: any) => symbol.token.symbol == splitSymbol[0]
      );

      const chainlogo =
        symbol.token.networkId == 1 ? "/ethereum.png" : "/solana.png";

      const symbolInfo: LibrarySymbolInfo = {
        ticker: symbol.token.symbol + "/" + splitSymbol[1],
        name: symbol.token.symbol,
        description: symbol.token.name + " on " + splitSymbol[1].toUpperCase(),
        logo_urls: [symbol.token.imageLargeUrl],
        exchange_logo: symbol.exchanges[0].iconUrl,
        timezone: "Etc/UTC",
        exchange: symbol.exchanges[0].name,
        minmov: 1,
        listed_exchange: symbol.exchanges[0].name,
        format: "price",
        pricescale: 1000000000000,
        supported_resolutions: [
          "1",
          "5",
          "15",
          "30",
          "60",
          "240",
          "1D",
        ] as ResolutionString[],
        type: "crypto",
        session: "24x7",
        has_intraday: true,
        volume_precision: 1,
        data_status: "streaming",
      };
      selectSymbol = symbol;

      onSymbolResolvedCallback(symbolInfo);
    } catch (error) {
      onResolveErrorCallback("[resolveSymbol]: symbol not found", error);
    }
  },

  // get historical data for the symbol
  getBars: async (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: Function
  ) => {
    console.log("[getBars] Method call");

    if (!checkInterval(resolution)) {
      return onErrorCallback("[getBars] Invalid interval");
    }

    const { to, firstDataRequest } = periodParams;
    const period = intervals[resolution];

    if (firstDataRequest) lastCandleTime = 0;
    const toTime = lastCandleTime == 0 ? to : lastCandleTime;
    const fromTime = to - timestring(period) * 600;
    console.log(fromTime, toTime, firstDataRequest);

    try {
      const query =
        "query GetBars($countback: Int, $symbol: String!, $from: Int!, $to: Int!, $resolution: String!, $currencyCode: String, $quoteToken: QuoteToken, $statsType: TokenPairStatisticsType, $removeLeadingNullValues: Boolean, $removeEmptyBars: Boolean) {\n  getBars(\n    symbol: $symbol\n    from: $from\n    to: $to\n    resolution: $resolution\n    currencyCode: $currencyCode\n    quoteToken: $quoteToken\n    statsType: $statsType\n    countback: $countback\n    removeLeadingNullValues: $removeLeadingNullValues\n    removeEmptyBars: $removeEmptyBars\n ) {\n    s\n    o\n    h\n    l\n    c\n    t\n    v\n    __typename\n  }\n}";
      const variables = {
        countback: 600,
        symbol: selectSymbol.pair.id,
        quoteToken: selectSymbol.quoteToken,
        from: fromTime,
        to: toTime,
        statsType: `FILTERED`,
        removeEmptyBars: false,
        removeLeadingNullValues: true,
        resolution: resolution,
        currencyCode: "USD",
      };

      var data = await makeApiRequest(query, variables);
      var formattedData = formatBars(data);
      console.log(formattedData);
      if (
        (data.Response && data.Response === "Error") ||
        formattedData.length === 0
      ) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], { noData: true });
        return;
      }
      let bars: any = [];
      formattedData.forEach((bar: any) => {
        if (bar.t >= fromTime && bar.t < to) {
          bars = [
            ...bars,
            {
              time: bar.t * 1000,
              low: bar.l,
              high: bar.h,
              open: bar.o,
              close: bar.c,
              volume: bar.v,
            },
          ];
        }
      });

      onHistoryCallback(bars, { noData: false });
      return;
    } catch (error) {
      console.log("[getBars]: Get error", error);
      onErrorCallback(error);
    }
  },

  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ) => {
    console.log(
      "[subscribeBars]: Method call with subscribeUID:",
      selectSymbol
    );

    sdk.subscribe(
      `
        subscription OnBarsUpdated($pairId: String, $quoteToken: QuoteToken) {
          onBarsUpdated(pairId: $pairId, quoteToken: $quoteToken) {
            networkId
            pairAddress
            pairId
            timestamp
            quoteToken
            aggregates {
              r1S {
                t
                usd {
                  t
                  o
                  h
                  l
                  c
                  v
                }
                token {
                  t
                  o
                  h
                  l
                  c
                  v
                }
              }
            }
          }
        }
      `,
      {
        pairId: selectSymbol.pair.id,
        quoteToken: selectSymbol.quoteToken,
      },
      {
        next({ data }: any) {
          const value = data.onBarsUpdated.aggregates.r1S.usd;
          console.log("bar update: ", value);
          const last = {
            time: value.t * 1000,
            low: value.l,
            high: value.h,
            open: value.o,
            close: value.c,
            volume: value.v,
          };

          if (value.v > 0) onRealtimeCallback(last);
          else onResetCacheNeededCallback();
        },
        complete() {
          console.log("bar subscription completed");
        },
        error(error) {
          console.error("bar subscription error: ", error);
        },
      }
    );
  },

  unsubscribeBars: (subscriberUID: string) => {
    console.log(
      "[unsubscribeBars]: Method call with subscriberUID:",
      subscriberUID
    );
    // unsubscribeFromStream(subscriberUID);
  },
};
