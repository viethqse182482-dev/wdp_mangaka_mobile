import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme/colors';

export function RolePage({
  title,
  subtitle,
  children,
  loading,
  error,
  onRefresh,
  footer,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  footer?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable style={styles.back} onPress={onBack} accessibilityLabel="Quay lại">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onRefresh ? (
          <Pressable style={styles.refresh} onPress={onRefresh} accessibilityLabel="Làm mới">
            <Ionicons name="refresh" size={20} color={colors.accentLight} />
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
          {onRefresh ? <Pressable onPress={onRefresh}><Text style={styles.retry}>Thử lại</Text></Pressable> : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  title: { color: colors.textPrimary, fontSize: 28, fontFamily: typography.fontFamilyBold, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4, fontFamily: typography.fontFamilyRegular },
  refresh: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassLight },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glassLight, marginRight: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  error: { color: colors.textSecondary, textAlign: 'center', fontFamily: typography.fontFamilyRegular },
  retry: { color: colors.accentLight, fontFamily: typography.fontFamilyBold },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
});
