import type { InvoiceData } from '../types/invoice';

function sanitizePdfText(value: string): string {
  return String(value ?? '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\r\n]/g, ' ');
}

function pdfEscape(value: string): string {
  return sanitizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function charWidthEm(ch: string, bold: boolean): number {
  if (ch === ' ' || "iIlj!|.,:;'`".includes(ch)) return 0.278;
  if ('frt()[]{}-/\\"'.includes(ch)) return 0.35;
  if ('MW'.includes(ch)) return bold ? 0.92 : 0.88;
  if ('mw'.includes(ch)) return 0.78;
  if (ch >= 'A' && ch <= 'Z') return bold ? 0.72 : 0.67;
  if (ch >= '0' && ch <= '9') return 0.556;
  return bold ? 0.56 : 0.52;
}

const MM_TO_PT = 72 / 25.4;

function textWidthMm(str: string, fontSizePt: number, bold: boolean): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += charWidthEm(str[i], bold);
  }
  return (sum * fontSizePt) / MM_TO_PT;
}

function wrapToWidthMm(
  text: string,
  maxWidthMm: number,
  fontSizePt: number,
  bold: boolean,
): string[] {
  const paragraphs = sanitizePdfText(text).split(/\r?\n/);
  const out: string[] = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/);
    if (!words[0]) {
      out.push('');
      return;
    }

    let line = '';
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidthMm(candidate, fontSizePt, bold) <= maxWidthMm) {
        line = candidate;
      } else {
        if (line) out.push(line);
        if (textWidthMm(word, fontSizePt, bold) <= maxWidthMm) {
          line = word;
        } else {
          let chunk = '';
          for (const ch of word) {
            if (textWidthMm(chunk + ch, fontSizePt, bold) <= maxWidthMm) {
              chunk += ch;
            } else {
              if (chunk) out.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        }
      }
    });

    if (line) out.push(line);
  });

  return out.length ? out : ['-'];
}

