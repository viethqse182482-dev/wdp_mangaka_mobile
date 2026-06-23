import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '../../types/story';
import { FollowButton } from '../library/FollowButton';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryActionBarProps {
  story: Story;
  onReadFromStart?: () => void;
  onNotifyPress?: () => void;
}

export function StoryActionBar({ story, onReadFromStart, onNotifyPress }: StoryActionBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.followWrap}>
          <FollowButton story={story} size={18} variant="heart" />
          <Text style={styles.followLabel}>Theo Dõi</Text>
        </View>

        <Pressable
          onPress={onNotifyPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.actionText}>Thông Báo</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onReadFromStart}
        style={({ pressed }) => [styles.readButton, pressed && styles.pressed]}
      >
        <Text style={styles.readButtonText}>Đọc Từ Đầu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  followWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  followLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  readButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  readButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
