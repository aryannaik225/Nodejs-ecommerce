import {
  setRedisKey,
  getRedisKey,
  deleteRedisKey
} from "../redis/redis-queries.js";

export const saveCheckoutState = async (orderId, data) => {
  await setRedisKey(`checkout:order:${orderId}`, data, 300);
};

export const loadCheckoutState = async (orderId) => {
  return await getRedisKey(`checkout:order:${orderId}`);
};

export const clearCheckoutState = async (orderId) => {
  await deleteRedisKey(`checkout:order:${orderId}`);
};
