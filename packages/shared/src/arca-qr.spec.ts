import { describe, expect, it } from 'vitest';
import { type ArcaQrData, decodeArcaQr, encodeArcaQr } from './arca-qr.js';

// Example published in ARCA's QR specification.
const SPEC_URL =
  'https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImZlY2hhIjoiMjAyMC0xMC0xMyIsImN1aXQiOjMwMDAwMDAwMDA3LCJwdG9WdGEiOjEwLCJ0aXBvQ21wIjoxLCJucm9DbXAiOjk0LCJpbXBvcnRlIjoxMjEwMCwibW9uZWRhIjoiRE9MIiwiY3R6Ijo2NSwidGlwb0RvY1JlYyI6ODAsIm5yb0RvY1JlYyI6MjAwMDAwMDAwMDEsInRpcG9Db2RBdXQiOiJFIiwiY29kQXV0Ijo3MDQxNzA1NDM2NzQ3Nn0=';

const SPEC_DATA: ArcaQrData = {
  ver: 1,
  fecha: '2020-10-13',
  cuit: 30000000007,
  ptoVta: 10,
  tipoCmp: 1,
  nroCmp: 94,
  importe: 12100,
  moneda: 'DOL',
  ctz: 65,
  tipoDocRec: 80,
  nroDocRec: 20000000001,
  tipoCodAut: 'E',
  codAut: 70417054367476,
};

const encode = (payload: unknown) =>
  `https://www.arca.gob.ar/fe/qr/?p=${btoa(JSON.stringify(payload))}`;

describe('decodeArcaQr', () => {
  it('decodes the example from the ARCA specification', () => {
    expect(decodeArcaQr(SPEC_URL)).toEqual(SPEC_DATA);
  });

  it('accepts base64 without padding and surrounding whitespace', () => {
    expect(decodeArcaQr(` ${SPEC_URL.replace(/=+$/, '')}\n`)).toEqual(SPEC_DATA);
  });

  it('rejects other hosts', () => {
    expect(decodeArcaQr(SPEC_URL.replace('www.afip.gob.ar', 'example.com'))).toBeNull();
  });

  it('rejects text that is not a URL', () => {
    expect(decodeArcaQr('hello')).toBeNull();
  });

  it('rejects a payload with missing fields', () => {
    const partial: Partial<ArcaQrData> = { ...SPEC_DATA };
    delete partial.codAut;
    expect(decodeArcaQr(encode(partial))).toBeNull();
  });

  it('rejects a payload that is not JSON', () => {
    expect(decodeArcaQr(`https://www.arca.gob.ar/fe/qr/?p=${btoa('not json')}`)).toBeNull();
  });
});

describe('encodeArcaQr', () => {
  it('builds a URL with the current ARCA domain', () => {
    expect(encodeArcaQr(SPEC_DATA)).toMatch(/^https:\/\/www\.arca\.gob\.ar\/fe\/qr\/\?p=/);
  });

  it('round-trips through decodeArcaQr', () => {
    expect(decodeArcaQr(encodeArcaQr(SPEC_DATA))).toEqual(SPEC_DATA);
  });
});
