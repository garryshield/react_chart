import { Defined } from "@definedfi/sdk";
import {
  HistoryCallback,
  LibrarySymbolInfo,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SubscribeBarsCallback,
} from "@/public/static/charting_library";
import { makeApiRequest, checkInterval, intervals } from "./helpers";
import timestring from "timestring";

export var lastCandleTime: number = 0;

const sdk = new Defined("02d56ee969a64918856f696cdfd130b1de5c40d3");

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
let chain = params.get("chain");
let resolution = params.get("resolution");
let token_id = params.get("token_id");
let token_name = params.get("token_name");
let quoteToken = params.get("quote_token");

const chain_dict: { [key: string]: number } = { eth: 1, sol: 1399811149 };
const chain_id =
  chain_dict[Object.keys(chain_dict).find((net) => chain === net)!];
const token_symbol = `${token_id}:${chain_id}`;

const configurationData = {
  supported_resolutions: [
    "1",
    "5",
    "15",
    "30",
    "60",
    "120",
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
  if (data && data.getBars) {
    var df = data.getBars;

    // Remove rows with null/undefined values in 'v' and 'c'
    lastCandleTime = df.t[0] as number;
    console.log(df);
    let dfArray = df.c.map((cValue: number, index: number) => ({
      c: cValue,
      v: df.v[index],
      h: df.h[index],
      l: df.l[index],
      o: df.o[index],
      t: df.t[index],
      s: df.s[index],
    }));

    // Filter the array to remove rows where either c or v is null
    dfArray = dfArray.filter((row: any, index: number) => {
      const prevRow = index == 0 ? dfArray[0] : dfArray[index - 1];
      if (
        row.v == null ||
        row.c == null ||
        (row.v == 0 && row.o == row.h && row.o == row.l && row.o == row.c)
      )
        return;
      // if (
      //   // (prevRow.o !== row.o ||
      //   //   prevRow.h !== row.h ||
      //   //   prevRow.l !== row.l ||
      //   //   prevRow.c !== row.c ||
      //   //   prevRow.v !== row.v)
      // )
      //   return row;
      return row;
    });

    // If needed, convert the filtered array back to the original structure
    df = {
      c: dfArray.map((row: any) => row.c),
      v: dfArray.map((row: any) => row.v),
      h: dfArray.map((row: any) => row.h),
      l: dfArray.map((row: any) => row.l),
      o: dfArray.map((row: any) => row.o),
      t: dfArray.map((row: any) => row.t),
      s: dfArray.map((row: any) => row.s),
    };

    df = df.t.map((t: number, index: number) => ({
      close: df.c[index],
      high: df.h[index],
      low: df.l[index],
      open: df.o[index],
      time: t, // Assuming time in seconds; no need to divide by 1000
      volume: df.v[index],
      status: "ok", // Assuming you may want to keep 's' field.
    }));
  } else {
    df = [];
  }
  return df;
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
    onResultReadyCallback: Function
  ) => {
    const symbols = userInput.toLowerCase() === "WETHUSD" ? ["WETHUSD"] : [];
    onResultReadyCallback(symbols);
  },

  resolveSymbol: async (
    symbolName: string,
    onSymbolResolvedCallback: ResolveCallback,
    onResolveErrorCallback: Function
  ) => {
    try {
      const symbolInfo: LibrarySymbolInfo = {
        ticker: token_name!,
        name: token_name!,
        // base_name: "WETH:USD",
        description: token_name!.toUpperCase(),
        timezone: "Etc/UTC",
        exchange: "dexscreener.com", // "eth".toUpperCase() + "_TEST1",
        minmov: 1,
        listed_exchange: "Uniswap",
        format: "price",
        pricescale: 100000000000,
        supported_resolutions: [
          "1",
          "5",
          "15",
          "30",
          "60",
          "120",
          "240",
          "1D",
        ] as ResolutionString[],
        type: "crypto",
        session: "24x7",
        has_intraday: true,
        volume_precision: 8,
        data_status: "streaming",
      };
      onSymbolResolvedCallback(symbolInfo);
    } catch (error) {
      onResolveErrorCallback("[resolveSymbol]: symbol not found", error);
    }
  },

  // get historical data for the symbol
  // https://github.com/tradingview/charting_library/wiki/JS-Api#getbarssymbolinfo-resolution-periodparams-onhistorycallback-onerrorcallback
  getBars: async (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: Function
  ) => {
    console.log("[getBars] Method call");

    if (!checkInterval(resolution) || !chain) {
      return onErrorCallback("[getBars] Invalid interval");
    }

    const { to, firstDataRequest } = periodParams;
    const period = intervals[resolution];
    console.log(to, firstDataRequest, resolution);

    if (periodParams.firstDataRequest) lastCandleTime = 0;
    const toTime = lastCandleTime == 0 ? to : lastCandleTime;
    const fromTime = to - timestring(period) * 600;
    try {
      const getTokenInfo = `query {
        getBars(
          symbol: "${token_symbol}"
          quoteToken: ${quoteToken}
          from: ${fromTime}
          to: ${toTime}
          statsType: FILTERED
          removeLeadingNullValues: true
          resolution: "${resolution}"
          currencyCode:"USD"
        ) {
          c
          h
          l
          o
          t
          v
          s
        }
      }`;
      const getBarQuery = getTokenInfo;
      var data = await makeApiRequest(getBarQuery);
      var formattedData = formatBars(data);
      if (
        (data.Response && data.Response === "Error") ||
        formattedData.length === 0
      ) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], {
          noData: true,
        });
        return;
      }
      let bars: any = [];
      formattedData.forEach((bar: any) => {
        if (bar.time >= fromTime && bar.time < to) {
          bars = [
            ...bars,
            {
              time: bar.time * 1000,
              low: bar.low,
              high: bar.high,
              open: bar.open,
              close: bar.close,
              volume: bar.volume,
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
      subscriberUID
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
                  volume
                }
                token {
                  t
                  o
                  h
                  l
                  c
                  volume
                }
              }
            }
          }
        }
      `,
      {
        pairId: token_symbol,
        quoteToken: quoteToken,
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
            volume: parseFloat(value.volume),
          };
          // onRealtimeCallback(last);
          if (parseFloat(value.volume) > 0) onRealtimeCallback(last);
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
