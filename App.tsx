import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StudioProvider } from './lib/studio';
import StudioShell from './components/StudioShell';

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
      <View style={{ flex: 1, backgroundColor: '#101112', justifyContent: 'center' }}>
        <ActivityIndicator color="#C9A76C" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <StudioProvider>
        <StudioShell />
      </StudioProvider>
    </SafeAreaProvider>
  );
}
