import { StudioDoc, dateFmt, deposit, money, total, articleNames } from './model';
export const clean = (s: string) =>
  s
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/→/g, ' > ');
export type Section = { title: string; lines: string[] };
export function contents(d: StudioDoc): Section[] {
  const { booking: b, client: c, profile: p, articles, payments } = d.snapshot;
  const paid = payments.reduce((n, v) => n + v.amount, 0);
  const sections: Section[] = [
    {
      title: 'La prestation',
      lines: [
        b.title,
        b.description,
        `Date : ${dateFmt(b.date)} · ${b.start ? b.start + ' - ' + b.end : 'Horaires à confirmer'}`,
        `Lieu : ${b.venue || 'À confirmer'}${b.address ? ' · ' + b.address : ''}`,
        ...(b.technical ? [`Disposition technique : ${b.technical}`] : []),
      ],
    },
    {
      title: 'Détail financier',
      lines: [
        `1 × ${b.description || b.title} : ${money(b.fee)} HT`,
        `Déplacements : ${b.travel ? money(b.travel) + ' HT' : 'inclus'} · Restauration : ${b.meal ? money(b.meal) + ' HT' : 'incluse'}`,
        `Total de la prestation HT : ${money(total(b))}`,
        p.vat,
        `Total TTC : ${money(total(b))}`,
        `Acompte ${b.rate} % : ${money(deposit(b))}, à régler le ${dateFmt(b.depositDue)}`,
        `Solde contractuel : ${money(total(b) - deposit(b))}, échéance le ${dateFmt(b.balanceDue || b.date)}`,
      ],
    },
  ];
  if (d.kind.startsWith('Facture') || d.kind === 'Avoir') {
    sections[1] = {
      title: 'Rappel de la prestation',
      lines: [
        `Prix unitaire HT de la prestation : ${money(b.fee)}. Quantité : 1.`,
        `Frais de déplacement : ${b.travel ? money(b.travel) : 'inclus'} ; restauration : ${b.meal ? money(b.meal) : 'incluse'}.`,
        `Prix total convenu : ${money(total(b))}. Acompte convenu : ${money(deposit(b))} (${b.rate} %).`,
        p.vat,
      ],
    };
  }
  if (d.kind === 'Avoir')
    sections.push({
      title: 'Correction de facture',
      lines: [
        `Facture d’origine : ${d.original}`,
        `Motif : ${d.reason}`,
        `Montant de l’avoir TTC : ${money(d.amount)}`,
        'Cet avoir ne constitue pas un remboursement enregistré.',
      ],
    });
  if (d.kind.startsWith('Facture'))
    sections.push({
      title: d.kind,
      lines: [
        `Nature : prestation de services. Quantité : 1.`,
        ...(d.kind === 'Facture de solde'
          ? (d.snapshot.references || []).map(
              (v) =>
                `${v.kind} déjà comptabilisé : ${v.number}, le ${dateFmt(v.date)} : ${money(v.amount)}.`,
            )
          : []),
        `Base HT de la présente facture : ${money(d.amount)}`,
        `TVA : 0 € (franchise en base). Total TTC de cette facture : ${money(d.amount)}`,
        `Échéance : ${dateFmt(d.kind === 'Facture d’acompte' ? b.depositDue : b.balanceDue || b.date)}`,
        `Règlements confirmés sur le dossier à la date d’émission : ${money(paid)}`,
        `Reste à encaisser sur le dossier : ${money(Math.max(0, total(b) - paid))}`,
      ],
    });
  if (d.kind === 'Récapitulatif')
    sections.push({
      title: 'Relevé récapitulatif — non exigible',
      lines: [
        `Ce document ne constitue pas une nouvelle facture.`,
        ...(d.snapshot.references || []).map(
          (v) => `${v.kind} ${v.number} du ${dateFmt(v.date)} : ${money(v.amount)}`,
        ),
        `Total encaissé : ${money(paid)}`,
        `Restant à encaisser : ${money(total(b) - paid)}`,
        ...payments.map((v) => `${dateFmt(v.date)} : ${money(v.amount)} (${v.method})`),
      ],
    });
  if (d.kind === 'Devis') {
    const until = new Date(d.date + 'T12:00:00');
    until.setDate(until.getDate() + 30);
    sections.push({
      title: 'Conditions du devis',
      lines: [
        `Devis gratuit, valable 30 jours, jusqu’au ${until.toLocaleDateString('fr-FR')}.`,
        'L’acceptation porte sur la prestation et le prix indiqués. Toute modification doit être convenue par écrit.',
        'Réservation avec acompte. Le solde est payable au plus tard à l’échéance indiquée.',
      ],
    });
  }
  if (d.kind === 'Contrat')
    articles.forEach((v, i) =>
      sections.push({ title: `Article ${i + 1} — ${articleNames[i]}`, lines: [v] }),
    );
  if (d.kind !== 'Avoir')
    sections.push({
      title: 'Modalités de règlement',
      lines: [
        'Virement bancaire. Aucun escompte pour paiement anticipé.',
        ...(c.kind === 'Professionnel'
          ? [
              'Retard de paiement : pénalités au taux de trois fois le taux d’intérêt légal, exigibles dès le jour suivant l’échéance, sans rappel. Indemnité forfaitaire de recouvrement : 40 € (art. L. 441-10 et D. 441-5 du Code de commerce).',
            ]
          : []),
        ...(p.iban
          ? [`Bénéficiaire : ${p.holder} · ${p.bank}`, `IBAN : ${p.iban} · BIC : ${p.bic}`]
          : ['Exemple : aucune coordonnée bancaire en démonstration.']),
      ],
    });
  if (c.kind === 'Particulier' && p.mediator)
    sections.push({ title: 'Médiation de la consommation', lines: [p.mediator] });
  if (d.kind === 'Devis' || d.kind === 'Contrat')
    sections.push({
      title: 'Accord des parties',
      lines: [
        'Fait à : __________________________     Le : ____ / ____ / ________',
        'Le client — Bon pour accord                        Le prestataire',
        'Signature :                                                Signature :',
        ' ',
        ' ',
      ],
    });
  return sections;
}
const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
export function htmlDoc(d: StudioDoc) {
  const { profile: p, client: c } = d.snapshot;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.kind + ' ' + (d.number || 'Brouillon'))}</title><style>@page{size:A4;margin:17mm}*{box-sizing:border-box}body{font:11px/1.65 Arial,sans-serif;color:#272725;background:#fff;margin:0}main{max-width:760px;margin:auto;padding:28px 32px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #b49665;padding-bottom:15px}.brand{font-size:20px;letter-spacing:3px;font-weight:bold}.sub{font-weight:600;font-size:8px;letter-spacing:5px;color:#907346}h1{font-size:26px;letter-spacing:-1px;font-weight:500;margin:24px 0 2px}h2{font-size:13px;color:#78603b;border-bottom:1px solid #e3dfd6;padding-bottom:5px;margin:14px 0 7px}p{margin:3px 0;white-space:pre-line;overflow-wrap:anywhere}.parties{display:flex;gap:30px;margin:19px 0}.parties>div{flex:1}.label{font-size:8px;letter-spacing:2px;color:#817c70;font-weight:bold}.stamp{font-size:9px;letter-spacing:1px;color:#806432;padding:4px 7px;background:#f3efe7}section{break-inside:avoid}.foot{border-top:1px solid #c9b590;margin-top:24px;padding-top:8px;font-size:9px;color:#777}@media print{main{max-width:none;padding:0}}</style></head><body><main><header><div><div class="brand">MATT MEZ</div><div class="sub">STUDIO</div></div><div class="stamp">${d.demo ? 'DÉMONSTRATION · ' : ''}${!d.number ? 'BROUILLON · NON ÉMIS' : 'DOCUMENT ÉMIS'}</div></header><h1>${esc(d.kind)}</h1><p>${esc(d.number || 'Sans numéro définitif')} · ${esc(dateFmt(d.date))}</p><div class="parties"><div><div class="label">PRESTATAIRE</div><b>${esc(p.name)}</b><p>${esc(p.legal + '\n' + p.address + '\n' + p.email + '\nSIRET : ' + p.siret + (p.registry ? '\n' + p.registry : ''))}</p></div><div><div class="label">CLIENT · ${esc(c.kind.toUpperCase())}</div><b>${esc(c.name)}</b><p>${esc(c.address + '\n' + c.email + (c.siren ? '\nSIREN : ' + c.siren : '') + (c.contact ? '\nContact : ' + c.contact : ''))}</p></div></div>${contents(
    d,
  )
    .map(
      (s) =>
        `<section><h2>${esc(s.title)}</h2>${s.lines.map((l) => `<p>${esc(l) || '&nbsp;'}</p>`).join('')}</section>`,
    )
    .join(
      '',
    )}<div class="foot">MATT MEZ STUDIO · ${esc(p.name)} · SIRET ${esc(p.siret)}${d.demo ? ' · EXEMPLE SANS VALEUR COMPTABLE' : ''}</div></main></body></html>`;
}
export const fileName = (d: StudioDoc) =>
  (d.number || `BROUILLON-${d.kind}-${d.snapshot.client.name}`).replace(/[^\p{L}\p{N}-]/gu, '_') +
  '.pdf';
