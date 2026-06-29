import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '../../types/story';
import { BookshelfButton } from '../library/BookshelfButton';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryActionBarProps {
  story: Story;
  lastReadChapter?: number;
  onReadFromStart?: () => void;
  onContinueReading?: () => void;
  onNotifyPress?: () => void;
  onLoginRequired?: () => void;
}

export function StoryActionBar({
  story,
  lastReadChapter,
  onReadFromStart,
  onContinueReading,
  onNotifyPress,
  onLoginRequired,
}: StoryActionBarProps) {
  const hasHistory = typeof lastReadChapter === 'number' && lastReadChapter > 1;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <BookshelfButton
          seriesId={story.id}
          variant="pill"
          onLoginRequired={onLoginRequired}
        />

        <Pressable
          onPress={onNotifyPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.actionText}>Thông Báo</Text>
        </Pressable>
      </View>

      <View style={styles.readRow}>
        {hasHistory && onContinueReading ? (
          <Pressable
            onPress={onContinueReading}
            style={({ pressed }) => [styles.readButton, styles.readButtonSecondary, pressed && styles.pressed]}
          >
            <Ionicons name="play-forward" size={16} color={colors.accent} />
            <Text style={styles.readButtonTextSecondary}>
              Đọc Tiếp (Ch.{lastReadChapter})
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onReadFromStart}
          style={({ pressed }) => [
            styles.readButton,
            styles.readButtonPrimary,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="book" size={16} color={colors.white} />
          <Text style={styles.readButtonTextPrimary}>
            {hasHistory ? 'Đọc Từ Đầu' : 'Đọc'}
          </Text>
        </Pressable>
      </View>
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
  readRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  readButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  readButtonPrimary: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  readButtonSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    flex: 2,
  },
  readButtonTextPrimary: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  readButtonTextSecondary: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});