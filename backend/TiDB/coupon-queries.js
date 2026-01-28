import prisma from "../config/prisma.js";

const createCoupon = async (data) => {
  const { 
    code, 
    discountAmount, 
    discountType, 
    limit, 
    expiresAt, 
    allProducts, 
    productIds = [],
    minCartAmount,
    maxDiscountAmount,
    startsAt,
    userLimit,
    newUsersOnly,
    isStackable,
    applyStrategy,
    freeProductId
  } = data;

  try {
    const coupon = await prisma.discountCode.create({
      data: {
        code,
        discountAmount: parseInt(discountAmount || 0), 
        discountType: discountType.toUpperCase(),
        limit: limit ? parseInt(limit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        allProducts: allProducts || false,
        isActive: true,
        minCartAmount: minCartAmount ? parseInt(minCartAmount) : null,
        maxDiscountAmount: maxDiscountAmount ? parseInt(maxDiscountAmount) : null,
        userLimit: userLimit ? parseInt(userLimit) : null,
        newUsersOnly: newUsersOnly || false,
        isStackable: isStackable || false,
        applyStrategy: applyStrategy || 'ALL_ITEMS',
        freeProductId: freeProductId ? parseInt(freeProductId) : null,
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

const validateCouponForCart = async (code, cartTotal, cartItems, userId) => {
  const now = new Date();

  const coupon = await prisma.discountCode.findUnique({
    where: { code },
    include: {
      ProductDiscountCodeRelation: true,
      _count: {
        select: { orders: { where: { user_id: userId } } }
      }
    }
  });

  if (!coupon) return { isValid: false, error: 'Invalid coupon code' };
  if (!coupon.isActive) return { isValid: false, error: 'This coupon is disabled' };
  if (coupon.startsAt && coupon.startsAt > now) return { isValid: false, error: 'Coupon not yet active' };
  if (coupon.expiresAt && coupon.expiresAt < now) return { isValid: false, error: 'Coupon expired' };
  if (coupon.limit !== null && coupon.uses >= coupon.limit) return { isValid: false, error: 'Coupon usage limit reached' };
  if (coupon.minCartAmount && cartTotal < coupon.minCartAmount) {
    return { isValid: false, error: `Minimum cart value of $${coupon.minCartAmount} required` };
  }
  if (userId) {
    if (coupon.userLimit !== null && coupon._count.orders >= coupon.userLimit) {
      return { isValid: false, error: 'You have already used this coupon' };
    }
    if (coupon.newUsersOnly) {
      const userOrderCount = await prisma.orders.count({ where: { user_id: userId } });
      if (userOrderCount > 0) {
        return { isValid: false, error: 'This coupon is for new customers only' };
      }
    }
  }
  let qualifyingItems = cartItems;
  
  if (!coupon.allProducts) {
    const validProductIds = coupon.ProductDiscountCodeRelation.map(r => r.productId);
    qualifyingItems = cartItems.filter(item => validProductIds.includes(item.product_id));

    if (qualifyingItems.length === 0) {
      return { isValid: false, error: 'Coupon applies to specific products not in your cart' };
    }
  }
  let discountAmount = 0;

  if (coupon.discountType === 'FREE_SHIPPING') {
    discountAmount = 0; 
  } 
  else if (coupon.discountType === 'FIXED') {
    discountAmount = coupon.discountAmount;
  } 
  else if (coupon.discountType === 'PERCENTAGE') {
    let targetAmount = 0;

    if (coupon.applyStrategy === 'HIGHEST_ITEM') {
      const highestItem = qualifyingItems.reduce((prev, current) => (prev.price > current.price) ? prev : current);
      targetAmount = highestItem.price; 
    } 
    else if (coupon.applyStrategy === 'CHEAPEST_ITEM') {
      const lowestItem = qualifyingItems.reduce((prev, current) => (prev.price < current.price) ? prev : current);
      targetAmount = lowestItem.price;
    } 
    else {
      targetAmount = qualifyingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    discountAmount = (targetAmount * coupon.discountAmount) / 100;

    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  }

  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  return { 
    isValid: true, 
    coupon: coupon,
    calculatedDiscount: Math.floor(discountAmount)
  };
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