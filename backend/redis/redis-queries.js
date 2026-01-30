import { redis } from "./lib/redis.js";

export const setRedisKey = async (key, value, ttl = 300) => {
  await redis.set(key, value, { ex: ttl });
};

export const getRedisKey = async (key) => {
  return await redis.get(key);
};

export const deleteRedisKey = async (key) => {
  await redis.del(key);
};
