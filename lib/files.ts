import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';
import { Booking, Client, StudioDoc } from './model';
import { htmlDoc, fileName } from './docContent';
export async function exportText(text: string, name: string, type = 'application/json') {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(text);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: type });
  else await Share.share({ message: text, title: name });
}
export async function downloadPDF(d: StudioDoc) {
  const { uri } = await Print.printToFileAsync({ html: htmlDoc(d), width: 595, height: 842 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: '.pdf',
    dialogTitle: fileName(d),
  });
}
export const previewPDF = downloadPDF;
export async function printPDF(d: StudioDoc) {
  await Print.printAsync({ html: htmlDoc(d) });
}
export async function emailDraft(to: string, subject: string, body: string, d?: StudioDoc) {
  const boundary = 'mm' + Date.now();
  let fields = [
    `To: ${to.replace(/[\r\n]/g, '')}`,
    `Subject: ${subject.replace(/[\r\n]/g, ' ')}`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ];
  if (d) {
    const { base64 } = await Print.printToFileAsync({
      html: htmlDoc(d),
      base64: true,
      width: 595,
      height: 842,
    });
    fields.push(
      `--${boundary}`,
      'Content-Type: application/pdf',
      'Content-Disposition: attachment; filename="document.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      base64?.match(/.{1,76}/g)?.join('\r\n') || '',
    );
  }
  fields.push(`--${boundary}--`);
  await exportText(fields.join('\r\n'), 'Matt-Mez-brouillon.eml', 'message/rfc822');
}
export async function calendarFile(b: Booking, c: Client) {
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const date = b.date.replace(/-/g, '');
  await exportText(
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Matt Mez Studio//FR',
      'BEGIN:VEVENT',
      'UID:' + b.id + '@mattmez.studio',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;VALUE=DATE:' + date,
      'SUMMARY:' + esc(b.title) + ' - Matt Mez',
      'DESCRIPTION:' + esc(c.name + ' - ' + (b.start || 'Horaires à confirmer')),
      'LOCATION:' + esc(b.venue + ' ' + b.address),
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel de prestation',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'),
    'Prestation.ics',
    'text/calendar',
  );
}
