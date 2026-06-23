import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginRequiredModal({ visible, onClose, onLogin }: LoginRequiredModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={28} color={colors.accent} />
          </View>

          <Text style={styles.title}>Chưa đăng nhập</Text>
          <Text style={styles.message}>
            Bạn chưa đăng nhập. Vui lòng đăng nhập để đọc truyện.
          </Text>

          <Pressable
            onPress={onLogin}
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
