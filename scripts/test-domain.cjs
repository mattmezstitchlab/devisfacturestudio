/* Deterministic domain checks; no real client or banking data is used. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-domain-'));
for (const name of ['model', 'operations', 'docContent']) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/', name + '.ts'), 'utf8');
  fs.writeFileSync(
    path.join(dir, name + '.js'),
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
}
const m = require(path.join(dir, 'model.js'));
const ops = require(path.join(dir, 'operations.js'));
const db = m.seedDb();
const sample = db.bookings.find((b) => b.sample);
assert.equal(m.total(sample), 100000);
assert.equal(m.deposit(sample), 50000);
assert.equal(m.received(db, sample.id), 0);
assert.equal(db.docs.filter((d) => d.bookingId === sample.id).length, 0);
const draftSample = ops.prepareDocument(db, sample.id, 'Devis', true);
assert.throws(() => ops.issueDocument(db, draftSample));
const parsed = m.parseRequest(
  'Chez Julien, Paris, le 31 décembre 2026, soirée du Nouvel An, saxophone, 1 000 €, acompte 50 %.',
  db,
);
assert.equal(parsed.booking.fee, 100000);
assert.equal(parsed.booking.rate, 50);
assert.equal(parsed.booking.date, '2026-12-31');
assert.equal(parsed.client.name, 'Chez Julien');
assert.equal(m.cents('1 234,56'), 123456);
assert.equal(m.validDate('2026-02-31'), false);
const c = {
  ...m.initialClient(),
  name: 'Studio test',
  address: 'Adresse de test',
  email: 'test@example.invalid',
};
const b = {
  ...m.initialBooking(),
  title: 'Événement test',
  date: '2027-03-21',
  clientId: c.id,
  fee: 100000,
  travel: 10000,
  meal: 5000,
  rate: 30,
  venue: 'Salle de test',
  address: 'Paris',
  balanceDue: '2027-03-21',
};
ops.saveBooking(db, c, b, false);
assert.equal(m.total(b), 115000);
assert.equal(m.deposit(b), 34500);
const counter = db.sequence.invoice;
const fid = ops.prepareDocument(db, b.id, 'Facture d’acompte', true);
assert.equal(db.sequence.invoice, counter);
assert.equal(db.docs.find((x) => x.id === fid).number, '');
ops.issueDocument(db, fid);
const invoice = db.docs.find((x) => x.id === fid);
const immutable = JSON.stringify(invoice.snapshot);
assert.equal(invoice.amount, 34500);
assert.equal(m.received(db, b.id), 0);
assert.equal(db.sequence.invoice, counter + 1);
assert.throws(() => ops.issueDocument(db, fid));
ops.saveBooking(db, c, { ...b, title: 'Nouvelle description' }, true);
assert.equal(JSON.stringify(invoice.snapshot), immutable);
ops.addPayment(db, b.id, 34500, m.today(), 'Virement', 'Confirmation de test', fid);
assert.equal(m.received(db, b.id), 34500);
assert.equal(invoice.status, 'Payé');
assert.throws(() => ops.addPayment(db, b.id, 999999, m.today(), 'Virement', ''));
assert.throws(() => ops.addPayment(db, b.id, 10, '2099-01-01', 'Virement', ''));
assert.throws(() => ops.addPayment(db, b.id, -100, m.today(), 'Virement', ''));
const bal = ops.prepareDocument(db, b.id, 'Facture de solde', true);
ops.issueDocument(db, bal);
assert.equal(db.docs.find((x) => x.id === bal).amount, 80500);
const credit = ops.makeCredit(db, invoice, 'Correction de test');
assert.equal(db.docs.find((x) => x.id === credit).number, '');
ops.issueDocument(db, credit);
assert.equal(db.docs.find((x) => x.id === credit).amount, -34500);
assert.equal(JSON.stringify(invoice.snapshot), immutable);
assert.equal(
  new Set(db.docs.map((x) => x.number).filter(Boolean)).size,
  db.docs.filter((x) => x.number).length,
);
assert.equal(m.conflict(db, { ...m.initialBooking(), date: sample.date })?.id, sample.id);
const night = { ...b, id: 'night', date: '2027-07-14', start: '23:00', end: '02:00' };
db.bookings.push(night);
assert.equal(
  m.conflict(db, { ...b, id: 'new', date: '2027-07-15', start: '01:00', end: '03:00' })?.id,
  'night',
);
fs.rmSync(dir, { recursive: true, force: true });
console.log(
  'PASS — natural-language parsing, cent-accurate pricing, draft protection, numbering, immutable invoices, credits, confirmed payments, overnight conflicts.',
);
