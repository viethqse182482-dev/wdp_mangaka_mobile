import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { VoteSection } from './VoteSection';
import { StoryComment, StoryDetail } from '../../types/storyDetail';
import { formatReadTime } from '../../utils/formatReadTime';
import { colors, radius, spacing } from '../../theme/colors';

interface CommentSectionProps {
  story: StoryDetail;
  onVoteSuccess?: (seriesId: string, averageScore: number, totalVotes: number) => void;
}

export function CommentSection({ story, onVoteSuccess }: CommentSectionProps) {
  const [comments, setComments] = useState(story.comments);
  const [draft, setDraft] = useState('');

  const handleVoteSuccess = (result: { average_score: number; total_votes: number }) => {
    onVoteSuccess?.(story.id, result.average_score, result.total_votes);
  };

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;

    setComments((current) => [
      {
        id: `local-${Date.now()}`,
        username: 'Bạn',
        badge: 'Độc giả',
        badgeColor: colors.accent,
        chapterNumber: story.comments[0]?.chapterNumber ?? 1,
        content,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft('');
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
        />
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
        >
          <Text style={styles.sendText}>GỬI</Text>
        </Pressable>
      </View>

      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
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
});
