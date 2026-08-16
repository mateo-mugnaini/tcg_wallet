const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000/api").replace(
  /\/$/,
  "",
);
const intervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? 30000);
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS ?? 5000);
const failureThreshold = Number(process.env.MONITOR_FAILURE_THRESHOLD ?? 3);
const continuous = process.env.MONITOR_CONTINUOUS === "true";
const webhookUrl = process.env.ALERT_WEBHOOK_URL;

if (!Number.isInteger(intervalMs) || intervalMs <= 0) {
  throw new Error("MONITOR_INTERVAL_MS must be a positive integer");
}

if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
  throw new Error("MONITOR_TIMEOUT_MS must be a positive integer");
}

if (!Number.isInteger(failureThreshold) || failureThreshold <= 0) {
  throw new Error("MONITOR_FAILURE_THRESHOLD must be a positive integer");
}

async function checkHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [liveResponse, readyResponse] = await Promise.all([
      fetch(`${baseUrl}/health/live`, { signal: controller.signal }),
      fetch(`${baseUrl}/health/ready`, { signal: controller.signal }),
    ]);

    const liveBody = await liveResponse.json();
    const readyBody = await readyResponse.json();

    if (
      !liveResponse.ok ||
      liveBody.status !== "ok" ||
      !readyResponse.ok ||
      readyBody.status !== "ready"
    ) {
      throw new Error(
        `health check returned live=${liveResponse.status} ready=${readyResponse.status}`,
      );
    }

    return { readyBody };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWebhook(payload, event) {
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`webhook returned HTTP ${response.status}`);
    }
  } catch (webhookError) {
    console.error(
      JSON.stringify({
        event: "health_alert_delivery_failed",
        alertEvent: event,
        message: webhookError.message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

async function notifyFailure(failureCount, error) {
  const payload = {
    status: "degraded",
    service: "tcg-wallet-api",
    failureCount,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify({ event: "health_check_failed", ...payload }));

  if (failureCount >= failureThreshold) {
    await sendWebhook(payload, "degraded");
  }
}

async function notifyRecovery(previousFailures, shouldNotify) {
  const payload = {
    status: "recovered",
    service: "tcg-wallet-api",
    previousFailures,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify({ event: "health_check_recovered", ...payload }));

  if (shouldNotify) {
    await sendWebhook(payload, "recovered");
  }
}

let failureCount = 0;
let alertSent = false;
let stopped = false;

async function runCheck() {
  try {
    const { readyBody } = await checkHealth();

    if (failureCount > 0) {
      await notifyRecovery(failureCount, alertSent);
    } else {
      console.log(
        JSON.stringify({
          event: "health_check_ok",
          databaseDurationMs: readyBody.durationMs,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    failureCount = 0;
    alertSent = false;
  } catch (error) {
    failureCount++;

    if (failureCount >= failureThreshold && !alertSent) {
      await notifyFailure(failureCount, error);
      alertSent = true;
      return;
    }

    console.error(
      JSON.stringify({
        event: "health_check_failed",
        failureCount,
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

process.once("SIGINT", () => {
  stopped = true;
});

process.once("SIGTERM", () => {
  stopped = true;
});

await runCheck();

if (continuous) {
  while (!stopped) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    if (!stopped) {
      await runCheck();
    }
  }
} else if (failureCount > 0) {
  process.exitCode = 1;
}
