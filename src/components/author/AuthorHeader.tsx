import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthorProfile } from '../../services/authorService';
import { FollowAuthorButton } from '../story/FollowAuthorButton';
import { colors, radius, spacing } from '../../theme/colors';

interface AuthorHeaderProps {
  profile: AuthorProfile;
  onLoginRequired?: () => void;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AuthorHeader({ profile, onLoginRequired }: AuthorHeaderProps) {
  const { full_name, username, avatar_url, stats } = profile;
  const displayName = full_name || username || 'Tác giả';
  const handleName = username ? `@${username}` : null;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {avatar_url ? (
          <Image
            source={{ uri: avatar_url }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={32} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {handleName && (
            <Text style={styles.username} numberOfLines={1}>
              {handleName}
            </Text>
          )}
          <Text style={styles.stats}>
            {stats.total_series} truyện · {formatFollowers(stats.total_followers)} theo dõi
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <FollowAuthorButton
          authorId={profile._id}
          authorName={displayName}
          onLoginRequired={onLoginRequired}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceElevated,
    flexShrink: 0,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  stats: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
