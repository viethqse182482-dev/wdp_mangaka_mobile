import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { PendingPayment, getPendingPayment } from '../services/paymentService';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard } from '../theme/uiPrimitives';

const FALLBACK_TIMEOUT_MS = 120_000;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function queryParamsFromUrl(url: string): Record<string, string> {
  const parsed = Linking.parse(url);
  return Object.fromEntries(
    Object.entries(parsed.queryParams ?? {}).map(([key, value]) => [key, String(value)]),
  );
}

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paymentId?: string | string[] }>();
  const paymentId = firstParam(params.paymentId);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(FALLBACK_TIMEOUT_MS);
  const completedRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    void getPendingPayment().then((value) => {
      if (disposed) return;
      if (!value || (paymentId && value.paymentId !== paymentId)) {
        setPending(null);
      } else {
        setPending(value);
      }
      setLoadingPending(false);
    });
    return () => {
      disposed = true;
    };
  }, [paymentId]);

  useEffect(() => {
    if (!pending) return;
    const parsedDeadline = Date.parse(pending.expiresAt);
    const fallbackDeadline = Date.parse(pending.createdAt) + FALLBACK_TIMEOUT_MS;
    const deadline = Number.isFinite(parsedDeadline) ? parsedDeadline : fallbackDeadline;

    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setRemainingMs(remaining);
      if (remaining === 0 && !completedRef.current) {
        completedRef.current = true;
        router.replace({
          pathname: '/payment/return' as never,
          params: {
            orderCode: String(pending.orderCode),
            status: 'EXPIRED',
            timeout: 'true',
          },
        });
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [pending, router]);

  const navigateFromCallback = useCallback((url: string, forceCancel = false) => {
    if (completedRef.current || !pending) return;
    completedRef.current = true;
    const query = queryParamsFromUrl(url);
    const isCancelled = forceCancel || query.cancel === 'true' || url.includes('/payment/cancel');
    router.replace({
      pathname: (isCancelled ? '/payment/cancel' : '/payment/return') as never,
      params: {
        ...query,
        orderCode: query.orderCode ?? String(pending.orderCode),
      },
    });
  }, [pending, router]);

  const handleNavigation = useCallback((url: string): boolean => {
    if (url.includes('/payment/return')) {
      navigateFromCallback(url);
      return false;
    }
    if (url.includes('/payment/cancel')) {
      navigateFromCallback(url, true);
      return false;
    }

    if (!/^https?:\/\//i.test(url)) {
      void Linking.canOpenURL(url).then((supported) => {
        if (supported) return Linking.openURL(url);
        return undefined;
      });
      return false;
    }
    return true;
  }, [navigateFromCallback]);

  if (loadingPending) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.accentLight} />
        <Text style={styles.stateText}>Đang chuẩn bị thanh toán...</Text>
      </View>
    );
  }

  if (!pending) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={colors.gradBg} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.missingWrap}>
            <GlassCard tint="navy" depth={2} style={styles.missingCard}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
              <Text style={styles.missingTitle}>Không tìm thấy giao dịch</Text>
              <Text style={styles.missingText}>Giao dịch đang chờ không còn trên thiết bị.</Text>
              <Pressable onPress={() => router.replace('/wallet' as never)} style={styles.backButton}>
                <Text style={styles.backButtonText}>Quay về ví</Text>
              </Pressable>
            </GlassCard>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/wallet' as never)} style={styles.iconButton} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Thanh toán PayOS</Text>
            <Text style={styles.orderCode}>Mã giao dịch #{pending.orderCode}</Text>
          </View>
          <View style={[styles.timerPill, remainingMs <= 30_000 && styles.timerPillDanger]}>
            <Ionicons name="time-outline" size={15} color={remainingMs <= 30_000 ? colors.danger : colors.cyan} />
            <Text style={[styles.timerText, remainingMs <= 30_000 && styles.timerTextDanger]}>
              {formatCountdown(remainingMs)}
            </Text>
          </View>
        </View>

        <View style={styles.webContainer}>
          <WebView
            source={{ uri: pending.checkoutUrl }}
            originWhitelist={['https://*', 'http://*', 'exp://*', 'wdpmanga://*']}
            onShouldStartLoadWithRequest={(request) => handleNavigation(request.url)}
            onLoadStart={() => {
              setWebLoading(true);
              setWebError(null);
            }}
            onLoadEnd={() => setWebLoading(false)}
            onError={() => {
              setWebLoading(false);
              setWebError('Không thể tải trang PayOS. Vui lòng kiểm tra kết nối mạng.');
            }}
            onHttpError={(event) => {
              setWebLoading(false);
              setWebError(`PayOS phản hồi lỗi ${event.nativeEvent.statusCode}.`);
            }}
            onOpenWindow={(event) => {
              const targetUrl = event.nativeEvent.targetUrl;
              if (targetUrl) void Linking.openURL(targetUrl);
            }}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            style={styles.webView}
          />

          {webLoading ? (
            <View style={styles.webOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={colors.accentLight} />
              <Text style={styles.stateText}>Đang tải cổng thanh toán...</Text>
            </View>
          ) : null}

          {webError ? (
            <View style={styles.webOverlay}>
              <Ionicons name="cloud-offline-outline" size={44} color={colors.danger} />
              <Text style={styles.errorText}>{webError}</Text>
              <Text style={styles.errorHint}>Đóng màn hình và thử lại từ ví.</Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  stateText: { color: colors.textSecondary, fontFamily: typography.fontFamilyRegular },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.backgroundElevated, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassLight },
  headerText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 16, fontFamily: typography.fontFamilyBold, fontWeight: '800' },
  orderCode: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.cyanSoft },
  timerPillDanger: { backgroundColor: colors.dangerSoft },
  timerText: { color: colors.cyan, fontSize: 13, fontFamily: typography.fontFamilyBold, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerTextDanger: { color: colors.danger },
  webContainer: { flex: 1, backgroundColor: colors.white },
  webView: { flex: 1, backgroundColor: colors.white },
  webOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  errorText: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, textAlign: 'center', fontFamily: typography.fontFamilyMedium },
  errorHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  missingWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  missingCard: { alignItems: 'center', padding: spacing.xxl },
  missingTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: typography.fontFamilyBold, fontWeight: '800', marginTop: spacing.md },
  missingText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  backButton: { marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.accent },
  backButtonText: { color: colors.white, fontFamily: typography.fontFamilyBold, fontWeight: '700' },
});
