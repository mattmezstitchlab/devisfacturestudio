import { StudioDoc, dateFmt, money, Booking, Client } from './model';
import { clean, contents, fileName, htmlDoc } from './docContent';
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function exportText(text: string, name: string, type = 'application/json') {
  saveBlob(new Blob([text], { type }), name);
}
export async function pdfOf(doc: StudioDoc) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({
    title: clean(doc.kind + ' - ' + (doc.number || 'Brouillon')),
    author: 'Matt Mez Studio',
    subject: clean(doc.snapshot.booking.title),
  });
  const left = 18,
    right = 192;
  let y = 21;
  const wrap = (s: string, w = 174) => pdf.splitTextToSize(clean(s), w) as string[];
  const head = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 37, 36);
    pdf.setFontSize(18);
    pdf.text('MATT MEZ', left, 19);
    pdf.setFontSize(7);
    pdf.setCharSpace(2.6);
    pdf.setTextColor(143, 112, 65);
    pdf.text('STUDIO', left, 24);
    pdf.setCharSpace(0);
    pdf.setFontSize(7);
    pdf.text(
      (doc.demo ? 'DEMONSTRATION  /  ' : '') +
        (doc.number ? 'DOCUMENT EMIS' : 'BROUILLON - NON EMIS'),
      right,
      19,
      { align: 'right' },
    );
    pdf.setDrawColor(186, 159, 110);
    pdf.setLineWidth(0.4);
    pdf.line(left, 29, right, 29);
    y = 37;
  };
  const page = () => {
    pdf.addPage();
    head();
  };
  const ensure = (h: number) => {
    if (y + h > 276) page();
  };
  const text = (s: string, size = 9, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    const lines = wrap(s);
    for (const line of lines) {
      ensure(size * 0.45 + 1);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(52, 52, 50);
      pdf.text(line || ' ', left, y);
      y += size * 0.41 + 0.65;
    }
  };
  head();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(27);
  pdf.setTextColor(34, 34, 32);
  pdf.text(clean(doc.kind), left, 44);
  y = 52;
  text((doc.number || 'Sans numéro définitif') + '  /  ' + dateFmt(doc.date), 9);
  y += 6;
  const { profile: p, client: c } = doc.snapshot;
  const start = y;
  const party = (x: number, label: string, lines: string[]) => {
    let yy = start;
    pdf.setFontSize(7);
    pdf.setTextColor(140, 113, 73);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, yy);
    yy += 6;
    lines.forEach((s, i) => {
      pdf.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      pdf.setFontSize(i === 0 ? 10 : 8.5);
      pdf.setTextColor(50, 50, 48);
      wrap(s, 80).forEach((l) => {
        pdf.text(l, x, yy);
        yy += 4;
      });
    });
    return yy;
  };
  y =
    Math.max(
      party(
        left,
        'PRESTATAIRE',
        [p.name, p.legal, p.address, p.email, 'SIRET : ' + p.siret, p.registry].filter(Boolean),
      ),
      party(
        109,
        'CLIENT / ' + clean(c.kind.toUpperCase()),
        [
          c.name,
          c.address,
          c.email,
          c.siren ? 'SIREN : ' + c.siren : '',
          c.contact ? 'Contact : ' + c.contact : '',
        ].filter(Boolean),
      ),
    ) + 6;
  contents(doc).forEach((section) => {
    const signature = section.title === 'Accord des parties';
    ensure(signature ? 32 : 18);
    y += 3;
    pdf.setFontSize(10.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(126, 100, 61);
    pdf.text(clean(section.title), left, y);
    y += 3;
    pdf.setDrawColor(222, 216, 204);
    pdf.setLineWidth(0.2);
    pdf.line(left, y, right, y);
    y += 5;
    section.lines.forEach((s) => text(s, 8.5));
    y += 3;
  });
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(120, 118, 112);
    pdf.setDrawColor(207, 196, 176);
    pdf.line(left, 282, right, 282);
    pdf.text(
      clean(
        'MATT MEZ STUDIO  /  ' +
          (doc.number || 'BROUILLON') +
          (doc.demo ? '  /  EXEMPLE SANS VALEUR COMPTABLE' : ''),
      ),
      left,
      287,
    );
    pdf.text(`${i} / ${n}`, right, 287, { align: 'right' });
  }
  return pdf;
}
export async function downloadPDF(d: StudioDoc) {
  saveBlob((await pdfOf(d)).output('blob'), fileName(d));
}
export async function previewPDF(d: StudioDoc) {
  const win = window.open('', '_blank');
  if (!win) throw new Error('Autorisez l’ouverture d’un onglet pour prévisualiser le PDF.');
  win.opener = null;
  const url = URL.createObjectURL((await pdfOf(d)).output('blob'));
  win.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 300000);
}
export async function printPDF(d: StudioDoc) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Autorisez la fenêtre d’impression dans le navigateur.');
  w.opener = null;
  w.document.open();
  w.document.write(htmlDoc(d));
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 350);
}
const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (v) => String.fromCharCode(v)).join(''));
export async function emailDraft(to: string, subject: string, body: string, d?: StudioDoc) {
  const boundary = 'mattmez_' + Date.now();
  const cr = '\r\n';
  const part = [
    `To: ${to.replace(/[\r\n]/g, '')}`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(body),
    '',
  ];
  if (d) {
    const safe = fileName(d)
      .normalize('NFD')
      .replace(/[^A-Za-z0-9_.-]/g, '_');
    part.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${safe}"`,
      `Content-Disposition: attachment; filename="${safe}"`,
      'Content-Transfer-Encoding: base64',
      '',
      (await pdfOf(d))
        .output('datauristring')
        .split(',')[1]
        .match(/.{1,76}/g)!
        .join(cr),
      '',
    );
  }
  part.push(`--${boundary}--`);
  await exportText(part.join(cr), 'Matt-Mez-brouillon.eml', 'message/rfc822');
}
export async function calendarFile(b: Booking, c: Client) {
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const date = b.date.replace(/-/g, '');
  const next = new Date(b.date + 'T12:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  const endDate = next.toISOString().slice(0, 10).replace(/-/g, '');
  const allDay = !b.start;
  const result = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Matt Mez Studio//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:' + b.id + '@mattmez.studio',
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
    allDay
      ? 'DTSTART;VALUE=DATE:' + date
      : 'DTSTART;TZID=Europe/Paris:' + date + 'T' + b.start.replace(':', '') + '00',
    allDay
      ? 'DTEND;VALUE=DATE:' + endDate
      : 'DTEND;TZID=Europe/Paris:' +
        (b.end < b.start ? endDate : date) +
        'T' +
        b.end.replace(':', '') +
        '00',
    'SUMMARY:' + esc(b.title) + ' - Matt Mez',
    'LOCATION:' + esc(b.venue + ' ' + b.address),
    'DESCRIPTION:' + esc(c.name + ' · ' + b.description),
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel de prestation',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  await exportText(
    result.join('\r\n'),
    'prestation-' + b.date + '.ics',
    'text/calendar;charset=utf-8',
  );
}
