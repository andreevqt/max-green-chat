export function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function dateLabel(timestamp: number) {
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) return "Сегодня";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
