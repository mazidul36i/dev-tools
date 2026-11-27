import { describe, expect, it } from 'vitest';
import { describePayload, emailPayload, phonePayload, smsPayload, vcardPayload, wifiPayload } from './qr-utils';

describe('QR payloads', () => {
  it('builds Wi-Fi payloads with escaping', () => {
    expect(wifiPayload({ ssid: 'Home;Net', password: 'p:a"ss', security: 'WPA' })).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:a\\"ss;;');
    expect(wifiPayload({ ssid: 'Cafe', security: 'nopass', hidden: true })).toBe('WIFI:T:nopass;S:Cafe;H:true;;');
    expect(wifiPayload({ ssid: 'a\\b', security: 'nopass' })).toBe('WIFI:T:nopass;S:a\\\\b;;');
  });

  it('builds email, phone and SMS payloads', () => {
    expect(emailPayload('a@b.com', 'Hi there', 'Body & more')).toBe('mailto:a@b.com?subject=Hi%20there&body=Body%20%26%20more');
    expect(emailPayload('a@b.com')).toBe('mailto:a@b.com');
    expect(phonePayload('+1 (555) 010-9999')).toBe('tel:+15550109999');
    expect(smsPayload('555 0100', 'hello')).toBe('SMSTO:5550100:hello');
  });

  it('builds vCards', () => {
    const v = vcardPayload({ firstName: 'Jane', lastName: 'Doe', organization: 'Acme, Inc.', email: 'jane@example.com' });
    expect(v).toContain('N:Doe;Jane;;;');
    expect(v).toContain('FN:Jane Doe');
    expect(v).toContain('ORG:Acme\\, Inc.');
    expect(v.startsWith('BEGIN:VCARD\nVERSION:3.0')).toBe(true);
  });

  it('describes decoded payloads', () => {
    expect(describePayload('https://example.com')).toBe('URL');
    expect(describePayload('WIFI:T:WPA;S:x;;')).toBe('Wi-Fi network');
    expect(describePayload('hello')).toBe('Text');
  });
});
