const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000/api").replace(
  /\/$/,
  "",
);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 5000);

const checks = [
  {
    name: "liveness",
    path: "/health/live",
    validate: (body) => body.status === "ok",
  },
  {
    name: "readiness",
    path: "/health/ready",
    validate: (body) => body.status === "ready" && body.checks.database === "ok",
  },
  {
    name: "openapi",
    path: "/docs/openapi.json",
    validate: (body) => body.openapi === "3.0.3" && body.paths,
  },
];

for (const check of checks) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    const body = await response.json();

    if (!response.ok || !check.validate(body)) {
      throw new Error(`unexpected response (${response.status})`);
    }

    console.log(`Smoke check passed: ${check.name}`);
  } catch (error) {
    console.error(`Smoke check failed: ${check.name} — ${error.message}`);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

if (process.exitCode !== 1) {
  console.log(`Smoke checks passed: ${baseUrl}`);
}
