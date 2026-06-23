import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { isStoryFollowed, toggleFollowStory } from '../../services/followService';
import { Story } from '../../types/story';
import { colors } from '../../theme/colors';

interface FollowButtonProps {
  story: Story;
  size?: number;
  variant?: 'bookmark' | 'heart';
  onToggle?: (following: boolean) => void;
}

export function FollowButton({ story, size = 22, variant = 'bookmark', onToggle }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    isStoryFollowed(story.id).then((value) => {
      if (mounted) {
        setFollowing(value);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [story.id]);

  const handlePress = useCallback(async () => {
    const nextValue = await toggleFollowStory(story);
    setFollowing(nextValue);
    onToggle?.(nextValue);
  }, [onToggle, story]);

  const iconName =
    variant === 'heart'
      ? following
        ? 'heart'
        : 'heart-outline'
      : following
        ? 'bookmark'
        : 'bookmark-outline';

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons
        name={iconName}
        size={size}
        color={following ? colors.accent : colors.textPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
