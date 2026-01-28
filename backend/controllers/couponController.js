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
    // const { 
    //   code, 
    //   discountAmount, 
    //   discountType, 
    //   limit, 
    //   expiresAt, 
    //   allProducts, 
    //   productIds 
    // } = req.body;

    const formattedData = {
      ...req.body,
      discountAmount: parseInt(req.body.discountAmount),
      discountType : req.body.discountType?.toUpperCase(),
      applyStrategy: req.body.applyStrategy?.toUpperCase()
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
  try {
    const { code, cartTotal, cartItems } = req.body;
    const userId = req.user ? req.user.id : null; 

    if (!code) {
      return res.status(400).json({ isValid: false, message: "Coupon code is required" });
    }
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ isValid: false, message: "Cart is empty" });
    }

    const result = await validateCouponForCart(
      code, 
      parseInt(cartTotal), 
      cartItems, 
      userId
    );

    if (!result.isValid) {
      return res.status(400).json({ 
        isValid: false, 
        message: result.error 
      });
    }

    return res.status(200).json({ 
      isValid: true,
      coupon: result.coupon,
      calculatedDiscount: result.calculatedDiscount 
    });

  } catch (error) {
    console.log("Validation Error:", error);
    res.status(500).json({ message: "Server Error during validation" });
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