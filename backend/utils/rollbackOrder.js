import { loadCheckoutState, clearCheckoutState } from "../controllers/redisController";
import { incrementStock } from "../TiDB/product-queries.js";

export const rollbackOrder = async (paypalOrderId) => {
  const data = await loadCheckoutState(paypalOrderId);
  if (!data) return;

  for (const item of data.items) {
    await incrementStock(item.productId, item.quantity);
  }

  await clearCheckoutState(paypalOrderId);
};
