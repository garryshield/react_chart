import React, { useEffect, useRef } from "react";
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  LineToolsAndGroupsState,
  ResolutionString,
  widget,
} from "@/public/static/charting_library";
import datafeed from "@/hooks/datafeed";
import { prettyNumber } from "@/utils";

export const TVChartContainer = (
  props: Partial<ChartingLibraryWidgetOptions>
) => {
  const chartContainerRef =
    useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: props.symbol,
      datafeed: datafeed,
      interval: props.interval as ResolutionString,
      container: chartContainerRef.current,
      library_path: props.library_path,
      locale: props.locale as LanguageCode,
      load_last_chart: props.load_last_chart,
      enabled_features: props.enabled_features,
      // disabled_features: ["use_localstorage_for_settings"],
      // charts_storage_url: props.charts_storage_url,
      charts_storage_api_version: props.charts_storage_api_version,
      client_id: props.client_id,
      user_id: props.user_id,
      fullscreen: props.fullscreen,
      autosize: props.autosize,
      theme: props.theme,
      overrides: {
        "paneProperties.background": "#000001",
        "paneProperties.backgroundType": "solid",
        "scalesProperties.fontSize": 14,
      },
      custom_formatters: {
        priceFormatterFactory: (symbolInfo, minTick) => {
          if (symbolInfo === null) {
            return null;
          }
          if (symbolInfo.format === "price") {
            return {
              format: (price, signPositive) => {
                return prettyNumber(price);
              },
            };
          }
          if (symbolInfo.format === "volume") {
            return {
              format: (price, signPositive) => {
                if (price >= 1000000000) {
                  return `${(price / 1000000000).toFixed(3)}B`;
                }

                if (price >= 1000000) {
                  return `${(price / 1000000).toFixed(3)}M`;
                }

                if (price >= 1000) {
                  return `${(price / 1000).toFixed(3)}K`;
                }

                return price.toFixed(2);
              },
            };
          }
          return null; // The default formatter will be used.
        },
      },
    };

    const tvWidget = new widget(widgetOptions);
    tvWidget.onChartReady(() => {
      tvWidget.subscribe("onAutoSaveNeeded", () => {
        const lineToolsState = tvWidget.activeChart().getLineToolsState();
        const temp = {
          sources: Array.from(lineToolsState.sources!),
          groups: Array.from(lineToolsState.groups!),
        };
        window.localStorage.setItem(
          "tvWidgetLineToolsState",
          JSON.stringify(temp)
        );
        tvWidget.save(
          (lineToolsState) => {
            console.log("Line tool saved!", lineToolsState);
          },
          { includeDrawings: true }
        );
      });

      let lineToolsState = window.localStorage.getItem(
        "tvWidgetLineToolsState"
      );
      lineToolsState = JSON.parse(lineToolsState!);
      const mapState: LineToolsAndGroupsState = {
        groups: new Map(
          (lineToolsState! as unknown as LineToolsAndGroupsState).groups
        ),
        sources: new Map(
          (lineToolsState! as unknown as LineToolsAndGroupsState).sources
        ),
      };

      if (!mapState) return;

      tvWidget
        .activeChart()
        .applyLineToolsState(mapState)
        .then(() => {
          console.log("Drawings state restored!");
        });
    });

    return () => {
      tvWidget.onChartReady(() => {
        // tvWidget.activeChart();
      });
      tvWidget.remove();
    };
  });

  return <div ref={chartContainerRef} className={"TVChartContainer"} />;
};
