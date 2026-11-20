import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import {
  Booking,
  Client,
  cents,
  clone,
  conflict,
  deposit,
  initialBooking,
  initialClient,
  money,
  newId,
  normalize,
  total,
  types,
  validDate,
} from '../lib/model';
import { prepareDocument, saveBooking } from '../lib/operations';
import {
  Badge,
  Button,
  Card,
  Check,
  Chips,
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
export function ClientFields({
  client: c,
  onChange: set,
  extra = false,
}: {
  client: Client;
  onChange: (v: Client) => void;
  extra?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [fieldExtra, setExtra] = useState(extra);
  const change = (k: keyof Client, v: string) => set({ ...c, [k]: v });
  return (
    <View style={{ gap: 15 }}>
      <Field
        label="Nom ou entreprise"
        required
        value={c.name}
        onChange={(v) => change('name', v)}
        placeholder="Ex. : Chez Julien"
      />
      <Chips
        values={['Professionnel', 'Particulier']}
        value={c.kind}
        onChange={(v) => change('kind', v)}
      />
      <Field
        label="Adresse postale"
        value={c.address}
        onChange={(v) => change('address', v)}
        placeholder="Rue, code postal, ville et pays"
      />
      <View style={{ flexDirection: width < 520 ? 'column' : 'row', gap: 12 }}>
        <Field
          style={{ flex: 1 }}
          label="E-mail"
          type="email"
          value={c.email}
          onChange={(v) => change('email', v)}
          placeholder="contact@exemple.fr"
        />
        <Field
          style={{ flex: 1 }}
          label="Téléphone"
          type="tel"
          value={c.phone}
          onChange={(v) => change('phone', v)}
          placeholder="+33…"
        />
      </View>
      <LinkText
        title={
          fieldExtra ? 'Masquer les informations complémentaires' : 'Informations complémentaires'
        }
        icon={fieldExtra ? 'chevron-up' : 'chevron-down'}
        onPress={() => setExtra(!fieldExtra)}
      />
      {fieldExtra && (
        <>
          <Field
            label="Contact principal"
            value={c.contact}
            onChange={(v) => change('contact', v)}
          />
          {c.kind === 'Professionnel' && (
            <Field
              label="SIREN du client"
              value={c.siren}
              type="number"
              onChange={(v) => change('siren', v)}
              placeholder="9 chiffres, si applicable"
            />
          )}
          <Field
            label="Notes internes"
            multiline
            value={c.notes}
            onChange={(v) => change('notes', v)}
            hint="Ces notes n’apparaissent jamais sur les documents."
          />
        </>
      )}
    </View>
  );
}
export default function Wizard({ panel }: { panel: Panel }) {
  const { db, c, commit, replace, close, mode, notify } = useStudio();
  const { width } = useWindowDimensions();
  const src = panel.id ? db.bookings.find((b) => b.id === panel.id) : null;
  const edit = !!src && !panel.data?.duplicate;
  const parsed = panel.data?.parsed;
  const [b, setB] = useState<Booking>(() => {
    if (parsed) return clone(parsed.booking);
    if (src) {
      const n = clone(src);
      if (!edit) {
        n.id = newId();
        n.stage = 0;
        n.sample = false;
        n.history = [];
        n.date = '';
        n.balanceDue = '';
        n.title += ' — copie';
      }
      return n;
    }
    return initialBooking();
  });
  const [client, setClient] = useState<Client>(() =>
    clone(
      parsed?.client ||
        db.clients.find((v) => v.id === (src?.clientId || panel.data?.clientId)) ||
        initialClient(),
    ),
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [technical, setTechnical] = useState(false);
  const [fee, setFee] = useState(b.fee ? String(b.fee / 100) : '');
  const [rate, setRate] = useState(String(b.rate));
  const [travel, setTravel] = useState(String(b.travel / 100 || ''));
  const [meal, setMeal] = useState(String(b.meal / 100 || ''));
  const [tr, setTr] = useState(b.travel > 0);
  const [me, setMe] = useState(b.meal > 0);
  const [prep, setPrep] = useState(true);
  const [select, setSelect] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [allowConflict, setAllowConflict] = useState(false);
  const change = (k: keyof Booking, v: any) =>
    setB((old) => ({
      ...old,
      [k]: v,
      ...(k === 'date' && (!old.balanceDue || old.balanceDue === old.date)
        ? { balanceDue: v }
        : {}),
    }));
  const current = {
    ...b,
    fee: cents(fee) || 0,
    rate: Number(rate.replace(',', '.')),
    travel: tr ? cents(travel) || 0 : 0,
    meal: me ? cents(meal) || 0 : 0,
    clientId: client.id,
  };
  const clash = conflict(db, current);
  const check = () => {
    if (step === 0) {
      if (!client.name.trim()) return 'Indiquez le nom du client ou de son entreprise.';
      if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email))
        return 'Vérifiez l’adresse e-mail du client.';
      if (client.siren && !/^\d{9}$/.test(client.siren.replace(/\s/g, '')))
        return 'Le SIREN du client doit contenir 9 chiffres.';
    }
    if (step === 1) {
      if (!b.title.trim()) return 'Donnez un nom à cette prestation.';
      if (!validDate(b.date)) return 'Choisissez une date valide.';
      if ((b.start && !b.end) || (!b.start && b.end))
        return 'Complétez les deux horaires ou laissez-les à confirmer.';
      if (
        b.start &&
        (!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.start) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.end) ||
          b.start === b.end)
      )
        return 'Vérifiez les horaires de début et de fin.';
      if (clash && !allowConflict) return 'Vérifiez et confirmez le conflit de planning.';
    }
    if (step === 2) {
      if (!Number.isSafeInteger(cents(fee)) || cents(fee) <= 0 || total(current) > 100000000000)
        return 'Indiquez un montant positif valide.';
      if (!rate.trim() || !Number.isFinite(current.rate) || current.rate < 0 || current.rate > 100)
        return 'L’acompte doit être compris entre 0 et 100 %.';
      if (
        (tr && (!Number.isSafeInteger(cents(travel)) || cents(travel) < 0)) ||
        (me && (!Number.isSafeInteger(cents(meal)) || cents(meal) < 0))
      )
        return 'Vérifiez les frais supplémentaires.';
      if (!validDate(current.depositDue) || !validDate(current.balanceDue))
        return 'Vérifiez les échéances de paiement.';
    }
    return '';
  };
  const next = async () => {
    const msg = check();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      let docId = '';
      await commit((d) => {
        saveBooking(d, client, current, edit);
        if (prep) docId = prepareDocument(d, b.id, 'Devis', mode === 'demo');
      });
      notify(
        mode === 'demo'
          ? 'Fiche enregistrée dans la session démo.'
          : 'Prestation enregistrée dans votre coffre.',
      );
      replace(docId ? { kind: 'document', id: docId } : { kind: 'booking', id: b.id });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const mins = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const duration = b.start && b.end ? (mins(b.end) - mins(b.start) + 1440) % 1440 : 0;
  return (
    <Sheet
      key={step}
      title={
        edit
          ? 'Modifier la prestation'
          : panel.data?.duplicate
            ? 'Dupliquer la prestation'
            : 'Nouvelle prestation'
      }
      kicker={mode === 'demo' ? 'STUDIO · ESPACE DÉMO' : 'STUDIO · ESPACE PRIVÉ'}
      footer={
        <View style={S.between}>
          <Button
            title={step ? 'Retour' : 'Annuler'}
            kind="ghost"
            onPress={() => {
              if (step) {
                setStep(step - 1);
                setError('');
              } else close();
            }}
          />
          <Button
            title={
              step < 2
                ? 'Continuer'
                : prep
                  ? 'Enregistrer et préparer le devis'
                  : 'Enregistrer la prestation'
            }
            icon={step < 2 ? 'arrow-forward' : 'checkmark'}
            onPress={next}
            loading={loading}
          />
        </View>
      }
    >
      <View style={[S.row, { gap: 5 }]}>
        {['Client', 'Événement', 'Tarification'].map((v, i) => (
          <View key={v} style={[S.row, { flex: 1, gap: 6 }]}>
            <View
              style={[
                S.center,
                {
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: i <= step ? c.goldSoft : c.card2,
                  borderColor: i === step ? c.gold : c.edge,
                  borderWidth: 1,
                },
              ]}
            >
              {i < step ? (
                <I name="checkmark" size={12} color={c.gold} />
              ) : (
                <T size={10} weight="700" color={i === step ? c.gold : c.faint}>
                  {i + 1}
                </T>
              )}
            </View>
            <T size={11} weight="600" color={i === step ? c.text : c.faint}>
              {v}
            </T>
          </View>
        ))}
      </View>
      <Rule />
      {parsed && step === 0 && (
        <Note icon="sparkles-outline">
          Détecté : {parsed.detected.join(' · ')}. Vérifiez les champs.{' '}
          {!b.date ? 'Date à compléter. ' : ''}
          {!b.fee ? 'Tarif à compléter. ' : ''}
          {!client.address ? 'Adresse du client à compléter avant émission.' : ''}
        </Note>
      )}
      {step === 0 && (
        <>
          {db.clients.length > 0 && !edit && (
            <>
              <LinkText
                title={select ? 'Fermer le carnet' : 'Choisir un client existant'}
                icon={select ? 'chevron-up' : 'people-outline'}
                onPress={() => setSelect(!select)}
              />
              {select && (
                <Card style={{ padding: 12, gap: 8 }}>
                  <Field
                    label="Rechercher dans le carnet"
                    value={clientSearch}
                    onChange={setClientSearch}
                  />
                  {db.clients
                    .filter((x) => normalize(x.name).includes(normalize(clientSearch)))
                    .slice(0, 8)
                    .map((x) => (
                      <P
                        key={x.id}
                        onPress={() => {
                          setClient(clone(x));
                          setSelect(false);
                        }}
                        style={[S.between, { padding: 9 }]}
                      >
                        <T size={13}>{x.name}</T>
                        <I name="arrow-forward" size={14} />
                      </P>
                    ))}
                </Card>
              )}
            </>
          )}
          <ClientFields client={client} onChange={setClient} />
        </>
      )}
      {step === 1 && (
        <>
          <Field
            label="Nom de l’événement"
            required
            value={b.title}
            onChange={(v) => change('title', v)}
            placeholder="Ex. : Soirée du Nouvel An"
          />
          <T size={12} weight="600">
            Type de prestation
          </T>
          <Chips
            values={types}
            value={b.type}
            onChange={(v) =>
              setB((old) => ({ ...old, type: v, title: old.title || v + ' — ' + client.name }))
            }
          />
          <Field
            label="Date de la prestation"
            required
            value={b.date}
            type="date"
            onChange={(v) => {
              change('date', v);
              setAllowConflict(false);
            }}
          />
          <View style={[S.row, { gap: 12 }]}>
            <Field
              style={S.grow}
              label="Heure de début"
              type="time"
              value={b.start}
              onChange={(v) => change('start', v)}
            />
            <Field
              style={S.grow}
              label="Heure de fin"
              type="time"
              value={b.end}
              onChange={(v) => change('end', v)}
            />
          </View>
          <T size={11} color={c.faint}>
            {duration
              ? `Durée : ${Math.floor(duration / 60)} h ${duration % 60 ? String(duration % 60).padStart(2, '0') : ''}`
              : 'Horaires à confirmer : laissez les deux champs vides.'}
          </T>
          <Field
            label="Nom du lieu"
            value={b.venue}
            onChange={(v) => change('venue', v)}
            placeholder="Ex. : Chez Julien"
          />
          <Field
            label="Adresse de l’événement"
            value={b.address}
            onChange={(v) => change('address', v)}
            placeholder="Rue, ville"
          />
          <LinkText
            title="Description et informations techniques"
            icon={technical ? 'chevron-up' : 'chevron-down'}
            onPress={() => setTechnical(!technical)}
          />
          {technical && (
            <>
              <Field
                label="Description de la prestation"
                multiline
                value={b.description}
                onChange={(v) => change('description', v)}
              />
              <Field
                label="Informations techniques"
                multiline
                value={b.technical}
                onChange={(v) => change('technical', v)}
              />
            </>
          )}
          {clash && (
            <>
              <Note error>Conflit de planning : « {clash.title} » est prévu à cette date.</Note>
              <Check
                label="J’ai vérifié le planning et souhaite conserver ce créneau."
                value={allowConflict}
                onChange={setAllowConflict}
              />
            </>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <View style={[S.row, { gap: 12 }]}>
            <Field
              style={{ flex: 1.5 }}
              label="Tarif de la prestation (€)"
              required
              type="decimal"
              value={fee}
              onChange={setFee}
              placeholder="1 000"
            />
            <Field
              style={{ flex: 1 }}
              label="Acompte (%)"
              type="decimal"
              value={rate}
              onChange={setRate}
            />
          </View>
          <View style={{ gap: 9 }}>
            <Check
              label="Déplacements inclus dans le tarif"
              value={!tr}
              onChange={(v) => setTr(!v)}
            />
            {tr && (
              <Field
                label="Supplément de déplacement (€)"
                value={travel}
                type="decimal"
                onChange={setTravel}
              />
            )}
            <Check
              label="Restauration incluse dans le tarif"
              value={!me}
              onChange={(v) => setMe(!v)}
            />
            {me && (
              <Field
                label="Supplément de restauration (€)"
                type="decimal"
                value={meal}
                onChange={setMeal}
              />
            )}
          </View>
          <View style={{ backgroundColor: c.goldSoft, padding: 18, borderRadius: 10, gap: 10 }}>
            <View style={S.between}>
              <Label color={c.gold}>TOTAL DE LA PRESTATION</Label>
              <T size={25} weight="700">
                {money(total(current))}
              </T>
            </View>
            <Rule />
            <View style={S.between}>
              <T size={13} color={c.muted}>
                Acompte · {Number.isFinite(current.rate) ? current.rate : 0} %
              </T>
              <T size={15} weight="600">
                {money(deposit(current) || 0)}
              </T>
            </View>
            <View style={S.between}>
              <T size={13} color={c.muted}>
                Solde contractuel
              </T>
              <T size={15} weight="600">
                {money(total(current) - (deposit(current) || 0))}
              </T>
            </View>
          </View>
          <View style={{ flexDirection: width < 480 ? 'column' : 'row', gap: 12 }}>
            <Field
              style={S.grow}
              label="Échéance de l’acompte"
              type="date"
              value={b.depositDue}
              onChange={(v) => change('depositDue', v)}
            />
            <Field
              style={S.grow}
              label="Échéance du solde"
              type="date"
              value={b.balanceDue}
              onChange={(v) => change('balanceDue', v)}
            />
          </View>
          <Check label="Préparer aussi le devis en brouillon" value={prep} onChange={setPrep} />
          <Note icon="lock-closed-outline">
            {mode === 'demo'
              ? 'Essai conservé dans cet onglet uniquement. Pour vos dossiers réels, ouvrez votre espace privé.'
              : 'Enregistrement local chiffré sur cet appareil.'}{' '}
            Aucun document émis, aucun paiement confirmé.
          </Note>
        </>
      )}
      {error && <Note error>{error}</Note>}
    </Sheet>
  );
}