export function buildVectorPdfBytes(data: InvoiceData): Uint8Array {
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;

  const pages: string[][] = [[]];
  let cmds = pages[0];
  let y = 20;

  const drawText = (
    str: string,
    xMm: number,
    yMm: number,
    sizePt: number,
    bold: boolean,
    align: 'left' | 'center',
  ) => {
    const sanitized = sanitizePdfText(str);
    const font = bold ? '/F2' : '/F1';
    const dx = align === 'center' ? xMm - textWidthMm(sanitized, sizePt, bold) / 2 : xMm;
    cmds.push(
      `BT ${font} ${sizePt} Tf ${(dx * MM_TO_PT).toFixed(2)} ${(pageHeightPt - yMm * MM_TO_PT).toFixed(2)} Td (${pdfEscape(sanitized)}) Tj ET`,
    );
  };

  const drawRect = (xMm: number, yMm: number, wMm: number, hMm: number) => {
    cmds.push(
      `0.75 w 0.13 0.13 0.13 RG ${(xMm * MM_TO_PT).toFixed(2)} ${(pageHeightPt - (yMm + hMm) * MM_TO_PT).toFixed(2)} ${(wMm * MM_TO_PT).toFixed(2)} ${(hMm * MM_TO_PT).toFixed(2)} re S`,
    );
  };

  // Header
  drawText('INCHARA CAB', 105, y, 15.5, true, 'center');
  y += 5.5;
  drawText(
    'ALL KINDS OF A/C & NON-A/C VEHICLES AVAILABLE AROUND THE CLOCK',
    105,
    y,
    8.5,
    true,
    'center',
  );
  y += 4.5;
  drawText('KOTHNUR MAIN ROAD, 8TH PHASE, JP NAGAR BENGALURU', 105, y, 8.5, true, 'center');
  y += 9;

  // Meta grid
  const metaPairs: Array<[string, string]> = [
    [`VEHICLE NO: ${data.meta.vehicleNo}`, `WEB: ${data.meta.web}`],
    [`CLASS OF VEHICLE: ${data.meta.classOfVehicle}`, `OFFICE MOBILE: ${data.meta.officeMobile}`],
    [`USER NAME: ${data.meta.userName}`, `DATE: ${data.meta.date}`],
    [`CLIENT NAME: ${data.meta.clientName}`, `INVOICE NO: ${data.meta.invoiceNo}`],
  ];

  metaPairs.forEach(([leftText, rightText]) => {
    const leftLines = wrapToWidthMm(leftText, 102, 8.5, false);
    const rightLines = wrapToWidthMm(rightText, 71, 8.5, false);
    leftLines.forEach((line, idx) => drawText(line, 14, y + idx * 4.2, 8.5, false, 'left'));
    rightLines.forEach((line, idx) => drawText(line, 123, y + idx * 4.2, 8.5, false, 'left'));
    y += Math.max(leftLines.length, rightLines.length) * 4.2 + 1.5;
  });
  y += 3;

  // Table columns (182mm total width centered on 210mm A4 with 14mm margins)
  const colWidths = [20, 27.5, 16.5, 20, 16.5, 18, 16.5, 18, 29];
  const colX: number[] = [];
  let cursorX = 14;
  colWidths.forEach((width) => {
    colX.push(cursorX);
    cursorX += width;
  });

  const headers: string[][] = [
    ['TRIP DATE'],
    ['DESCRIPTION'],
    ['KM/HR'],
    ['AMOUNT'],
    ['EXTRA', 'KM'],
    ['AMOUNT'],
    ['EXTRA', 'KM'],
    ['AMOUNT'],
    ['TOTAL', 'AMOUNT'],
  ];

  const drawHeader = () => {
    for (let i = 0; i < 9; i++) {
      drawRect(colX[i], y, colWidths[i], 11.5);
      let ty = y + 4.3;
      headers[i].forEach((line) => {
        drawText(line, colX[i] + colWidths[i] / 2, ty, 8.1, false, 'center');
        ty += 3.6;
      });
    }
    y += 11.5;
  };

  drawHeader();

  data.rows.forEach((row) => {
    const values = [
      row.tripDate,
      row.description,
      row.kmHr,
      row.amount1,
      row.extraKm1,
      row.amount2,
      row.extraKm2,
      row.amount3,
      row.totalAmount,
    ];
    const wrapped = values.map((val, idx) => wrapToWidthMm(val, colWidths[idx] - 2.4, 8.3, false));
    const rowHeight = Math.max(10.5, Math.max(...wrapped.map((w) => w.length)) * 3.8 + 4.5);

    if (y + rowHeight > 280) {
      cmds = [];
      pages.push(cmds);
      y = 18;
      drawHeader();
    }

    for (let i = 0; i < 9; i++) {
      drawRect(colX[i], y, colWidths[i], rowHeight);
      let ty = y + 4.4;
      wrapped[i].forEach((line) => {
        drawText(line, colX[i] + colWidths[i] / 2, ty, 8.3, false, 'center');
        ty += 3.8;
      });
    }
    y += rowHeight;
  });

  // Summary rows
  const wordLines = wrapToWidthMm(data.amountInWords, 129, 8.4, false);
  const totalHeight = 7.5;
  const grandTotalHeight = Math.max(15.5, wordLines.length * 4 + 6 - totalHeight);
  const summaryHeight = totalHeight + grandTotalHeight;

  if (y + summaryHeight > 280) {
    cmds = [];
    pages.push(cmds);
    y = 18;
  }

  drawRect(14, y, 135, summaryHeight);
  let wy = y + (summaryHeight - wordLines.length * 4) / 2 + 2.8;
  wordLines.forEach((line) => {
    drawText(line, 17, wy, 8.4, false, 'left');
    wy += 4;
  });

  drawRect(colX[7], y, colWidths[7], totalHeight);
  drawText('TOTAL', colX[7] + colWidths[7] / 2, y + totalHeight / 2 + 1.1, 8.3, false, 'center');
  drawRect(colX[8], y, colWidths[8], totalHeight);
  drawText(
    data.formattedTotal,
    colX[8] + colWidths[8] / 2,
    y + totalHeight / 2 + 1.1,
    8.3,
    false,
    'center',
  );

  const gtY = y + totalHeight;
  const gtW = colWidths[7] + colWidths[8];
  drawRect(colX[7], gtY, gtW, grandTotalHeight);
  drawText('GRAND TOTAL', colX[7] + gtW / 2, gtY + grandTotalHeight / 2 - 1.2, 8.3, false, 'center');
  drawText(
    data.formattedTotal,
    colX[7] + gtW / 2,
    gtY + grandTotalHeight / 2 + 4.0,
    8.3,
    false,
    'center',
  );

  // Assemble PDF objects
  const objs = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '',
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ];

  const kids: string[] = [];
  let objId = 5;
  pages.forEach((pageCmds) => {
    const stream = pageCmds.join('\n');
    const contentId = objId++;
    const pageId = objId++;
    kids.push(`${pageId} 0 R`);
    objs.push(
      `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
    objs.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );
  });

  objs[1] = `2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>\nendobj\n`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objs.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function bytesToDataUri(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:application/pdf;base64,${btoa(bin)}`;
}

export function getInvoiceFilename(invoiceNo: string): string {
  const sanitizedInv = (invoiceNo || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return sanitizedInv ? `INCHARA_CAB_Invoice_${sanitizedInv}.pdf` : 'INCHARA_CAB_Invoice.pdf';
}

export function createPdfDownloadResource(data: InvoiceData): {
  href: string;
  filename: string;
  isBlob: boolean;
} {
  const pdfBytes = buildVectorPdfBytes(data);
  const filename = getInvoiceFilename(data.meta.invoiceNo);
  const isAndroidWebView = typeof navigator !== 'undefined' && /; wv\)/i.test(navigator.userAgent);

  if (isAndroidWebView) {
    return {
      href: bytesToDataUri(pdfBytes),
      filename,
      isBlob: false,
    };
  }

  // application/octet-stream forces mobile browsers (iOS Safari & Chrome) to download instead of opening inline
  const blob = new Blob([pdfBytes.slice()], { type: 'application/octet-stream' });
  return {
    href: URL.createObjectURL(blob),
    filename,
    isBlob: true,
  };
}
