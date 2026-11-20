export type Client = {
  id: string;
  name: string;
  kind: 'Professionnel' | 'Particulier';
  address: string;
  email: string;
  phone: string;
  contact: string;
  notes: string;
  siren: string;
};
export type Booking = {
  id: string;
  clientId: string;
  title: string;
  type: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  address: string;
  description: string;
  technical: string;
  fee: number;
  travel: number;
  meal: number;
  rate: number;
  depositDue: string;
  balanceDue: string;
  stage: number;
  sample: boolean;
  created: string;
  history: { at: string; text: string }[];
};
export type Profile = {
  name: string;
  legal: string;
  address: string;
  email: string;
  siret: string;
  vat: string;
  bank: string;
  holder: string;
  iban: string;
  bic: string;
  mediator: string;
  registry: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  date: string;
  method: string;
  note: string;
  docId?: string;
};
export type DocKind =
  | 'Devis'
  | 'Contrat'
  | 'Facture d’acompte'
  | 'Facture de solde'
  | 'Récapitulatif'
  | 'Avoir';
export type DocStatus = 'Brouillon' | 'Émis' | 'Envoyé' | 'Accepté' | 'Payé' | 'Annulé';
export type StudioDoc = {
  id: string;
  bookingId: string;
  kind: DocKind;
  status: DocStatus;
  number: string;
  date: string;
  issued: string;
  snapshot: {
    client: Client;
    booking: Booking;
    profile: Profile;
    articles: string[];
    payments: Payment[];
    references?: { number: string; kind: DocKind; amount: number; date: string }[];
  };
  amount: number;
  demo: boolean;
  original?: string;
  reason?: string;
};
export type Database = {
  version: 1;
  revision: number;
  clients: Client[];
  bookings: Booking[];
  docs: StudioDoc[];
  payments: Payment[];
  profile: Profile;
  clauses: Record<Client['kind'], string[]>;
  sequence: { quote: number; invoice: number; contract: number; summary: number };
  lastIssue: string;
};
export const stages = [
  'Demande',
  'Devis',
  'Acceptation',
  'Acompte',
  'Prestation',
  'Solde',
  'Terminé',
];
export const types = [
  'Mariage',
  'Anniversaire',
  'Entreprise',
  'Restaurant',
  'Soirée privée',
  'Cérémonie',
  'Nouvel An',
  'Autre',
];
export const docKinds: DocKind[] = [
  'Devis',
  'Contrat',
  'Facture d’acompte',
  'Facture de solde',
  'Récapitulatif',
];
export const articleNames = [
  'Identité des parties',
  'Objet de la prestation',
  'Obligations du prestataire',
  'Obligations du client',
  'Tarifs',
  'Prix et acompte',
  'Déplacement et restauration',
  'Assurances',
  'Paiement',
  'Annulation',
  'Litiges',
];
export const today = () => localDate(new Date());
export function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const money = (v: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: v % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v / 100);
export const dateFmt = (
  s: string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) => (s ? new Date(s.slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-FR', opts) : 'À confirmer');
export const total = (b: Booking) => b.fee + b.travel + b.meal;
export const deposit = (b: Booking) => Math.round((total(b) * b.rate) / 100);
export const received = (db: Database, id: string) =>
  db.payments.filter((p) => p.bookingId === id).reduce((s, p) => s + p.amount, 0);
export const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const cents = (v: string) =>
  Math.round(Number(v.replace(/[\s\u202f\u00a0€]/g, '').replace(',', '.')) * 100);
export const validDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !isNaN(Date.parse(v)) &&
  new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
export function statusOf(b: Booking) {
  return b.stage === 6
    ? 'Terminée'
    : b.stage >= 2
      ? 'Confirmée'
      : b.stage === 1
        ? 'Devis envoyé'
        : 'Brouillon';
}
export const initialClient = (): Client => ({
  id: newId(),
  name: '',
  kind: 'Professionnel',
  address: '',
  email: '',
  phone: '',
  contact: '',
  notes: '',
  siren: '',
});
export const initialBooking = (): Booking => ({
  id: newId(),
  clientId: '',
  title: '',
  type: 'Soirée privée',
  date: '',
  start: '',
  end: '',
  venue: '',
  address: '',
  description: 'Saxophone live — Matt Mez',
  technical: 'Une petite table, une prise électrique à proximité et une bouteille d’eau.',
  fee: 0,
  travel: 0,
  meal: 0,
  rate: 50,
  depositDue: today(),
  balanceDue: '',
  stage: 0,
  sample: false,
  created: today(),
  history: [],
});
// Public sandbox identity. The owner's actual profile is sealed in provision.json.
export const defaultProfile: Profile = {
  name: 'Matthieu Lecointre (Matt Mez)',
  legal: 'Entrepreneur individuel',
  address: 'Frelinghien, France · Démonstration',
  email: 'studio@example.invalid',
  siret: '000 000 000 00000',
  vat: 'TVA non applicable, article 293 B du CGI.',
  bank: '',
  holder: '',
  iban: '',
  bic: '',
  mediator: '',
  registry: '',
};
export function defaultClauses(kind: Client['kind']) {
  return [
    'Le présent accord est conclu entre le prestataire et le client identifiés en première page. Chaque partie déclare disposer de la capacité nécessaire pour s’engager.',
    'Le prestataire réalise une représentation musicale au saxophone selon son répertoire préparé, à la date et au lieu précisés dans le présent document.',
    'Le prestataire assure la préparation musicale, la présence aux horaires convenus et apporte le matériel prévu pour sa représentation.',
    'Le client garantit l’accès au lieu et les autorisations nécessaires. Il met à disposition une petite table, une prise électrique à proximité et une bouteille d’eau.',
    'Le prix correspond à la prestation et aux frais détaillés dans le récapitulatif financier. Toute modification fait l’objet d’un accord écrit entre les parties.',
    'L’acompte indiqué est exigible à la réservation. Il est imputé sur le prix total. La réservation est confirmée selon les conditions convenues entre les parties.',
    'Les déplacements et la restauration sont inclus sauf supplément expressément chiffré dans le présent document.',
    'Chaque partie maintient une assurance de responsabilité civile adaptée à ses activités et peut fournir une attestation sur demande.',
    'Le règlement est effectué par virement bancaire, sauf autre accord écrit. Le solde doit être réglé au plus tard à la date d’échéance indiquée.',
    'Toute demande d’annulation ou de report est communiquée par écrit. Les parties recherchent en priorité une date de report. À défaut d’accord, les conséquences de l’annulation sont déterminées selon le droit applicable et le préjudice justifié, sous réserve de la force majeure.',
    kind === 'Professionnel'
      ? 'En cas de litige, les parties recherchent une solution amiable avant de saisir la juridiction compétente selon les règles de droit commun. Le contrat est soumis au droit français.'
      : 'Le client peut adresser une réclamation écrite au prestataire, puis saisir gratuitement le médiateur de la consommation désigné au contrat. Les droits impératifs du consommateur sont préservés. La juridiction compétente est celle prévue par la loi.',
  ];
}
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export function makeDoc(db: Database, b: Booking, kind: DocKind, demo: boolean): StudioDoc {
  const client = db.clients.find((c) => c.id === b.clientId)!;
  const previouslyBilled = db.docs
    .filter(
      (d) =>
        d.bookingId === b.id &&
        d.number &&
        (d.kind === 'Facture d’acompte' || d.kind === 'Facture de solde' || d.kind === 'Avoir'),
    )
    .reduce((n, d) => n + d.amount, 0);
  return {
    id: newId(),
    bookingId: b.id,
    kind,
    status: 'Brouillon',
    number: '',
    date: today(),
    issued: '',
    snapshot: clone({
      client,
      booking: b,
      profile: db.profile,
      articles: db.clauses[client.kind],
      payments: db.payments.filter((p) => p.bookingId === b.id),
      references: db.docs
        .filter(
          (v) =>
            v.bookingId === b.id &&
            v.number &&
            (v.kind.startsWith('Facture') || v.kind === 'Avoir'),
        )
        .map((v) => ({ number: v.number, kind: v.kind, date: v.issued, amount: v.amount })),
    }),
    amount:
      kind === 'Facture d’acompte'
        ? Math.min(deposit(b), Math.max(0, total(b) - previouslyBilled))
        : kind === 'Facture de solde'
          ? Math.max(0, total(b) - previouslyBilled)
          : total(b),
    demo,
  };
}
export function emptyDb(): Database {
  return {
    version: 1,
    revision: 0,
    clients: [],
    bookings: [],
    docs: [],
    payments: [],
    profile: clone(defaultProfile),
    clauses: {
      Professionnel: defaultClauses('Professionnel'),
      Particulier: defaultClauses('Particulier'),
    },
    sequence: { quote: 1, invoice: 1, contract: 1, summary: 1 },
    lastIssue: '',
  };
}
export function seedDb(): Database {
  const db = emptyDb();
  const rows = [
    [
      'Maison Aurore',
      'Cocktail d’entreprise',
      '2026-11-28',
      'Lille',
      'Le Palais de la Bourse',
      'Entreprise',
      '1500',
      '2',
    ],
    [
      'Emma & Louis',
      'Mariage d’hiver',
      '2026-12-12',
      'Chantilly',
      'Château de Chantilly',
      'Mariage',
      '1800',
      '1',
    ],
    [
      'Chez Julien',
      'Soirée du Nouvel An',
      '2026-12-31',
      'Paris',
      'Chez Julien',
      'Nouvel An',
      '1000',
      '0',
    ],
    [
      'Maison Rivage',
      'Cocktail de la maison',
      '2027-01-16',
      'Le Touquet',
      'La Villa Rivage',
      'Entreprise',
      '1000',
      '2',
    ],
    [
      'Atelier Noma',
      'Lancement de collection',
      '2027-01-23',
      'Paris',
      'Galerie Noma',
      'Entreprise',
      '950',
      '1',
    ],
    [
      'Louise Martin',
      'Dîner d’anniversaire',
      '2027-02-06',
      'Lille',
      'Villa Louise',
      'Anniversaire',
      '700',
      '1',
    ],
    [
      'Maison Aurore',
      'Soirée de printemps',
      '2026-04-18',
      'Lille',
      'Le Palais de la Bourse',
      'Entreprise',
      '2650',
      '6',
    ],
    [
      'Atelier Noma',
      'Collection d’été',
      '2026-06-12',
      'Paris',
      'Galerie Noma',
      'Entreprise',
      '1800',
      '6',
    ],
    [
      'Maison Rivage',
      'Les sessions d’été',
      '2026-08-22',
      'Le Touquet',
      'La Villa Rivage',
      'Restaurant',
      '2400',
      '6',
    ],
    [
      'Louise Martin',
      'Soirée privée',
      '2026-10-10',
      'Lille',
      'Villa Louise',
      'Soirée privée',
      '1600',
      '6',
    ],
  ];
  rows.forEach(([name, title, date, city, venue, type, fee, stage], i) => {
    let c = db.clients.find((v) => v.name === name);
    if (!c) {
      c = {
        ...initialClient(),
        id: 'client-' + i,
        name,
        kind: ['Mariage', 'Anniversaire', 'Soirée privée'].includes(type)
          ? 'Particulier'
          : 'Professionnel',
        address: city + ', France',
        email: '',
        contact: name === 'Emma & Louis' ? 'Emma' : '',
      };
      db.clients.push(c);
    }
    const b: Booking = {
      ...initialBooking(),
      id: 'event-' + i,
      clientId: c.id,
      title,
      date,
      address: city,
      venue,
      type,
      fee: +fee * 100,
      stage: +stage,
      created: i < 6 ? '2026-11-10' : date,
      start: i === 2 ? '' : '19:00',
      end: i === 2 ? '' : '22:00',
      sample: i === 2,
      balanceDue: date,
      depositDue: '2026-11-25',
      history: [{ at: i < 6 ? '2026-11-10' : date, text: 'Fiche de démonstration créée.' }],
    };
    db.bookings.push(b);
    if (b.stage > 0) {
      const d = makeDoc(db, b, 'Devis', true);
      d.id = 'doc-' + i;
      d.status = b.stage >= 2 ? 'Accepté' : 'Envoyé';
      d.number = 'DÉMO-DEV-2026-' + String(i + 1).padStart(3, '0');
      d.date = b.created;
      d.issued = b.created;
      db.docs.push(d);
    }
    if (+stage === 6)
      db.payments.push({
        id: 'pay-' + i,
        bookingId: b.id,
        amount: b.fee,
        date,
        method: 'Virement',
        note: 'Règlement fictif de démonstration',
      });
  });
  db.sequence.quote = 12;
  return db;
}
export function conflict(db: Database, b: Booking) {
  if (!validDate(b.date)) return undefined;
  const range = (v: Booking) => {
    const day = Date.parse(v.date + 'T00:00:00Z') / 60000;
    const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
    let end = v.end ? min(v.end) : 1440;
    const start = v.start ? min(v.start) : 0;
    if (end <= start) end += 1440;
    return [day + start, day + end];
  };
  const [start, end] = range(b);
  return db.bookings.find((v) => {
    if (v.id === b.id) return false;
    const [s, e] = range(v);
    return s < end && start < e;
  });
}
export function parseRequest(raw: string, db: Database) {
  const b = initialBooking();
  let c = initialClient();
  const n = normalize(raw);
  const known = db.clients.find((x) => n.includes(normalize(x.name)));
  if (known) c = clone(known);
  else c.name = (raw.split(/[,;\n]/)[0] || '').replace(/^(?:pour|client\s*:)\s*/i, '').trim();
  const amount = raw.match(/(\d[\d\s\u00a0\u202f]*(?:[,.]\d{1,2})?)\s*(?:€|euros?)/i);
  if (amount) b.fee = cents(amount[1]);
  const pct = raw.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pct) b.rate = Math.min(100, Number(pct[1].replace(',', '.')));
  const months = [
    'janvier',
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
  ];
  const dm = n.match(
    new RegExp('(\\d{1,2})(?:er)?\\s+(' + months.join('|') + ')(?:\\s+(20\\d{2}))?'),
  );
  if (dm) {
    let y = Number(dm[3] || new Date().getFullYear());
    const m = months.indexOf(dm[2]) + 1;
    b.date = `${y}-${String(m).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`;
    if (!dm[3] && b.date < today()) b.date = String(y + 1) + b.date.slice(4);
  }
  const numeric = raw.match(/\b(\d{1,2})[/.](\d{1,2})[/.](20\d{2})\b/);
  if (numeric)
    b.date = `${numeric[3]}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`;
  const iso = raw.match(/\b20\d{2}-\d\d-\d\d\b/);
  if (iso) b.date = iso[0];
  const matched = types.find((t) => n.includes(normalize(t)));
  if (matched) b.type = matched;
  b.title = n.includes('nouvel an')
    ? 'Soirée du Nouvel An'
    : matched
      ? `${matched} — ${c.name}`
      : '';
  const chunks = raw.split(',').map((a) => a.trim());
  const city =
    chunks[1] &&
    !/\d/.test(chunks[1]) &&
    !types.some((t) => normalize(chunks[1]).includes(normalize(t)))
      ? chunks[1]
      : raw.match(/\b(?:à|sur)\s+([A-ZÀ-Ý][\p{L}\- ]+?)(?:,|\s+le\s|$)/u)?.[1];
  b.address = city || '';
  b.venue = known && known.name.startsWith('Chez ') ? known.name : '';
  const tm = Array.from(raw.matchAll(/\b([01]?\d|2[0-3])\s*h\s*([0-5]\d)?\b/g));
  if (tm[0]) b.start = tm[0][1].padStart(2, '0') + ':' + (tm[0][2] || '00');
  if (tm[1]) b.end = tm[1][1].padStart(2, '0') + ':' + (tm[1][2] || '00');
  b.clientId = c.id;
  b.balanceDue = b.date;
  return {
    booking: b,
    client: c,
    detected: [
      c.name && 'Client',
      b.date && 'Date',
      b.address && 'Lieu',
      b.fee && 'Montant',
      pct && 'Acompte',
      matched && 'Type',
    ].filter(Boolean),
    raw,
  };
}
