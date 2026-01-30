import prisma from "../config/prisma.js";

export const createOrderTransaction = async (userId, paymentMethod, paymentStatus) => {
  return await prisma.$transaction(async (tx) => {
    
    const cartItems = await tx.cart_items.findMany({
      where: { user_id: userId },
      include: {
        products: true
      }
    });

    if (!cartItems || cartItems.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.products.price * item.quantity);
    }, 0);

    const newOrder = await tx.orders.create({
      data: {
        user_id: userId,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        order_status: 'placed'
      }
    });

    const orderItemsData = cartItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_title: item.products.title,
      product_price: item.products.price,
      quantity: item.quantity
    }));

    await tx.order_items.createMany({
      data: orderItemsData
    });

    return newOrder;
  });
};

export const updateOrderStatus = async (orderId, order_status, payment_status) => {
  return await prisma.orders.update({
    where: { id: orderId },
    data: { order_status: order_status, payment_status: payment_status }
  })
}