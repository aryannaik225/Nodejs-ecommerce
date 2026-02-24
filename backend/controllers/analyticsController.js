import prisma from "../config/prisma.js";

export const getKpis = async (req, res) => {
  try {
    // Get Total Revenue & Total Orders
    const [revenueAndOrders] = await prisma.$queryRaw`
      SELECT 
        CAST(COALESCE(SUM(total_amount), 0) AS UNSIGNED) AS totalRevenue,
        CAST(COUNT(id) AS UNSIGNED) AS totalOrders
      FROM orders 
      WHERE payment_status = 'paid'
    `;

    // (Users who added to cart vs Users who actually bought)
    const [cartUsers] = await prisma.$queryRaw`
      SELECT CAST(COUNT(DISTINCT user_id) AS UNSIGNED) AS count FROM cart_items
    `;
    const [orderUsers] = await prisma.$queryRaw`
      SELECT CAST(COUNT(DISTINCT user_id) AS UNSIGNED) AS count FROM orders
    `;

    let abandonmentRate = 0;
    const cUsers = Number(cartUsers.count);
    const oUsers = Number(orderUsers.count);

    if (cUsers > 0) {
      // Formula: ((Cart Users - Order Users) / Cart Users) * 100
      const diff = cUsers - oUsers;
      abandonmentRate = Math.max(0, (diff / cUsers) * 100).toFixed(1);
    }

    res.json({
      totalRevenue: Number(revenueAndOrders.totalRevenue),
      totalOrders: Number(revenueAndOrders.totalOrders),
      abandonmentRate: Number(abandonmentRate)
    });

  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: "Failed to fetch analytics KPIs" });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await prisma.$queryRaw`
      SELECT 
        product_title AS product_name,
        CAST(SUM(quantity) AS UNSIGNED) AS units_sold,
        CAST(SUM(quantity * product_price) AS UNSIGNED) AS revenue
      FROM order_items
      GROUP BY product_title
      ORDER BY revenue DESC
      LIMIT 5
    `;

    const formattedProducts = topProducts.map(product => ({
      product_name: product.product_name,
      units_sold: Number(product.units_sold),
      revenue: Number(product.revenue)
    }));

    res.json(formattedProducts);

  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ error: "Failed to fetch top products" });
  }
};