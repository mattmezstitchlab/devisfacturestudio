import {
  Booking,
  Client,
  Database,
  DocKind,
  Profile,
  StudioDoc,
  clone,
  deposit,
  makeDoc,
  newId,
  received,
  today,
  total,
  validDate,
} from './model';
export const log = (b: Booking, text: string) =>
  b.history.unshift({ at: new Date().toISOString(), text });
export function prepareDocument(
  d: Database,
  id: string,
  kind: DocKind,
  demo: boolean,
  duplicate = false,
) {
  const b = d.bookings.find((v) => v.id === id)!;
  const existing =
    !duplicate &&
    d.docs.find((x) => x.bookingId === id && x.kind === kind && x.status === 'Brouillon');
  if (existing) {
    Object.assign(existing, makeDoc(d, b, kind, demo), { id: existing.id });
    return existing.id;
  }
  const doc = makeDoc(d, b, kind, demo);
  d.docs.unshift(doc);
  log(b, `${kind} préparé en brouillon.`);
  return doc.id;
}
export function validateIssue(doc: StudioDoc) {
  const { client, booking: b, profile: p } = doc.snapshot;
  if (!client.name.trim() || !client.address.trim())
    throw new Error('Complétez l’adresse du client dans la fiche avant l’émission.');
  if (!b.date || !validDate(b.date) || !b.venue.trim() || !b.address.trim())
    throw new Error('La date, le lieu et l’adresse de la prestation sont nécessaires.');
  if (!p.name || !p.address || p.siret.replace(/\s/g, '').length !== 14 || !p.legal)
    throw new Error('Vérifiez l’identité professionnelle dans les réglages.');
  if (!doc.demo && client.kind === 'Particulier' && doc.kind === 'Contrat' && !p.mediator.trim())
    throw new Error('Renseignez votre médiateur de la consommation dans les réglages.');
  if (doc.amount === 0) throw new Error('Aucun montant à émettre pour ce document.');
}
export function issueDocument(d: Database, id: string) {
  const doc = d.docs.find((v) => v.id === id)!;
  if (doc.status !== 'Brouillon' || doc.number) throw new Error('Ce document est déjà émis.');
  const b = d.bookings.find((v) => v.id === doc.bookingId)!;
  if (b.sample)
    throw new Error('L’exemple Chez Julien reste un brouillon. Dupliquez la prestation.');
  if (doc.kind !== 'Avoir' && makeDoc(d, b, doc.kind, doc.demo).amount !== doc.amount)
    throw new Error('Le montant facturable a changé. Actualisez le brouillon puis relisez-le.');
  validateIssue(doc);
  if (d.lastIssue > today()) throw new Error('La date de l’appareil précède la dernière émission.');
  if (
    doc.kind === 'Facture d’acompte' &&
    d.docs.some(
      (v) =>
        v.bookingId === b.id &&
        v.kind === doc.kind &&
        v.number &&
        !d.docs.some((a) => a.kind === 'Avoir' && a.original === v.number && a.number),
    )
  )
    throw new Error('Une facture d’acompte existe déjà. Un avoir est nécessaire pour la corriger.');
  if (
    doc.kind === 'Avoir' &&
    d.docs.some((v) => v.kind === 'Avoir' && v.original === doc.original && v.number)
  )
    throw new Error('Cette facture a déjà fait l’objet d’un avoir.');
  const key =
    doc.kind === 'Devis'
      ? 'quote'
      : doc.kind === 'Contrat'
        ? 'contract'
        : doc.kind === 'Récapitulatif'
          ? 'summary'
          : 'invoice';
  const prefix = { quote: 'DEV', contract: 'CTR', summary: 'REC', invoice: 'FAC' }[key];
  const num = d.sequence[key]++;
  doc.number =
    (doc.demo ? 'DÉMO-' : '') +
    prefix +
    '-' +
    today().slice(0, 4) +
    '-' +
    String(num).padStart(4, '0');
  doc.issued = today();
  doc.date = today();
  doc.status = 'Émis';
  d.lastIssue = today();
  log(b, `${doc.kind} ${doc.number} émis et figé.`);
}
export function addPayment(
  d: Database,
  bid: string,
  amount: number,
  date: string,
  method: string,
  note: string,
  targetId?: string,
) {
  const b = d.bookings.find((v) => v.id === bid)!;
  if (b.sample) throw new Error('Aucun encaissement sur cet exemple.');
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > total(b) - received(d, bid))
    throw new Error('Le montant doit être positif et ne pas dépasser le restant dû.');
  if (!validDate(date) || date > today())
    throw new Error('Choisissez une date d’encaissement passée ou actuelle.');
  const target = targetId ? d.docs.find((x) => x.id === targetId) : null;
  const allocated = targetId
    ? d.payments.filter((p) => p.docId === targetId).reduce((s, p) => s + p.amount, 0)
    : 0;
  if (
    targetId &&
    (!target ||
      !target.number ||
      !target.kind.startsWith('Facture') ||
      target.bookingId !== bid ||
      target.status === 'Payé' ||
      amount > target.amount - allocated ||
      d.docs.some((v) => v.kind === 'Avoir' && v.original === target.number && v.number))
  )
    throw new Error('Cette facture est déjà réglée, créditée ou le montant dépasse son solde.');
  d.payments.push({
    id: newId(),
    bookingId: bid,
    amount,
    date,
    method,
    note,
    ...(targetId ? { docId: targetId } : {}),
  });
  if (target && amount + allocated === target.amount) target.status = 'Payé';
  log(
    b,
    'Encaissement confirmé manuellement : ' +
      (amount / 100).toLocaleString('fr-FR') +
      ' € par ' +
      method.toLowerCase() +
      '.',
  );
}
export function saveBooking(d: Database, c: Client, b: Booking, editing: boolean) {
  if (
    !c.name.trim() ||
    !b.title.trim() ||
    !validDate(b.date) ||
    !Number.isSafeInteger(total(b)) ||
    total(b) <= 0 ||
    b.rate < 0 ||
    b.rate > 100
  )
    throw new Error('Vérifiez les informations de la prestation.');
  if (received(d, b.id) > total(b))
    throw new Error('Le prix ne peut pas être inférieur aux règlements déjà reçus.');
  const billed = d.docs
    .filter(
      (x) =>
        x.bookingId === b.id && x.number && (x.kind.startsWith('Facture') || x.kind === 'Avoir'),
    )
    .reduce((s, v) => s + v.amount, 0);
  if (billed > total(b))
    throw new Error(
      'Le nouveau prix est inférieur au montant facturé. Préparez un avoir avant cette correction.',
    );
  const ci = d.clients.findIndex((v) => v.id === c.id);
  if (ci < 0) d.clients.push(clone(c));
  else d.clients[ci] = clone(c);
  const bi = d.bookings.findIndex((v) => v.id === b.id);
  const copy = clone(b);
  if (bi >= 0) copy.history = clone(d.bookings[bi].history);
  copy.clientId = c.id;
  log(
    copy,
    editing ? 'Informations de la prestation modifiées.' : 'Prestation créée en brouillon.',
  );
  if (bi < 0) d.bookings.unshift(copy);
  else d.bookings[bi] = copy;
  d.docs.forEach((doc, index) => {
    if (doc.bookingId === b.id && doc.status === 'Brouillon' && doc.kind !== 'Avoir')
      d.docs[index] = { ...makeDoc(d, copy, doc.kind, doc.demo), id: doc.id };
  });
}
export function makeCredit(d: Database, original: StudioDoc, reason: string) {
  if (!reason.trim()) throw new Error('Précisez le motif de la correction.');
  if (!original.number || !original.kind.startsWith('Facture'))
    throw new Error('Seule une facture émise peut faire l’objet d’un avoir.');
  const prior = d.docs.find((x) => x.kind === 'Avoir' && x.original === original.number);
  if (prior) return prior.id;
  const a: StudioDoc = {
    ...clone(original),
    id: newId(),
    kind: 'Avoir',
    status: 'Brouillon',
    number: '',
    issued: '',
    date: today(),
    amount: -original.amount,
    original: original.number,
    reason,
  };
  d.docs.push(a);
  return a.id;
}
export function profileValid(p: Profile, demo = false) {
  if (
    !p.name.trim() ||
    !p.legal.trim() ||
    !p.address.trim() ||
    !p.email.includes('@') ||
    !/^\d{14}$/.test(p.siret.replace(/\s/g, ''))
  )
    throw new Error('Vérifiez le nom, le statut, l’adresse, l’e-mail et le SIRET (14 chiffres).');
  if (demo) return;
  if (
    !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(p.iban.replace(/\s/g, '')) ||
    !/^([A-Z0-9]{8}|[A-Z0-9]{11})$/.test(p.bic)
  )
    throw new Error('Le format de l’IBAN ou du BIC est incorrect.');
}
