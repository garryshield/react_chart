import Head from "next/head";
import dynamic from "next/dynamic";
import Script from "next/script";
import { useState } from "react";

import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from "@/public/static/charting_library";

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  symbol: "Wrapped Ether",
  interval: "60" as ResolutionString,
  library_path: "/static/charting_library/",
  // charts_storage_url: "http://saveload.tradingview.com",
  charts_storage_api_version: "1.1",
  enabled_features: [
    "saveload_separate_drawings_storage",
    "show_symbol_logos",
    "show_exchange_logos",
  ],
  load_last_chart: true,
  client_id: "tradingview.com",
  user_id: "public_user_id",
  auto_save_delay: 5,
  autosize: true,
  debug: false,
  theme: "dark",
  fullscreen: true,
  overrides: {
    "paneProperties.background": "#000001",
    "paneProperties.backgroundType": "solid",
    "scalesProperties.fontSize": 14,
  },
  locale: "en",
};

const TVChartContainer = dynamic(
  () =>
    import("@/components/TVChartContainer").then((mod) => mod.TVChartContainer),
  { ssr: false }
) as React.ComponentType<Partial<ChartingLibraryWidgetOptions>>;

export default function Home() {
  const [isScriptReady, setIsScriptReady] = useState(false);
  return (
    <>
      <Head>
        <title>TradingView Charting Library and Next.js</title>
      </Head>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
      />
      {isScriptReady && <TVChartContainer {...defaultWidgetProps} />}
    </>
  );
}
