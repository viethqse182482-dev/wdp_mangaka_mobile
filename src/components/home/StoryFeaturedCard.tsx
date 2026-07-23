import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FeaturedStory } from '../../types/story';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryFeaturedCardProps {
  story: FeaturedStory;
  onPress: (id: string) => void;
}

const COVER_WIDTH = 100;
const COVER_HEIGHT = 140;

export function StoryFeaturedCard({ story, onPress }: StoryFeaturedCardProps) {
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{story.latestChapter} Chương</Text>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Text style={styles.statText}>{story.rating}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
            <Text style={styles.statText}>{formatCompactNumber(story.views)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
            <Text style={styles.statText}>{formatCompactNumber(story.followers)}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>

        <View style={styles.genreRow}>
          {story.genres.slice(0, 2).map((genre) => (
            <View key={genre} style={styles.genreBadge}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.synopsis} numberOfLines={3}>
          {story.synopsis}
        </Text>

        <Text style={styles.readLink}>ĐỌC TRUYỆN</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coverWrapper: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: spacing.xs,
    fontFamily: 'Roboto-Bold',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  genreBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Roboto-Medium',
  },
  synopsis: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  readLink: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'Roboto-Bold',
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.surface,
  },
});
