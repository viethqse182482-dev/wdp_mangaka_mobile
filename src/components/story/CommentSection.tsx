/**
 * CommentSection — phần bình luận với glass card + input bubble.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deleteComment, fetchComments, submitComment } from '../../services/commentService';
import { getAuthUser } from '../../services/authService';
import { invalidateSeriesDetailCache } from '../../services/seriesService';
import { VoteSection } from './VoteSection';
import { StoryComment, StoryDetail } from '../../types/storyDetail';
import { formatReadTime } from '../../utils/formatReadTime';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, GradientButton, Tag, GlassTextField } from '../../theme/uiPrimitives';

interface CommentSectionProps {
  story: StoryDetail;
  isLoggedIn: boolean;
  onVoteSuccess?: (seriesId: string, averageScore: number, totalVotes: number) => void;
  onVoteRemoved?: (seriesId: string, averageScore: number, totalVotes: number) => void;
}

const COMMENTS_PER_PAGE = 20;

function isCommentOwnedBy(commentReaderId: string | undefined, currentUserId: string | null): boolean {
  if (!currentUserId || !commentReaderId) return false;
  // So sánh qua String() để tránh lệch kiểu (BE có thể trả về ObjectId đã serialize
  // thành string, nhưng tuỳ schema có thể trả về object lồng — đã được chuẩn hoá
  // ở commentService.mapBeCommentToComment). Trim để chắc chắn không có khoảng trắng.
  return String(commentReaderId).trim() === String(currentUserId).trim();
}

export function CommentSection({ story, isLoggedIn, onVoteSuccess, onVoteRemoved }: CommentSectionProps) {
  const [comments, setComments] = useState<StoryComment[]>(story.comments);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUserId(null);
      return;
    }
    getAuthUser()
      .then((u) => setCurrentUserId(u?.userId ? String(u.userId) : null))
      .catch(() => setCurrentUserId(null));
  }, [isLoggedIn]);

  const loadComments = async (pageNum: number, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await fetchComments(story.id, pageNum, COMMENTS_PER_PAGE);
      const mappedComments: StoryComment[] = result.comments.map((c) => ({
        id: c.id,
        username: c.username,
        badge: c.badge,
        badgeColor: c.badgeColor,
        chapterNumber: c.chapterNumber,
        content: c.content,
        createdAt: c.createdAt,
        replyTo: c.replyTo,
        readerId: c.readerId,
      }));

      if (isRefresh || pageNum === 1) {
        setComments(mappedComments);
      } else {
        setComments((prev) => [...prev, ...mappedComments]);
      }

      setHasMore(result.comments.length >= COMMENTS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadComments(1, true);
  }, [story.id]);

  const handleVoteSuccess = (result: { average_score: number; total_votes: number }) => {
    onVoteSuccess?.(story.id, result.average_score, result.total_votes);
  };

  const handleVoteRemoved = (result: { average_score: number; total_votes: number }) => {
    onVoteRemoved?.(story.id, result.average_score, result.total_votes);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || loading) return;

    const tempId = `local-${Date.now()}`;
    const tempComment: StoryComment = {
      id: tempId,
      username: 'Bạn',
      badge: 'Độc giả',
      badgeColor: colors.accent,
      chapterNumber: story.comments[0]?.chapterNumber ?? 1,
      content,
      createdAt: new Date().toISOString(),
      readerId: currentUserId ?? undefined,
    };

    setComments((current) => [tempComment, ...current]);
    setDraft('');
    setLoading(true);

    try {
      const result = await submitComment(story.id, content, tempComment.chapterNumber);
      const newComment: StoryComment = {
        id: result.id,
        username: result.username,
        badge: result.badge,
        badgeColor: result.badgeColor,
        chapterNumber: result.chapterNumber,
        content: result.content,
        createdAt: result.createdAt,
        replyTo: result.replyTo,
        readerId: result.readerId ?? currentUserId ?? undefined,
      };

      setComments((current) =>
        current.map((c) => (c.id === tempId ? newComment : c)),
      );
      // Comment mới gửi thành công — cache `StoryDetail.comments` (kèm `readerId`)
      // đã cũ. Xoá cache để lần mở StoryDetail tiếp theo fetch lại, tránh state
      // ban đầu hiển thị comment cũ thiếu `readerId` → ẩn nhầm nút Xóa/Xem.
      invalidateSeriesDetailCache(story.id);
    } catch (error: any) {
      console.error('Failed to submit comment:', error);
      if (error?.message === 'Not authenticated') {
        Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để gửi bình luận.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingRef.current && hasMore) {
      loadComments(page + 1);
    }
  };

  const handleRefresh = () => {
    setHasMore(true);
    setPage(1);
    loadComments(1, true);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId || commentId.startsWith('local-')) return;

    Alert.alert(
      'Xóa bình luận',
      'Bạn có chắc muốn xóa bình luận này? Bình luận trả lời cũng sẽ bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(commentId);
            try {
              await deleteComment(commentId);
              setComments((current) =>
                current.filter(
                  (c) => c.id !== commentId && c.replyTo !== commentId,
                ),
              );
              // Xoá comment thành công — cache `StoryDetail.comments` dù hiện tại
              // đã có trong state local, vẫn có thể chứa bản cũ khi user navigate
              // tới StoryDetail khác rồi quay lại. Invalidate để lần mở tới fetch mới.
              invalidateSeriesDetailCache(story.id);
            } catch (err) {
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Không thể xóa bình luận.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleIconWrap}>
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.cyan} />
        </View>
        <Text style={styles.title}>BÌNH LUẬN</Text>
        <Tag label={`${comments.length}`} variant="default" />
      </View>

      <VoteSection
        seriesId={story.id}
        initialRating={story.rating}
        initialVotes={story.ratingCount}
        isLoggedIn={isLoggedIn}
        onVoteSuccess={handleVoteSuccess}
        onVoteRemoved={handleVoteRemoved}
      />

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <GlassTextField
            icon="chatbox-outline"
            placeholder="Người tiện tay vẽ hoa vẽ lá..."
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!loading}
          />
        </View>
        <GradientButton
          label="Gửi"
          icon="send"
          onPress={handleSend}
          loading={loading}
          disabled={!draft.trim()}
          size="md"
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommentCard
            comment={item}
            isOwner={isCommentOwnedBy(item.readerId, currentUserId)}
            isDeleting={deletingId === item.id}
            onDelete={handleDeleteComment}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Chưa có bình luận nào.</Text>
          ) : null
        }
        ListFooterComponent={
          hasMore && comments.length > 0 && !loading ? (
            <Text style={styles.loadingMore}>Đang tải thêm...</Text>
          ) : null
        }
        scrollEnabled={false}
      />
    </View>
  );
}

function CommentCard({
  comment,
  isOwner,
  isDeleting,
  onDelete,
}: {
  comment: StoryComment;
  isOwner: boolean;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
  const isReply = Boolean(comment.replyTo);

  return (
    <View style={[styles.commentBlock, isReply && styles.replyBlock]}>
      <View style={styles.commentHeader}>
        <Text style={styles.username}>{comment.username}</Text>
        <View style={[styles.badge, { backgroundColor: comment.badgeColor }]}>
          <Text style={styles.badgeText}>{comment.badge}</Text>
        </View>
        <Text style={styles.time}>{formatReadTime(comment.createdAt)}</Text>
      </View>

      <View style={styles.commentBody}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      {isOwner && !comment.id.startsWith('local-') ? (
        <View style={styles.commentActions}>
          <Pressable
            onPress={() => onDelete(comment.id)}
            disabled={isDeleting}
            style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
          >
            {isDeleting ? (
              <Text style={styles.deleteLinkText}>Đang xóa…</Text>
            ) : (
              <>
                <Ionicons name="trash-outline" size={12} color={colors.danger} />
                <Text style={styles.deleteLinkText}>Xóa</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  titleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  commentBlock: {
    marginBottom: spacing.lg,
  },
  replyBlock: {
    marginLeft: spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.glassBorder,
    paddingLeft: spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  username: {
    color: colors.accentLight,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyRegular,
  },
  commentBody: {
    backgroundColor: colors.glassLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamilyRegular,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteLinkText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    marginVertical: spacing.lg,
    fontFamily: typography.fontFamilyRegular,
  },
  loadingMore: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginVertical: spacing.sm,
    fontFamily: typography.fontFamilyRegular,
  },
});
