/**
 * AccountDrawer — drawer trượt từ trái với phong cách khối màu.
 *
 *  - Panel trái dùng nền màu đặc + glow accent.
 *  - Backdrop màu tối (không blur).
 *  - Header avatar gradient, list item trong GlassCard.
 *  - Dialog "Đổi tên" dùng GlassModal với backdrop màu tối.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, GradientButton, GlassTextField } from '../../theme/uiPrimitives';
import { getAuthUser } from '../../services/authService';
import { AuthUser } from '../../types/auth';

type MenuIcon = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  key: string;
  label: string;
  icon: MenuIcon;
  badge?: string;
  showChevron?: boolean;
}

const ACCOUNT_FEATURE_ITEMS: MenuItem[] = [
  { key: 'wallet', label: 'Ví & nạp Coin', icon: 'wallet-outline', showChevron: true },
  { key: 'change-display-name', label: 'Đổi tên hiển thị', icon: 'create-outline' },
];

const NAV_ITEMS: MenuItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline' },
  { key: 'ranking', label: 'Bảng xếp hạng', icon: 'trophy-outline', showChevron: true },
  { key: 'library', label: 'Tủ truyện', icon: 'bookmarks-outline', showChevron: true },
  { key: 'history', label: 'Lịch sử đọc', icon: 'time-outline', showChevron: true },
  { key: 'following', label: 'Đang theo dõi', icon: 'walk-outline' },
  { key: 'genres', label: 'Thể loại', icon: 'list-outline', showChevron: true },
  { key: 'notifications', label: 'Thông báo', icon: 'mail-outline', showChevron: true },
  { key: 'contact', label: 'Liên hệ', icon: 'chatbox-ellipses-outline', showChevron: true },
];

interface AccountDrawerProps {
  visible: boolean;
  onClose: () => void;
  onMenuPress?: (key: string) => void;
}

function MenuRow({
  item,
  onPress,
  indented = false,
}: {
  item: MenuItem;
  onPress: (key: string) => void;
  indented?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onPress(item.key)}
      style={({ pressed }) => [
        styles.menuRow,
        indented && styles.menuRowIndented,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={item.icon} size={18} color={colors.accentLight} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      {item.badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{item.badge}</Text>
        </View>
      ) : null}
      {item.showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

function AccountFeaturesSection({
  onMenuPress,
  resetKey,
}: {
  onMenuPress: (key: string) => void;
  resetKey: number;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  return (
    <GlassCard tint="dark" depth={2} style={styles.accountFeatures}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={({ pressed }) => [styles.accountFeaturesHeader, pressed && styles.pressed]}
      >
        <View style={styles.menuIconWrap}>
          <Ionicons name="person-circle-outline" size={18} color={colors.cyan} />
        </View>
        <Text style={styles.accountFeaturesTitle}>Tính năng tài khoản</Text>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.textPrimary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.accountFeaturesBody}>
          {ACCOUNT_FEATURE_ITEMS.map((item) => (
            <MenuRow key={item.key} item={item} onPress={onMenuPress} indented />
          ))}
        </View>
      ) : null}
    </GlassCard>
  );
}

export function AccountDrawer({ visible, onClose, onMenuPress }: AccountDrawerProps) {
  const insets = useSafeAreaInsets();
  const [drawerSession, setDrawerSession] = useState(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [displayNameModalVisible, setDisplayNameModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const slideAnim = useRef(new Animated.Value(-320)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -320,
      duration: motion_base(),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  useEffect(() => {
    if (visible) {
      setDrawerSession((prev) => prev + 1);
      void getAuthUser().then(setAuthUser);
    } else {
      setDisplayNameModalVisible(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setDisplayName(authUser?.fullName || authUser?.username || '');
  }, [authUser, visible]);

  const displayName_ = authUser?.fullName || authUser?.username || 'Khách';

  const handleMenuPress = (key: string) => {
    if (key === 'change-display-name') {
      setDisplayNameModalVisible(true);
      return;
    }

    if (key === 'username' && !authUser) {
      onClose();
      onMenuPress?.('login');
      return;
    }

    onMenuPress?.(key);
    if (key === 'home' || key === 'login') {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTouch} onPress={onClose}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'rgba(7,11,26,0.7)' },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top + spacing.md,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={[styles.glowA, { top: -60, right: -40 }]} />
          <View pointerEvents="none" style={[styles.glowB, { bottom: -80, left: -60 }]} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={colors.gradPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarBadge}
                >
                  <View style={styles.avatarInner}>
                    <Ionicons
                      name={authUser ? 'person' : 'person-outline'}
                      size={28}
                      color={colors.white}
                    />
                  </View>
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {displayName_}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {authUser ? 'Tài khoản Reader' : 'Chưa đăng nhập'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <AccountFeaturesSection
                onMenuPress={handleMenuPress}
                resetKey={drawerSession}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Khám phá</Text>
              <GlassCard tint="dark" depth={1} style={styles.navCard}>
                {NAV_ITEMS.map((item, idx) => (
                  <View key={item.key}>
                    <MenuRow item={item} onPress={handleMenuPress} />
                    {idx < NAV_ITEMS.length - 1 ? (
                      <View style={styles.navDivider} />
                    ) : null}
                  </View>
                ))}
              </GlassCard>
            </View>

            <View style={styles.section}>
              <GradientButton
                label={authUser ? 'Đăng xuất' : 'Đăng nhập ngay'}
                icon={authUser ? 'log-out-outline' : 'log-in-outline'}
                onPress={() => handleMenuPress(authUser ? 'logout' : 'login')}
                variant={authUser ? 'secondary' : 'primary'}
                size="md"
                fullWidth
                glow={!authUser}
                style={{ alignSelf: 'stretch' }}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      <Modal
        visible={displayNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisplayNameModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <Pressable
            style={styles.dialogBackdropTouch}
            onPress={() => setDisplayNameModalVisible(false)}
          >
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: 'rgba(7,11,26,0.7)' },
              ]}
            />
          </Pressable>

          <View style={styles.dialogPanelWrap}>
            <GlassCard tint="dark" depth={3} radius={radius.xl} style={{ width: '100%', maxWidth: 380 }}>
              <View style={{ padding: spacing.lg }}>
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>Đổi tên hiển thị</Text>
                  <Pressable
                    onPress={() => setDisplayNameModalVisible(false)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.dialogCloseButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.ruleList}>
                  <Text style={styles.dialogRule}>• Chức năng chỉ dành cho tài khoản cấp 2+</Text>
                  <Text style={styles.dialogRule}>• Mỗi ngày chỉ được đổi một lần</Text>
                  <Text style={styles.dialogRule}>• Không chứa ký tự nhạy cảm</Text>
                  <Text style={styles.dialogRule}>• Tối đa 30 ký tự</Text>
                </View>

                <GlassTextField
                  label="Tên hiển thị"
                  icon="id-card-outline"
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={30}
                  placeholder="Nhập tên hiển thị"
                  containerStyle={{ marginTop: spacing.xs }}
                />

                <View style={styles.dialogActions}>
                  <GradientButton
                    label="Xác nhận"
                    onPress={() => setDisplayNameModalVisible(false)}
                    size="md"
                    style={{ flex: 1 }}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setDisplayNameModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const PANEL_WIDTH = 320;

function motion_base() {
  return 280;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdropTouch: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.backgroundElevated,
    overflow: 'hidden',
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  glowA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.accent,
    opacity: 0.22,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  glowB: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.cyan,
    opacity: 0.12,
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  avatarBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: colors.cyan,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassLight,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  navCard: {
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  navDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginLeft: 44,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuRowIndented: {
    paddingLeft: spacing.lg,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  menuBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  menuBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  accountFeatures: {
    padding: spacing.xs,
    borderRadius: radius.lg,
  },
  accountFeaturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  accountFeaturesTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  accountFeaturesBody: {
    paddingBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialogBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogPanelWrap: {
    width: '100%',
    maxWidth: 380,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  dialogCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassLight,
  },
  ruleList: {
    gap: 6,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  dialogRule: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyPlatform as string,
    lineHeight: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.glassLight,
  },
  cancelBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
});
