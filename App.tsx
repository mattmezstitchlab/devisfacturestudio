import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StudioProvider } from './lib/studio';
import StudioShell from './components/StudioShell';
import { colors } from './lib/theme';

export default function App() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
    Manrope: require('./assets/fonts/Manrope-Regular.ttf'),
    ManropeMedium: require('./assets/fonts/Manrope-Medium.ttf'),
    ManropeSemibold: require('./assets/fonts/Manrope-SemiBold.ttf'),
    ManropeBold: require('./assets/fonts/Manrope-Bold.ttf'),
  });

  if (!loaded && !error)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StudioProvider>
        <StudioShell />
      </StudioProvider>
    </SafeAreaProvider>
  );
}
