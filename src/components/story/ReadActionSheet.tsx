/**
 * ReadActionSheet — bottom action sheet hiện khi user bấm "Đọc Ngay"
 * trên một series đã từng đọc. Cho phép chọn nhanh:
 *   - Đọc tiếp từ chương đã đọc gần nhất
 *   - Đọc lại từ đầu (chương 1)
 *   - Chọn chương cụ thể (mở ChapterListModal ở StoryDetailScreen)
 *   - Hủy
 *
 * Pattern glass + handle đồng bộ với ChapterListModal trong ReaderScreen.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard } from '../../theme/uiPrimitives';

interface ReadActionSheetProps {
  visible: boolean;
  /** Số chương user đã đọc gần nhất — sheet dùng để hiển thị "Đọc tiếp · Chương X". */
  lastReadChapter?: number;
  /** Có nhiều hơn 1 chương không — để biết có nên hiện "Chọn chương". */
  hasMultipleChapters: boolean;
  onContinue: () => void;
  onRestart: () => void;
  onPickChapter: () => void;
  onClose: () => void;
}

export function ReadActionSheet({
  visible,
  lastReadChapter,
  hasMultipleChapters,
  onContinue,
  onRestart,
  onPickChapter,
  onClose,
}: ReadActionSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Đóng"
      />
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View style={styles.sheetContainer}>
        <GlassCard
          tint="navy"
          depth={3}
          radius={0}
          style={styles.sheet}
          innerStyle={styles.sheetInner}
          showHighlight
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Bạn muốn đọc tiếp?</Text>
          <Text style={styles.subtitle}>
            {typeof lastReadChapter === 'number' && lastReadChapter > 0
              ? `Lần cuối bạn đã đọc đến chương ${lastReadChapter}.`
              : 'Bạn đã từng đọc truyện này.'}
          </Text>

          {/* Đọc tiếp — option chính, nổi bật */}
          <Pressable
            onPress={onContinue}
            disabled={typeof lastReadChapter !== 'number' || lastReadChapter <= 0}
            style={({ pressed }) => [
              styles.option,
              styles.optionPrimary,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.optionIconWrap}>
              <Ionicons name="play-circle" size={22} color={colors.white} />
            </View>
            <View style={styles.optionBody}>
              <Text style={styles.optionPrimaryTitle}>Đọc tiếp</Text>
              <Text style={styles.optionPrimarySubtitle}>
                {typeof lastReadChapter === 'number' && lastReadChapter > 0
                  ? `Chương ${lastReadChapter}`
                  : 'Chương gần nhất'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>

          {/* Chọn chương — mở ChapterListModal ở parent */}
          {hasMultipleChapters ? (
            <Pressable
              onPress={onPickChapter}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <View style={[styles.optionIconWrap, styles.optionIconWrapGhost]}>
                <Ionicons name="list" size={22} color={colors.accentLight} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Chọn chương</Text>
                <Text style={styles.optionSubtitle}>Mở danh sách đầy đủ</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}

          {/* Đọc từ đầu — luôn hiển thị để reset trải nghiệm */}
          <Pressable
            onPress={onRestart}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <View style={[styles.optionIconWrap, styles.optionIconWrapGhost]}>
              <Ionicons name="refresh" size={22} color={colors.accentLight} />
            </View>
            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Đọc từ đầu</Text>
              <Text style={styles.optionSubtitle}>Bắt đầu lại từ chương 1</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          {/* Cancel */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Hủy</Text>
          </Pressable>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  sheetInner: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassHeavy,
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: typography.fontFamilyRegular,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  /* === Option rows === */
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    marginBottom: spacing.sm,
  },
  optionPrimary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapGhost: {
    backgroundColor: colors.glassHeavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyRegular,
    marginTop: 2,
  },
  optionPrimaryTitle: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  optionPrimarySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
});
