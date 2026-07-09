import { apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface VoteResult {
  average_score: number;
  total_votes: number;
}

interface BeVoteResponse {
  success: boolean;
  data: {
    _id: string;
    series_id: string;
    reader_id: string;
    score: number;
    comment?: string;
    release_period: string;
    createdAt: string;
    updatedAt: string;
  };
  seriesStats: VoteResult;
}

export async function submitVote(
  seriesId: string,
  score: number,
  comment?: string
): Promise<VoteResult> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await apiPost<BeVoteResponse>(
    '/reader/votes',
    { series_id: seriesId, score, comment },
    { token }
  );

  if (!response.success) throw new Error('Vote failed');
  const stats = response.seriesStats ?? response.data as unknown as VoteResult;
  return {
    average_score: Number(stats?.average_score ?? score),
    total_votes: Number(stats?.total_votes ?? 1),
  };
}

export async function fetchMyVotes(seriesId?: string): Promise<Array<{
  id: string;
  seriesId: string;
  score: number;
  comment: string;
  createdAt: string;
}>> {
  const token = await getAuthToken();
  if (!token) return [];

  const params = seriesId ? { series_id: seriesId } : undefined;
  const response = await apiGet<{
    success: boolean;
    data: Array<{
      _id: string;
      series_id: { _id: string; name: string };
      score: number;
      comment: string;
      createdAt: string;
    }>;
  }>('/reader/votes/mine', { token, params });

  if (!response.success) return [];

  return response.data.map((v) => ({
    id: v._id,
    seriesId: v.series_id._id,
    score: v.score,
    comment: v.comment ?? '',
    createdAt: v.createdAt,
  }));
}
