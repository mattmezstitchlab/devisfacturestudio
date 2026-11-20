import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import { dateFmt, deposit, money, normalize, received, today } from '../lib/model';
import { calendarFile, emailDraft } from '../lib/files';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  I,
  Label,
  Note,
  P,
  Rule,
  S,
  Sheet,
  T,
} from '../components/ui';
import { BookingRow, DocRow } from './Dashboard';
import { SearchBox } from './Library';
export function SearchPanel({ panel }: { panel: Panel }) {
  const { db, c, open, year } = useStudio();
  const [q, setQ] = useState('');
  if (panel.data?.pendingQuotes) {
    const pending = db.docs.filter(
      (v) =>
        v.kind === 'Devis' &&
        ['Émis', 'Envoyé'].includes(v.status) &&
        (year === 'Tout' || v.date.startsWith(year)),
    );
    return (
      <Sheet title="Devis en attente" kicker="SUIVI COMMERCIAL">
        <T size={12} color={c.muted}>
          {pending.length} devis à suivre · {money(pending.reduce((s, v) => s + v.amount, 0))}
        </T>
        {pending.length ? (
          pending.map((d, i) => <DocRow key={d.id} doc={d} last={i === pending.length - 1} />)
        ) : (
          <Empty
            title="Tout est à jour"
            body="Aucun devis émis en attente d’acceptation pour cette période."
          />
        )}
      </Sheet>
    );
  }
  const n = normalize(q);
  const clients = db.clients.filter((x) => normalize(x.name + ' ' + x.email).includes(n));
  const events = db.bookings.filter((x) =>
    normalize(
      x.title +
        ' ' +
        x.address +
        ' ' +
        x.venue +
        ' ' +
        db.clients.find((v) => v.id === x.clientId)?.name,
    ).includes(n),
  );
  const docs = q
    ? db.docs.filter((x) =>
        normalize(x.kind + ' ' + x.number + ' ' + x.snapshot.client.name).includes(n),
      )
    : [];
  return (
    <Sheet title="Rechercher" kicker="RECHERCHE GLOBALE">
      <SearchBox value={q} onChange={setQ} placeholder="Un client, une prestation, un document…" />
      {events.length > 0 && (
        <>
          <Label>PRESTATIONS · {events.length}</Label>
          <View>
            {events.slice(0, 8).map((b, i) => (
              <BookingRow key={b.id} booking={b} last={i === Math.min(7, events.length - 1)} />
            ))}
          </View>
        </>
      )}
      {clients.length > 0 && (
        <>
          <Label>CLIENTS · {clients.length}</Label>
          {clients.slice(0, 6).map((v) => (
            <P
              key={v.id}
              onPress={() => open({ kind: 'client', id: v.id })}
              style={[S.row, { gap: 10, paddingVertical: 5 }]}
            >
              <I name="person-outline" size={16} />
              <T style={S.grow} size={13}>
                {v.name}
              </T>
              <I name="arrow-forward" size={14} />
            </P>
          ))}
        </>
      )}
      {docs.length > 0 && (
        <>
          <Label>DOCUMENTS · {docs.length}</Label>
          <View>
            {docs.slice(0, 6).map((d) => (
              <DocRow key={d.id} doc={d} />
            ))}
          </View>
        </>
      )}
      {!clients.length && !events.length && !docs.length && (
        <Empty
          icon="search-outline"
          title="Aucun résultat"
          body="Essayez un autre terme, un nom ou un numéro de document."
        />
      )}
    </Sheet>
  );
}
export function ActivityPanel({ panel }: { panel: Panel }) {
  const { db, c, open, year } = useStudio();
  const due = db.bookings.filter(
    (b) => b.stage >= 2 && b.stage < 6 && deposit(b) > received(db, b.id),
  );
  const history = db.bookings
    .flatMap((b) => b.history.map((h) => ({ ...h, b })))
    .sort((a, b) => b.at.localeCompare(a.at));
  const pays = [...db.payments]
    .filter((p) => year === 'Tout' || p.date.startsWith(year))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Sheet
      title={panel.data?.payments ? 'Encaissements' : 'Activité du studio'}
      kicker={panel.data?.payments ? 'RÈGLEMENTS CONFIRMÉS' : 'RAPPELS & JOURNAL'}
    >
      {panel.data?.payments ? (
        <>
          <T size={31} weight="600">
            {money(pays.reduce((s, p) => s + p.amount, 0))}
          </T>
          <T size={12} color={c.muted}>
            {year === 'Tout' ? 'Toutes les années' : year} · {pays.length} règlement(s)
            enregistré(s)
          </T>
          <Rule />
          {pays.length ? (
            pays.map((p) => (
              <P
                key={p.id}
                onPress={() => open({ kind: 'booking', id: p.bookingId })}
                style={S.between}
              >
                <View style={S.grow}>
                  <T size={13} weight="600">
                    {db.bookings.find((b) => b.id === p.bookingId)?.title}
                  </T>
                  <T size={11} color={c.faint}>
                    {dateFmt(p.date)} · {p.method}
                  </T>
                </View>
                <T color={c.good} size={14} weight="700">
                  {money(p.amount)}
                </T>
              </P>
            ))
          ) : (
            <Empty
              title="Aucun encaissement"
              body="Les seuls montants comptabilisés sont ceux que vous confirmez."
            />
          )}
        </>
      ) : (
        <>
          <Label color={c.gold}>ACOMPTES À RECEVOIR · {due.length}</Label>
          {due.length ? (
            due.map((b) => (
              <Card key={b.id} style={{ padding: 13, gap: 9 }}>
                <View style={S.between}>
                  <T size={13} weight="700">
                    {b.title}
                  </T>
                  <T size={14} color={c.gold}>
                    {money(deposit(b) - received(db, b.id))}
                  </T>
                </View>
                <T size={11} color={c.muted}>
                  Échéance : {dateFmt(b.depositDue)}
                </T>
                <Button
                  title="Préparer une relance"
                  icon="mail-outline"
                  kind="secondary"
                  small
                  onPress={() => open({ kind: 'email', id: b.id, data: { reminder: true } })}
                />
              </Card>
            ))
          ) : (
            <T size={12} color={c.muted}>
              Aucun acompte en attente.
            </T>
          )}
          <Rule />
          <Label>DERNIÈRES ACTIONS</Label>
          {history.length ? (
            history.slice(0, 9).map((h, i) => (
              <P
                key={i}
                style={[S.row, { gap: 11 }]}
                onPress={() => open({ kind: 'booking', id: h.b.id })}
              >
                <I name="time-outline" size={15} />
                <View style={S.grow}>
                  <T size={12}>{h.text}</T>
                  <T size={10} color={c.faint}>
                    {h.b.title} · {dateFmt(h.at)}
                  </T>
                </View>
              </P>
            ))
          ) : (
            <T size={12} color={c.faint}>
              Votre historique commencera avec votre première prestation.
            </T>
          )}
        </>
      )}
    </Sheet>
  );
}
export function EmailPanel({ panel }: { panel: Panel }) {
  const { db, c, notify } = useStudio();
  const d = panel.data?.reminder ? undefined : db.docs.find((x) => x.id === panel.id);
  const b = d?.snapshot.booking || db.bookings.find((x) => x.id === panel.id)!;
  const cl = d?.snapshot.client || db.clients.find((x) => x.id === b.clientId)!;
  const [to, setTo] = useState(cl.email);
  const [subject, setSubject] = useState(
    d
      ? `${d.kind} ${d.number || '(brouillon)'} — ${b.title}`
      : `Acompte de réservation — ${b.title}`,
  );
  const [body, setBody] = useState(
    d
      ? `Bonjour${cl.contact ? ' ' + cl.contact : ''},\n\nVeuillez trouver en pièce jointe ${d.kind.toLowerCase()}${d.number ? ' ' + d.number : ' (brouillon)'} pour la prestation « ${b.title} » du ${dateFmt(b.date)}.\n\nJe reste à votre disposition pour toute précision.\n\nBien à vous,\nMatthieu Lecointre — Matt Mez`
      : `Bonjour${cl.contact ? ' ' + cl.contact : ''},\n\nSauf erreur de ma part, l’acompte de ${money(Math.max(0, deposit(b) - received(db, b.id)))} relatif à « ${b.title} » reste à régler. L’échéance prévue est le ${dateFmt(b.depositDue)}.\n\nSi le virement a déjà été effectué, merci de ne pas tenir compte de ce message.\n\nBien à vous,\nMatthieu Lecointre — Matt Mez`,
  );
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !subject.trim()) {
      setErr('Renseignez une adresse e-mail et un objet valides.');
      return;
    }
    setBusy(true);
    try {
      await emailDraft(to, subject, body, d);
      notify('Brouillon e-mail préparé. Aucun envoi effectué.');
      setErr('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={d ? 'Préparer l’e-mail' : 'Relance d’acompte'}
      kicker="CORRESPONDANCE"
      footer={
        <Button
          title="Exporter le brouillon e-mail (.eml)"
          icon="download-outline"
          loading={busy}
          onPress={submit}
        />
      }
    >
      <Note>
        Relisez et ouvrez le fichier .eml dans un logiciel de messagerie compatible. Vous décidez de
        l’envoi. Aucun statut n’est modifié automatiquement.
      </Note>
      <Field label="Destinataire" type="email" value={to} onChange={setTo} />
      <Field label="Objet" value={subject} onChange={setSubject} />
      <Field label="Message" multiline value={body} onChange={setBody} />
      {d && (
        <View style={[S.row, { gap: 9, padding: 12, backgroundColor: c.input, borderRadius: 8 }]}>
          <I name="attach-outline" color={c.gold} />
          <View>
            <T size={12} weight="600">
              {d.kind}.pdf
            </T>
            <T size={10} color={c.faint}>
              PDF joint au brouillon .eml
            </T>
          </View>
        </View>
      )}
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function CalendarPanel({ panel }: { panel: Panel }) {
  const { db, c, notify } = useStudio();
  const b = db.bookings.find((v) => v.id === panel.id)!;
  const cl = db.clients.find((v) => v.id === b.clientId)!;
  const [err, setErr] = useState('');
  return (
    <Sheet title="Rappel de prestation" kicker="VOTRE CALENDRIER">
      <T size={19} weight="700">
        {b.title}
      </T>
      <T color={c.muted}>
        {dateFmt(b.date)} · {b.start ? b.start + ' – ' + b.end : 'Horaires à confirmer'}
      </T>
      <T size={12} color={c.muted}>
        {b.venue} · {b.address}
      </T>
      <Note>
        Le fichier calendrier (.ics) contient un rappel 24 h avant l’événement. Importez-le dans
        votre agenda pour activer le rappel. Aucune notification distante n’est envoyée.
      </Note>
      <Button
        title="Télécharger le rappel calendrier"
        icon="calendar-outline"
        onPress={async () => {
          try {
            await calendarFile(b, cl);
            notify('Fichier calendrier préparé.');
          } catch (e: any) {
            setErr(e.message);
          }
        }}
      />
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function PeriodPanel() {
  const { c, db, year, setYear, close } = useStudio();
  const values = Array.from(
    new Set([
      String(new Date().getFullYear()),
      ...db.docs.map((d) => d.date.slice(0, 4)),
      ...db.payments.map((p) => p.date.slice(0, 4)),
    ]),
  )
    .sort()
    .reverse();
  return (
    <Sheet title="Période d’analyse" kicker="VUE D’ENSEMBLE">
      <T size={12} color={c.muted}>
        La période filtre les devis et les encaissements. Les acomptes à recevoir restent affichés
        toutes dates confondues.
      </T>
      {[...values, 'Tout'].map((v) => (
        <P
          key={v}
          onPress={() => {
            setYear(v);
            close();
          }}
          style={[
            S.between,
            { backgroundColor: v === year ? c.goldSoft : c.input, padding: 14, borderRadius: 8 },
          ]}
        >
          <T size={14} weight="600">
            {v === 'Tout' ? 'Toutes les années' : 'Année ' + v}
          </T>
          {v === year && <I name="checkmark" color={c.gold} />}
        </P>
      ))}
    </Sheet>
  );
}
export function ConfirmPanel({ panel }: { panel: Panel }) {
  const { close, clear } = useStudio();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const d = panel.data;
  return (
    <Sheet title={d.title} kicker="CONFIRMATION">
      <Note>{d.body}</Note>
      <View style={[S.row, { justifyContent: 'flex-end', gap: 9 }]}>
        <Button title="Annuler" kind="ghost" onPress={close} />
        <Button
          title={d.action}
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await d.run();
              d.keep ? close() : clear();
            } catch (e: any) {
              setErr(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
