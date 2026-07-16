function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // treat Monday as start of week
  return addDays(d, -diff);
}

function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
}

function getPeriodRange(period, now = new Date()) {
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = addDays(now, -1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "thisWeek":
      return { start: startOfWeek(now), end: endOfDay(now) };
    case "thisMonth":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "thisYear":
      return { start: startOfYear(now), end: endOfDay(now) };
    default:
      throw new Error(`Unknown period: ${period}`);
  }
}

// Previous period of equal length, used to compute % change
function getPreviousPeriodRange(period, now = new Date()) {
  const { start, end } = getPeriodRange(period, now);
  const lengthMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - lengthMs);
  return { start: prevStart, end: prevEnd };
}

function percentChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

module.exports = {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
  getPeriodRange,
  getPreviousPeriodRange,
  percentChange,
};
