/**
 * Shop Service
 * Handles product and purchase API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  qv: number | null;
  is_active: number;
  created_at: string;
  updated_at: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

export interface PurchaseRequest {
  product_id: number;
  quantity: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  transaction_id: number | null;
  new_balance: number | null;
}

export interface PlanPurchaseResponse {
  success: boolean;
  message: string;
  transaction_id: number | null;
  new_balance: number | null;
  plan_level: number;
  qv: number;
  cost: number;
}

export interface PurchaseHistoryItem {
  id: number;
  product: string;
  amount: number;
  date: string;
}

export interface PurchaseHistoryResponse {
  items: PurchaseHistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

class ShopService {
  /**
   * Get products list
   */
  async getProducts(page = 1, perPage = 50, activeOnly = true): Promise<{ data: ProductListResponse } | { error: string }> {
    const response = await apiClient.get<ProductListResponse>(
      `${ENDPOINTS.SHOP.PRODUCTS}?page=${page}&per_page=${perPage}&active_only=${activeOnly}`,
      false // Products can be viewed without auth
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  /**
   * Get single product
   */
  async getProduct(id: number): Promise<{ product: Product } | { error: string }> {
    const response = await apiClient.get<Product>(ENDPOINTS.SHOP.PRODUCT(id), false);

    if (response.error) {
      return { error: response.error };
    }

    return { product: response.data! };
  }

  /**
   * Purchase product
   */
  async purchase(productId: number, quantity = 1): Promise<{ data: PurchaseResponse } | { error: string }> {
    const response = await apiClient.post<PurchaseResponse>(ENDPOINTS.SHOP.PURCHASE, {
      product_id: productId,
      quantity,
    });

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  /**
   * Purchase a plan (Start=1, Standard=2, Business=3, VIP=4)
   * Full side effects: referral bonus, binary tree placement, volume propagation
   */
  async purchasePlan(planLevel: number): Promise<{ data: PlanPurchaseResponse } | { error: string }> {
    const response = await apiClient.post<PlanPurchaseResponse>(ENDPOINTS.SHOP.PURCHASE_PLAN, {
      plan_level: planLevel,
    });

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory(page = 1, perPage = 20): Promise<{ data: PurchaseHistoryResponse } | { error: string }> {
    const response = await apiClient.get<PurchaseHistoryResponse>(
      `${ENDPOINTS.SHOP.HISTORY}?page=${page}&per_page=${perPage}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { data: response.data! };
  }
}

export const shopService = new ShopService();
export default shopService;
