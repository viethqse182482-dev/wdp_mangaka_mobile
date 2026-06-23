import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Story } from '../../types/story';
import { colors, radius, spacing } from '../../theme/colors';
import { FollowButton } from '../library/FollowButton';

interface StoryGridCardProps {
  story: Story;
  width: number;
  onPress: (id: string) => void;
}

export function StoryGridCard({ story, width, onPress }: StoryGridCardProps) {
  const coverHeight = width * 1.45;

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
        <View style={styles.followButton}>
          <FollowButton story={story} size={18} />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {story.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.updatedAt}>{story.updatedAt}</Text>
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
  followButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  updatedAt: {
    color: colors.textMuted,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
