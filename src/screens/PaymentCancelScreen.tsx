import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearPendingPayment, getPendingPayment } from '../services/paymentService';
import { colors, spacing, typography } from '../theme/colors';
import { GlassCard, GradientButton } from '../theme/uiPrimitives';

export default function PaymentCancelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderCode?: string | string[] }>();
  const [orderCode, setOrderCode] = useState<string | null>(
    Array.isArray(params.orderCode) ? params.orderCode[0] : params.orderCode ?? null,
  );

  useEffect(() => {
    let disposed = false;
    void getPendingPayment().then(async (pending) => {
      if (disposed) return;
      if (!orderCode && pending) setOrderCode(String(pending.orderCode));
      if (pending) await clearPendingPayment(pending.paymentId);
    });
    return () => {
      disposed = true;
    };
  }, [orderCode]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={colors.gradBg} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <GlassCard tint="navy" depth={3} style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="close-circle" size={56} color={colors.warning} />
            </View>
            <Text style={styles.title}>Đã huỷ thanh toán</Text>
            <Text style={styles.message}>
              Không có Coin nào được cộng vào ví. Bạn có thể chọn lại gói Coin khi sẵn sàng.
            </Text>
            {orderCode ? <Text style={styles.orderCode}>Mã giao dịch: #{orderCode}</Text> : null}

            <GradientButton
              label="Thử lại"
              icon="refresh"
              onPress={() => router.replace('/wallet' as never)}
              fullWidth
              style={styles.button}
            />
            <Pressable onPress={() => router.replace('/wallet' as never)} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Quay về ví</Text>
            </Pressable>
          </GlassCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.xxl, alignItems: 'center' },
  iconCircle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningSoft },
  title: { color: colors.textPrimary, fontSize: 22, fontFamily: typography.fontFamilyBold, fontWeight: '800', textAlign: 'center', marginTop: spacing.xl },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm },
  orderCode: { color: colors.textMuted, fontSize: 13, marginTop: spacing.md },
  button: { width: '100%', marginTop: spacing.xl },
  secondaryButton: { width: '100%', alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  secondaryText: { color: colors.accentLight, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
});
