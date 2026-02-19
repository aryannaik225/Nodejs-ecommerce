import { redis } from "./lib/redis.js";
// import CircuitBreaker from "opossum";

// const breakerOptions = {
//   timeout: 2000,
//   errorThresholdPercentage: 50,
//   resetTimeout: 10000,
// }

// const breakerOptions = {
//   timeout: 1000, // 1 second timeout
//   errorThresholdPercentage: 1, // Trip if literally ANY request fails
//   volumeThreshold: 1, // Only require 1 request before calculating percentages
//   resetTimeout: 10000, // Wait 10 seconds before trying again
// };


class RedisCircuitBreaker {
  constructor(options = {}) {
    this.state = 'CLOSED'
    this.failureCount = 0

    this.failureThreshold = options.failureThreshold || 3
    this.resetTimeout = options.resetTimeout || 10000
    this.requestTimeout = options.requestTimeout || 2000

    this.nextAttempt = Date.now()
  }

  async fire(action, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN'
        console.log('🟡 REDIS CIRCUIT HALF-OPEN: Testing the waters...')
      } else {
        throw new Error("REDIS_UNAVAILABLE")
      }
    }

    try {
      const requestPromise = redis[action](...args)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), this.requestTimeout)
      })
      const result = await Promise.race([requestPromise, timeoutPromise])
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw new Error("REDIS_UNAVAILABLE")
    }
  }

  onSuccess() {
    this.failureCount = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      console.log('🟢 REDIS CIRCUIT CLOSED: Redis is back online.')
    }
  }

  onFailure(error) {
    this.failureCount += 1
    console.warn(`[Redis Error]: ${error.message} | Failures: ${this.failureCount}`)

    if (this.failureCount >= this.failureThreshold && this.state !== 'OPEN') {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.resetTimeout
      console.log('🔴 REDIS CIRCUIT TRIPPED: State is now OPEN. Requests are failing fast.')
    }
  }
}

const customBreaker = new RedisCircuitBreaker({
  failureThreshold: 1, // Trip on first failure
  resetTimeout: 10000, // 10 seconds
  requestTimeout: 2000, // 2 seconds
})

export const setRedisKey = async (key, value, ttl = 900) => {
  await customBreaker.fire("set", key, value, { ex: ttl });
};

export const getRedisKey = async (key) => {
  return await customBreaker.fire("get", key);
};

export const deleteRedisKey = async (key) => {
  await customBreaker.fire("del", key);
};
