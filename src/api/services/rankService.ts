/**
 * Rank Service
 * Handles rank progress and requirements API calls
 */
import { apiClient } from '../client';
import { ENDPOINTS } from '../config';

// Types
export interface RankProgressResponse {
  user_id: number;
  current_rank: number;
  current_rank_name: string;
  rank_time: string;
  left_total_qv: string;
  right_total_qv: string;
  left_ref_qv: string;
  right_ref_qv: string;
  left_inv_total_qv: string;
  left_inv_leader_qv: string;
  left_inv_client_qv: string;
  right_inv_total_qv: string;
  right_inv_leader_qv: string;
  right_inv_client_qv: string;
  left_ref_count: number;
  right_ref_count: number;
  left_week_qv: number;
  right_week_qv: number;
  next_rank: number | null;
  next_rank_name: string | null;
  progress_percentage: number;
}

export interface RankDefinition {
  rank: number;
  name: string;
}

export interface RankRequirement {
  rank: number;
  name: string;
  min_personal_qv: number;
  min_weak_leg: number;
  min_referrals: number;
}

class RankService {
  /**
   * Get user's rank progress
   */
  async getProgress(): Promise<{ progress: RankProgressResponse } | { error: string }> {
    const response = await apiClient.get<RankProgressResponse>(ENDPOINTS.RANKS.PROGRESS);

    if (response.error) {
      return { error: response.error };
    }

    return { progress: response.data! };
  }

  /**
   * Get all rank definitions
   */
  async getAllRanks(): Promise<{ ranks: RankDefinition[] } | { error: string }> {
    const response = await apiClient.get<{ ranks: RankDefinition[] }>(ENDPOINTS.RANKS.ALL);

    if (response.error) {
      return { error: response.error };
    }

    return { ranks: response.data!.ranks };
  }

  /**
   * Get rank requirements
   */
  async getRequirements(): Promise<{ requirements: RankRequirement[] } | { error: string }> {
    const response = await apiClient.get<{ requirements: RankRequirement[] }>(ENDPOINTS.RANKS.REQUIREMENTS);

    if (response.error) {
      return { error: response.error };
    }

    return { requirements: response.data!.requirements };
  }
}

export const rankService = new RankService();
export default rankService;
