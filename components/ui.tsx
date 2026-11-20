import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { useStudio } from '../lib/studio';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type { IconName };
export function I({ name, size = 19, color }: { name: IconName; size?: number; color?: string }) {
  const { c } = useStudio();
  return <Ionicons name={name} size={size} color={color || c.muted} />;
}
export function T({
  children,
  size = 14,
  color,
  weight = '400',
  style,
  lines,
  selectable = false,
}: {
  children?: React.ReactNode;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: any;
  lines?: number;
  selectable?: boolean;
}) {
  const { c } = useStudio();
  return (
    <Text
      numberOfLines={lines}
      selectable={selectable}
      style={[
        {
          fontFamily:
            Number(weight) >= 700 || weight === 'bold'
              ? 'ManropeBold'
              : Number(weight) >= 600
                ? 'ManropeSemibold'
                : Number(weight) >= 500
                  ? 'ManropeMedium'
                  : 'Manrope',
          fontSize: size,
          fontWeight: 'normal',
          color: color || c.text,
          lineHeight: Math.round(size * 1.5),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  const { c } = useStudio();
  return (
    <T size={9} weight="700" color={color || c.faint} style={{ letterSpacing: 1.8 }}>
      {children}
    </T>
  );
}
export function Mark({ size = 38, color = '#D2B27C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M3 37 L12 9 L21 30 L30 9 L40 37 M11 37 L20 9 L29 30 L38 9 L46 37"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="miter"
      />
    </Svg>
  );
}
export function Wordmark({ small = false }: { small?: boolean }) {
  const { c } = useStudio();
  return (
    <View style={[S.row, { gap: small ? 8 : 12 }]}>
      <Mark size={small ? 32 : 40} color={c.gold} />
      <View>
        <T
          size={small ? 12 : 16}
          weight="800"
          style={{ letterSpacing: 2.45, lineHeight: small ? 17 : 22 }}
        >
          MATT MEZ
        </T>
        <T
          size={small ? 8 : 9}
          color={c.gold}
          weight="600"
          style={{ letterSpacing: small ? 4 : 4.8, lineHeight: 15 }}
        >
          STUDIO
        </T>
      </View>
    </View>
  );
}
export function P({
  onPress,
  children,
  style,
  label,
  disabled = false,
  hover,
  role = 'button',
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
  label?: string;
  disabled?: boolean;
  hover?: string;
  role?: any;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        style,
        hovered && hover ? { backgroundColor: hover } : null,
        pressed && { opacity: 0.72, transform: [{ scale: 0.992 }] },
        disabled && { opacity: 0.42 },
        Platform.OS === 'web' &&
          ({
            transitionDuration: '150ms',
            transitionProperty: 'background-color, opacity, transform',
          } as any),
      ]}
    >
      {children}
    </Pressable>
  );
}
export function Button({
  title,
  icon,
  onPress,
  kind = 'primary',
  small = false,
  disabled = false,
  loading = false,
  style,
}: {
  title: string;
  icon?: IconName;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}) {
  const { c } = useStudio();
  const fg =
    kind === 'primary'
      ? '#1c1b17'
      : kind === 'danger'
        ? c.danger
        : kind === 'ghost'
          ? c.muted
          : c.text;
  return (
    <P
      onPress={onPress}
      disabled={disabled || loading}
      label={title}
      hover={kind === 'primary' ? '#ddc398' : c.hover}
      style={[
        S.row,
        {
          justifyContent: 'center',
          minHeight: small ? 35 : 44,
          gap: 8,
          paddingHorizontal: small ? 13 : 17,
          paddingVertical: small ? 6 : 10,
          borderRadius: 8,
          backgroundColor:
            kind === 'primary'
              ? '#d3b581'
              : kind === 'secondary'
                ? c.card2
                : kind === 'danger'
                  ? c.card2
                  : 'transparent',
          borderWidth: kind === 'secondary' || kind === 'danger' ? 1 : 0,
          borderColor: c.edge,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <I name={icon} size={small ? 15 : 18} color={fg} />
      ) : null}
      <T size={small ? 12 : 13} weight="700" color={fg}>
        {title}
      </T>
    </P>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  size = 18,
  plain = false,
  style,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  plain?: boolean;
  style?: any;
}) {
  const { c } = useStudio();
  return (
    <P
      label={label}
      onPress={onPress}
      hover={c.hover}
      style={[
        S.center,
        {
          height: 38,
          width: 38,
          borderRadius: 9,
          backgroundColor: plain ? 'transparent' : c.card,
          borderColor: c.edge,
          borderWidth: plain ? 0 : 1,
        },
        style,
      ]}
    >
      <I name={name} size={size} />
    </P>
  );
}
export function Badge({
  text,
  tone,
  dot = true,
}: {
  text: string;
  tone?: 'green' | 'gold' | 'grey';
  dot?: boolean;
}) {
  const { c } = useStudio();
  const green =
    tone === 'green' ||
    (!tone && ['Confirmée', 'Terminé', 'Terminée', 'Accepté', 'Payé'].includes(text));
  const gold = tone === 'gold' || (!tone && ['Devis envoyé', 'Émis', 'Envoyé'].includes(text));
  const color = green ? c.good : gold ? c.gold : c.muted;
  return (
    <View
      style={[
        S.row,
        {
          alignSelf: 'flex-start',
          paddingHorizontal: 8,
          paddingVertical: 3,
          gap: 5,
          borderRadius: 5,
          backgroundColor: green ? c.goodBg : gold ? c.goldSoft : c.card2,
        },
      ]}
    >
      {dot && <View style={{ width: 4.5, height: 4.5, borderRadius: 4, backgroundColor: color }} />}
      <T size={10} weight="600" color={color} style={{ lineHeight: 15 }}>
        {text}
      </T>
    </View>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { c } = useStudio();
  return (
    <View
      style={[
        { backgroundColor: c.card, borderWidth: 1, borderColor: c.edge, borderRadius: 13 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Rule({ style }: { style?: any }) {
  const { c } = useStudio();
  return <View style={[{ height: 1, backgroundColor: c.edge }, style]} />;
}
export function LinkText({
  title,
  onPress,
  icon = 'arrow-forward',
  color,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  color?: string;
}) {
  const { c } = useStudio();
  return (
    <P
      onPress={onPress}
      label={title}
      style={[S.row, { gap: 6, minHeight: 32, alignSelf: 'flex-start' }]}
    >
      <T size={12} weight="600" color={color || c.gold}>
        {title}
      </T>
      <I name={icon} size={14} color={color || c.gold} />
    </P>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  multiline = false,
  autoFocus = false,
  required = false,
  secure = false,
  hint,
  style,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'decimal' | 'date' | 'time' | 'number';
  multiline?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  secure?: boolean;
  hint?: string;
  style?: any;
  editable?: boolean;
}) {
  const { c } = useStudio();
  const [focus, setFocus] = useState(false);
  const base = {
    backgroundColor: c.input,
    borderWidth: 1,
    borderColor: focus ? c.gold : c.edge,
    borderRadius: 8,
    color: c.text,
    minHeight: 45,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: 'Manrope',
    fontSize: 14,
    lineHeight: 21,
  };
  return (
    <View style={[{ gap: 6, minWidth: 0 }, style]}>
      <T size={12} weight="600">
        {label}
        {required ? (
          <T size={12} color={c.gold}>
            {' '}
            *
          </T>
        ) : null}
      </T>
      {Platform.OS === 'web' && (type === 'date' || type === 'time') ? (
        React.createElement('input', {
          'aria-label': label,
          type,
          value,
          onChange: (e: any) => onChange(e.target.value),
          onFocus: () => setFocus(true),
          onBlur: () => setFocus(false),
          style: {
            height: 45,
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            colorScheme: c.light ? 'light' : 'dark',
            background: c.input,
            border: `1px solid ${focus ? c.gold : c.edge}`,
            borderRadius: 8,
            padding: '9px 12px',
            color: c.text,
            fontFamily: 'Manrope, sans-serif',
            fontSize: 14,
            outline: 'none',
          },
        })
      ) : (
        <TextInput
          accessibilityLabel={label}
          editable={editable}
          value={value}
          onChangeText={onChange}
          placeholder={
            placeholder || (type === 'date' ? 'AAAA-MM-JJ' : type === 'time' ? 'HH:MM' : '')
          }
          placeholderTextColor={c.faint}
          autoFocus={autoFocus}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          multiline={multiline}
          secureTextEntry={secure}
          autoCapitalize={secure || type === 'email' ? 'none' : 'sentences'}
          autoCorrect={!secure && type === 'text'}
          keyboardType={
            type === 'email'
              ? 'email-address'
              : type === 'tel'
                ? 'phone-pad'
                : type === 'decimal' || type === 'number'
                  ? 'decimal-pad'
                  : 'default'
          }
          returnKeyType={multiline ? 'default' : 'done'}
          style={[
            base,
            multiline && { minHeight: 84, textAlignVertical: 'top' },
            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          ]}
        />
      )}{' '}
      {hint ? (
        <T size={11} color={c.faint}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}
export function Chips({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { c } = useStudio();
  return (
    <View style={[S.wrap, { gap: 7 }]}>
      {values.map((v) => (
        <P
          key={v}
          label={v}
          onPress={() => onChange(v)}
          style={{
            borderWidth: 1,
            borderColor: v === value ? c.gold : c.edge,
            backgroundColor: v === value ? c.goldSoft : c.input,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 7,
          }}
        >
          <T size={12} color={v === value ? c.gold : c.muted} weight={v === value ? '700' : '500'}>
            {v}
          </T>
        </P>
      ))}
    </View>
  );
}
export function Note({
  children,
  error = false,
  icon = 'information-circle-outline',
}: {
  children: React.ReactNode;
  error?: boolean;
  icon?: IconName;
}) {
  const { c } = useStudio();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 9,
        padding: 12,
        borderRadius: 8,
        backgroundColor: error ? (c.light ? '#fff1ed' : '#2c2020') : c.goldSoft,
        alignItems: 'flex-start',
      }}
    >
      <I name={error ? 'alert-circle-outline' : icon} color={error ? c.danger : c.gold} size={17} />
      <T size={12} color={error ? c.danger : c.muted} style={{ flex: 1 }}>
        {children}
      </T>
    </View>
  );
}
export function Empty({
  icon = 'albums-outline',
  title,
  body,
  action,
  onPress,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: string;
  onPress?: () => void;
}) {
  const { c } = useStudio();
  return (
    <View style={[S.center, { paddingHorizontal: 24, paddingVertical: 36, gap: 7 }]}>
      <View
        style={[
          S.center,
          { height: 43, width: 43, borderRadius: 13, backgroundColor: c.goldSoft, marginBottom: 5 },
        ]}
      >
        <I name={icon} size={21} color={c.gold} />
      </View>
      <T size={16} weight="700" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T size={13} color={c.muted} style={{ textAlign: 'center', maxWidth: 380 }}>
        {body}
      </T>
      {action && onPress && (
        <Button title={action} onPress={onPress} small kind="secondary" style={{ marginTop: 9 }} />
      )}
    </View>
  );
}
export function Sheet({
  title,
  kicker,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  kicker?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const { c, close, panels, clear } = useStudio();
  const { width, height } = useWindowDimensions();
  const mobil = width < 700;
  return (
    <View
      style={
        {
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.edge,
          width: mobil ? '100%' : Math.min(wide ? 880 : 650, width - 56),
          maxHeight: mobil ? height * 0.94 : height * 0.91,
          borderRadius: mobil ? 18 : 16,
          borderBottomLeftRadius: mobil ? 0 : 16,
          borderBottomRightRadius: mobil ? 0 : 16,
          overflow: 'hidden',
          boxShadow: Platform.OS === 'web' ? '0 22px 100px #0008' : undefined,
        } as ViewStyle
      }
    >
      <View
        style={{
          paddingHorizontal: mobil ? 20 : 27,
          paddingTop: 22,
          paddingBottom: 17,
          borderBottomColor: c.edge,
          borderBottomWidth: 1,
        }}
      >
        <View style={[S.row, { gap: 12 }]}>
          {panels.length > 1 && (
            <IconButton name="arrow-back" plain label="Retour" onPress={close} />
          )}
          <View style={{ flex: 1 }}>
            {kicker && <Label color={c.gold}>{kicker}</Label>}
            <T size={mobil ? 23 : 26} weight="700" style={{ letterSpacing: -0.9 }}>
              {title}
            </T>
          </View>
          <IconButton name="close" label="Fermer" onPress={clear} plain />
        </View>
        {subtitle && (
          <T size={12} color={c.muted} style={{ marginTop: 4 }}>
            {subtitle}
          </T>
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ padding: mobil ? 20 : 27, gap: 17 }}
      >
        {children}
      </ScrollView>
      {footer && (
        <View
          style={{
            paddingHorizontal: mobil ? 20 : 27,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderColor: c.edge,
          }}
        >
          {footer}
        </View>
      )}
    </View>
  );
}
export function Page({
  children,
  padding = true,
}: {
  children: React.ReactNode;
  padding?: boolean;
}) {
  const { c, refresh, notify } = useStudio();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const pad = width >= 1200 ? 30 : width >= 760 ? 23 : 17;
  return (
    <FlatList
      refreshControl={
        <RefreshControl
          tintColor={c.gold}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await refresh();
            } catch (e: any) {
              notify(e.message);
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        padding: padding ? pad : 0,
        paddingTop: padding ? (width < 760 ? 17 : 24) : 0,
        paddingBottom: width < 760 ? 28 : 22,
        maxWidth: 1640,
        width: '100%',
        alignSelf: 'center',
      }}
      data={[1]}
      keyExtractor={() => 'page'}
      renderItem={() => <View>{children}</View>}
      showsVerticalScrollIndicator={false}
    />
  );
}
export function TitleBlock({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  const { c } = useStudio();
  return (
    <View style={{ gap: 8, marginBottom: 23 }}>
      <Label color={c.gold}>{eyebrow}</Label>
      <View style={[S.between, { gap: 10, flexWrap: 'wrap' }]}>
        <T size={32} weight="700" style={{ letterSpacing: -1.3 }}>
          {title}
        </T>
        {action}
      </View>
      <T size={14} color={c.muted}>
        {desc}
      </T>
    </View>
  );
}
export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { c } = useStudio();
  return (
    <P
      onPress={() => onChange(!value)}
      label={label}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 5 }}
    >
      <View
        style={[
          S.center,
          {
            marginTop: 2,
            borderWidth: 1,
            borderColor: value ? c.gold : c.faint,
            backgroundColor: value ? c.gold : 'transparent',
            borderRadius: 4,
            width: 18,
            height: 18,
          },
        ]}
      >
        {value && <I name="checkmark" size={14} color="#171715" />}
      </View>
      <T size={12} color={c.muted} style={{ flex: 1 }}>
        {label}
      </T>
    </P>
  );
}
export const S = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  grow: { flex: 1, minWidth: 0 },
});
