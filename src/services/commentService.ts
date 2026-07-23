import { Alert } from 'react-native';
import { apiDelete, apiGet, apiPost } from './apiClient';
import { getAuthToken } from './authService';

export interface Comment {
  id: string;
  username: string;
  badge: string;
  badgeColor: string;
  chapterNumber: number;
  content: string;
  createdAt: string;
  replyTo?: string;
}

interface BeComment {
  _id?: string;
  id?: string;
  username?: string;
  user?: { username?: string };
  badge?: string;
  badge_color?: string;
  badgeColor?: string;
  chapter_number?: number;
  chapterNumber?: number;
  content?: string;
  createdAt?: string;
  created_at?: string;
  reply_to?: string;
  replyTo?: string;
}

interface BeCommentsResponse {
  success: boolean;
  comments?: BeComment[];
  data?: BeComment[];
  total?: number;
  page?: number;
  limit?: number;
}

interface BeSubmitCommentResponse {
  success: boolean;
  comment?: BeComment;
  data?: BeComment;
  message?: string;
}

function mapBeCommentToComment(be: BeComment): Comment {
  return {
    id: be._id ?? be.id ?? '',
    username: be.user?.username ?? be.username ?? 'Người dùng',
    badge: be.badge ?? 'Độc giả',
    badgeColor: be.badge_color ?? be.badgeColor ?? '#6366F1',
    chapterNumber: be.chapter_number ?? be.chapterNumber ?? 1,
    content: be.content ?? '',
    createdAt: be.createdAt ?? be.created_at ?? new Date().toISOString(),
    replyTo: be.reply_to ?? be.replyTo,
  };
}

export async function submitComment(
  seriesId: string,
  content: string,
  chapterNumber?: number,
  replyTo?: string,
): Promise<Comment> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await apiPost<BeSubmitCommentResponse>(
    '/comments',
    {
      series_id: seriesId,
      content,
      chapter_number: chapterNumber,
      reply_to: replyTo,
    },
    { token },
  );

  if (!response.success) {
    throw new Error(response.message ?? 'Không thể gửi bình luận');
  }

  const comment = response.comment ?? response.data;
  if (!comment) {
    throw new Error('Không nhận được dữ liệu bình luận từ máy chủ');
  }

  return mapBeCommentToComment(comment);
}

export async function fetchComments(
  seriesId: string,
  page = 1,
  limit = 20,
): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> {
  const token = await getAuthToken();
  if (!token) {
    return { comments: [], total: 0, page: 1, limit };
  }

  const response = await apiGet<BeCommentsResponse>(
    `/comments/series/${encodeURIComponent(seriesId)}`,
    {
      token,
      params: { page, limit },
    },
  );

  if (!response.success) {
    throw new Error('Không thể tải bình luận');
  }

  const rawComments = response.comments ?? response.data ?? [];
  const comments = rawComments.map(mapBeCommentToComment);

  return {
    comments,
    total: response.total ?? rawComments.length,
    page: response.page ?? page,
    limit: response.limit ?? limit,
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await apiDelete<{ success: boolean; message?: string }>(
    `/comments/${encodeURIComponent(commentId)}`,
    { token },
  );

  if (!response.success) {
    throw new Error(response.message ?? 'Không thể xóa bình luận');
  }
}
