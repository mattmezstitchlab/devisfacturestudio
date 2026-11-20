import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, TextInput, View, useWindowDimensions } from 'react-native';
import { useStudio } from '../lib/studio';
import { Booking, Client, StudioDoc, normalize, today } from '../lib/model';
import { Badge, Button, Card, Chips, Empty, I, P, S, T, TitleBlock } from '../components/ui';
import { BookingRow, DocRow } from './Dashboard';
function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { c } = useStudio();
  return (
    <View
      style={[
        S.row,
        {
          gap: 10,
          backgroundColor: c.input,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: c.edge,
          paddingHorizontal: 13,
          marginBottom: 14,
        },
      ]}
    >
      <I name="search-outline" size={17} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.faint}
        style={
          {
            flex: 1,
            color: c.text,
            fontFamily: 'Manrope',
            fontSize: 13,
            paddingVertical: 12,
            outlineStyle: 'none',
          } as any
        }
      />
      {!!value && (
        <P label="Effacer la recherche" onPress={() => onChange('')}>
          <I name="close-circle" size={16} />
        </P>
      )}
    </View>
  );
}
export { SearchBox };
function ListPage<T>({
  items,
  header,
  render,
  empty,
}: {
  items: T[];
  header: React.ReactNode;
  render: (v: T, i: number) => React.ReactNode;
  empty: React.ReactNode;
}) {
  const { c, refresh: reload, notify } = useStudio();
  const { width } = useWindowDimensions();
  const [refresh, setRefresh] = useState(false);
  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        padding: width < 700 ? 18 : 30,
        paddingBottom: 85,
        maxWidth: 1480,
        width: '100%',
        alignSelf: 'center',
      }}
      data={items}
      ListHeaderComponent={<View style={{ marginBottom: 13 }}>{header}</View>}
      keyExtractor={(i: any) => i.id}
      renderItem={({ item, index }) => (
        <View
          style={{
            backgroundColor: c.card,
            borderColor: c.edge,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: index === 0 ? 1 : 0,
            borderBottomWidth: index === items.length - 1 ? 1 : 0,
            borderTopLeftRadius: index === 0 ? 12 : 0,
            borderTopRightRadius: index === 0 ? 12 : 0,
            borderBottomLeftRadius: index === items.length - 1 ? 12 : 0,
            borderBottomRightRadius: index === items.length - 1 ? 12 : 0,
            paddingHorizontal: 18,
          }}
        >
          {render(item, index)}
        </View>
      )}
      ListEmptyComponent={<Card>{empty}</Card>}
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={async () => {
            setRefresh(true);
            try {
              await reload();
            } catch (e: any) {
              notify(e.message);
            } finally {
              setRefresh(false);
            }
          }}
          tintColor={c.gold}
        />
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}
export function Bookings() {
  const { db, open } = useStudio();
  const [q, setQ] = useState('');
  const [f, setF] = useState('À venir');
  const items = db.bookings
    .filter(
      (b) =>
        (f === 'Toutes' ||
          (f === 'À venir'
            ? b.date >= today()
            : f === 'Brouillons'
              ? b.stage === 0
              : b.date < today())) &&
        normalize(
          [b.title, b.venue, b.address, db.clients.find((c) => c.id === b.clientId)?.name].join(
            ' ',
          ),
        ).includes(normalize(q)),
    )
    .sort((a, b) =>
      f === 'Passées' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  return (
    <ListPage
      items={items}
      header={
        <>
          <TitleBlock
            eyebrow="VOTRE AGENDA"
            title="Prestations"
            desc="Chaque événement, de la première demande au dernier accord."
            action={
              <Button
                title="Nouvelle prestation"
                icon="add"
                onPress={() => open({ kind: 'wizard' })}
                small
              />
            }
          />
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Rechercher une prestation, un lieu, un client…"
          />
          <Chips
            values={['À venir', 'Toutes', 'Brouillons', 'Passées']}
            value={f}
            onChange={setF}
          />
        </>
      }
      render={(b, i) => <BookingRow booking={b} library last={i === items.length - 1} />}
      empty={
        <Empty
          icon="calendar-outline"
          title={q ? 'Aucun résultat' : 'Aucune prestation ici'}
          body={
            q
              ? 'Essayez un autre nom ou un autre lieu.'
              : 'Retrouvez ici les prestations correspondant à ce filtre.'
          }
          action="Nouvelle prestation"
          onPress={() => open({ kind: 'wizard' })}
        />
      }
    />
  );
}
export function Clients() {
  const { db, c, open } = useStudio();
  const [q, setQ] = useState('');
  const [f, setF] = useState('Tous');
  const items = db.clients
    .filter(
      (v) =>
        (f === 'Tous' || v.kind === f) &&
        normalize(v.name + ' ' + v.email + ' ' + v.address).includes(normalize(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <ListPage
      items={items}
      header={
        <>
          <TitleBlock
            eyebrow="VOTRE RÉSEAU"
            title="Clients"
            desc="Vos contacts et toute l’histoire de leurs prestations."
            action={
              <Button
                title="Nouveau client"
                icon="person-add-outline"
                small
                onPress={() => open({ kind: 'client', data: { create: true } })}
              />
            }
          />
          <SearchBox value={q} onChange={setQ} placeholder="Rechercher un client…" />
          <Chips values={['Tous', 'Professionnel', 'Particulier']} value={f} onChange={setF} />
        </>
      }
      render={(v, i) => (
        <P
          label={v.name}
          onPress={() => open({ kind: 'client', id: v.id })}
          hover={c.hover}
          style={[
            S.row,
            {
              gap: 14,
              paddingVertical: 17,
              borderBottomWidth: i === items.length - 1 ? 0 : 1,
              borderColor: c.edge,
            },
          ]}
        >
          <View
            style={[
              S.center,
              { width: 42, height: 42, borderRadius: 11, backgroundColor: c.goldSoft },
            ]}
          >
            <T size={14} weight="700" color={c.gold}>
              {v.name
                .split(/\s+/)
                .filter((x) => x !== '&')
                .slice(0, 2)
                .map((x) => x[0])
                .join('')
                .toUpperCase()}
            </T>
          </View>
          <View style={S.grow}>
            <T size={14} weight="700">
              {v.name}
            </T>
            <T size={11} color={c.muted}>
              {v.kind} · {db.bookings.filter((b) => b.clientId === v.id).length} prestation(s)
            </T>
          </View>
          <I name="chevron-forward" size={16} />
        </P>
      )}
      empty={
        <Empty
          icon="people-outline"
          title="Aucun client trouvé"
          body="Ajoutez un client ou ajustez votre recherche."
          action="Ajouter un client"
          onPress={() => open({ kind: 'client', data: { create: true } })}
        />
      }
    />
  );
}
export function Documents() {
  const { db, open } = useStudio();
  const [q, setQ] = useState('');
  const [f, setF] = useState('Tous');
  const items = [...db.docs]
    .filter(
      (d) =>
        (f === 'Tous' ||
          (f === 'Factures'
            ? d.kind.startsWith('Facture') || d.kind === 'Avoir'
            : f === 'Brouillons'
              ? d.status === 'Brouillon'
              : f === 'Contrats'
                ? d.kind === 'Contrat'
                : d.kind === 'Devis')) &&
        normalize(d.number + ' ' + d.kind + ' ' + d.snapshot.client.name).includes(normalize(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ListPage
      items={items}
      header={
        <>
          <TitleBlock
            eyebrow="VOTRE PAPETERIE"
            title="Documents"
            desc="Devis, contrats et factures réunis dans un seul espace."
          />
          <SearchBox value={q} onChange={setQ} placeholder="Rechercher un document ou un numéro…" />
          <Chips
            values={['Tous', 'Devis', 'Contrats', 'Factures', 'Brouillons']}
            value={f}
            onChange={setF}
          />
        </>
      }
      render={(d, i) => <DocRow doc={d} last={i === items.length - 1} />}
      empty={
        <Empty
          icon="documents-outline"
          title="Votre collection de documents"
          body="Ouvrez une prestation pour préparer un devis, un contrat ou une facture."
          action="Choisir une prestation"
          onPress={() => open({ kind: 'search', data: { bookings: true } })}
        />
      }
    />
  );
}
