const endpointMetrics = new Map();

let totalRequests = 0;
let clientErrorRequests = 0;
let serverErrorRequests = 0;
let totalDurationMs = 0;
let maxDurationMs = 0;

function round(value) {
  return Number(value.toFixed(2));
}

function createEndpointMetric() {
  return {
    total: 0,
    clientErrors: 0,
    serverErrors: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
  };
}

export function recordHttpRequest({ method, path, status, durationMs }) {
  const safeDurationMs = Number.isFinite(durationMs) ? durationMs : 0;
  const metric = endpointMetrics.get(`${method} ${path}`) ?? createEndpointMetric();

  totalRequests++;
  totalDurationMs += safeDurationMs;
  maxDurationMs = Math.max(maxDurationMs, safeDurationMs);

  metric.total++;
  metric.totalDurationMs += safeDurationMs;
  metric.maxDurationMs = Math.max(metric.maxDurationMs, safeDurationMs);

  if (status >= 400 && status < 500) {
    clientErrorRequests++;
    metric.clientErrors++;
  }

  if (status >= 500) {
    serverErrorRequests++;
    metric.serverErrors++;
  }

  endpointMetrics.set(`${method} ${path}`, metric);
}

export function getMetricsSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    requests: {
      total: totalRequests,
      clientErrors: clientErrorRequests,
      serverErrors: serverErrorRequests,
      totalDurationMs: round(totalDurationMs),
      averageDurationMs: totalRequests
        ? round(totalDurationMs / totalRequests)
        : 0,
      maxDurationMs: round(maxDurationMs),
    },
    endpoints: [...endpointMetrics.entries()].map(([endpoint, metric]) => ({
      endpoint,
      ...metric,
      totalDurationMs: round(metric.totalDurationMs),
      averageDurationMs: metric.total
        ? round(metric.totalDurationMs / metric.total)
        : 0,
      maxDurationMs: round(metric.maxDurationMs),
    })),
  };
}

export function resetMetrics() {
  endpointMetrics.clear();
  totalRequests = 0;
  clientErrorRequests = 0;
  serverErrorRequests = 0;
  totalDurationMs = 0;
  maxDurationMs = 0;
}
