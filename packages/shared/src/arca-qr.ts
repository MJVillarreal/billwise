export const ARCA_QR_URL = 'https://www.arca.gob.ar/fe/qr/';

const ACCEPTED_HOSTS = ['www.arca.gob.ar', 'arca.gob.ar', 'www.afip.gob.ar', 'afip.gob.ar'];

/** JSON payload of the QR printed on electronic invoices (ARCA spec, version 1). */
export interface ArcaQrData {
  ver: number;
  fecha: string;
  cuit: number;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: string;
  ctz: number;
  tipoDocRec?: number;
  nroDocRec?: number;
  tipoCodAut: 'A' | 'E';
  codAut: number;
}

export function encodeArcaQr(data: ArcaQrData): string {
  return `${ARCA_QR_URL}?p=${btoa(JSON.stringify(data))}`;
}

/** Decodes the text read from an invoice QR. Returns null when it is not a valid ARCA QR. */
export function decodeArcaQr(text: string): ArcaQrData | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (!ACCEPTED_HOSTS.includes(url.hostname) || !url.pathname.startsWith('/fe/qr')) return null;

  const param = url.searchParams.get('p');
  if (!param) return null;

  let payload: unknown;
  try {
    const base64 = param.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    payload = JSON.parse(atob(padded));
  } catch {
    return null;
  }

  return isArcaQrData(payload) ? payload : null;
}

function isArcaQrData(value: unknown): value is ArcaQrData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const isNumber = (key: string) => typeof v[key] === 'number' && Number.isFinite(v[key]);

  return (
    ['ver', 'cuit', 'ptoVta', 'tipoCmp', 'nroCmp', 'importe', 'ctz', 'codAut'].every(isNumber) &&
    typeof v.fecha === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.fecha) &&
    typeof v.moneda === 'string' &&
    (v.tipoCodAut === 'A' || v.tipoCodAut === 'E') &&
    (v.tipoDocRec === undefined || isNumber('tipoDocRec')) &&
    (v.nroDocRec === undefined || isNumber('nroDocRec'))
  );
}
