import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Panel, useStudio } from '../lib/studio';
import Wizard from '../screens/Wizard';
import { BookingDetail, ClientDetail, PaymentPanel } from '../screens/BookingDetail';
import DocumentDetail from '../screens/DocumentDetail';
import {
  Appearance,
  AuthPanel,
  ClausesPanel,
  DataPanel,
  ProfilePanel,
  SequencePanel,
} from '../screens/Preferences';
import {
  ActivityPanel,
  CalendarPanel,
  ConfirmPanel,
  EmailPanel,
  PeriodPanel,
  SearchPanel,
} from '../screens/QuickPanels';
import { I, S, T } from './ui';
const screens: Record<Panel['kind'], React.ComponentType<any>> = {
  wizard: Wizard,
  booking: BookingDetail,
  client: ClientDetail,
  payment: PaymentPanel,
  document: DocumentDetail,
  auth: AuthPanel,
  profile: ProfilePanel,
  clauses: ClausesPanel,
  sequence: SequencePanel,
  data: DataPanel,
  appearance: Appearance,
  activity: ActivityPanel,
  calendar: CalendarPanel,
  confirm: ConfirmPanel,
  email: EmailPanel,
  period: PeriodPanel,
  search: SearchPanel,
};
export default function PanelHost() {
  const { panels, close, toast, c } = useStudio();
  const { width } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const p = panels[panels.length - 1];
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!p) return;
    val.setValue(0);
    Animated.timing(val, {
      toValue: 1,
      duration: 170,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [p?.kind, p?.id, panels.length]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !p) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p]);
  if (!p) return null;
  const Screen = screens[p.kind];
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: width < 700 ? 'flex-end' : 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,.68)',
          paddingTop: inset.top,
        }}
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={close}
          style={{ position: 'absolute', inset: 0 } as any}
        />
        <Animated.View
          accessibilityViewIsModal
          style={{
            maxHeight: '100%',
            width: width < 700 ? '100%' : undefined,
            opacity: val,
            transform: [
              { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) },
            ],
            paddingBottom: width < 700 ? inset.bottom : 0,
          }}
        >
          <Screen key={`${p.kind}-${p.id || ''}-${panels.length}`} panel={p} />
        </Animated.View>
        {toast && (
          <View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            style={[
              S.row,
              {
                position: 'absolute',
                top: inset.top + 9,
                alignSelf: 'center',
                maxWidth: '92%',
                borderRadius: 8,
                backgroundColor: c.card2,
                borderWidth: 1,
                borderColor: c.edge,
                paddingVertical: 8,
                paddingHorizontal: 12,
                gap: 7,
              },
            ]}
          >
            <I name="checkmark-circle-outline" size={15} color={c.gold} />
            <T size={11}>{toast}</T>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
