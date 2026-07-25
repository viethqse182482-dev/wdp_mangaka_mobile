/**
 * HighlightedText — text có highlight phần khớp với keyword (case-insensitive).
 *
 *  - Phần khớp: màu accentLight + bold
 *  - Phần còn lại: màu textPrimary
 *  - Empty / no match: trả về text bình thường
 */
import { Fragment } from 'react';
import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';
import { colors, typography } from '../../theme/colors';

interface HighlightedTextProps {
  text: string;
  keyword: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export function HighlightedText({
  text,
  keyword,
  numberOfLines,
  style,
}: HighlightedTextProps) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const lowerText = text.toLowerCase();
  const lowerKeyword = trimmed.toLowerCase();
  const parts: Array<{ value: string; match: boolean }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = lowerText.indexOf(lowerKeyword, cursor);
    if (found === -1) {
      parts.push({ value: text.slice(cursor), match: false });
      break;
    }
    if (found > cursor) {
      parts.push({ value: text.slice(cursor, found), match: false });
    }
    parts.push({ value: text.slice(found, found + trimmed.length), match: true });
    cursor = found + trimmed.length;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, idx) =>
        part.match ? (
          <Text key={idx} style={styles.highlight}>
            {part.value}
          </Text>
        ) : (
          <Fragment key={idx}>{part.value}</Fragment>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    color: colors.accentLight,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
});
