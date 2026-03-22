require("dotenv").config();

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getOnlineAiConfig = () => {
  const baseUrl = toText(process.env.OPENAI_BASE_URL, "").trim() || DEFAULT_BASE_URL;
  const apiKey = toText(process.env.OPENAI_API_KEY, "").trim();
  const model = toText(process.env.OPENAI_MODEL, "").trim() || "gpt-4o-mini";
  const timeoutMs = toNumber(process.env.OPENAI_TIMEOUT_MS, 30000);
  return { baseUrl, apiKey, model, timeoutMs };
};

const postJson = async (url, payload, timeoutMs, apiKey) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs || 30000));
  try {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (_) {
        json = null;
      }

      return { ok: res.ok, status: res.status, json, text };
    } catch (error) {
      if (error?.name === "AbortError") {
        const err = new Error("Online AI request timed out");
        err.code = "AI_TIMEOUT";
        throw err;
      }
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
};

const extractContent = (messageContent) => {
  if (typeof messageContent === "string") return messageContent.trim();
  if (!Array.isArray(messageContent)) return "";

  return messageContent
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.type === "text") return toText(item?.text, "");
      return "";
    })
    .join("\n")
    .trim();
};

const chat = async ({
  messages = [],
  model,
  temperature = 0.2,
  num_predict = 512,
} = {}) => {
  const cfg = getOnlineAiConfig();
  if (!cfg.apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured");
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  const selectedModel = toText(model, "").trim() || cfg.model;
  const payload = {
    model: selectedModel,
    messages: Array.isArray(messages) ? messages : [],
    temperature: toNumber(temperature, 0.2),
    max_tokens: toNumber(num_predict, 512),
  };

  const { ok, status, json, text } = await postJson(
    `${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`,
    payload,
    cfg.timeoutMs,
    cfg.apiKey,
  );

  if (!ok) {
    const message =
      json?.error?.message || json?.message || text || `Online AI request failed (${status})`;
    const err = new Error(message);
    err.status = status;
    err.body = text;
    throw err;
  }

  const content = extractContent(json?.choices?.[0]?.message?.content);
  return { content, raw: json };
};

module.exports = {
  getOnlineAiConfig,
  chat,
};
