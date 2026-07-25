/**
 * StoryAuthorCard — dòng tác giả nổi bật ngay trên synopsis.
 *
 * Gồm:
 *  - Avatar placeholder (icon glass).
 *  - Tên tác giả + label "Tác giả".
 *  - Nút FollowAuthorButton (compact) nằm trong cùng row → user biết chính xác
 *    đâu là điểm tap để mở trang tác giả hoặc follow.
 *
 * Toàn bộ row là Pressable để navigate sang trang author.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { LiquidGlass } from '../../theme/LiquidGlass';
import { FollowAuthorButton } from './FollowAuthorButton';

interface StoryAuthorCardProps {
  authorId: string;
  authorName: string;
  onAuthorPress: () => void;
  onLoginRequired?: () => void;
}

export function StoryAuthorCard({
  authorId,
  authorName,
  onAuthorPress,
  onLoginRequired,
}: StoryAuthorCardProps) {
  const initial = (authorName?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <LiquidGlass
      tint="navy"
      depth={2}
      radius={radius.lg}
      style={styles.card}
      innerStyle={styles.cardInner}
    >
      <Pressable
        onPress={onAuthorPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>TÁC GIẢ</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {authorName}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
              style={styles.chevron}
            />
          </View>
        </View>

        {/* Follow button ngay trong row, ngăn sự kiện tap để bubble lên Pressable cha */}
        <View style={styles.followWrap} onStartShouldSetResponder={() => true}>
          <FollowAuthorButton
            authorId={authorId}
            authorName={authorName}
            variant="compact"
            onLoginRequired={onLoginRequired}
          />
        </View>
      </Pressable>
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
  },
  cardInner: {
    padding: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(79, 139, 255, 0.35)',
  },
  avatarText: {
    color: colors.accentLight,
    fontSize: 18,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  chevron: {
    marginLeft: 2,
  },
  followWrap: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.75,
  },
});
