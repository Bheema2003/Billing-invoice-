import type { FormattedTripRow, InvoiceData, InvoiceMeta, TripRow } from '../types/invoice';

export function createEmptyMeta(): InvoiceMeta {
  return {
    vehicleNo: '',
    web: '',
    classOfVehicle: '',
    officeMobile: '',
    userName: '',
    date: '',
    clientName: '',
    invoiceNo: '',
  };
}

export function createRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyRow(): TripRow {
  return {
    id: createRowId(),
    tripDate: '',
    description: '',
    kmHr: '',
    amount1: '',
    extraKm1: '',
    amount2: '',
    extraKm2: '',
    amount3: '',
    totalAmount: '',
  };
}

export const SAMPLE_INVOICE_META: InvoiceMeta = {
  vehicleNo: 'KA03AL6461',
  web: 'incharacab.com',
  classOfVehicle: 'INNOVA CRYSTA',
  officeMobile: '9845211281',
  userName: 'MR. SANDEEP DATTA',
  date: '16/11/26',
  clientName: 'BANNERGHATTA ROAD',
  invoiceNo: '232',
};

export function createSampleTripRows(): TripRow[] {
  return [
    {
      id: createRowId(),
      tripDate: '16/11/26',
      description: 'BANGALORE LOCAL USE',
      kmHr: '80/8',
      amount1: '2700 +\nRs.185\nTOLL',
      extraKm1: '-',
      amount2: '-',
      extraKm2: '-',
      amount3: '-',
      totalAmount: '2885',
    },
  ];
}

export function parseAmount(value: string | number | null | undefined): number {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function rawOrDash(value: string | null | undefined): string {
  return String(value ?? '').trim() === '' ? '-' : String(value);
}

export function formatRupees(num: number): string {
  if (!Number.isFinite(num)) return 'Rs.0';
  const hasDecimals = Math.abs(num % 1) > 0.001;
  return (
    'Rs.' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

export function numberToIndianWords(num: number): string {
  const ones = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const twoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    return n % 10 === 0
      ? tens[Math.floor(n / 10)]
      : `${tens[Math.floor(n / 10)]}-${ones[n % 10]}`;
  };

  const threeDigits = (n: number): string => {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    return [hundreds > 0 ? `${ones[hundreds]} HUNDRED` : '', twoDigits(rem)]
      .filter(Boolean)
      .join(' ');
  };

  const intWords = (n: number): string => {
    if (n === 0) return 'ZERO';
    const parts: string[] = [];
    let rem = n;
    const crores = Math.floor(rem / 10000000);
    rem %= 10000000;
    const lakhs = Math.floor(rem / 100000);
    rem %= 100000;
    const thousands = Math.floor(rem / 1000);
    rem %= 1000;

    if (crores > 0) parts.push(`${intWords(crores)} CRORE`);
    if (lakhs > 0) parts.push(`${twoDigits(lakhs)} LAKH`);
    if (thousands > 0) parts.push(`${twoDigits(thousands)} THOUSAND`);
    if (rem > 0) parts.push(threeDigits(rem));
    return parts.join(' ');
  };

  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  const whole = Math.floor(rounded);
  const paise = Math.round((rounded - whole) * 100);

  return `IN WORDS: RUPEES ${intWords(whole)}${paise > 0 ? ` AND ${twoDigits(paise)} PAISE` : ''} ONLY.`;
}

export function formatInvoiceData(meta: InvoiceMeta, tripRows: TripRow[]): InvoiceData {
  const formattedMeta: InvoiceMeta = {
    vehicleNo: meta.vehicleNo.trim().toUpperCase(),
    web: meta.web.trim(),
    classOfVehicle: meta.classOfVehicle.trim().toUpperCase(),
    officeMobile: meta.officeMobile.trim(),
    userName: meta.userName.trim().toUpperCase(),
    date: meta.date.trim(),
    clientName: meta.clientName.trim().toUpperCase(),
    invoiceNo: meta.invoiceNo.trim().toUpperCase(),
  };

  let grandTotal = 0;
  const rows: FormattedTripRow[] = tripRows.map((row) => {
    const amountNum = parseAmount(row.totalAmount);
    grandTotal += amountNum;
    return {
      id: row.id,
      tripDate: rawOrDash(row.tripDate).toUpperCase(),
      description: rawOrDash(row.description).toUpperCase(),
      kmHr: rawOrDash(row.kmHr).toUpperCase(),
      amount1: rawOrDash(row.amount1).toUpperCase().replace(/\bRS\./g, 'Rs.'),
      extraKm1: rawOrDash(row.extraKm1).toUpperCase(),
      amount2: rawOrDash(row.amount2).toUpperCase(),
      extraKm2: rawOrDash(row.extraKm2).toUpperCase(),
      amount3: rawOrDash(row.amount3).toUpperCase(),
      totalAmount: String(row.totalAmount ?? '').trim() === '' ? '-' : formatRupees(amountNum),
    };
  });

  return {
    meta: formattedMeta,
    rows,
    grandTotal,
    formattedTotal: formatRupees(grandTotal),
    amountInWords: numberToIndianWords(grandTotal),
  };
}
