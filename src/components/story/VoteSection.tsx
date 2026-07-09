import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { submitVote, VoteResult } from '../../services/voteService';
import { colors, radius, spacing } from '../../theme/colors';

interface VoteSectionProps {
  seriesId: string;
  initialRating: number;
  initialVotes: number;
  onVoteSuccess?: (result: VoteResult) => void;
}

export function VoteSection({
  seriesId,
  initialRating,
  initialVotes,
  onVoteSuccess,
}: VoteSectionProps) {
  const [rating, setRating] = useState(initialRating);
  const [totalVotes, setTotalVotes] = useState(initialVotes);
  const [selectedStar, setSelectedStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (starValue: number) => {
    setSelectedStar(starValue);
    setSubmitting(true);

    try {
      const result = await submitVote(seriesId, starValue);
      setRating(result.average_score);
      setTotalVotes(result.total_votes);
      onVoteSuccess?.(result);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = Math.round(rating);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ĐÁNH GIÁ</Text>
        <View style={styles.statsRow}>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Ionicons
                key={index}
                name={index < displayRating ? 'star' : 'star-outline'}
                size={16}
                color={index < displayRating ? colors.gold : colors.textMuted}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} / 5 ({totalVotes} lượt)
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Bạn đánh giá bao nhiêu sao?</Text>

      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isSelected = selectedStar >= starValue && selectedStar > 0;
          return (
            <Pressable
              key={index}
              onPress={() => handleVote(starValue)}
              disabled={submitting}
              hitSlop={8}
            >
              {submitting && selectedStar === starValue ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <Ionicons
                  name={isSelected ? 'star' : 'star-outline'}
                  size={32}
                  color={isSelected ? colors.gold : colors.textMuted}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
