import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import { Client, Database, Profile, articleNames, clone, seedDb, today } from '../lib/model';
import { clearDemo, encryptedBackup, eraseVault, openVault } from '../lib/vault';
import { profileValid } from '../lib/operations';
import { exportText } from '../lib/files';
import {
  Button,
  Card,
  Check,
  Chips,
  Field,
  I,
  Label,
  LinkText,
  Mark,
  Note,
  P,
  Rule,
  S,
  Sheet,
  T,
} from '../components/ui';
export function AuthPanel() {
  const { c, exists, authenticate, close } = useStudio();
  const [pwd, setPwd] = useState('');
  const [conf, setConf] = useState('');
  const [activation, setActivation] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState(false);
  const [file, setFile] = useState('');
  const submit = async () => {
    if (!exists && !restore && pwd !== conf) {
      setErr('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!pwd || (!exists && !restore && pwd.length < 10)) {
      setErr('Choisissez un mot de passe d’au moins 10 caractères.');
      return;
    }
    if (restore && !file) {
      setErr('Sélectionnez une sauvegarde chiffrée.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await authenticate(pwd, !exists, restore ? file : undefined, activation);
    } catch (e: any) {
      setErr(e.message || 'Impossible de déverrouiller le coffre.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={
        exists
          ? 'Déverrouiller le studio'
          : restore
            ? 'Restaurer votre studio'
            : 'Votre espace privé'
      }
      kicker="MATT MEZ STUDIO · ACCÈS SÉCURISÉ"
      footer={
        <Button
          title={
            exists
              ? 'Déverrouiller mon espace'
              : restore
                ? 'Restaurer le coffre'
                : 'Créer mon coffre privé'
          }
          icon="lock-closed-outline"
          loading={busy}
          onPress={submit}
        />
      }
    >
      <View style={[S.row, { gap: 13 }]}>
        <View
          style={[
            S.center,
            { height: 48, width: 48, borderRadius: 12, backgroundColor: c.goldSoft },
          ]}
        >
          <I name="shield-checkmark-outline" size={24} color={c.gold} />
        </View>
        <View style={S.grow}>
          <T size={15} weight="700">
            {exists ? 'Bienvenue dans votre studio.' : 'Vos prestations vous appartiennent.'}
          </T>
          <T size={12} color={c.muted}>
            Un coffre chiffré, uniquement sur cet appareil.
          </T>
        </View>
      </View>
      <T size={13} color={c.muted}>
        {exists
          ? 'Saisissez votre mot de passe pour accéder à vos clients, documents et règlements.'
          : restore
            ? 'Importez votre sauvegarde et saisissez son mot de passe d’origine.'
            : 'Activez votre studio personnel avec le code privé fourni à la livraison. Vos coordonnées et l’exemple Chez Julien seront préremplis, sans facture ni paiement.'}
      </T>
      {restore &&
        (Platform.OS === 'web' ? (
          React.createElement('input', {
            'aria-label': 'Sauvegarde chiffrée',
            type: 'file',
            accept: '.json,.mmstudio',
            style: { color: c.text, fontSize: 12 },
            onChange: async (e: any) => {
              const f = e.target.files?.[0];
              if (f && f.size < 32000000) setFile(await f.text());
              else setErr('Fichier absent ou trop volumineux.');
            },
          })
        ) : (
          <Field
            label="Contenu de la sauvegarde chiffrée"
            multiline
            value={file}
            onChange={setFile}
          />
        ))}
      {!exists && !restore && (
        <Field
          label="Code d’initialisation du studio"
          secure
          value={activation}
          onChange={setActivation}
          placeholder="Code privé fourni à la livraison"
        />
      )}
      <Field
        label={exists || restore ? 'Mot de passe' : 'Créer un mot de passe'}
        value={pwd}
        onChange={setPwd}
        secure
        placeholder={exists ? 'Votre mot de passe' : '10 caractères minimum'}
      />
      {!exists && !restore && (
        <Field label="Confirmer le mot de passe" secure value={conf} onChange={setConf} />
      )}
      <Note icon="key-outline">
        {exists
          ? 'Le coffre se verrouille au rechargement et après 15 minutes d’inactivité sur le web.'
          : 'Le mot de passe ne peut pas être réinitialisé. Exportez régulièrement une sauvegarde chiffrée : effacer les données du navigateur efface aussi le coffre local.'}
      </Note>
      {err && <Note error>{err}</Note>}
      <View style={[S.between, { flexWrap: 'wrap' }]}>
        <LinkText title="Revenir à la démonstration" onPress={close} />
        {!exists && (
          <LinkText
            title={restore ? 'Créer un nouveau coffre' : 'Restaurer une sauvegarde'}
            onPress={() => {
              setRestore(!restore);
              setErr('');
            }}
            icon="archive-outline"
          />
        )}
      </View>
    </Sheet>
  );
}
export function ProfilePanel() {
  const { db, c, commit, close, mode, notify } = useStudio();
  const [p, setP] = useState<Profile>(() => clone(db.profile));
  const [tab, setTab] = useState('Identité');
  const [approved, setApproved] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const bankChange = ['bank', 'iban', 'bic', 'holder'].some(
    (k) => p[k as keyof Profile] !== db.profile[k as keyof Profile],
  );
  const set = (k: keyof Profile, v: string) => {
    setP((a) => ({ ...a, [k]: v }));
    if (['iban', 'bic', 'bank', 'holder'].includes(k)) setApproved(false);
  };
  const save = async () => {
    setBusy(true);
    try {
      profileValid(p, mode === 'demo');
      if (bankChange && !approved)
        throw new Error('Confirmez explicitement la modification des coordonnées bancaires.');
      await commit((d) => {
        d.profile = clone(p);
      });
      close();
      notify('Informations du prestataire enregistrées.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const field = (key: keyof Profile, label: string, multi = false) => (
    <Field key={key} label={label} value={p[key]} onChange={(v) => set(key, v)} multiline={multi} />
  );
  return (
    <Sheet
      title="Profil du prestataire"
      kicker="IDENTITÉ DU STUDIO"
      footer={
        <Button
          title="Enregistrer les informations"
          icon="checkmark"
          loading={busy}
          onPress={save}
        />
      }
    >
      <Chips values={['Identité', 'Banque', 'Mentions légales']} value={tab} onChange={setTab} />
      {tab === 'Identité' && (
        <>
          {field('name', 'Nom professionnel')}
          {field('legal', 'Forme / qualité juridique')}
          {field('address', 'Adresse professionnelle', true)}
          {field('email', 'Adresse e-mail')}
          {field('siret', 'SIRET')}
        </>
      )}
      {tab === 'Banque' && mode === 'demo' && (
        <Note icon="lock-closed-outline">
          Les coordonnées bancaires de Matthieu sont chiffrées et ne sont visibles que dans son
          coffre privé. Aucun compte bancaire n’est associé à la démonstration.
        </Note>
      )}
      {tab === 'Banque' && mode === 'private' && (
        <>
          <Note icon="shield-checkmark-outline">
            Les coordonnées du bénéficiaire ne changent jamais automatiquement. Toute modification
            nécessite votre confirmation.
          </Note>
          {field('holder', 'Bénéficiaire bancaire')}
          {field('bank', 'Établissement bancaire')}
          {field('iban', 'IBAN')}
          {field('bic', 'BIC')}
          {bankChange && (
            <Check
              value={approved}
              onChange={setApproved}
              label="Je confirme avoir vérifié le bénéficiaire et l’IBAN saisis."
            />
          )}
        </>
      )}
      {tab === 'Mentions légales' && (
        <>
          {field('vat', 'Mention de franchise de TVA', true)}
          {field('registry', 'Immatriculation et mentions complémentaires', true)}
          {field('mediator', 'Médiateur de la consommation : nom, adresse et site', true)}
          <Note>
            Vérifiez votre statut, votre régime de TVA et les obligations applicables à votre
            activité artistique avant émission. Aucun modèle n’est présenté comme juridiquement
            validé.
          </Note>
        </>
      )}
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function ClausesPanel() {
  const { db, c, commit, notify, close } = useStudio();
  const [all, setAll] = useState(() => clone(db.clauses));
  const [kind, setKind] = useState<Client['kind']>('Professionnel');
  const [active, setActive] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      if (Object.values(all).some((a) => a.some((v) => !v.trim())))
        throw new Error('Chaque article doit comporter un texte.');
      await commit((d) => {
        d.clauses = clone(all);
      });
      close();
      notify('Les deux modèles de contrat sont enregistrés.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title="Conditions contractuelles"
      kicker="ÉDITEUR DE CONTRAT"
      footer={
        <Button title="Enregistrer les modèles" icon="checkmark" loading={busy} onPress={save} />
      }
    >
      <Chips
        values={['Professionnel', 'Particulier']}
        value={kind}
        onChange={(v) => setKind(v as Client['kind'])}
      />
      <Note>
        Modèle à adapter à chaque situation, notamment pour l’annulation et les droits du
        consommateur. Les contrats déjà émis restent inchangés.
      </Note>
      {articleNames.map((name, i) => (
        <Card key={name} style={{ padding: 13, gap: active === i ? 10 : 0 }}>
          <P onPress={() => setActive(active === i ? -1 : i)} style={S.between}>
            <View style={S.grow}>
              <Label color={c.gold}>ARTICLE {String(i + 1).padStart(2, '0')}</Label>
              <T size={13} weight="700">
                {name}
              </T>
            </View>
            <I name={active === i ? 'chevron-up' : 'chevron-down'} size={14} />
          </P>
          {active === i && (
            <Field
              label="Texte de l’article"
              value={all[kind][i]}
              multiline
              onChange={(v) =>
                setAll((old) => ({ ...old, [kind]: old[kind].map((s, j) => (j === i ? v : s)) }))
              }
            />
          )}
        </Card>
      ))}
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function SequencePanel() {
  const { db, commit, close, notify } = useStudio();
  const [q, setQ] = useState(String(db.sequence.quote));
  const [f, setF] = useState(String(db.sequence.invoice));
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      if (!/^\d{1,8}$/.test(q) || !/^\d{1,8}$/.test(f) || +q < 1 || +f < 1)
        throw new Error('Utilisez des entiers positifs (8 chiffres maximum).');
      await commit((d) => {
        if (+q < d.sequence.quote || +f < d.sequence.invoice)
          throw new Error('La séquence ne peut pas revenir en arrière.');
        if (
          d.docs.some((x) => x.number && !x.demo) &&
          (+q !== d.sequence.quote || +f !== d.sequence.invoice)
        )
          throw new Error('La numérotation est verrouillée après la première émission officielle.');
        d.sequence.quote = +q;
        d.sequence.invoice = +f;
      });
      close();
      notify('Séquences enregistrées.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title="Numérotation"
      kicker="SÉQUENCES CHRONOLOGIQUES"
      footer={
        <Button title="Confirmer les séquences" disabled={!ok} loading={busy} onPress={save} />
      }
    >
      <Note>
        Reprenez les numéros de votre activité avant la première émission. Les brouillons ne
        consomment aucun numéro. Factures et avoirs partagent une séquence continue.
      </Note>
      <Field
        label="Prochain numéro de devis"
        type="number"
        value={q}
        onChange={(v) => {
          setQ(v);
          setOk(false);
        }}
        hint={'DEV-' + today().slice(0, 4) + '-' + q.padStart(4, '0')}
      />
      <Field
        label="Prochain numéro de facture"
        type="number"
        value={f}
        onChange={(v) => {
          setF(v);
          setOk(false);
        }}
        hint={'FAC-' + today().slice(0, 4) + '-' + f.padStart(4, '0')}
      />
      <Check
        value={ok}
        onChange={setOk}
        label="J’ai vérifié la continuité avec mes derniers documents émis."
      />
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function DataPanel() {
  const { db, c, mode, commit, notify, close, lock, refreshExists, open } = useStudio();
  const [plain, setPlain] = useState(false);
  const [del, setDel] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState(false);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Données et sauvegardes" kicker="VOTRE COFFRE">
      <View style={[S.row, { gap: 12 }]}>
        <I name="server-outline" color={c.gold} size={25} />
        <View>
          <T size={15} weight="700">
            {mode === 'demo' ? 'Session de démonstration' : 'Stockage privé local'}
          </T>
          <T size={11} color={c.muted}>
            {db.clients.length} clients · {db.bookings.length} prestations · {db.docs.length}{' '}
            documents
          </T>
        </View>
      </View>
      <Note>
        {mode === 'demo'
          ? 'La démonstration est conservée dans cet onglet. N’y saisissez pas de données confidentielles.'
          : 'Vos données sont chiffrées par AES-256-GCM, avec une clé dérivée du mot de passe (PBKDF2, 600 000 itérations). Aucun envoi vers un serveur, aucune synchronisation entre appareils.'}
      </Note>
      {mode === 'private' && (
        <Button
          title="Exporter la sauvegarde chiffrée"
          icon="shield-checkmark-outline"
          onPress={() =>
            run(async () => {
              await exportText(await encryptedBackup(), 'Matt-Mez-coffre-' + today() + '.mmstudio');
              setBackup(true);
              notify('Sauvegarde chiffrée exportée.');
            })
          }
          loading={busy}
        />
      )}
      <LinkText
        title="Exporter les données en JSON"
        icon="download-outline"
        onPress={() => setPlain(!plain)}
      />
      {plain && (
        <>
          <Note>
            Le fichier JSON contient les données personnelles et bancaires en clair. Conservez-le
            dans un emplacement sécurisé.
          </Note>
          <Button
            title="Confirmer l’export non chiffré"
            kind="secondary"
            loading={busy}
            onPress={() =>
              run(async () => {
                await exportText(
                  JSON.stringify(db, null, 2),
                  'Matt-Mez-donnees-' + today() + '.json',
                );
                setPlain(false);
                notify('Export JSON téléchargé.');
              })
            }
          />
        </>
      )}
      <Rule />
      <Label>GESTION DES DONNÉES</Label>
      {mode === 'private' && db.docs.some((x) => x.number) && (
        <Note>
          Les pièces émises doivent être archivées selon les durées légales applicables. La
          suppression d’un coffre n’annule pas ces obligations.
        </Note>
      )}
      <LinkText
        title={
          mode === 'demo' ? 'Réinitialiser la démonstration' : 'Supprimer le coffre de cet appareil'
        }
        color={c.danger}
        icon="trash-outline"
        onPress={() => setDel(!del)}
      />
      {del && (
        <>
          <Note error>
            Cette opération est irréversible.{' '}
            {mode === 'private'
              ? 'Exportez d’abord votre sauvegarde chiffrée et vérifiez votre archivage.'
              : 'Vos essais seront remplacés par les données de démonstration initiales.'}
          </Note>
          <Field label="Saisissez SUPPRIMER" value={phrase} onChange={setPhrase} />
          {mode === 'private' && (
            <Field label="Mot de passe du coffre" value={pwd} onChange={setPwd} secure />
          )}
          <Button
            title="Confirmer la suppression"
            kind="danger"
            disabled={phrase !== 'SUPPRIMER' || (mode === 'private' && (!pwd || !backup))}
            loading={busy}
            onPress={() =>
              run(async () => {
                if (mode === 'private') {
                  const test = await openVault(pwd);
                  test.key.bytes.fill(0);
                  await eraseVault();
                  await refreshExists();
                  lock();
                } else {
                  clearDemo();
                  await commit((d) => Object.assign(d, seedDb()));
                  close();
                }
                notify('Données effacées.');
              })
            }
          />
        </>
      )}
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
export function Appearance({ panel }: { panel: Panel }) {
  const { theme, setTheme, c } = useStudio();
  const [installed, setInstalled] = useState(false);
  if (panel.data?.install)
    return (
      <Sheet title="Installer le studio" kicker="ACCÈS RAPIDE">
        <View style={[S.row, { gap: 14 }]}>
          <Mark size={49} />
          <View>
            <T size={17} weight="700">
              Matt Mez Studio
            </T>
            <T size={12} color={c.muted}>
              Votre studio sur l’écran d’accueil.
            </T>
          </View>
        </View>
        {Platform.OS === 'web' && (window as any).__mmInstall ? (
          <Button
            title="Installer l’application"
            icon="download-outline"
            onPress={async () => {
              const evt = (window as any).__mmInstall;
              if (evt) {
                await evt.prompt();
                const res = await evt.userChoice;
                setInstalled(res.outcome === 'accepted');
                (window as any).__mmInstall = null;
              }
            }}
          />
        ) : null}
        {installed && <Note>Installation acceptée par votre navigateur.</Note>}
        <T size={14} weight="700">
          Sur iPhone ou iPad
        </T>
        <T size={13} color={c.muted}>
          Dans Safari, touchez Partager, puis « Sur l’écran d’accueil » et confirmez avec « Ajouter
          ».
        </T>
        <T size={14} weight="700">
          Sur ordinateur ou Android
        </T>
        <T size={13} color={c.muted}>
          Dans le menu de votre navigateur, choisissez « Installer l’application » ou « Ajouter à
          l’écran d’accueil », si cette option est proposée.
        </T>
        <Note>
          Le studio fonctionne hors ligne après un premier chargement complet. Exportez votre coffre
          avant de changer de navigateur ou d’appareil.
        </Note>
      </Sheet>
    );
  return (
    <Sheet title="Apparence" kicker="PRÉFÉRENCES">
      <T size={13} color={c.muted}>
        Choisissez l’ambiance de votre espace.
      </T>
      {[
        ['sombre', 'moon-outline', 'Mode sombre'],
        ['clair', 'sunny-outline', 'Mode clair'],
        ['systeme', 'contrast-outline', 'Suivre mon appareil'],
      ].map(([id, icon, title]) => (
        <P
          key={id}
          onPress={() => setTheme(id)}
          style={[
            S.row,
            {
              padding: 15,
              gap: 13,
              borderWidth: 1,
              borderColor: theme === id ? c.gold : c.edge,
              backgroundColor: theme === id ? c.goldSoft : c.input,
              borderRadius: 9,
            },
          ]}
        >
          <I name={icon as any} color={c.gold} />
          <T style={S.grow} weight="600">
            {title}
          </T>
          {theme === id && <I name="checkmark" color={c.gold} />}
        </P>
      ))}
    </Sheet>
  );
}
