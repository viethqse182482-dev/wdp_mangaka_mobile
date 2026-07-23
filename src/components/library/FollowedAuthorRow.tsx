import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FollowedAuthor } from '../../services/followAuthorService';
import { FollowAuthorButton } from '../story/FollowAuthorButton';
import { colors, radius, spacing } from '../../theme/colors';

interface FollowedAuthorRowProps {
  item: FollowedAuthor;
  onPress?: (authorId: string) => void;
}

export function FollowedAuthorRow({ item, onPress }: FollowedAuthorRowProps) {
  const author = item.author_id;
  const authorId = String(author?._id ?? item.author_id);
  const name = author?.full_name || author?.fullName || author?.username || 'Tác giả';
  const avatar = author?.avatar_url;
  const seriesCount = item.series_count ?? 0;

  return (
    <Pressable
      onPress={() => onPress?.(authorId)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Ionicons name="person" size={26} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {seriesCount > 0
            ? `${seriesCount} truyện public`
            : 'Chưa có truyện public'}
        </Text>
      </View>

      <FollowAuthorButton authorId={authorId} variant="compact" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});