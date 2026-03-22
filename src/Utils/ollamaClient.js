// src/Utils/ollamaClient.js
require("dotenv").config();

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getOllamaConfig = () => {
  const baseUrl = toText(process.env.OLLAMA_BASE_URL, "").trim() || DEFAULT_BASE_URL;
  const model = toText(process.env.OLLAMA_MODEL, "").trim() || "llama3.1";
  const timeoutMs = toNumber(process.env.OLLAMA_TIMEOUT_MS, 20000);
  return { baseUrl, model, timeoutMs };
};

const postJson = async (url, payload, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs || 20000));
  try {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const err = new Error("Ollama request timed out");
        err.code = "OLLAMA_TIMEOUT";
        throw err;
      }
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
};

const chat = async ({
  messages = [],
  model,
  temperature = 0.2,
  num_predict = 512,
} = {}) => {
  const cfg = getOllamaConfig();
  const selectedModel = toText(model, "").trim() || cfg.model;

  const payload = {
    model: selectedModel,
    messages: Array.isArray(messages) ? messages : [],
    stream: false,
    options: {
      temperature: toNumber(temperature, 0.2),
      num_predict: toNumber(num_predict, 512),
    },
  };

  const { ok, status, json, text } = await postJson(
    `${cfg.baseUrl}/api/chat`,
    payload,
    cfg.timeoutMs,
  );

  if (!ok) {
    const message = json?.error || text || `Ollama request failed (${status})`;
    const err = new Error(message);
    err.status = status;
    err.body = text;
    throw err;
  }

  const content = toText(json?.message?.content, "").trim();
  return { content, raw: json };
};

module.exports = {
  getOllamaConfig,
  chat,
};
