const HandoverService = require("../Services/HandoverService");

let timerRef = null;
let isRunning = false;
let pauseUntil = 0;
let lastFailureLoggedAt = 0;

const isEnabled = () => {
  const raw = String(process.env.HANDOVER_SCHEDULER_ENABLED || "true").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(raw);
};

const getIntervalMs = () => {
  const seconds = Number.parseInt(process.env.HANDOVER_SCHEDULER_INTERVAL_SECONDS || "60", 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 60000;
  return seconds * 1000;
};

const getFailureCooldownMs = () => {
  const seconds = Number.parseInt(process.env.HANDOVER_SCHEDULER_FAILURE_COOLDOWN_SECONDS || "300", 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 300000;
  return seconds * 1000;
};

const isDbConnectionFailure = (error = {}) => {
  const code = String(error?.code || "").toUpperCase();
  if (["ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH", "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"].includes(code)) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return message.includes("econnrefused") || message.includes("can't connect to mysql server");
};

const runOnce = async () => {
  if (isRunning) return;
  if (pauseUntil > Date.now()) return;
  isRunning = true;

  try {
    const result = await HandoverService.runMaintenance();
    pauseUntil = 0;
    if (Number(result?.total || 0) > 0) {
      console.log("[HandoverScheduler] Maintenance result", result);
    }
  } catch (error) {
    if (isDbConnectionFailure(error)) {
      const cooldownMs = getFailureCooldownMs();
      pauseUntil = Date.now() + cooldownMs;

      const now = Date.now();
      if (now - lastFailureLoggedAt >= cooldownMs) {
        lastFailureLoggedAt = now;
        console.log(
          `[HandoverScheduler] DB unavailable (${error?.message || error}). Pausing for ${Math.floor(cooldownMs / 1000)}s.`,
        );
      }
    } else {
      console.log("[HandoverScheduler] Maintenance failed", error?.message || error);
    }
  } finally {
    isRunning = false;
  }
};

const startHandoverScheduler = () => {
  if (!isEnabled()) return;
  if (timerRef) return;

  const intervalMs = getIntervalMs();
  timerRef = setInterval(() => {
    void runOnce();
  }, intervalMs);

  void runOnce();
  console.log(`[HandoverScheduler] Started. interval_ms=${intervalMs}`);
};

module.exports = {
  startHandoverScheduler,
  runOnce,
};
