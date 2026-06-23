import { Ionicons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryDetail } from '../../types/storyDetail';
import { colors, spacing } from '../../theme/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COVER_HEIGHT = SCREEN_WIDTH * 1.1;

interface StoryHeroProps {
  story: StoryDetail;
}

export function StoryHero({ story }: StoryHeroProps) {
  return (
    <View style={styles.wrapper}>
      <Image source={{ uri: story.coverUrl }} style={styles.cover} contentFit="cover" transition={250} />
      <LinearGradient
        colors={['transparent', 'rgba(13,13,15,0.35)', colors.background]}
        style={styles.gradient}
      />
    </View>
  );
}

export const STORY_HERO_HEIGHT = COVER_HEIGHT;

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: colors.surface,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
