/**
 * StoryGridCard — card lưới hiển thị truyện trong trang chủ (3 cột).
 * Glass card + ảnh bìa bo tròn + 2 chip meta.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '../../types/story';
import { colors, radius, spacing, typography } from '../../theme/colors';

interface StoryGridCardProps {
  story: Story;
  width: number;
  onPress: (id: string) => void;
}

export function StoryGridCard({ story, width, onPress }: StoryGridCardProps) {
  const coverHeight = width * 1.4;
  const hasRating = story.rating && story.rating > 0;

  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [
        styles.card,
        { width, transform: [{ scale: pressed ? 0.96 : 1 }], opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.coverWrapper, { height: coverHeight }]}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={250}
        />
        <LinearGradient
          colors={['rgba(7,11,26,0)', 'rgba(7,11,26,0.55)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.chapterBadge}>
          <Ionicons name="book-outline" size={9} color={colors.cyan} />
          <Text style={styles.chapterBadgeText}>Ch. {story.latestChapter}</Text>
        </View>
        {hasRating && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={styles.ratingText}>{(story.rating ?? 0).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>

      <View style={styles.metaRow}>
        {story.updatedAt ? (
          <Text style={styles.updatedAt} numberOfLines={1}>
            {story.updatedAt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  coverWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  chapterBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(8,12,32,0.78)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chapterBadgeText: {
    color: colors.cyan,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(8,12,32,0.78)',
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
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36,
    letterSpacing: -0.1,
  },
  metaRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  updatedAt: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyRegular,
  },
});
