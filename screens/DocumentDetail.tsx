import React, { useState } from 'react';
import { View } from 'react-native';
import { Panel, useStudio } from '../lib/studio';
import { DocStatus, clone, dateFmt, deposit, money, received, total, makeDoc } from '../lib/model';
import { issueDocument, log, makeCredit, prepareDocument } from '../lib/operations';
import { downloadPDF, previewPDF, printPDF } from '../lib/files';
import {
  Badge,
  Button,
  Card,
  Check,
  Field,
  I,
  Label,
  LinkText,
  Note,
  Rule,
  S,
  Sheet,
  T,
} from '../components/ui';
export default function DocumentDetail({ panel }: { panel: Panel }) {
  const { db, c, open, commit, notify, replace, mode } = useStudio();
  const d = db.docs.find((v) => v.id === panel.id);
  const [issue, setIssue] = useState(false);
  const [checked, setChecked] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [credit, setCredit] = useState(false);
  const [reason, setReason] = useState('');
  if (!d)
    return (
      <Sheet title="Document introuvable">
        <Note>Ce document n’est plus présent dans le dossier.</Note>
      </Sheet>
    );
  const b = d.snapshot.booking,
    cl = d.snapshot.client;
  const official = !!d.number;
  const invoice = d.kind.startsWith('Facture');
  const credited =
    !!d.number && db.docs.some((v) => v.kind === 'Avoir' && v.original === d.number && v.number);
  const unallocated =
    d.amount - db.payments.filter((v) => v.docId === d.id).reduce((s, p) => s + p.amount, 0);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e: any) {
      setErr(e.message || 'Impossible de terminer cette action.');
    } finally {
      setBusy(false);
    }
  };
  const status = (s: DocStatus) =>
    open({
      kind: 'confirm',
      data: {
        title:
          s === 'Accepté'
            ? 'Confirmer l’acceptation ?'
            : s === 'Annulé'
              ? 'Annuler ce document ?'
              : 'Confirmer l’envoi ?',
        body:
          s === 'Envoyé'
            ? 'Marquez ce document comme envoyé uniquement si vous l’avez effectivement transmis. Aucun e-mail ne partira de l’application.'
            : s === 'Accepté'
              ? 'Cette action consigne une acceptation obtenue auprès du client. Elle ne crée pas de signature électronique.'
              : 'Le document sera conservé dans l’historique.',
        action: 'Confirmer',
        keep: true,
        run: async () => {
          await commit((db) => {
            const doc = db.docs.find((x) => x.id === d.id)!;
            doc.status = s;
            const ev = db.bookings.find((v) => v.id === b.id)!;
            log(ev, `${doc.kind} ${doc.number} : ${s.toLowerCase()} (confirmation manuelle).`);
          });
          notify('Statut mis à jour.');
        },
      },
    });
  return (
    <Sheet title={d.kind} kicker="ATELIER DOCUMENTAIRE" wide>
      <View style={S.between}>
        <Badge text={d.status} />
        <T size={11} color={c.faint}>
          {d.demo ? 'Démonstration · ' : ''}A4 · PDF
        </T>
      </View>
      <View
        style={{
          backgroundColor: '#f2efe8',
          borderRadius: 8,
          overflow: 'hidden',
          padding: 23,
          borderTopWidth: 3,
          borderTopColor: '#b99c69',
        }}
      >
        <View style={S.between}>
          <View>
            <T color="#292925" size={16} weight="800" style={{ letterSpacing: 2.2 }}>
              MATT MEZ
            </T>
            <T color="#92784f" size={8} weight="700" style={{ letterSpacing: 4 }}>
              STUDIO
            </T>
          </View>
          <T color="#817766" size={10}>
            {dateFmt(d.date)}
          </T>
        </View>
        <View style={{ height: 1, backgroundColor: '#d7d0c3', marginVertical: 15 }} />
        <T color="#292925" size={24} weight="600" style={{ letterSpacing: -1 }}>
          {d.kind}
        </T>
        <T color="#817766" size={10.5}>
          {d.number || 'BROUILLON · SANS NUMÉRO DÉFINITIF'}
        </T>
        <View style={[S.between, { alignItems: 'flex-end', marginTop: 15, gap: 8 }]}>
          <View style={S.grow}>
            <T color="#837b6f" size={9}>
              CLIENT
            </T>
            <T color="#252521" size={14} weight="700">
              {cl.name}
            </T>
            <T color="#6b675f" size={11}>
              {b.title}
            </T>
            <T color="#6b675f" size={11}>
              {dateFmt(b.date)}
            </T>
          </View>
          <T color="#272721" size={25} weight="600" style={{ letterSpacing: -1 }}>
            {money(d.amount)}
          </T>
        </View>
      </View>
      <View style={[S.wrap, { gap: 8 }]}>
        <Button
          title="Télécharger le PDF"
          icon="download-outline"
          small
          disabled={busy}
          onPress={() => run(() => downloadPDF(d))}
        />
        <Button
          title="Aperçu A4"
          icon="eye-outline"
          kind="secondary"
          small
          disabled={busy}
          onPress={() => run(() => previewPDF(d))}
        />
        <Button
          title="Imprimer"
          icon="print-outline"
          kind="secondary"
          small
          onPress={() => run(() => printPDF(d))}
        />
        <Button
          title="Préparer l’e-mail"
          icon="mail-outline"
          small
          kind="secondary"
          onPress={() => open({ kind: 'email', id: d.id })}
        />
      </View>
      {official ? (
        <>
          <Note icon="lock-closed-outline">
            Le numéro et le contenu sont figés depuis le {dateFmt(d.issued)}. Les modifications du
            dossier ne changent pas ce document.
          </Note>
          <View style={[S.wrap, { gap: 8 }]}>
            {d.status === 'Émis' && (
              <Button
                small
                title="Marquer envoyé"
                kind="secondary"
                icon="paper-plane-outline"
                onPress={() => status('Envoyé')}
              />
            )}
            {['Devis', 'Contrat'].includes(d.kind) && ['Émis', 'Envoyé'].includes(d.status) && (
              <>
                <Button
                  small
                  title="Confirmer l’acceptation"
                  kind="secondary"
                  onPress={() => status('Accepté')}
                />
                <Button
                  small
                  title="Annuler le document"
                  kind="ghost"
                  onPress={() => status('Annulé')}
                />
              </>
            )}
            {invoice && credited && <Badge text="Facture créditée par avoir" />}
            {invoice && !credited && d.status !== 'Payé' && (
              <Button
                small
                title="Confirmer le paiement"
                icon="wallet-outline"
                kind="secondary"
                onPress={() =>
                  open({ kind: 'payment', id: b.id, data: { amount: unallocated, docId: d.id } })
                }
              />
            )}
            {invoice && (
              <Button
                small
                title="Préparer un avoir"
                kind="secondary"
                onPress={() => setCredit(!credit)}
              />
            )}
          </View>
        </>
      ) : (
        <>
          <Note icon="document-text-outline">
            {b.sample
              ? 'Exemple protégé : téléchargez le brouillon ou dupliquez la prestation. Aucune émission officielle n’est possible.'
              : 'Ce brouillon est téléchargeable. Un numéro définitif sera attribué uniquement après votre validation.'}
          </Note>
          {!b.sample && !issue && (
            <Button
              title={
                mode === 'demo'
                  ? 'Valider l’émission de démonstration'
                  : 'Vérifier et émettre le document'
              }
              kind="secondary"
              icon="checkmark-done-outline"
              onPress={() => setIssue(true)}
            />
          )}
          {issue && (
            <Card style={{ padding: 16, gap: 13 }}>
              <T size={15} weight="700">
                Dernière vérification
              </T>
              <T size={12} color={c.muted}>
                L’identité des parties, le prix, les échéances et les clauses doivent être vérifiés.
                Ce modèle ne constitue pas un avis juridique. La facturation électronique
                réglementaire via une plateforme agréée n’est pas intégrée.
              </T>
              <Check
                value={checked}
                onChange={setChecked}
                label={
                  'J’ai relu le PDF et je confirme l’émission de ce document' +
                  (d.demo ? ' de démonstration.' : '.')
                }
              />
              <Button
                title={d.demo ? 'Émettre l’exemple numéroté' : 'Confirmer l’émission définitive'}
                disabled={!checked}
                loading={busy}
                onPress={() =>
                  run(async () => {
                    await commit((db) => issueDocument(db, d.id));
                    setIssue(false);
                    notify('Document émis et contenu figé.');
                  })
                }
              />
            </Card>
          )}
        </>
      )}
      {credit && (
        <Card style={{ padding: 15, gap: 12 }}>
          <Field
            label="Motif de l’avoir intégral"
            value={reason}
            onChange={setReason}
            placeholder="Précisez l’erreur ou l’annulation"
          />
          <T size={11} color={c.muted}>
            L’avoir référencera la facture d’origine sans la modifier. Aucun remboursement bancaire
            ne sera déclenché.
          </T>
          <Button
            title="Préparer l’avoir en brouillon"
            small
            disabled={!reason.trim()}
            onPress={() =>
              run(async () => {
                let id = '';
                await commit((db) => {
                  id = makeCredit(db, d, reason);
                });
                replace({ kind: 'document', id });
              })
            }
          />
        </Card>
      )}
      <Rule />
      <View style={[S.wrap, { gap: 14 }]}>
        <LinkText
          title="Ouvrir la prestation"
          onPress={() => open({ kind: 'booking', id: b.id })}
        />
        {!official && d.kind !== 'Avoir' && (
          <LinkText
            title="Actualiser le brouillon"
            icon="refresh-outline"
            onPress={() =>
              run(async () => {
                await commit((base) => {
                  const i = base.docs.findIndex((x) => x.id === d.id);
                  if (base.docs[i].number) throw new Error('Ce document est déjà émis.');
                  const ev = base.bookings.find((x) => x.id === d.bookingId)!;
                  base.docs[i] = { ...makeDoc(base, ev, d.kind, d.demo), id: d.id };
                });
                setChecked(false);
                setIssue(false);
                notify('Brouillon actualisé depuis la fiche.');
              })
            }
          />
        )}
        {d.kind !== 'Avoir' && (
          <LinkText
            title="Dupliquer en brouillon"
            icon="copy-outline"
            onPress={() =>
              run(async () => {
                let id = '';
                await commit((db) => {
                  id = prepareDocument(db, b.id, d.kind, mode === 'demo', true);
                });
                replace({ kind: 'document', id });
              })
            }
          />
        )}
      </View>
      {err && <Note error>{err}</Note>}
    </Sheet>
  );
}
