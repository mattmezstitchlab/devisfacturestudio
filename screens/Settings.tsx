import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import {
  Button,
  Card,
  I,
  IconName,
  Label,
  P,
  Page,
  Rule,
  S,
  T,
  TitleBlock,
} from '../components/ui';
export function SettingRow({
  icon,
  title,
  desc,
  onPress,
  last = false,
}: {
  icon: IconName;
  title: string;
  desc: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { c } = useStudio();
  return (
    <P
      onPress={onPress}
      hover={c.hover}
      style={[
        S.row,
        { gap: 13, paddingVertical: 17, borderBottomWidth: last ? 0 : 1, borderColor: c.edge },
      ]}
    >
      <View
        style={[S.center, { width: 34, height: 34, borderRadius: 9, backgroundColor: c.goldSoft }]}
      >
        <I name={icon} size={17} color={c.gold} />
      </View>
      <View style={S.grow}>
        <T size={13} weight="700">
          {title}
        </T>
        <T size={11} color={c.muted} style={{ marginTop: 3 }}>
          {desc}
        </T>
      </View>
      <I name="chevron-forward" size={14} />
    </P>
  );
}
export default function Settings() {
  const { c, mode, open, lock, theme } = useStudio();
  const { width } = useWindowDimensions();
  return (
    <Page>
      <TitleBlock
        eyebrow="VOTRE STUDIO"
        title="Réglages"
        desc="Un espace à votre image, des documents à votre nom."
      />
      <Card style={{ padding: 22, marginBottom: 20 }}>
        <View style={[S.between, { gap: 15, flexWrap: 'wrap' }]}>
          <View style={[S.row, { gap: 14 }]}>
            <View
              style={[
                S.center,
                { width: 48, height: 48, borderRadius: 24, backgroundColor: c.goldSoft },
              ]}
            >
              <I name="lock-closed-outline" color={c.gold} size={21} />
            </View>
            <View>
              <T size={17} weight="700">
                {mode === 'demo' ? 'Votre espace privé' : 'Votre coffre est déverrouillé'}
              </T>
              <T size={12} color={c.muted}>
                Stockage local chiffré sur cet appareil.
              </T>
            </View>
          </View>
          <Button
            small
            icon={mode === 'demo' ? 'arrow-forward' : 'lock-closed-outline'}
            title={mode === 'demo' ? 'Accéder à mon espace' : 'Verrouiller'}
            onPress={() => (mode === 'demo' ? open({ kind: 'auth' }) : lock())}
          />
        </View>
      </Card>
      <View style={{ flexDirection: width >= 1130 ? 'row' : 'column', gap: 17 }}>
        <Card style={{ paddingHorizontal: 19, paddingTop: 19, flex: 1 }}>
          <Label color={c.gold}>IDENTITÉ & DOCUMENTS</Label>
          <SettingRow
            icon="person-outline"
            title="Profil du prestataire"
            desc="Identité, coordonnées et informations bancaires"
            onPress={() => open({ kind: 'profile' })}
          />
          <SettingRow
            icon="reader-outline"
            title="Conditions contractuelles"
            desc="Deux modèles, onze articles personnalisables"
            onPress={() => open({ kind: 'clauses' })}
          />
          <SettingRow
            icon="list-outline"
            title="Numérotation"
            desc="Reprendre votre séquence de devis et factures"
            onPress={() => open({ kind: 'sequence' })}
            last
          />
        </Card>
        <Card style={{ paddingHorizontal: 19, paddingTop: 19, flex: 1 }}>
          <Label color={c.gold}>PRÉFÉRENCES & DONNÉES</Label>
          <SettingRow
            icon="contrast-outline"
            title="Apparence"
            desc={
              theme === 'clair'
                ? 'Mode clair'
                : theme === 'sombre'
                  ? 'Mode sombre'
                  : 'Selon votre appareil'
            }
            onPress={() => open({ kind: 'appearance' })}
          />
          <SettingRow
            icon="server-outline"
            title="Données et sauvegardes"
            desc="Exporter, sauvegarder ou effacer votre espace"
            onPress={() => open({ kind: 'data' })}
          />
          <SettingRow
            icon="phone-portrait-outline"
            title="Installer le studio"
            desc="Accéder à l’application depuis l’écran d’accueil"
            onPress={() => open({ kind: 'appearance', data: { install: true } })}
            last
          />
        </Card>
      </View>
      <T size={10} color={c.faint} style={{ marginTop: 20, textAlign: 'center', letterSpacing: 1 }}>
        MATT MEZ STUDIO · VERSION 1.0
      </T>
    </Page>
  );
}
