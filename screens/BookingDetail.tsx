import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import {
  Booking,
  Client,
  DocKind,
  cents,
  clone,
  dateFmt,
  deposit,
  docKinds,
  initialClient,
  money,
  received,
  stages,
  statusOf,
  today,
  total,
  validDate,
} from '../lib/model';
import { addPayment, log, prepareDocument } from '../lib/operations';
import {
  Badge,
  Button,
  Card,
  Check,
  Chips,
  Empty,
  Field,
  I,
  Label,
  LinkText,
  Note,
  P,
  Rule,
  S,
  Sheet,
  T,
} from '../components/ui';
import { BookingRow, DocRow } from './Dashboard';
import { ClientFields } from './Wizard';
export function BookingDetail({ panel }: { panel: Panel }) {
  const { db, c, open, commit, mode, notify, clear } = useStudio();
  const b = db.bookings.find((v) => v.id === panel.id);
  const [tab, setTab] = useState('Aperçu');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<number | null>(null);
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!b)
    return (
      <Sheet title="Fiche introuvable">
        <Note>Cette prestation n’existe plus.</Note>
      </Sheet>
    );
  const cl = db.clients.find((v) => v.id === b.clientId)!;
  const paid = received(db, b.id);
  const docs = db.docs.filter((d) => d.bookingId === b.id);
  const create = async (kind: DocKind) => {
    setBusy(true);
    try {
      let id = '';
      await commit((d) => {
        id = prepareDocument(d, b.id, kind, mode === 'demo');
      });
      open({ kind: 'document', id });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const validate = async () => {
    if (stage === null) return;
    try {
      if (b.sample) throw new Error('L’exemple reste en brouillon. Dupliquez-le pour poursuivre.');
      if ((stage === 3 && paid < deposit(b)) || ((stage === 5 || stage === 6) && paid < total(b)))
        throw new Error('Confirmez d’abord le règlement correspondant dans l’onglet Règlements.');
      await commit((d) => {
        const v = d.bookings.find((x) => x.id === b.id)!;
        v.stage = stage;
        log(v, 'Étape validée manuellement : ' + stages[stage] + '.');
      });
      setStage(null);
      setError('');
      notify('Progression mise à jour.');
    } catch (e: any) {
      setError(e.message);
    }
  };
  return (
    <Sheet title={b.title} kicker="FICHE PRESTATION" wide>
      <View style={[S.between, { gap: 8, flexWrap: 'wrap' }]}>
        <P onPress={() => open({ kind: 'client', id: cl.id })} style={[S.row, { gap: 7 }]}>
          <I name="person-outline" size={15} color={c.gold} />
          <T size={14} color={c.gold} weight="600">
            {cl.name}
          </T>
          <I name="arrow-forward" size={12} color={c.gold} />
        </P>
        <Badge text={statusOf(b)} />
      </View>
      <View style={[S.wrap, { gap: 8 }]}>
        <Button
          small
          kind="secondary"
          icon="create-outline"
          title="Modifier"
          onPress={() => open({ kind: 'wizard', id: b.id })}
        />
        <Button
          small
          kind="secondary"
          icon="copy-outline"
          title="Dupliquer"
          onPress={() => open({ kind: 'wizard', id: b.id, data: { duplicate: true } })}
        />
        <Button
          small
          icon="document-text-outline"
          title="Préparer un devis"
          loading={busy}
          onPress={() => create('Devis')}
        />
      </View>
      {b.sample && (
        <Note>
          Exemple Chez Julien : cette fiche reste en brouillon. Dupliquez-la pour créer une
          réservation indépendante.
        </Note>
      )}
      <Chips
        values={['Aperçu', 'Documents', 'Règlements', 'Historique']}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setError('');
        }}
      />
      {tab === 'Aperçu' && (
        <>
          <View style={{ backgroundColor: c.input, borderRadius: 10, padding: 16, gap: 11 }}>
            <Label color={c.gold}>SUIVI DE LA PRESTATION</Label>
            <View style={[S.wrap, { gap: 5 }]}>
              {stages.map((s, i) => (
                <P
                  key={s}
                  onPress={() => {
                    setStage(i);
                    setError('');
                  }}
                  style={[
                    S.row,
                    {
                      gap: 4,
                      paddingVertical: 7,
                      paddingHorizontal: 6,
                      borderRadius: 5,
                      backgroundColor: i === b.stage ? c.goldSoft : 'transparent',
                    },
                  ]}
                >
                  <I
                    size={12}
                    name={i <= b.stage ? 'checkmark-circle' : 'ellipse-outline'}
                    color={i <= b.stage ? c.gold : c.faint}
                  />
                  <T size={10} color={i <= b.stage ? c.gold : c.faint}>
                    {s}
                  </T>
                </P>
              ))}
            </View>
            {stage !== null && (
              <>
                <T size={12}>Valider l’étape « {stages[stage]} » ? Aucun paiement ne sera créé.</T>
                <View style={[S.row, { gap: 9 }]}>
                  <Button small title="Valider l’étape" onPress={validate} />
                  <Button small kind="ghost" title="Annuler" onPress={() => setStage(null)} />
                </View>
              </>
            )}
          </View>
          <View style={{ gap: 11 }}>
            <Label>ÉVÉNEMENT</Label>
            <Info
              icon="calendar-outline"
              title={dateFmt(b.date)}
              sub={b.start ? `${b.start} – ${b.end}` : 'Horaires à confirmer'}
            />
            <Info
              icon="location-outline"
              title={b.venue || 'Lieu à confirmer'}
              sub={b.address || 'Adresse à compléter'}
            />
            <Info icon="musical-notes-outline" title={b.type} sub={b.description} />
          </View>
          <Card style={{ padding: 17, gap: 9 }}>
            <View style={S.between}>
              <T size={13} color={c.muted}>
                Montant total
              </T>
              <T size={22} weight="700">
                {money(total(b))}
              </T>
            </View>
            <Rule />
            <View style={S.between}>
              <T size={12} color={c.muted}>
                Acompte · {b.rate} %
              </T>
              <T size={14}>{money(deposit(b))}</T>
            </View>
            <View style={S.between}>
              <T size={12} color={c.muted}>
                Solde contractuel
              </T>
              <T size={14}>{money(total(b) - deposit(b))}</T>
            </View>
          </Card>
          <View style={[S.wrap, { gap: 8 }]}>
            <Button
              title="Rappel calendrier"
              small
              kind="secondary"
              icon="calendar-outline"
              onPress={() => open({ kind: 'calendar', id: b.id })}
            />
            <Button
              title="Préparer une relance"
              small
              kind="secondary"
              icon="mail-outline"
              onPress={() => open({ kind: 'email', id: b.id, data: { reminder: true } })}
            />
          </View>
          {b.technical && (
            <>
              <Label>INFORMATIONS TECHNIQUES</Label>
              <T size={12} color={c.muted}>
                {b.technical}
              </T>
            </>
          )}
          {b.stage === 0 && !docs.some((v) => !!v.number) && paid === 0 && !b.sample && (
            <LinkText
              title="Supprimer cette fiche brouillon"
              color={c.danger}
              icon="trash-outline"
              onPress={() => setRemove(!remove)}
            />
          )}
          {remove && (
            <>
              <Note error>
                La fiche et ses brouillons seront supprimés. Le contact client sera conservé.
              </Note>
              <Button
                title="Confirmer la suppression"
                kind="danger"
                onPress={async () => {
                  try {
                    await commit((d) => {
                      if (
                        d.docs.some((v) => v.bookingId === b.id && v.number) ||
                        received(d, b.id) > 0
                      )
                        throw new Error('Un document émis ou un paiement protège cette fiche.');
                      d.bookings = d.bookings.filter((v) => v.id !== b.id);
                      d.docs = d.docs.filter((v) => v.bookingId !== b.id);
                    });
                    clear();
                    notify('Brouillon supprimé.');
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
              />
            </>
          )}
        </>
      )}
      {tab === 'Documents' && (
        <>
          <Label>DOCUMENTS ASSOCIÉS · {docs.length}</Label>
          {docs.length ? (
            <View>
              {docs.map((d, i) => (
                <DocRow key={d.id} doc={d} last={i === docs.length - 1} />
              ))}
            </View>
          ) : (
            <Note>Aucun document pour le moment. Préparez un premier brouillon ci-dessous.</Note>
          )}
          <Label>PRÉPARER UN DOCUMENT</Label>
          <View style={[S.wrap, { gap: 8 }]}>
            {docKinds.map((k) => (
              <Button
                key={k}
                title={k}
                icon="add"
                small
                kind="secondary"
                disabled={busy}
                onPress={() => create(k)}
              />
            ))}
          </View>
          <T size={11} color={c.faint}>
            La préparation ne réserve aucun numéro officiel. La validation se fait après relecture.
          </T>
        </>
      )}
      {tab === 'Règlements' && (
        <>
          <Card style={{ padding: 17, gap: 12 }}>
            <View style={S.between}>
              <T color={c.muted}>Encaissé confirmé</T>
              <T size={23} weight="700" color={c.good}>
                {money(paid)}
              </T>
            </View>
            <View style={S.between}>
              <T color={c.muted}>Restant à encaisser</T>
              <T size={20} weight="600">
                {money(total(b) - paid)}
              </T>
            </View>
          </Card>
          <T size={12} color={c.muted}>
            Acompte : {dateFmt(b.depositDue)} · Solde : {dateFmt(b.balanceDue || b.date)}
          </T>
          {db.payments
            .filter((x) => x.bookingId === b.id)
            .map((p) => (
              <View key={p.id} style={S.between}>
                <View>
                  <T size={13} weight="600">
                    {p.method}
                  </T>
                  <T size={11} color={c.faint}>
                    {dateFmt(p.date)} · {p.note || 'Confirmé manuellement'}
                  </T>
                </View>
                <T size={15}>{money(p.amount)}</T>
              </View>
            ))}
          {!paid && (
            <T size={12} color={c.faint}>
              Aucun règlement enregistré.
            </T>
          )}
          <Button
            icon="add"
            title="Confirmer un encaissement"
            disabled={b.sample || paid >= total(b)}
            onPress={() => open({ kind: 'payment', id: b.id })}
          />
        </>
      )}
      {tab === 'Historique' && (
        <>
          {b.history.map((h, i) => (
            <View key={i} style={[S.row, { gap: 11 }]}>
              <I name="time-outline" size={16} color={c.gold} />
              <View style={S.grow}>
                <T size={13}>{h.text}</T>
                <T size={10} color={c.faint}>
                  {dateFmt(h.at)}
                </T>
              </View>
            </View>
          ))}
        </>
      )}
      {error && <Note error>{error}</Note>}
    </Sheet>
  );
}
export function Info({ icon, title, sub }: { icon: any; title: string; sub?: string }) {
  const { c } = useStudio();
  return (
    <View style={[S.row, { gap: 11 }]}>
      <I name={icon} size={18} color={c.faint} />
      <View style={S.grow}>
        <T size={13} weight="600">
          {title}
        </T>
        {sub && (
          <T size={11} color={c.muted}>
            {sub}
          </T>
        )}
      </View>
    </View>
  );
}
export function ClientDetail({ panel }: { panel: Panel }) {
  const { db, c, open, commit, replace, close, notify } = useStudio();
  const original = db.clients.find((x) => x.id === panel.id);
  const [client, setClient] = useState<Client>(() => clone(original || initialClient()));
  const [edit, setEdit] = useState(!original);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const list = db.bookings
    .filter((b) => b.clientId === client.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const save = async () => {
    if (!client.name.trim()) {
      setErr('Le nom est obligatoire.');
      return;
    }
    if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
      setErr('L’adresse e-mail est invalide.');
      return;
    }
    if (client.siren && !/^\d{9}$/.test(client.siren.replace(/\s/g, ''))) {
      setErr('Le SIREN doit comporter 9 chiffres.');
      return;
    }
    setBusy(true);
    try {
      await commit((d) => {
        const i = d.clients.findIndex((x) => x.id === client.id);
        if (i < 0) d.clients.push(client);
        else d.clients[i] = client;
      });
      replace({ kind: 'client', id: client.id });
      setEdit(false);
      notify('Fiche client enregistrée.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={edit ? (original ? 'Modifier le client' : 'Nouveau client') : client.name}
      kicker="CARNET DE CLIENTS"
      footer={
        edit ? (
          <Button title="Enregistrer le client" icon="checkmark" loading={busy} onPress={save} />
        ) : undefined
      }
    >
      {edit ? (
        <ClientFields client={client} onChange={setClient} extra />
      ) : (
        <>
          <Badge text={client.kind} />
          <Info icon="location-outline" title={client.address || 'Adresse à compléter'} />
          <Info icon="mail-outline" title={client.email || 'E-mail à compléter'} />
          {client.phone && <Info icon="call-outline" title={client.phone} />}
          {client.contact && <Info icon="person-outline" title={client.contact} />}
          {client.notes && <Note>{client.notes}</Note>}
          <View style={[S.wrap, { gap: 8 }]}>
            <Button
              title="Nouvelle prestation"
              icon="add"
              small
              onPress={() => open({ kind: 'wizard', data: { clientId: client.id } })}
            />
            <Button
              title="Modifier le client"
              icon="create-outline"
              small
              kind="secondary"
              onPress={() => setEdit(true)}
            />
          </View>
          <Rule />
          <Label>PRESTATIONS · {list.length}</Label>
          {list.length ? (
            list.map((b, i) => <BookingRow key={b.id} booking={b} last={i === list.length - 1} />)
          ) : (
            <T size={12} color={c.faint}>
              Ce client n’a pas encore de prestation.
            </T>
          )}
          {!list.length && (
            <Button
              title="Supprimer le contact sans prestation"
              kind="danger"
              small
              onPress={() =>
                open({
                  kind: 'confirm',
                  data: {
                    title: 'Supprimer ce contact ?',
                    body: 'Cette suppression est définitive.',
                    action: 'Supprimer le contact',
                    run: async () => {
                      await commit((d) => {
                        if (d.bookings.some((b) => b.clientId === client.id))
                          throw new Error('Ce client est associé à une prestation.');
                        d.clients = d.clients.filter((v) => v.id !== client.id);
                      });
                      notify('Contact supprimé.');
                    },
                  },
                })
              }
            />
          )}
        </>
      )}
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function PaymentPanel({ panel }: { panel: Panel }) {
  const { db, c, commit, close, notify } = useStudio();
  const b = db.bookings.find((v) => v.id === panel.id)!;
  const remain = total(b) - received(db, b.id);
  const [amount, setAmount] = useState(
    String(
      (panel.data?.amount ||
        Math.min(remain, Math.max(0, deposit(b) - received(db, b.id)) || remain)) / 100,
    ),
  );
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState('Virement');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!confirm) {
      setErr('Confirmez que les fonds ont réellement été reçus.');
      return;
    }
    setBusy(true);
    try {
      await commit((d) =>
        addPayment(d, b.id, cents(amount), date, method, note, panel.data?.docId),
      );
      notify('Règlement enregistré après votre confirmation.');
      close();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title="Confirmer un encaissement"
      kicker="RÈGLEMENT MANUEL"
      subtitle={b.title}
      footer={
        <Button
          title="Confirmer le règlement reçu"
          icon="checkmark-circle-outline"
          disabled={!confirm}
          loading={busy}
          onPress={save}
        />
      }
    >
      <Note>
        Ce formulaire ne débite aucun compte. Enregistrez uniquement un paiement effectivement reçu.
      </Note>
      <Field
        label="Montant reçu (€)"
        type="decimal"
        value={amount}
        onChange={setAmount}
        hint={'Restant à encaisser : ' + money(remain)}
      />
      <Field label="Date de réception" type="date" value={date} onChange={setDate} />
      <Label>MODE DE RÈGLEMENT</Label>
      <Chips
        values={['Virement', 'Chèque', 'Carte', 'Espèces']}
        value={method}
        onChange={setMethod}
      />
      <Field label="Référence ou note" value={note} onChange={setNote} />
      <Check
        label={'Je confirme avoir reçu ' + money(cents(amount) || 0) + ' pour cette prestation.'}
        value={confirm}
        onChange={setConfirm}
      />
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
