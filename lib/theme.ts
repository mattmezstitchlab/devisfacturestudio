import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bg: '#FFFFFF',
  bgSubtle: '#F7F7F7',
  surface: '#FFFFFF',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  text: '#1D1D1D',
  textSecondary: '#5B5B5B',
  textMuted: '#8B8B8B',
  accent: '#F6821F',
  accentPressed: '#D96D0C',
  accentSoft: '#FFF3E6',
  info: '#0051C3',
  infoSoft: '#EAF1FB',
  success: '#0F7B3D',
  successSoft: '#E9F6EE',
  warning: '#A65B00',
  warningSoft: '#FFF4E5',
  danger: '#C4342B',
  dangerSoft: '#FDECEA',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 8, lg: 12, pill: 999 };

export const typography: Record<string, TextStyle> = {
  display:    { fontFamily: 'ManropeBold',     fontSize: 28, lineHeight: 34, letterSpacing: -0.4, color: colors.text },
  title:      { fontFamily: 'ManropeSemibold', fontSize: 20, lineHeight: 26, letterSpacing: -0.2, color: colors.text },
  body:       { fontFamily: 'Manrope',         fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: 'ManropeSemibold', fontSize: 15, lineHeight: 22, color: colors.text },
  caption:    { fontFamily: 'ManropeMedium',   fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  label:      { fontFamily: 'ManropeSemibold', fontSize: 12, lineHeight: 16, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted },
};

export const shadow: Record<string, ViewStyle> = {
  card: { shadowColor: '#1D1D1D', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
};
