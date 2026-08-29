const YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

function toHistoryPoint(item) {
  const date = new Date(item.period);

  if (Number.isNaN(date.getTime())) return null;

  return {
    ...item,
    date,
    label: new Intl.DateTimeFormat("es-ES", {
      month: "short",
      year: "2-digit",
    }).format(date),
  };
}

/**
 * Shows at most the last year's data. If that window is empty, keeps the
 * latest valid historical point so a chart with available data never appears
 * empty.
 */
export function getAllPriceHistory(aggregations = []) {
  const safeAggregations = Array.isArray(aggregations) ? aggregations : [];

  return safeAggregations
    .map(toHistoryPoint)
    .filter(Boolean)
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

export function getVisiblePriceHistory(aggregations = [], now = Date.now()) {
  const history = getAllPriceHistory(aggregations);
  const cutoff = now - YEAR_IN_MILLISECONDS;
  const recentHistory = history.filter((item) => item.date.getTime() >= cutoff);

  if (recentHistory.length > 0) {
    return { data: recentHistory, isFallback: false };
  }

  return {
    data: history.length > 0 ? [history.at(-1)] : [],
    isFallback: history.length > 0,
  };
}
