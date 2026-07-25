import { apiDelete, apiGet, apiPost } from './apiClient';
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

export interface SubmitVoteResponse {
  voteId: string;
  stats: VoteResult;
}

export async function submitVote(
  seriesId: string,
  score: number,
  comment?: string
): Promise<SubmitVoteResponse> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await apiPost<BeVoteResponse>(
    '/reader/votes',
    { series_id: seriesId, score, comment },
    { token }
  );

  if (!response.success) throw new Error('Vote failed');

  // CHỈ dùng `seriesStats` từ server. Không fallback `response.data` vì `data`
  // là vote object (chỉ chứa { _id, score, comment, ... }) — không có
  // `average_score`/`total_votes` → fallback `?? score` sẽ trả về `score` của
  // user vừa vote thay vì rating tổng. Điều này từng khiến hiển thị TB = 3
  // khi thực tế rating tổng đã là 4.
  if (!response.seriesStats || !response.data?._id) {
    throw new Error('Server không trả về seriesStats hoặc vote _id');
  }

  return {
    voteId: response.data._id,
    stats: {
      average_score: Number(response.seriesStats.average_score),
      total_votes: Number(response.seriesStats.total_votes),
    },
  };
}

export async function deleteVote(voteId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await apiDelete<{ success: boolean; message?: string }>(
    `/votes/${encodeURIComponent(voteId)}`,
    { token },
  );

  if (!response.success) {
    throw new Error(response.message ?? 'Không thể xóa đánh giá');
  }
}

export interface SeriesVote {
  id: string;
  score: number;
  comment: string;
  releasePeriod: string;
  createdAt: string;
  reader: {
    id?: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

interface BeSeriesVote {
  _id?: string;
  id?: string;
  score?: number;
  comment?: string;
  release_period?: string;
  createdAt?: string;
  created_at?: string;
  reader_id?: {
    _id?: string;
    username?: string;
    full_name?: string;
    fullName?: string;
    avatar_url?: string;
    avatarUrl?: string;
  } | string;
}

interface BeSeriesVotesResponse {
  success: boolean;
  data?: BeSeriesVote[];
  votes?: BeSeriesVote[];
  total?: number;
  page?: number;
  limit?: number;
}

export async function fetchSeriesVotes(
  seriesId: string,
  page = 1,
  limit = 20,
): Promise<{ votes: SeriesVote[]; total: number; page: number; limit: number }> {
  const token = await getAuthToken();
  if (!token) {
    return { votes: [], total: 0, page: 1, limit };
  }

  const response = await apiGet<BeSeriesVotesResponse>(
    `/votes/series/${encodeURIComponent(seriesId)}`,
    {
      token,
      params: { page, limit },
    },
  );

  if (!response.success) {
    throw new Error('Không thể tải danh sách đánh giá');
  }

  const raw = response.data ?? response.votes ?? [];
  const votes: SeriesVote[] = raw.map((v) => {
    const reader = typeof v.reader_id === 'object' && v.reader_id !== null ? v.reader_id : {};
    return {
      id: v._id ?? v.id ?? '',
      score: Number(v.score ?? 0),
      comment: v.comment ?? '',
      releasePeriod: v.release_period ?? '',
      createdAt: v.createdAt ?? v.created_at ?? new Date().toISOString(),
      reader: {
        id: typeof reader._id === 'string' ? reader._id : undefined,
        username: reader.username,
        fullName: reader.full_name ?? reader.fullName,
        avatarUrl: reader.avatar_url ?? reader.avatarUrl,
      },
    };
  });

  return {
    votes,
    total: response.total ?? raw.length,
    page: response.page ?? page,
    limit: response.limit ?? limit,
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
      // BE có thể trả `series_id` dưới 2 dạng:
      //  - string (ObjectId) — phổ biến nhất
      //  - object `{ _id, name }` — populate có thể trả thế này
      // Bắt buộc xử lý cả 2. Nếu chỉ assume object, `v.series_id._id` = undefined
      // → `myVote` luôn null → optimistic math ở VoteSection chạy sai branch
      // "chưa vote" → tính TB sai từ lần vote thứ 2.
      series_id: string | { _id: string; name?: string };
      score: number;
      comment?: string;
      createdAt: string;
    }>;
  }>('/reader/votes/mine', { token, params });

  if (!response.success) return [];

  return response.data
    .map((v) => ({
      id: v._id,
      seriesId: typeof v.series_id === 'string' ? v.series_id : v.series_id?._id ?? '',
      score: Number(v.score ?? 0),
      comment: v.comment ?? '',
      createdAt: v.createdAt,
    }))
    .filter((v) => v.seriesId);
}

export interface MyVoteForSeries {
  id: string;
  seriesId: string;
  score: number;
  comment: string;
  createdAt: string;
}

export async function fetchMyVoteForSeries(seriesId: string): Promise<MyVoteForSeries | null> {
  const votes = await fetchMyVotes(seriesId);
  return votes.find((v) => v.seriesId === seriesId) ?? null;
}
