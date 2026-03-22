require("dotenv").config();

const { chat: chatWithOllama } = require("./ollamaClient");
const { chat: chatWithOnlineAi } = require("./onlineAiClient");

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const getAIProvider = () => toText(process.env.AI_PROVIDER, "ollama").trim().toLowerCase();

const chat = async (options = {}) => {
  const provider = getAIProvider();

  if (provider === "openai" || provider === "online") {
    return chatWithOnlineAi(options);
  }

  return chatWithOllama(options);
};

module.exports = {
  getAIProvider,
  chat,
};
