import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Story } from '../../types/story';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryGridCardProps {
  story: Story;
  width: number;
  onPress: (id: string) => void;
}

export function StoryGridCard({ story, width, onPress }: StoryGridCardProps) {
  const coverHeight = width * 1.45;
  const hasRating = story.rating && story.rating > 0;

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.coverWrapper, { height: coverHeight }]}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.chapterBadge}>
          <Text style={styles.chapterBadgeText}>Ch. {story.latestChapter}</Text>
        </View>
        {hasRating && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={styles.ratingText}>{story.rating}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>

      <View style={styles.metaRow}>
        {hasRating && (
          <Text style={styles.ratingCount}>({story.ratingCount} đánh giá)</Text>
        )}
        <Text style={[styles.updatedAt, hasRating && styles.updatedAtSmall]}>{story.updatedAt}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  coverWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  chapterBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chapterBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  ratingText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingCount: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  updatedAt: {
    color: colors.textMuted,
    fontSize: 11,
  },
  updatedAtSmall: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
