import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FollowedStory } from '../../services/followService';
import { colors, radius, spacing } from '../../theme/colors';

interface LibraryStoryRowProps {
  story: FollowedStory;
  onPress: (id: string) => void;
  onUnfollow: (id: string) => void;
}

export function LibraryStoryRow({ story, onPress, onUnfollow }: LibraryStoryRowProps) {
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.coverWrapper}>
        <Image source={{ uri: story.coverUrl }} style={styles.cover} contentFit="cover" transition={200} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>

        <Text style={styles.genres} numberOfLines={1}>
          {story.genres.join(' · ')}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.chapter}>Chương {story.latestChapter}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.updatedAt}>{story.updatedAt}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => onUnfollow(story.id)}
        hitSlop={8}
        style={({ pressed }) => [styles.unfollowButton, pressed && styles.pressed]}
      >
        <Ionicons name="bookmark" size={20} color={colors.accent} />
      </Pressable>
    </Pressable>
  );
}

const COVER_WIDTH = 64;
const COVER_HEIGHT = 92;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  genres: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.xs,
  },
  chapter: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  updatedAt: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  unfollowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
