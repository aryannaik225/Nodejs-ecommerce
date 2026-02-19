import { redis } from "./lib/redis.js";
import CircuitBreaker from "opossum";

// const breakerOptions = {
//   timeout: 2000,
//   errorThresholdPercentage: 50,
//   resetTimeout: 10000,
// }

const breakerOptions = {
  timeout: 1000, // 1 second timeout
  errorThresholdPercentage: 1, // Trip if literally ANY request fails
  volumeThreshold: 1, // Only require 1 request before calculating percentages
  resetTimeout: 10000, // Wait 10 seconds before trying again
};

const executeRedis = async (action, ...args) => {
  return await redis[action](...args);
}

const redisBreaker = new CircuitBreaker(executeRedis, breakerOptions);

redisBreaker.on('open', () => console.log('🔴 REDIS CIRCUIT TRIPPED: State is now OPEN. Requests are failing fast.'));
redisBreaker.on('halfOpen', () => console.log('🟡 REDIS CIRCUIT HALF-OPEN: Testing the waters with the next request...'));
redisBreaker.on('close', () => console.log('🟢 REDIS CIRCUIT CLOSED: Redis is back online.'));
redisBreaker.on('fallback', () => console.log('⚠️ FALLBACK TRIGGERED'));

redisBreaker.fallback(() => {
  throw new Error("REDIS_UNAVAILABLE");
})

export const setRedisKey = async (key, value, ttl = 900) => {
  await redisBreaker.fire("set", key, value, { ex: ttl });
};

export const getRedisKey = async (key) => {
  return await redisBreaker.fire("get", key);
};

export const deleteRedisKey = async (key) => {
  await redisBreaker.fire("del", key);
};
