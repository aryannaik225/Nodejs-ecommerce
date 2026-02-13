import engine from '../services/recommendationEngine.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient() 

export const getSimilarProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const recommendations = engine.recommend(id);
        res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Recommendation Error" });
    }
};

export const getCartRecommendations = async (req, res) => {
  try {
        const userId = req.user.id; 

        const cartItems = await prisma.cart_items.findMany({
            where: { user_id: userId },
            select: { product_id: true }
        });

        if (!cartItems.length) {
            return res.status(200).json({ success: true, data: [] });
        }

        const cartProductIds = cartItems.map(item => item.product_id);
        let mixedRecs = [];

        for (const pid of cartProductIds) {
            const recs = engine.recommend(pid, 3);
            mixedRecs.push(...recs);
        }

        const uniqueRecs = mixedRecs.filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id) && 
            !cartProductIds.includes(item.id)
        );

        res.status(200).json({ success: true, data: uniqueRecs.slice(0, 10) });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getUserRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await prisma.orders.findMany({
            where: { user_id: userId },
            include: { 
                order_items: true 
            },
            orderBy: { created_at: 'desc' },
            take: 5
        });

        if (!orders.length) {
            return res.status(200).json({ success: true, data: [] });
        }

        const purchasedProductIds = orders.flatMap(order => 
            order.order_items.map(item => item.product_id)
        );

        const recentIds = [...new Set(purchasedProductIds)].slice(0, 3);
        
        let mixedRecs = [];
        for (const pid of recentIds) {
            const recs = engine.recommend(pid, 4);
            mixedRecs.push(...recs);
        }

        const uniqueRecs = mixedRecs.filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id) && 
            !purchasedProductIds.includes(item.id)
        );

        res.status(200).json({ success: true, data: uniqueRecs.slice(0, 10) });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const refreshEngine = async (req, res) => {
    try {
        const count = await engine.refresh();
        res.status(200).json({ success: true, message: `Refreshed ${count} products` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};