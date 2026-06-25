import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme/colors';
import { getAuthUser } from '../../services/authService';
import { AuthUser } from '../../types/auth';

type MenuIcon = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  key: string;
  label: string;
  icon: MenuIcon;
  showChevron?: boolean;
}

const USER_INFO_TEMPLATE: MenuItem[] = [
  { key: 'username', label: 'Đăng nhập', icon: 'person-outline' },
  { key: 'level', label: 'Cấp Độ: 2', icon: 'ribbon-outline' },
  { key: 'notifications', label: 'Thông Báo', icon: 'mail-outline' },
];

const ACCOUNT_FEATURE_ITEMS: MenuItem[] = [
  { key: 'change-display-name', label: 'Đổi Tên Hiển Thị', icon: 'create-outline' },
  { key: 'request-upgrade', label: 'Yêu Cầu Thăng Cấp', icon: 'construct-outline' },
];

const NAV_ITEMS: MenuItem[] = [
  { key: 'home', label: 'Trang Chủ', icon: 'home-outline' },
  { key: 'following', label: 'Truyện Theo Dõi', icon: 'walk-outline' },
  { key: 'history', label: 'Truyện Đã Đọc', icon: 'time-outline' },
  { key: 'genres', label: 'Thể Loại', icon: 'list-outline' },
  { key: 'contact', label: 'Liên Hệ', icon: 'chatbox-ellipses-outline' },
];

const LOGOUT_ITEM: MenuItem = {
  key: 'logout',
  label: 'Đăng Xuất',
  icon: 'log-out-outline',
};

const LOGIN_ITEM: MenuItem = {
  key: 'login',
  label: 'Đăng Nhập',
  icon: 'log-in-outline',
};

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
      <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
      <Text style={styles.menuLabel}>{item.label}</Text>
      {item.showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
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
    <View style={styles.accountFeatures}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={({ pressed }) => [
          styles.accountFeaturesHeader,
          expanded && styles.accountFeaturesHeaderExpanded,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="person-circle-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.accountFeaturesTitle}>Tính Năng Tài Khoản</Text>
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
    </View>
  );
}

export function AccountDrawer({ visible, onClose, onMenuPress }: AccountDrawerProps) {
  const insets = useSafeAreaInsets();
  const [drawerSession, setDrawerSession] = useState(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [displayNameModalVisible, setDisplayNameModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');

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

  const userInfoItems = USER_INFO_TEMPLATE.map((item) =>
    item.key === 'username'
      ? {
          ...item,
          label: authUser?.fullName || authUser?.username || 'Đăng nhập',
        }
      : item,
  );

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
    if (key === 'home') {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.panel, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tính Năng Tài Khoản</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              {userInfoItems.map((item) => (
                <MenuRow key={item.key} item={item} onPress={handleMenuPress} />
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <AccountFeaturesSection onMenuPress={handleMenuPress} resetKey={drawerSession} />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              {NAV_ITEMS.map((item) => (
                <MenuRow key={item.key} item={item} onPress={handleMenuPress} />
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <MenuRow
                item={authUser ? LOGOUT_ITEM : LOGIN_ITEM}
                onPress={handleMenuPress}
              />
            </View>
          </ScrollView>
        </View>

        <Modal
          visible={displayNameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDisplayNameModalVisible(false)}
        >
          <View style={styles.dialogOverlay}>
            <Pressable style={styles.dialogBackdrop} onPress={() => setDisplayNameModalVisible(false)} />

            <View style={styles.dialogPanel}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Đổi Tên Hiển Thị</Text>
                <Pressable
                  onPress={() => setDisplayNameModalVisible(false)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.dialogCloseButton, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <Text style={styles.dialogRule}>- Chức năng này chỉ dùng cho tài khoản cấp 2+</Text>
              <Text style={styles.dialogRule}>- Một ngày chỉ được đổi một lần</Text>
              <Text style={styles.dialogRule}>
                - Tên và Danh hiệu không được chứa ký tự nhạy cảm, nếu vi phạm sẽ bị khóa chức năng
              </Text>
              <Text style={styles.dialogRule}>- Số ký tự giới hạn là 30</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên Hiển Thị</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={30}
                  style={styles.dialogInput}
                  placeholder="Nhập tên hiển thị"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.dialogActions}>
                <Pressable
                  style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
                  onPress={() => setDisplayNameModalVisible(false)}
                >
                  <Text style={styles.dialogButtonText}>THAY ĐỔI</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
                  onPress={() => setDisplayNameModalVisible(false)}
                >
                  <Text style={styles.dialogButtonText}>HỦY</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const PANEL_WIDTH = 300;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuRowIndented: {
    paddingLeft: spacing.sm,
  },
  accountFeatures: {
    marginHorizontal: -spacing.lg,
  },
  accountFeaturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  accountFeaturesHeaderExpanded: {
    backgroundColor: '#4A2C28',
  },
  accountFeaturesTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  accountFeaturesBody: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  menuLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
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
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialogPanel: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dialogTitle: {
    color: colors.textPrimary,
    fontSize: 38 / 2,
    fontWeight: '700',
  },
  dialogCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogRule: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.xs,
  },
  inputGroup: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  dialogInput: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dialogButton: {
    minWidth: 98,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dialogButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
