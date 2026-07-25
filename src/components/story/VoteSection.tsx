/**
 * VoteSection — App Store-style minimalist 5-star voting.
 *
 *  - Header: large average score + 5 stars + total votes count.
 *  - 3 states:
 *      (a) Chưa vote  → 5 sao lớn + "Chạm để đánh giá"
 *      (b) Đã vote    → compact badge "Bạn đã đánh giá X★" + 1 icon Create
 *      (c) Đang sửa   → 5 sao sáng với điểm cũ + Lưu/Hủy + nút Xóa đánh giá riêng
 *  - Optimistic UI: tính averageScore/totalVotes TRƯỚC khi gọi API,
 *    set local state ngay, fire callback với số liệu đã tính.
 *    KHÔNG phụ thuộc payload trả về từ server.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deleteVote,
  fetchMyVoteForSeries,
  MyVoteForSeries,
  submitVote,
} from '../../services/voteService';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, GradientButton } from '../../theme/uiPrimitives';

interface VoteSectionProps {
  seriesId: string;
  initialRating: number;
  initialVotes: number;
  isLoggedIn: boolean;
  onVoteSuccess?: (result: { average_score: number; total_votes: number }) => void;
  onVoteRemoved?: (result: { average_score: number; total_votes: number }) => void;
}

export function VoteSection({
  seriesId,
  initialRating,
  initialVotes,
  isLoggedIn,
  onVoteSuccess,
  onVoteRemoved,
}: VoteSectionProps) {
  const [rating, setRating] = useState(initialRating);
  const [totalVotes, setTotalVotes] = useState(initialVotes);
  const [submitting, setSubmitting] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  const [myVote, setMyVote] = useState<MyVoteForSeries | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setCheckingVote(false);
      setMyVote(null);
      setIsEditing(false);
      return;
    }

    setCheckingVote(true);
    fetchMyVoteForSeries(seriesId)
      .then((vote) => {
        setMyVote(vote);
        setIsEditing(false);
      })
      .catch(() => {
        setMyVote(null);
      })
      .finally(() => {
        setCheckingVote(false);
      });
  }, [seriesId, isLoggedIn]);

  /** Điểm sáng trên hàng 5 sao trong chế độ sửa. */
  const displayedDraftScore = (() => {
    if (hoveredStar > 0) return hoveredStar;
    return myVote?.score ?? 0;
  })();

  const handleVote = async (starValue: number) => {
    if (submitting) return;
    setSubmitting(true);

    // Optimistic math — tính trước khi gọi API để UI phản hồi tức thì.
    // Công thức đúng:
    //   sum_old = rating * totalVotes
    //   Nếu user đã có vote (myVote): sum_new = sum_old - myVote.score + starValue
    //                                total_new = totalVotes (không đổi)
    //   Nếu chưa có vote:           sum_new = sum_old + starValue
    //                                total_new = totalVotes + 1
    //   rating_new = sum_new / total_new
    const newTotal = myVote ? totalVotes : totalVotes + 1;
    const prevTotalScore = myVote
      ? rating * totalVotes - myVote.score
      : rating * totalVotes;
    const newRating = newTotal > 0 ? (prevTotalScore + starValue) / newTotal : 0;

    const snapshotRating = rating;
    const snapshotTotalVotes = totalVotes;
    const snapshotMyVote = myVote;

    setRating(newRating);
    setTotalVotes(newTotal);
    // Tạm set id rỗng — sẽ được cập nhật từ response server bên dưới.
    setMyVote({
      id: snapshotMyVote?.id ?? '',
      seriesId,
      score: starValue,
      comment: '',
      createdAt: snapshotMyVote?.createdAt ?? new Date().toISOString(),
    });
    setHoveredStar(0);
    setIsEditing(false);

    try {
      // Lấy `voteId` thật từ server, không bỏ qua. Cần thiết để DeleteVote
      // (nếu vote đầu tiên, myVote.id trước đó là rỗng — phải dùng id server trả về).
      const response = await submitVote(seriesId, starValue);
      setMyVote((prev) => (prev ? { ...prev, id: response.voteId } : prev));
      // Vẫn dùng optimistic math (chính xác hơn nếu có FP rounding) thay vì
      // stats server — `seriesStats` từ server có thể làm tròn 1 chữ số thập phân.
      onVoteSuccess?.({ average_score: newRating, total_votes: newTotal });
    } catch (err) {
      setRating(snapshotRating);
      setTotalVotes(snapshotTotalVotes);
      setMyVote(snapshotMyVote);
      Alert.alert(
        'Lỗi',
        err instanceof Error ? err.message : 'Không thể gửi đánh giá. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!myVote?.id || submitting) return;

    Alert.alert(
      'Xóa đánh giá',
      'Bạn có chắc muốn xóa đánh giá của mình cho truyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const newTotal = Math.max(0, totalVotes - 1);
            const newRating =
              newTotal === 0
                ? 0
                : ((rating * totalVotes - myVote.score) / newTotal);

            const snapshotRating = rating;
            const snapshotTotalVotes = totalVotes;
            const snapshotMyVote = myVote;

            setRating(newRating);
            setTotalVotes(newTotal);
            setMyVote(null);
            setHoveredStar(0);
            setIsEditing(false);

            try {
              await deleteVote(myVote.id);
              onVoteRemoved?.({ average_score: newRating, total_votes: newTotal });
            } catch (err) {
              setRating(snapshotRating);
              setTotalVotes(snapshotTotalVotes);
              setMyVote(snapshotMyVote);
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Không thể xóa đánh giá.',
              );
            }
          },
        },
      ],
    );
  };

  const displayRating = rating.toFixed(1);
  const hasVoted = myVote !== null;

  return (
    <GlassCard
      tint="navy"
      depth={2}
      radius={radius.lg}
      innerStyle={styles.card}
    >
      {/* Header: title + lớn average score + 5 stars + total votes */}
      <View style={styles.header}>
        <Text style={styles.title}>ĐÁNH GIÁ & NHẬN XÉT</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreValue}>{displayRating}</Text>
          <View style={styles.scoreMeta}>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, index) => {
                const filled = Math.round(rating) > index;
                return (
                  <Ionicons
                    key={`header-${index}`}
                    name={filled ? 'star' : 'star-outline'}
                    size={16}
                    color={filled ? colors.warning : colors.textMuted}
                  />
                );
              })}
            </View>
            <Text style={styles.votesCount}>
              {totalVotes} lượt đánh giá
            </Text>
          </View>
        </View>
      </View>

      {checkingVote ? (
        <ActivityIndicator
          size="small"
          color={colors.accentLight}
          style={styles.checkingIndicator}
        />
      ) : isEditing && hasVoted ? (
        /* (c) Đang sửa — 5 sao sáng với điểm cũ + Lưu/Hủy + nút Xóa */
        <View style={styles.editMode}>
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              const isFilled = displayedDraftScore >= starValue;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleVote(starValue)}
                  onPressIn={() => setHoveredStar(starValue)}
                  onPressOut={() => setHoveredStar(0)}
                  hitSlop={10}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.starButton,
                    pressed && styles.pressed,
                    isFilled && styles.starButtonActive,
                  ]}
                >
                  <Ionicons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={38}
                    color={isFilled ? colors.warning : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.editActions}>
            <GradientButton
              label="Hủy"
              variant="ghost"
              onPress={() => {
                setIsEditing(false);
                setHoveredStar(0);
              }}
              disabled={submitting}
              size="sm"
            />
          </View>

          {/* Nút Xóa đánh giá — ẩn trong chế độ sửa */}
          <Pressable
            onPress={handleRemoveVote}
            disabled={submitting}
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.removeButtonText}>Xóa đánh giá</Text>
          </Pressable>
        </View>
      ) : hasVoted ? (
        /* (b) Đã vote — compact: badge + icon Create để sửa */
        <View style={styles.votedRow}>
          <View style={styles.votedBadge}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.votedBadgeText}>
              Bạn đã đánh giá {myVote?.score}/5
            </Text>
          </View>
          <Pressable
            onPress={() => setIsEditing(true)}
            hitSlop={10}
            style={({ pressed }) => [styles.editIcon, pressed && styles.pressed]}
            accessibilityLabel="Sửa đánh giá"
          >
            <Ionicons name="create-outline" size={20} color={colors.accentLight} />
          </Pressable>
        </View>
      ) : (
        /* (a) Chưa vote — 5 sao lớn + tap hint */
        <View style={styles.idleMode}>
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              const isFilled = hoveredStar >= starValue;
              const isLoadingThis = submitting && hoveredStar === starValue;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleVote(starValue)}
                  onPressIn={() => setHoveredStar(starValue)}
                  onPressOut={() => setHoveredStar(0)}
                  hitSlop={10}
                  disabled={submitting || !isLoggedIn}
                  style={({ pressed }) => [
                    styles.starButton,
                    pressed && styles.pressed,
                    isFilled && styles.starButtonActive,
                  ]}
                >
                  {isLoadingThis ? (
                    <ActivityIndicator size="small" color={colors.warning} />
                  ) : (
                    <Ionicons
                      name={isFilled ? 'star' : 'star-outline'}
                      size={42}
                      color={isFilled ? colors.warning : colors.textMuted}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.tapHint}>
            {isLoggedIn ? 'Chạm để đánh giá' : 'Đăng nhập để đánh giá'}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  scoreValue: {
    color: colors.warning,
    fontSize: 48,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  scoreMeta: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  votesCount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  checkingIndicator: {
    marginVertical: spacing.lg,
  },
  /* === State (a) chưa vote === */
  idleMode: {
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  starButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  starButtonActive: {
    shadowColor: colors.warning,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  tapHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  /* === State (b) đã vote — compact row === */
  votedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  votedBadgeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  editIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.glassLight,
  },
  /* === State (c) đang sửa === */
  editMode: {
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
});
