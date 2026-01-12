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