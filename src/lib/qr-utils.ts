// Builders for structured QR payloads understood by phone camera apps.

/** Escapes \ ; , : " for MECARD-style payloads (Wi-Fi). */
function escapeMeCard(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export interface WifiOptions {
  ssid: string;
  password?: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export function wifiPayload({ ssid, password = '', security, hidden }: WifiOptions): string {
  const parts = [`T:${security}`, `S:${escapeMeCard(ssid)}`];
  if (security !== 'nopass') parts.push(`P:${escapeMeCard(password)}`);
  if (hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

export function emailPayload(to: string, subject = '', body = ''): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const q = params.toString().replace(/\+/g, '%20');
  return `mailto:${to}${q ? `?${q}` : ''}`;
}

export function phonePayload(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, '')}`;
}

export function smsPayload(number: string, message = ''): string {
  return `SMSTO:${number.replace(/[^\d+]/g, '')}:${message}`;
}

export interface ContactOptions {
  firstName: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function vcardPayload(c: ContactOptions): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(c.lastName ?? '')};${escapeVCard(c.firstName)};;;`,
    `FN:${escapeVCard([c.firstName, c.lastName].filter(Boolean).join(' '))}`,
    c.organization && `ORG:${escapeVCard(c.organization)}`,
    c.title && `TITLE:${escapeVCard(c.title)}`,
    c.phone && `TEL;TYPE=CELL:${c.phone}`,
    c.email && `EMAIL:${c.email}`,
    c.url && `URL:${c.url}`,
    'END:VCARD',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Describes what a decoded QR payload is, for display. */
export function describePayload(text: string): string {
  if (/^https?:\/\//i.test(text)) return 'URL';
  if (/^WIFI:/i.test(text)) return 'Wi-Fi network';
  if (/^mailto:/i.test(text)) return 'Email';
  if (/^tel:/i.test(text)) return 'Phone number';
  if (/^(SMSTO|sms):/i.test(text)) return 'SMS';
  if (/^BEGIN:VCARD/i.test(text)) return 'Contact (vCard)';
  if (/^BEGIN:VEVENT/i.test(text)) return 'Calendar event';
  if (/^geo:/i.test(text)) return 'Location';
  return 'Text';
}
