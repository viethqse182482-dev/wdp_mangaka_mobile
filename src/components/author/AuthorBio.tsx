import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthorProfile } from '../../services/authorService';
import { colors, radius, spacing } from '../../theme/colors';

interface AuthorBioProps {
  bio?: string;
  socialLinks?: AuthorProfile['social_links'];
}

interface SocialLink {
  key: keyof NonNullable<AuthorProfile['social_links']>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SOCIAL_ITEMS: SocialLink[] = [
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { key: 'twitter', label: 'Twitter / X', icon: 'logo-twitter' },
  { key: 'website', label: 'Website', icon: 'globe-outline' },
];

export function AuthorBio({ bio, socialLinks }: AuthorBioProps) {
  const hasBio = bio && bio.trim().length > 0;
  const hasSocials = SOCIAL_ITEMS.some(
    (item) => socialLinks?.[item.key] && socialLinks[item.key]!.trim().length > 0,
  );

  if (!hasBio && !hasSocials) return null;

  return (
    <View style={styles.container}>
      {hasBio && (
        <Text style={styles.bio} numberOfLines={4}>
          {bio}
        </Text>
      )}

      {hasSocials && (
        <View style={styles.socials}>
          {SOCIAL_ITEMS.map((item) => {
            const url = socialLinks?.[item.key]?.trim();
            if (!url) return null;

            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  // expo-linking handles URL opening
                }}
                style={({ pressed }) => [styles.socialChip, pressed && styles.pressed]}
              >
                <Ionicons name={item.icon} size={14} color={colors.accent} />
                <Text style={styles.socialLabel}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  socials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  socialLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
