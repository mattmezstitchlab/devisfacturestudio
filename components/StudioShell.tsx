import React, { useEffect, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStudio, tabs, Tab, navRef } from '../lib/studio';
import { I, IconButton, IconName, Label, Mark, P, Rule, S, T, Wordmark } from './ui';
import Dashboard from '../screens/Dashboard';
import { Bookings, Clients, Documents } from '../screens/Library';
import Settings from '../screens/Settings';
import PanelHost from './PanelHost';
const Navigator = createBottomTabNavigator();
export const icons: Record<Tab, IconName> = {
  Accueil: 'grid-outline',
  Prestations: 'calendar-outline',
  Clients: 'people-outline',
  Documents: 'documents-outline',
  Réglages: 'options-outline',
};
function Sidebar({ active }: { active: Tab }) {
  const { c, go, open, mode, lock } = useStudio();
  const { width } = useWindowDimensions();
  const item = (name: Tab) => (
    <P
      key={name}
      onPress={() => go(name)}
      label={name}
      hover={c.hover}
      style={[
        S.row,
        {
          gap: 13,
          paddingHorizontal: 15,
          paddingVertical: 12,
          borderRadius: 7,
          marginVertical: 2,
          backgroundColor: name === active ? c.goldSoft : 'transparent',
        },
      ]}
    >
      <I name={icons[name]} size={18} color={name === active ? c.gold : c.muted} />
      <T
        size={13}
        weight={name === active ? '700' : '500'}
        color={name === active ? c.gold : c.muted}
      >
        {name}
      </T>
      {name === active && (
        <View
          style={{
            marginLeft: 'auto',
            width: 5,
            height: 5,
            borderRadius: 5,
            backgroundColor: c.gold,
          }}
        />
      )}
    </P>
  );
  return (
    <View
      style={{
        width: width > 1440 ? 234 : width > 1180 ? 216 : 192,
        backgroundColor: c.side,
        borderRightWidth: 1,
        borderColor: c.edge,
        paddingHorizontal: 16,
        paddingTop: 34,
        paddingBottom: 20,
      }}
    >
      <View style={{ paddingHorizontal: 7 }}>
        <Wordmark />
      </View>
      <View style={{ paddingHorizontal: 13, marginTop: 50, marginBottom: 12 }}>
        <Label>ESPACE DE TRAVAIL</Label>
      </View>
      {tabs.slice(0, 4).map(item)}
      <View style={{ marginVertical: 22, paddingHorizontal: 12 }}>
        <Rule />
      </View>
      {item('Réglages')}
      <View style={{ flex: 1 }} />
      <P
        onPress={() => (mode === 'demo' ? open({ kind: 'auth' }) : lock())}
        hover={c.hover}
        style={{
          padding: 13,
          borderWidth: 1,
          borderColor: c.edge,
          borderRadius: 10,
          marginBottom: 21,
          backgroundColor: c.bg,
        }}
      >
        <View style={[S.row, { gap: 7, marginBottom: 4 }]}>
          <View style={{ height: 5, width: 5, borderRadius: 4, backgroundColor: c.gold }} />
          <Label color={c.gold}>{mode === 'demo' ? 'ESPACE DÉMO' : 'ESPACE PRIVÉ'}</Label>
        </View>
        <View style={S.between}>
          <T size={11} color={c.muted}>
            {mode === 'demo' ? 'Ouvrir mon espace privé' : 'Verrouiller le studio'}
          </T>
          <I name={mode === 'demo' ? 'arrow-forward' : 'lock-closed-outline'} size={13} />
        </View>
      </P>
      <Rule />
      <P onPress={() => open({ kind: 'profile' })} style={[S.row, { gap: 10, marginTop: 18 }]}>
        <View
          style={[
            S.center,
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: c.goldSoft,
              borderWidth: 1,
              borderColor: c.edge,
            },
          ]}
        >
          <T size={12} color={c.gold} weight="700">
            ML
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={12} weight="700">
            Matthieu Lecointre
          </T>
          <T size={10} color={c.faint}>
            Artiste saxophoniste
          </T>
        </View>
        <I name="chevron-down" size={12} />
      </P>
    </View>
  );
}
function Header({ active, wide }: { active: Tab; wide: boolean }) {
  const { c, open, setTheme, go } = useStudio();
  return (
    <View
      style={[
        S.between,
        {
          height: wide ? 66 : 64,
          backgroundColor: c.bg,
          borderBottomWidth: 1,
          borderColor: c.edge,
          paddingHorizontal: wide ? 30 : 18,
          gap: 12,
        },
      ]}
    >
      {wide ? (
        <View style={[S.row, { gap: 12 }]}>
          <I name="albums-outline" size={16} color={c.faint} />
          <T size={12} color={c.faint}>
            Espace studio
          </T>
          <T size={12} color={c.faint}>
            /
          </T>
          <T size={12} weight="600">
            {active === 'Accueil' ? 'Tableau de bord' : active}
          </T>
        </View>
      ) : (
        <P onPress={() => go('Accueil')} label="Matt Mez Studio, accueil">
          <Wordmark small />
        </P>
      )}
      <View style={[S.row, { gap: wide ? 11 : 5 }]}>
        {(!wide || active !== 'Accueil') && (
          <P
            label="Créer une prestation rapidement"
            onPress={() => open({ kind: 'wizard' })}
            style={[
              S.center,
              { width: 32, height: 32, borderRadius: 8, backgroundColor: c.goldSoft },
            ]}
          >
            <I name="add" color={c.gold} size={19} />
          </P>
        )}
        <P
          onPress={() => open({ kind: 'search' })}
          label="Rechercher dans le studio"
          hover={c.hover}
          style={[
            S.row,
            {
              height: 34,
              gap: 9,
              paddingHorizontal: wide ? 10 : 8,
              borderWidth: wide ? 1 : 0,
              borderColor: c.edge,
              borderRadius: 7,
              backgroundColor: wide ? c.card : 'transparent',
              width: wide ? 190 : 34,
            },
          ]}
        >
          <I name="search-outline" size={16} />
          {wide && (
            <>
              <T size={11} color={c.faint} style={{ flex: 1 }}>
                Rechercher...
              </T>
              <T
                size={10}
                color={c.faint}
                style={{
                  borderColor: c.edge,
                  borderWidth: 1,
                  borderRadius: 4,
                  paddingHorizontal: 4,
                }}
              >
                ⌘ K
              </T>
            </>
          )}
        </P>
        {wide && (
          <View style={{ height: 19, width: 1, backgroundColor: c.edge, marginHorizontal: 3 }} />
        )}
        <IconButton
          name={c.light ? 'moon-outline' : 'sunny-outline'}
          label="Changer d’apparence"
          onPress={() => setTheme(c.light ? 'sombre' : 'clair')}
          plain
          size={18}
          style={{ width: 32, height: 34 }}
        />
        <P
          onPress={() => open({ kind: 'activity' })}
          label="Activité et rappels"
          hover={c.hover}
          style={[S.center, { width: 32, height: 34, borderRadius: 8 }]}
        >
          <I name="notifications-outline" size={19} />
          <View
            style={{
              position: 'absolute',
              right: 6,
              top: 6,
              backgroundColor: c.gold,
              width: 5,
              height: 5,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: c.bg,
            }}
          />
        </P>
      </View>
    </View>
  );
}
export default function StudioShell() {
  const { c, open, toast, panels, mode } = useStudio();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [active, setActive] = useState<Tab>('Accueil');
  const inset = useSafeAreaInsets();
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.title = 'Matt Mez Studio — Espace artiste';
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open({ kind: 'search' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const theme = {
    ...(c.light ? DefaultTheme : DarkTheme),
    colors: {
      ...(c.light ? DefaultTheme : DarkTheme).colors,
      background: c.bg,
      card: c.card,
      border: c.edge,
      text: c.text,
      primary: c.gold,
    },
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={c.light ? 'dark' : 'light'} />
      <NavigationContainer
        ref={navRef}
        theme={theme}
        onStateChange={() => setActive((navRef.getCurrentRoute()?.name || 'Accueil') as Tab)}
      >
        <View
          aria-hidden={panels.length > 0}
          accessibilityElementsHidden={panels.length > 0}
          importantForAccessibility={panels.length ? 'no-hide-descendants' : 'auto'}
          style={{ flex: 1, flexDirection: 'row' }}
        >
          {wide && <Sidebar active={active} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Header active={active} wide={wide} />
            <Navigator.Navigator
              key={mode}
              tabBar={({ state, navigation }) =>
                wide ? null : (
                  <View
                    style={{
                      flexDirection: 'row',
                      paddingTop: 6,
                      paddingBottom: Math.max(7, inset.bottom),
                      backgroundColor: c.side,
                      borderTopWidth: 1,
                      borderColor: c.edge,
                    }}
                  >
                    {state.routes.map((r, i) => (
                      <P
                        key={r.key}
                        role="tab"
                        label={r.name}
                        onPress={() => navigation.navigate(r.name)}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 44,
                          gap: 3,
                        }}
                      >
                        <I
                          name={icons[r.name as Tab]}
                          size={19}
                          color={state.index === i ? c.gold : c.muted}
                        />
                        <T
                          size={9.5}
                          weight="600"
                          color={state.index === i ? c.gold : c.muted}
                          style={{ lineHeight: 14 }}
                        >
                          {r.name}
                        </T>
                      </P>
                    ))}
                  </View>
                )
              }
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: wide
                  ? { display: 'none' }
                  : {
                      backgroundColor: c.side,
                      borderTopWidth: 1,
                      borderColor: c.edge,
                      paddingTop: 8,
                      paddingBottom: Math.max(inset.bottom, 6),
                      height: 61 + inset.bottom,
                    },
                tabBarActiveTintColor: c.gold,
                tabBarInactiveTintColor: c.faint,
                tabBarLabelStyle: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '600' },
                tabBarIcon: ({ color }) => (
                  <I name={icons[route.name as Tab]} size={20} color={color} />
                ),
                sceneStyle: { backgroundColor: c.bg },
                animation: 'fade',
                lazy: true,
              })}
            >
              <Navigator.Screen name="Accueil" component={Dashboard} />
              <Navigator.Screen name="Prestations" component={Bookings} />
              <Navigator.Screen name="Clients" component={Clients} />
              <Navigator.Screen name="Documents" component={Documents} />
              <Navigator.Screen name="Réglages" component={Settings} />
            </Navigator.Navigator>
          </View>
        </View>
      </NavigationContainer>
      {!wide && active !== 'Accueil' && panels.length === 0 && (
        <P
          onPress={() => open({ kind: 'wizard' })}
          label="Nouvelle prestation"
          style={[
            S.center,
            {
              position: 'absolute',
              bottom: 77 + inset.bottom,
              right: 19,
              width: 49,
              height: 49,
              borderRadius: 25,
              backgroundColor: '#d3b581',
              boxShadow: '0 4px 20px #0003',
            },
          ]}
        >
          <I name="add" color="#171715" size={25} />
        </P>
      )}
      <PanelHost />
      {toast && panels.length === 0 && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            S.row,
            {
              position: 'absolute',
              alignSelf: 'center',
              bottom: wide ? 25 : 84,
              maxWidth: '90%',
              backgroundColor: c.card2,
              borderWidth: 1,
              borderColor: c.edge,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 17,
              gap: 9,
            },
          ]}
        >
          <I name="checkmark-circle-outline" color={c.gold} size={17} />
          <T size={12}>{toast}</T>
        </View>
      )}
    </SafeAreaView>
  );
}
