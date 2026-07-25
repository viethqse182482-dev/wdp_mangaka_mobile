/**
 * ContactScreen — Trang liên hệ với 3 GlassCard elevated.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme/colors';
import { GlassCard, GlassIconButton } from '../theme/uiPrimitives';

function InfoCard({ title, accent, children }: { title: string; accent?: string; children: string[] }) {
  return (
    <GlassCard
      tint="navy"
      depth={2}
      radius={radius.lg}
      glow
      style={styles.card}
      innerStyle={styles.cardInner}
    >
      <View style={styles.cardTitleRow}>
        <View style={[styles.titleBar, { backgroundColor: accent ?? colors.accent }]} />
        <Text style={[styles.cardTitle, { color: accent ?? colors.accentLight }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {children.map((line, idx) => (
          <Text key={`${title}-${idx}`} style={styles.cardText}>
            {line}
          </Text>
        ))}
      </View>
    </GlassCard>
  );
}

export function ContactScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.gradBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.header}>
          <GlassIconButton
            icon="chevron-back"
            size={40}
            tint="light"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Liên Hệ</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <InfoCard
            title="THÔNG TIN TÀI KHOẢN"
            accent={colors.accentLight}
            children={[
              '1. Truyện đọc sẽ hoàn toàn free không thu phí.',
              '2. Tài khoản đăng nhập sẽ được chia cấp độ.',
              '3. Để tài khoản được thăng cấp thì tài khoản đó phải là bạn đọc thường xuyên ở website.',
              'Sau khi đủ điều kiện hãy bấm nút Yêu cầu thăng cấp trong menu tài khoản.',
              'Khi được quản trị phê duyệt thì thông tin cấp độ sẽ được cập nhật.',
              'CHÚC MỌI NGƯỜI ĐỌC TRUYỆN VUI VẺ.',
            ]}
          />

          <InfoCard
            title="QUYỀN LỢI CẤP ĐỘ"
            accent={colors.cyan}
            children={[
              'Cấp độ các tài khoản được phân chia theo màu sắc.',
              'Tài khoản sơ cấp: Đọc truyện free, có thể bị giới hạn với chapter đặc biệt.',
              'Tài khoản trung cấp 2+: Có thêm quyền xem các chương nâng cao và video/limit.',
              'Tài khoản cao cấp 3+: Có tất cả quyền lợi trung cấp và hỗ trợ ưu tiên.',
              'Việc thăng cấp tài khoản là quá trình tích cực tương tác, không tới từ tiền bạc.',
              'Quan trọng nhất: đây là trang web phi lợi nhuận.',
            ]}
          />

          <InfoCard
            title="ABOUT US"
            accent={colors.warning}
            children={[
              'Gửi chủ sở hữu.',
              'Hầu hết nội dung của trang web đều được thu thập từ Internet.',
              'Nếu bạn không muốn nội dung xuất hiện trên trang web này, vui lòng liên hệ.',
              'BOT sẽ xử lý sớm nhất có thể.',
              'Facebook Page: Link',
              'Thank you.',
            ]}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
  },
  cardInner: {
    padding: spacing.lg,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  titleBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    gap: 6,
  },
  cardText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    lineHeight: 22,
  },
});

export default ContactScreen;
