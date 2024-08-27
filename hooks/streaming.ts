
function getNextDailyBarTime(barTime: number) {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function unsubscribeFromStream(subscriberUID: string) {
  // find a subscription with id === subscriberUID
  console.log("unsubscribe");
  // for (const channelString of channelToSubscription.keys()) {
  //   const subscriptionItem = channelToSubscription.get(channelString);
  //   const handlerIndex = subscriptionItem.handlers.findIndex(
  //     (handler) => handler.id === subscriberUID
  //   );

  //   if (handlerIndex !== -1) {
  //     // remove from handlers
  //     subscriptionItem.handlers.splice(handlerIndex, 1);

  //     if (subscriptionItem.handlers.length === 0) {
  //       // unsubscribe from the channel, if it was the last handler
  //       console.log(
  //         "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
  //         channelString
  //       );
  //       socket.emit("SubRemove", { subs: [channelString] });
  //       channelToSubscription.delete(channelString);
  //       break;
  //     }
  //   }
  // }
}
