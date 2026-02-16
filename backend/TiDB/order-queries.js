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

export const getOrdersWithStatusSimulation = async (userId) => {
  const getMinutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

  return await prisma.$transaction(async (tx) => {
    await tx.orders.updateMany({
      where: {
        user_id: userId,
        order_status: 'placed',
        created_at: {
          lte: getMinutesAgo(5)
        }
      },
      data: { order_status: 'shipped' }
    })

    await tx.orders.updateMany({
      where: {
        user_id: userId,
        order_status: 'shipped',
        created_at: {
          lte: getMinutesAgo(10)
        }
      },
      data: {
        order_status: 'delivered', payment_status: 'paid'
      }
    })

    const orders = await tx.orders.findMany({
      where: { user_id: userId },
      include: {
        order_items: true
      },
      orderBy: { created_at: 'desc' }
    })
    return orders;
  })
}