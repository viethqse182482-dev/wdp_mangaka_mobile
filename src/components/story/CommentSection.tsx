import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchComments, submitComment } from '../../services/commentService';
import { VoteSection } from './VoteSection';
import { StoryComment, StoryDetail } from '../../types/storyDetail';
import { formatReadTime } from '../../utils/formatReadTime';
import { colors, radius, spacing } from '../../theme/colors';

interface CommentSectionProps {
  story: StoryDetail;
  onVoteSuccess?: (seriesId: string, averageScore: number, totalVotes: number) => void;
}

const COMMENTS_PER_PAGE = 20;

export function CommentSection({ story, onVoteSuccess }: CommentSectionProps) {
  const [comments, setComments] = useState<StoryComment[]>(story.comments);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const isFetchingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

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
      };

      setComments((current) =>
        current.map((c) => (c.id === tempId ? newComment : c)),
      );
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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>BÌNH LUẬN</Text>

      <VoteSection
        seriesId={story.id}
        initialRating={story.rating}
        initialVotes={story.ratingCount}
        onVoteSuccess={handleVoteSuccess}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Người tiện tay vẽ hoa vẽ lá..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          editable={!loading}
        />
        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={({ pressed }) => [
            styles.sendButton,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          <Text style={[styles.sendText, loading && styles.disabledText]}>
            {loading ? '...' : 'GỬI'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentCard comment={item} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Chưa có bình luận nào.</Text> : null
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

function CommentCard({ comment }: { comment: StoryComment }) {
  const isReply = Boolean(comment.replyTo);

  return (
    <View style={[styles.commentBlock, isReply && styles.replyBlock]}>
      <View style={styles.commentHeader}>
        <Text style={styles.username}>{comment.username}</Text>
        <Text style={styles.chapterRef}>Chương {comment.chapterNumber}</Text>
        <View style={[styles.badge, { backgroundColor: comment.badgeColor }]}>
          <Text style={styles.badgeText}>{comment.badge}</Text>
        </View>
        <Text style={styles.time}>{formatReadTime(comment.createdAt)}</Text>
      </View>

      <View style={styles.commentBody}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      <View style={styles.commentActions}>
        <Text style={styles.actionLink}>Trả lời</Text>
        <Text style={styles.actionLink}>Báo cáo</Text>
        <Text style={styles.actionLink}>Tag Tên</Text>
        <Ionicons name="happy-outline" size={14} color={colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.black,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sendText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  commentBlock: {
    marginBottom: spacing.lg,
  },
  replyBlock: {
    marginLeft: spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
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
    color: '#F472B6',
    fontSize: 13,
    fontWeight: '700',
  },
  chapterRef: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  commentBody: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionLink: {
    color: colors.textMuted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    marginVertical: spacing.lg,
  },
  loadingMore: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
    marginVertical: spacing.sm,
  },
});
