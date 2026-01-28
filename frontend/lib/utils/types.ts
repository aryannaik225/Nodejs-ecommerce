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
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING'; 
  maxDiscountAmount: number | null;
  minCartAmount: number | null;
  limit: number | null;
  userLimit: number | null;
  uses: number; 
  newUsersOnly: boolean;
  isStackable: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
  allProducts: boolean;
  applyStrategy: 'ALL_ITEMS' | 'HIGHEST_ITEM' | 'CHEAPEST_ITEM';
  freeProductId: number | null;
  description: string;
  ProductDiscountCodeRelation: {
    productId: number;
  }[];
}