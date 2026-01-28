import prisma from "../config/prisma.js";

const createCoupon = async ({ code, discountAmount, discountType, limit, expiresAt, allProducts, productIds = [] }) => {
  try {
    const coupon = await prisma.discountCode.create({
      data: {
        code,
        discountAmount, 
        discountType,
        limit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allProducts: allProducts || false,
        isActive: true,
        ProductDiscountCodeRelation: !allProducts && productIds.length > 0 ? {
          create: productIds.map(prodId => ({
            productId: parseInt(prodId)
          }))
        } : undefined
      },
      include: {
        ProductDiscountCodeRelation: true
      }
    });
    return coupon;
  } catch (error) {
    console.log("Error creating coupon. Error = ", error);
    throw error;
  }
}

const updateCoupon = async (id, data) => {
  const { 
    code, 
    discountAmount, 
    discountType, 
    limit, 
    expiresAt, 
    allProducts, 
    productIds 
  } = data;

  let relationUpdate = undefined;

  if (typeof allProducts !== 'undefined') {
    if (allProducts) {
      relationUpdate = {
        deleteMany: {}, 
      };
    } else {
      relationUpdate = {
        deleteMany: {}, 
        create: productIds && productIds.length > 0 
          ? productIds.map(prodId => ({ productId: parseInt(prodId) }))
          : []
      };
    }
  }

  try {
    const coupon = await prisma.discountCode.update({
      where: { id: parseInt(id) },
      data: {
        code,
        discountAmount: discountAmount ? parseInt(discountAmount) : undefined,
        discountType,
        limit: limit !== undefined ? (limit ? parseInt(limit) : null) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allProducts,
        ProductDiscountCodeRelation: relationUpdate
      },
      include: {
        ProductDiscountCodeRelation: true
      }
    });
    return coupon;
  } catch (error) {
    console.log("Error updating coupon. Error = ", error);
    throw error;
  }
}

const getAllCoupons = async () => {
  try {
    const coupons = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ProductDiscountCodeRelation: true,
        _count: { select: { orders: true } }
      }
    });
    return coupons;
  } catch (error) {
    console.log("Error fetching coupons. Error = ", error);
    throw error;
  }
}

const getActiveCoupons = async () => {
  const now = new Date();

  const coupons = await prisma.discountCode.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    }
  })
  return coupons.filter(c => c.limit === null || c.uses < c.limit)
}

const getExpiredCoupons = async () => {
  const now = new Date();

  const dateOrStatusInvalid = await prisma.discountCode.findMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        { isActive: false }
      ]
    }
  });

  const potentiallyActive = await prisma.discountCode.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
    }
  });

  const usageInvalid = potentiallyActive.filter(c => c.limit !== null && c.uses >= c.limit);

  return [...dateOrStatusInvalid, ...usageInvalid];
}

const getCouponByCode = async (code) => {
  try {
    const coupon = await prisma.discountCode.findUnique({
      where: { code },
      include: {
        ProductDiscountCodeRelation: {
          select: { productId: true }
        }
      }
    });
    return coupon;
  } catch (error) {
    console.log("Error fetching coupon by code. Error = ", error);
    throw error;
  }
}

const validateCouponForCart = async (code, cartTotal, cartProductIds) => {
  const coupon = await getCouponByCode(code)
  const now = new Date()

  if (!coupon) return { isValid: false, error: 'Invalid code' }
  if (!coupon.isActive) return { isValid: false, error: 'Coupon disabled' };
  if (coupon.expiresAt && coupon.expiresAt < now) return { isValid: false, error: 'Coupon expired' };
  if (coupon.limit !== null && coupon.uses >= coupon.limit) return { isValid: false, error: 'Usage limit reached' };

  if (!coupon.allProducts) {
    const validProductIds = coupon.ProductDiscountCodeRelation.map(rel => rel.productId);
    const hasValidProduct = cartProductIds.some(pid => validProductIds.includes(parseInt(pid)));

    if (!hasValidProduct) {
      return { isValid: false, error: 'Coupon not applicable to items in cart' };
    }
  }

  return { isValid: true, coupon };
}


const incrementCouponUsage = async (id) => {
  return await prisma.discountCode.updateMany({
    where: {
      id,
      OR: [
        { limit: null },
        { uses: { lt: prisma.discountCode.limit } }
      ]
    },
    data: {
      uses: { increment: 1 }
    }
  })
}

const deleteCoupon = async (id) => {
  try {
    return await prisma.discountCode.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false 
      }
    })
  } catch (error) {
    if (error.code === 'P2023') {
      console.log("Cannot delete coupon that has been used in orders. Disable it instead.");
      throw new Error('Cannot delete coupon that has been used in orders. Disable it instead.');
    }
    else {
      console.log("Error deleting coupon. Error = ", error);
    }
    throw error;
  }
}

export {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  getExpiredCoupons,
  getCouponByCode,
  validateCouponForCart,
  updateCoupon,
  incrementCouponUsage,
  deleteCoupon
}