import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Genre } from '../../types/genre';
import { colors, spacing } from '../../theme/colors';

interface GenreListItemProps {
  genre: Genre;
  onPress: (genre: Genre) => void;
  showDivider?: boolean;
}

export function GenreListItem({ genre, onPress, showDivider = true }: GenreListItemProps) {
  return (
    <View>
      <Pressable
        onPress={() => onPress(genre)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Text style={styles.label}>{genre.name}</Text>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceElevated,
  },
});
