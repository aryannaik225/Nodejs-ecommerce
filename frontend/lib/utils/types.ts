export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  categories?: Category[];
}

export interface Coupon {
  id: number;
  code: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED'; 
  limit: number | null;
  uses: number; 
  expiresAt: string | null;
  allProducts: boolean;
  ProductDiscountCodeRelation: {
    productId: number;
  }[];
}