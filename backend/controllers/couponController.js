import {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  getExpiredCoupons,
  getCouponByCode,
  validateCouponForCart,
  updateCoupon,
  incrementCouponUsage,
  deleteCoupon
} from "../TiDB/coupon-queries.js";

export const createNewCoupon = async (req, res) => {
  try {
    const { 
      code, 
      discountAmount, 
      discountType, 
      limit, 
      expiresAt, 
      allProducts, 
      productIds 
    } = req.body;

    const formattedData = {
      code,
      discountAmount: parseInt(discountAmount),
      discountType : discountType ? discountType.toUpperCase() : 'PERCENTAGE',
      limit: limit ? parseInt(limit) : null,
      expiresAt,
      allProducts,
      productIds
    };

    const coupon = await createCoupon(formattedData);
    return res.status(201).json({ coupon });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred", error: error.message });
  }
}

export const getCoupons = async (req, res) => {
  try {
    const coupons = await getAllCoupons();
    return res.status(200).json({ coupons });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const getCouponByCodeController = async (req, res) => {
  const code = req.params.code;
  try {
    const coupon = await getCouponByCode(code);
    return res.status(200).json({ coupon });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const validateCoupon = async (req, res) => {
  const { code, cartTotal, cartProductIds } = req.body;
  try {
    const result = await validateCouponForCart(code, cartTotal, cartProductIds);
    if (!result.isValid) {
      return res.status(400).json({ message: result.error });
    }
    return res.status(200).json({ coupon: result.coupon });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const updateCouponController = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const coupon = await updateCoupon(id, data);
    return res.status(200).json({ coupon });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const incrementCouponUsageController = async (req, res) => {
  const id = req.params.id;
  try {
    await incrementCouponUsage(id);
    return res.status(200).json({ message: "Coupon usage incremented" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const deleteCouponController = async (req, res) => {
  const id = req.params.id;
  try {
    await deleteCoupon(id);
    return res.status(200).json({ message: "Coupon deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const getActiveCouponsController = async (req, res) => {
  try {
    const coupons = await getActiveCoupons();
    return res.status(200).json({ coupons });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  }
}

export const getExpiredCouponsController = async (req, res) => {
  try {
    const coupons = await getExpiredCoupons();
    return res.status(200).json({ coupons });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occurred" });
  } 
}