
function getNextDailyBarTime(barTime: number) {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function unsubscribeFromStream(subscriberUID: string) {
  console.log("unsubscribe");
}
