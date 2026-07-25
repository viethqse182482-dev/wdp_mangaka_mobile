/**
 * StoryActionBar — CTA chính + quick actions gọn.
 *
 * Design:
 *  - Quick Actions: glass toolbar ngang chứa 2 icon tròn (bookmark, notify).
 *  - Primary CTA: GradientButton lớn, nổi bật, chiếm toàn bộ chiều rộng.
 *  - Optional "Continue reading" glass pill phía trên CTA nếu có lịch sử.
 *    → Tap pill = đọc tiếp chương đã đọc (nhanh).
 *    → Tap CTA chính = mở ReadActionSheet (chọn tiếp/chọn lại/chọn chương).
 *    → Trừ khi chưa từng đọc, khi đó CTA = đi thẳng chương 1.
 *
 * Mục tiêu: giảm chiều dọc, primary focus 100% vào nút ĐỌC.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Story } from '../../types/story';
import { BookshelfButton } from '../library/BookshelfButton';
import { NotificationToggle } from './NotificationToggle';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { LiquidGlass } from '../../theme/LiquidGlass';
import { GradientButton } from '../../theme/uiPrimitives';

interface StoryActionBarProps {
  story: Story;
  authorId?: string;
  authorName?: string;
  lastReadChapter?: number;
  /**
   * Có lịch sử đọc trước đó không. Quyết định:
   *  - Hiển thị pill "Tiếp tục đọc" phía trên CTA.
   *  - Primary CTA đổi sang "ĐỌC NGAY" (parent sẽ mở ReadActionSheet).
   * Nếu false → primary CTA = "BẮT ĐẦU ĐỌC" → đi thẳng chương 1.
   */
  hasHistory: boolean;
  onRead: () => void;
  onContinueReading?: () => void;
  onLoginRequired?: () => void;
}

export function StoryActionBar({
  story,
  lastReadChapter,
  hasHistory,
  onRead,
  onContinueReading,
  onLoginRequired,
}: StoryActionBarProps) {
  return (
    <View style={styles.wrapper}>
      {/* Quick Actions — glass toolbar ngang, 2 icon compact */}
      <LiquidGlass
        tint="navy"
        depth={2}
        radius={radius.pill}
        style={styles.toolbar}
        innerStyle={styles.toolbarInner}
      >
        <View style={styles.toolbarItem}>
          <BookshelfButton
            seriesId={story.id}
            variant="icon"
            onLoginRequired={onLoginRequired}
          />
        </View>
        <View style={styles.toolbarDivider} />
        <View style={styles.toolbarItem}>
          <NotificationToggle
            seriesId={story.id}
            seriesTitle={story.title}
            onLoginRequired={onLoginRequired}
          />
        </View>
      </LiquidGlass>

      {/* Continue Reading — nhỏ gọn, ẩn khi chưa có history.
          Tap = đọc tiếp ngay, không mở sheet. */}
      {hasHistory && typeof lastReadChapter === 'number' ? (
        <Pressable
          onPress={onContinueReading}
          style={({ pressed }) => [styles.continueWrap, pressed && styles.pressed]}
        >
          <LiquidGlass
            tint="accent"
            depth={2}
            radius={radius.lg}
            style={styles.continue}
            innerStyle={styles.continueInner}
          >
            <Ionicons name="play-circle" size={20} color={colors.accentLight} />
            <Text style={styles.continueLabel}>
              Tiếp tục đọc · Chương {lastReadChapter}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </LiquidGlass>
        </Pressable>
      ) : null}

      {/* Primary CTA — GradientButton lớn
          - Chưa có history: "BẮT ĐẦU ĐỌC" → parent đi thẳng chương 1.
          - Có history:    "ĐỌC NGAY"       → parent mở ReadActionSheet. */}
      <GradientButton
        label={hasHistory ? 'ĐỌC NGAY' : 'BẮT ĐẦU ĐỌC'}
        icon="book"
        variant="primary"
        size="lg"
        fullWidth
        glow
        onPress={onRead}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  // Quick Actions toolbar
  toolbar: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  toolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  toolbarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: colors.glassBorder,
    marginHorizontal: spacing.xs,
  },
  toolbarItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  // Continue reading
  continueWrap: {
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
  continue: {
    alignSelf: 'stretch',
  },
  continueInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  continueLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
