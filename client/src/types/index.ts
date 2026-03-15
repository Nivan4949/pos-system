export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  categoryId: string | null;
  category?: Category;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  stockQuantity: number;
  unit: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
  discount?: number;
}
