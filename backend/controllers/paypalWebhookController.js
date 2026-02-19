// import { redis } from "../redis/lib/redis.js";
import { getRedisKey, deleteRedisKey } from "../redis/redis-queries.js";
import { incrementStock } from "../TiDB/product-queries.js";

export const paypalWebhook = async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.event_type;

    if (
      eventType !== "CHECKOUT.ORDER.EXPIRED" &&
      eventType !== "PAYMENT.CAPTURE.DENIED"
    ) {
      return res.sendStatus(200);
    }

    const paypalOrderId =
      event.resource?.id ||
      event.resource?.supplementary_data?.related_ids?.order_id;

    if (!paypalOrderId) {
      console.warn("Webhook received without order ID");
      return res.sendStatus(200);
    }

    const redisKey = `checkout:order:${paypalOrderId}`;
    const redisData = await getRedisKey(redisKey);

    if (!redisData?.items) {
      return res.sendStatus(200);
    }

    for (const item of redisData.items) {
      await incrementStock(item.productId, item.quantity);
    }

    await deleteRedisKey(redisKey);

    console.log(
      `Webhook rollback completed for order ${paypalOrderId}`
    );

    return res.sendStatus(200);

  } catch (error) {
    console.error("PayPal Webhook Error:", error);
    if (error.message === "REDIS_UNAVAILABLE") {
      console.warn("Redis circuit open during webhook. Asking PayPal to retry later.");
      return res.sendStatus(503); 
    }
    return res.sendStatus(500);
  }
};
