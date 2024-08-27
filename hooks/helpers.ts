import axios from "axios";
export const intervals: { [key: string]: string } = {
	'1': '1m',
	'3': '3m',
	'5': '5m',
	'15': '15m',
	'30': '30m',
	'60': '1h',
	'120': '2h',
	'240': '4h',
	'360': '6h',
	'480': '8h',
	'720': '12h',
	'D': '1d',
	'1D': '1d',
	'3D': '3d',
	'W': '1w',
	'1W': '1w',
	'M': '1M',
	'1M': '1M',
}

// Make requests to CryptoCompare API
export async function makeApiRequest(getBarQuery: string) {
  try {
    const url = "https://graph.defined.fi/graphql";
    const headers = {
      "Content-type": "application/json",
      Authorization: "02d56ee969a64918856f696cdfd130b1de5c40d3",
    };
    const data = {
      query: getBarQuery,
    };
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(`CryptoCompare request error: ${error.status}`);
  }
}

export function formatBars(response: any) {
  const data = response.data;
  if (data && data.getBars) {
    var df = data.getBars;

    // Remove rows with null/undefined values in 'v' and 'c'
    console.log(df);
    // lastCandleTime = df.t[0];
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
    // dfArray = dfArray.filter((row: any) => row.v !== null && row.c !== null && row.v > 0);

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

// Generate a symbol ID from a pair of the coins
export function generateSymbol(exchange: string, fromSymbol: string, toSymbol: string) {
  const short = `${fromSymbol}/${toSymbol}`;
  return {
    short,
    full: `${exchange}:${short}`,
  };
}

export function parseFullSymbol(fullSymbol: string) {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }

  return {
    exchange: match[1],
    fromSymbol: match[2],
    toSymbol: match[3],
  };
}

export const checkInterval = (interval: string) => !!intervals[interval]
