/**
 * LoginRequiredModal — modal yêu cầu đăng nhập.
 *
 *  - Backdrop màu tối.
 *  - Card khối màu với gradient icon + 2 button (login gradient + cancel).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, GradientButton } from '../../theme/uiPrimitives';

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginRequiredModal({ visible, onClose, onLogin }: LoginRequiredModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTouch} onPress={onClose}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'rgba(7,11,26,0.7)' },
            ]}
          />
        </Pressable>

        <View style={styles.cardOuter}>
          <GlassCard tint="dark" depth={4} radius={radius.xl} style={{ width: '100%', maxWidth: 360 }}>
            <View style={styles.cardInner}>
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={colors.gradPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconInner}
                >
                  <Ionicons name="lock-closed-outline" size={28} color={colors.white} />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Chưa đăng nhập</Text>
              <Text style={styles.message}>
                Bạn cần đăng nhập để sử dụng tính năng này.
              </Text>

              <GradientButton
                label="Đăng nhập ngay"
                icon="log-in-outline"
                onPress={onLogin}
                size="md"
                fullWidth
                glow
                style={{ alignSelf: 'stretch' }}
              />

              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>Để sau</Text>
              </Pressable>
            </View>
          </GlassCard>
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
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOuter: {
    width: '100%',
    maxWidth: 360,
  },
  cardInner: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.fontFamilyPlatform as string,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
