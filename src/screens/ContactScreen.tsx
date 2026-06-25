import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme/colors';

function InfoCard({ title, children }: { title: string; children: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children.map((line) => (
        <Text key={`${title}-${line}`} style={styles.cardText}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Liên Hệ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InfoCard
          title="THÔNG TIN LIÊN QUAN TỚI TÀI KHOẢN"
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
          title="QUYỀN LỢI TỚI TỪ TÀI KHOẢN"
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardTitle: {
    color: '#D76C75',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  cardText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
