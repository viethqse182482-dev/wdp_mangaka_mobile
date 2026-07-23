import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { AppProviders } from '../src/context/AppProviders';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
    'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="read/[storyId]/[chapter]"
            options={{
              contentStyle: { backgroundColor: '#000000' },
              animation: 'fade',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              title: 'Thông báo',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.textPrimary,
            }}
          />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
