import React, { useId, useMemo, useState } from 'react';
import { TextInput, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useStudio } from '../lib/studio';
import {
  Booking,
  StudioDoc,
  dateFmt,
  deposit,
  money,
  parseRequest,
  received,
  statusOf,
  today,
  total,
} from '../lib/model';
import {
  Badge,
  Button,
  Card,
  Empty,
  I,
  IconName,
  Label,
  LinkText,
  P,
  Page,
  Rule,
  S,
  T,
} from '../components/ui';
function Spark({ points, kind }: { points: number[]; kind: number }) {
  const { c } = useStudio();
  const id = 'g' + useId().replace(/:/g, '');
  const color = kind === 2 ? '#8caa97' : c.gold;
  const max = Math.max(...points, 1),
    min = Math.min(...points, 0);
  const coords = points.map((n, i) => [
    (i * 104) / (points.length - 1),
    36 - ((n - min) / (max - min || 1)) * 26,
  ]);
  const line = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  return (
    <Svg width={100} height={42} viewBox="0 0 106 43">
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.24} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={line + ' L104,43 L0,43 Z'} fill={`url(#${id})`} />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function Metric({
  icon,
  title,
  value,
  note,
  kind,
  points,
  onPress,
}: {
  icon: IconName;
  title: string;
  value: string;
  note: string;
  kind: number;
  points: number[];
  onPress: () => void;
}) {
  const { c } = useStudio();
  const { width } = useWindowDimensions();
  const compact = width < 680;
  return (
    <P
      onPress={onPress}
      label={`${title}, ${value}`}
      hover={c.hover}
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.edge,
        borderRadius: 12,
        paddingHorizontal: compact ? 13 : 20,
        paddingVertical: compact ? 15 : 19,
        overflow: 'hidden',
      }}
    >
      <View
        style={[S.row, { gap: compact ? 7 : 10, alignItems: compact ? 'flex-start' : 'center' }]}
      >
        <View
          style={[
            S.center,
            {
              width: compact ? 25 : 31,
              height: compact ? 25 : 31,
              borderRadius: 8,
              backgroundColor: kind === 2 ? c.goodBg : c.goldSoft,
            },
          ]}
        >
          <I name={icon} color={kind === 2 ? c.good : c.gold} size={compact ? 14 : 16} />
        </View>
        <T
          size={compact ? 10 : 12.5}
          weight="500"
          color={c.muted}
          style={{ flex: 1, lineHeight: compact ? 15 : 18 }}
        >
          {title}
        </T>
      </View>
      <View style={[S.between, { marginTop: compact ? 12 : 15, alignItems: 'flex-end' }]}>
        <T
          size={compact ? (width < 360 ? 19 : 23) : width > 1400 ? 37 : 34}
          weight="600"
          style={{ letterSpacing: -1.6, lineHeight: compact ? 36 : 46 }}
        >
          {value}
        </T>
        {!compact && (
          <View style={{ position: 'absolute', bottom: 1, right: -2, opacity: 0.85 }}>
            <Spark points={points} kind={kind} />
          </View>
        )}
      </View>
      <View style={[S.row, { gap: 5, marginTop: 5 }]}>
        {kind === 2 && <I name="trending-up-outline" color={c.good} size={12} />}
        <T size={compact ? 9 : 10.5} color={c.faint} lines={compact ? 2 : 1}>
          {note}
        </T>
      </View>
    </P>
  );
}
export function BookingRow({
  booking: b,
  last = false,
  library = false,
}: {
  booking: Booking;
  last?: boolean;
  library?: boolean;
}) {
  const { db, c, open } = useStudio();
  const cl = db.clients.find((x) => x.id === b.clientId);
  return (
    <P
      onPress={() => open({ kind: 'booking', id: b.id })}
      label={b.title}
      hover={c.hover}
      style={[
        S.row,
        { gap: 13, paddingVertical: 15, borderBottomWidth: last ? 0 : 1, borderColor: c.edge },
      ]}
    >
      <View
        style={[
          S.center,
          {
            width: 45,
            height: 51,
            borderRadius: 8,
            backgroundColor: c.card2,
            borderWidth: 1,
            borderColor: c.edge,
          },
        ]}
      >
        <T size={20} weight="600" style={{ lineHeight: 26, letterSpacing: -0.8 }}>
          {b.date.slice(8, 10)}
        </T>
        <T size={8} weight="700" color={c.muted} style={{ letterSpacing: 1.2, lineHeight: 14 }}>
          {dateFmt(b.date, { month: 'short' }).replace('.', '').toUpperCase()}
        </T>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <T size={14} weight="700" lines={1}>
          {b.title}
        </T>
        <T size={11.5} color={c.muted} lines={1}>
          {cl?.name}
          <T color={c.faint} size={11}>
            {' '}
            · {b.address.split('\n').pop() || b.venue}
          </T>
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <T size={14} weight="600" style={{ letterSpacing: -0.3 }}>
          {money(total(b))}
        </T>
        <Badge text={statusOf(b)} />
      </View>
      {library && <I name="chevron-forward" size={15} />}
    </P>
  );
}
export function DocRow({ doc: d, last = false }: { doc: StudioDoc; last?: boolean }) {
  const { c, open } = useStudio();
  return (
    <P
      onPress={() => open({ kind: 'document', id: d.id })}
      hover={c.hover}
      style={[
        S.row,
        { gap: 12, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderColor: c.edge },
      ]}
    >
      <View
        style={[
          S.center,
          {
            height: 38,
            width: 34,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: c.edge,
            backgroundColor: c.card2,
          },
        ]}
      >
        <I name="document-text-outline" color={c.gold} size={17} />
      </View>
      <View style={S.grow}>
        <T size={13} weight="600" lines={1}>
          {d.kind} · {d.snapshot.client.name}
        </T>
        <T size={10} color={c.faint}>
          {d.number || 'Sans numéro · Brouillon'}
        </T>
      </View>
      <Badge text={d.status} />
      <I name="chevron-forward" size={14} />
    </P>
  );
}
function Assistant() {
  const { c, db, open } = useStudio();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const run = () => {
    if (!text.trim()) {
      setErr('Décrivez au moins le client et son événement.');
      return;
    }
    setErr('');
    open({ kind: 'wizard', data: { parsed: parseRequest(text, db) } });
  };
  return (
    <LinearGradient
      colors={c.light ? ['#f5efe3', '#fcfaf5'] : ['#24221e', '#1a1a1b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: c.light ? '#d7ccb9' : '#3b352a',
        borderRadius: 13,
        padding: 21,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <View style={[S.row, { gap: 8, marginBottom: 14 }]}>
          <I name="sparkles-outline" size={15} color={c.gold} />
          <Label color={c.gold}>ASSISTANT STUDIO</Label>
        </View>
        <T size={21} weight="600" style={{ letterSpacing: -0.8 }}>
          Une nouvelle prestation ?
        </T>
        <T size={12} color={c.muted} style={{ marginTop: 5 }}>
          Décrivez votre événement en une phrase.
        </T>
      </View>
      <View
        style={{
          backgroundColor: c.light ? '#fff' : '#151516',
          borderWidth: 1,
          borderColor: c.light ? c.edge : '#3a3732',
          borderRadius: 9,
          padding: 12,
          marginTop: 17,
          marginBottom: 4,
        }}
      >
        <TextInput
          accessibilityLabel="Une nouvelle prestation ?"
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setErr('');
          }}
          placeholder={
            'Ex. : Chez Julien, à Paris, le 31 décembre,\nsaxophone live, 1 000 €, acompte 50 %…'
          }
          placeholderTextColor={c.faint}
          style={
            {
              fontFamily: 'Manrope',
              fontSize: 11.5,
              color: c.text,
              lineHeight: 19,
              minHeight: 42,
              textAlignVertical: 'top',
              outlineStyle: 'none',
            } as any
          }
        />
        <View style={[S.between, { marginTop: 7 }]}>
          <T size={9} color={c.faint}>
            Saisie en langage naturel
          </T>
          <P
            label="Préremplir la prestation"
            onPress={run}
            hover="#ddc398"
            style={[
              S.center,
              { width: 29, height: 29, borderRadius: 7, backgroundColor: '#d2b583' },
            ]}
          >
            <I name="arrow-forward" color="#242019" size={17} />
          </P>
        </View>
      </View>
      {err && (
        <T size={11} color={c.danger}>
          {err}
        </T>
      )}
      <LinkText
        title="Utiliser le formulaire classique"
        onPress={() => open({ kind: 'wizard' })}
        color={c.muted}
        icon="arrow-forward"
      />
    </LinearGradient>
  );
}
export default function Dashboard() {
  const { db, c, open, go, mode, year } = useStudio();
  const { width } = useWindowDimensions();
  const mobile = width < 680;
  const two = width >= 1130 || (width >= 750 && width < 900);
  const upcoming = [...db.bookings]
    .filter((b) => b.date >= today() && b.stage < 6)
    .sort((a, b) => a.date.localeCompare(b.date));
  const quotes = db.docs.filter(
    (d) =>
      d.kind === 'Devis' &&
      ['Émis', 'Envoyé'].includes(d.status) &&
      (year === 'Tout' || d.date.startsWith(year)),
  );
  const due = db.bookings.filter(
    (b) => b.stage >= 2 && b.stage < 6 && deposit(b) > received(db, b.id),
  );
  const payments = db.payments.filter((p) => year === 'Tout' || p.date.startsWith(year));
  const accrued = payments.reduce((s, p) => s + p.amount, 0);
  const first = payments.sort((a, b) => a.date.localeCompare(b.date));
  const line3 = [
    0,
    ...first.map((_, i) => first.slice(0, i + 1).reduce((n, p) => n + p.amount, 0)),
  ];
  return (
    <Page>
      <View style={{ gap: mobile ? 20 : 23 }}>
        <View
          style={{
            height: mobile ? 235 : 225,
            overflow: 'hidden',
            borderRadius: 13,
            backgroundColor: '#171819',
            borderWidth: 1,
            borderColor: '#303032',
          }}
        >
          <Image
            source={require('../assets/images/saxophone-studio.jpg')}
            contentFit="cover"
            contentPosition={{ top: '47%', left: '70%' }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: mobile ? '96%' : '63%',
              height: '100%',
              opacity: mobile ? 0.68 : 0.94,
            }}
          />
          <LinearGradient
            colors={
              mobile
                ? ['#171819', '#171819b0', '#17181929']
                : ['#171819', '#171819', '#171819e6', '#17181920', '#17181900']
            }
            locations={mobile ? [0, 0.45, 1] : [0, 0.26, 0.43, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', inset: 0 } as any}
          />
          <LinearGradient
            colors={['transparent', '#10111360']}
            style={{ position: 'absolute', inset: 0 } as any}
          />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingHorizontal: mobile ? 22 : 31,
              paddingVertical: 20,
            }}
          >
            <View style={[S.row, { gap: 9, marginBottom: 9 }]}>
              <View style={{ width: 19, height: 1, backgroundColor: '#d1b482' }} />
              <T size={9} color="#d8bc8c" weight="700" style={{ letterSpacing: 2 }}>
                VOTRE ESPACE ARTISTE
              </T>
            </View>
            <T
              size={mobile ? Math.min(35, width * 0.089) : 44}
              weight="600"
              color="#f6f4ef"
              style={{ letterSpacing: -2.1, lineHeight: mobile ? 48 : 59 }}
            >
              Bonjour Matthieu
              <T size={mobile ? Math.min(35, width * 0.089) : 44} color="#d3b481">
                .
              </T>
            </T>
            <T size={mobile ? 12 : 13} color="#c3c2c2" style={{ marginTop: 3 }}>
              Votre activité, en un coup d’œil.
            </T>
            <Button
              icon="add"
              title="Nouvelle prestation"
              onPress={() => open({ kind: 'wizard' })}
              style={{ marginTop: 21, minHeight: 39, paddingVertical: 9, borderRadius: 7 }}
            />
          </View>
          {!mobile && (
            <View style={[S.row, { position: 'absolute', bottom: 18, right: 20, gap: 7 }]}>
              <View style={{ height: 1, width: 21, backgroundColor: '#cac2b2' }} />
              <T color="#e1dcd2" size={8} weight="600" style={{ letterSpacing: 1.9 }}>
                MATT MEZ · SAXOPHONE LIVE
              </T>
            </View>
          )}
        </View>
        <View style={{ gap: 13 }}>
          <View style={S.between}>
            <T size={18} weight="700" style={{ letterSpacing: -0.6 }}>
              Vue d’ensemble
            </T>
            <P
              onPress={() => open({ kind: 'period' })}
              style={[
                S.row,
                {
                  gap: 7,
                  borderWidth: 1,
                  borderColor: c.edge,
                  borderRadius: 6,
                  paddingVertical: 5,
                  paddingHorizontal: 9,
                  backgroundColor: c.card,
                },
              ]}
            >
              <I name="calendar-clear-outline" size={12} />
              <T size={10} color={c.muted}>
                {year === 'Tout' ? 'Toutes les années' : 'Année ' + year}
              </T>
              <I name="chevron-down" size={11} />
            </P>
          </View>
          <View style={{ flexDirection: 'row', gap: mobile ? 7 : 14 }}>
            <Metric
              icon="document-text-outline"
              title="Devis en attente"
              value={String(quotes.length).padStart(2, '0')}
              note={'Pour un total de ' + money(quotes.reduce((s, x) => s + x.amount, 0))}
              kind={0}
              points={
                mode === 'demo'
                  ? [0, 1, 1, 2, 1.8, 2.5, 2.2, 2.2, 3.1, 2.8, 3.8, 3.8]
                  : [0, 0, quotes.length]
              }
              onPress={() => open({ kind: 'search', data: { pendingQuotes: true } })}
            />
            <Metric
              icon="wallet-outline"
              title="Acomptes à recevoir"
              value={money(due.reduce((s, b) => s + deposit(b) - received(db, b.id), 0))}
              note={
                due.length +
                ' prestation' +
                (due.length > 1 ? 's' : '') +
                ' confirmée' +
                (due.length > 1 ? 's' : '')
              }
              kind={1}
              points={
                mode === 'demo'
                  ? [1, 1, 1.4, 1.4, 2.8, 2.7, 2.1, 2.6, 2.6, 3.8, 3.4, 3.4]
                  : [0, 0, due.length]
              }
              onPress={() => open({ kind: 'activity' })}
            />
            <Metric
              icon="trending-up-outline"
              title={mobile ? 'CA encaissé' : 'Chiffre d’affaires encaissé'}
              value={money(accrued)}
              note={year === 'Tout' ? 'Total des règlements' : 'Encaissé en ' + year}
              kind={2}
              points={
                mode === 'demo'
                  ? [0, 0.6, 0.5, 1.3, 1.1, 2, 2.1, 1.8, 2.8, 3.4, 3.2, 4.5]
                  : line3.length > 1
                    ? line3
                    : [0, 0]
              }
              onPress={() => open({ kind: 'activity', data: { payments: true } })}
            />
          </View>
        </View>
        <View style={{ flexDirection: two ? 'row' : 'column', gap: 16 }}>
          <Card
            style={{
              flex: two ? 1.6 : undefined,
              paddingHorizontal: mobile ? 16 : 21,
              paddingTop: 17,
              paddingBottom: 4,
            }}
          >
            <View style={[S.between, { gap: 7, marginBottom: 4 }]}>
              <View style={[S.row, { gap: 9 }]}>
                <I name="calendar-outline" color={c.gold} size={18} />
                <T size={mobile ? 16 : 17} weight="700" style={{ letterSpacing: -0.7 }}>
                  Prochaines prestations
                </T>
              </View>
              <LinkText
                title="Voir tout"
                icon="arrow-forward"
                color={c.faint}
                onPress={() => go('Prestations')}
              />
            </View>
            {upcoming.length ? (
              upcoming
                .slice(0, 3)
                .map((b, i) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    last={i === Math.min(2, upcoming.length - 1)}
                  />
                ))
            ) : (
              <Empty
                title="Votre agenda vous attend"
                body="Créez une première prestation pour la retrouver ici."
                action="Créer une prestation"
                onPress={() => open({ kind: 'wizard' })}
              />
            )}
          </Card>
          <Assistant />
        </View>
        <View
          style={[S.between, { borderTopWidth: 1, borderColor: c.edge, paddingTop: 16, gap: 12 }]}
        >
          <View style={[S.row, { gap: 9 }]}>
            <I name="musical-notes-outline" size={14} color={c.gold} />
            <T size={10} color={c.faint}>
              Une prestation. Une fiche. Tous les documents.
            </T>
          </View>
          <P
            label="Informations sur l’espace"
            onPress={() => open({ kind: mode === 'demo' ? 'auth' : 'data' })}
            style={[S.row, { gap: 5 }]}
          >
            <I name="shield-checkmark-outline" size={12} color={c.faint} />
            {!mobile && (
              <T size={10} color={c.faint}>
                {mode === 'demo' ? 'Espace de démonstration' : 'Coffre local chiffré'}
              </T>
            )}
          </P>
        </View>
      </View>
    </Page>
  );
}
