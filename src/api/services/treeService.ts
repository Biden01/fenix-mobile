/**
 * Tree Service
 * Handles binary tree and structure API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface TreeNodeUser {
  id: number;
  login: string;
  fio: string;
  status: number;
  rang: number;
  akwa: number;
  totalsum: number;
}

export interface TreeNode {
  id: number;
  user_id: number;
  parent_id: number;
  leg: number;
  amount_qv: number;
  user: TreeNodeUser | null;
  left: TreeNode | null;
  right: TreeNode | null;
}

export interface TreeResponse {
  tree: TreeNode | null;
  left_volume: number;
  right_volume: number;
  left_count: number;
  right_count: number;
}

export interface DownlineItem {
  id: number;
  login: string;
  fio: string;
  status: number;
  rang: number;
  type: number;
  sponsor: number;
  parent: number;
  leg: number;
  depth: number;
}

export interface DownlineResponse {
  user_id: number;
  total: number;
  items: DownlineItem[];
}

export interface VolumeResponse {
  user_id: number;
  login: string;
  left_volume: number;
  right_volume: number;
  left_member_count: number;
  right_member_count: number;
  total_volume: number;
  total_members: number;
  weak_leg_volume: number;
}

export interface FindSlotResponse {
  parent_id: number;
  parent_login: string | null;
  parent_fio: string | null;
  leg: number;
  leg_name: string;
}

export interface ReferralChild {
  id: number;
  login: string;
  fio: string;
  status: number;
  rang: number;
  type: number;
  children_count: number;
}

class TreeService {
  /**
   * Get binary tree for user
   */
  async getTree(userId: number, depth = 3): Promise<TreeResponse | { error: string }> {
    const response = await apiClient.get<TreeResponse>(
      `${ENDPOINTS.TREE.GET(userId)}?depth=${depth}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return response.data!;
  }

  /**
   * Get downline (linear structure) for user
   */
  async getDownline(userId: number, maxDepth = 10): Promise<{ downline: DownlineResponse } | { error: string }> {
    const response = await apiClient.get<DownlineResponse>(
      `/users/downline/${userId}?max_depth=${maxDepth}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { downline: response.data! };
  }

  /**
   * Get volume statistics
   */
  async getVolumes(userId: number): Promise<{ volumes: VolumeResponse } | { error: string }> {
    const response = await apiClient.get<VolumeResponse>(ENDPOINTS.TREE.VOLUMES(userId));

    if (response.error) {
      return { error: response.error };
    }

    return { volumes: response.data! };
  }

  /**
   * Get direct referral children for linear view (lazy loading)
   */
  async getReferralChildren(userId: number): Promise<{ items: ReferralChild[] } | { error: string }> {
    const response = await apiClient.get<{ parent_id: number; items: ReferralChild[] }>(
      `/users/referral-children/${userId}`
    );
    if (response.error) return { error: response.error };
    return { items: response.data?.items ?? [] };
  }

  /**
   * Find free slot in tree
   */
  async findSlot(sponsorId: number, preferredLeg = 1): Promise<{ slot: FindSlotResponse } | { error: string }> {
    const response = await apiClient.get<FindSlotResponse>(
      `${ENDPOINTS.TREE.FIND_SLOT(sponsorId)}?preferred_leg=${preferredLeg}`
    );

    if (response.error) {
      return { error: response.error };
    }

    return { slot: response.data! };
  }
}

export const treeService = new TreeService();
export default treeService;
