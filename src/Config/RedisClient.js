// src/Config/RedisClient.js
require("dotenv").config();
const Redis = require("ioredis");

let redisClient = null;
let connectPromise = null;

const buildRedisClient = () => {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (redisUrl) {
    return new Redis(redisUrl, { lazyConnect: true });
  }

  const host = String(process.env.REDIS_HOST || "").trim();
  if (!host) return null;

  const port = Number.parseInt(process.env.REDIS_PORT, 10);
  const password = String(process.env.REDIS_PASSWORD || "").trim();
  const db = Number.parseInt(process.env.REDIS_DB, 10);

  return new Redis(
    {
      host,
      port: Number.isFinite(port) ? port : 6379,
      password: password || undefined,
      db: Number.isFinite(db) ? db : 0,
      lazyConnect: true,
    },
  );
};

const getRedis = () => {
  if (redisClient) return redisClient;
  redisClient = buildRedisClient();
  if (!redisClient) return null;

  redisClient.on("error", () => {
    // Swallow connection errors; cache is optional.
  });
  return redisClient;
};

const ensureRedisReady = async (client) => {
  if (!client) return false;
  if (client.status === "ready") return true;

  if (!connectPromise) {
    connectPromise = client.connect().catch(() => false);
  }

  await connectPromise;
  if (client.status === "ready") return true;

  connectPromise = null;
  return false;
};

const getJson = async (key) => {
  const client = getRedis();
  if (!client) return null;
  const ok = await ensureRedisReady(client);
  if (!ok) return null;
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

const setJsonEx = async (key, ttlSeconds, value) => {
  const client = getRedis();
  if (!client) return false;
  const ok = await ensureRedisReady(client);
  if (!ok) return false;
  const ttl = Number.parseInt(ttlSeconds, 10);
  const expiresIn = Number.isFinite(ttl) && ttl > 0 ? ttl : 60;
  await client.set(key, JSON.stringify(value), "EX", expiresIn);
  return true;
};

module.exports = {
  getRedis,
  getJson,
  setJsonEx,
};

