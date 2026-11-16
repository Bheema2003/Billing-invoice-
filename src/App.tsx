import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceSheet } from './components/InvoiceSheet';
import type { InvoiceMeta, TripRow } from './types/invoice';
import {
  SAMPLE_INVOICE_META,
  createEmptyMeta,
  createEmptyRow,
  createRowId,
  createSampleTripRows,
  formatInvoiceData,
} from './utils/invoiceFormat';
import { createPdfDownloadResource } from './utils/pdfGenerator';

const STORAGE_KEY = 'inchara_cab_invoice_draft_v1';

interface StoredDraft {
  meta: InvoiceMeta;
  tripRows: TripRow[];
}

function loadInitialDraft(): StoredDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredDraft>;
      if (parsed.meta && Array.isArray(parsed.tripRows) && parsed.tripRows.length > 0) {
        return {
          meta: { ...createEmptyMeta(), ...parsed.meta },
          tripRows: parsed.tripRows.map((row) => ({
            ...createEmptyRow(),
            ...row,
            id: row.id || createRowId(),
          })),
        };
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return {
    meta: createEmptyMeta(),
    tripRows: [createEmptyRow()],
  };
}

export default function App() {
  const initialDraft = useMemo(() => loadInitialDraft(), []);
  const [meta, setMeta] = useState<InvoiceMeta>(initialDraft.meta);
  const [tripRows, setTripRows] = useState<TripRow[]>(initialDraft.tripRows);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const previousBlobUrlRef = useRef<string | null>(null);

  const formattedData = useMemo(() => formatInvoiceData(meta, tripRows), [meta, tripRows]);

  const pdfResource = useMemo(() => createPdfDownloadResource(formattedData), [formattedData]);

  // Persist draft in localStorage
  useEffect(() => {
    try {
      const payload: StoredDraft = { meta, tripRows };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write errors
    }
  }, [meta, tripRows]);

  // Safely revoke older blob URLs after a generous delay so mobile downloads finish cleanly
  useEffect(() => {
    const prev = previousBlobUrlRef.current;
    if (prev && prev !== pdfResource.href) {
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(prev);
      }, 60000);
      previousBlobUrlRef.current = pdfResource.isBlob ? pdfResource.href : null;
      return () => window.clearTimeout(timer);
    }
    previousBlobUrlRef.current = pdfResource.isBlob ? pdfResource.href : null;
    return undefined;
  }, [pdfResource]);

  const handleMetaChange = (field: keyof InvoiceMeta, value: string) => {
    setMeta((prev) => ({ ...prev, [field]: value }));
  };

  const handleTripChange = (index: number, field: keyof Omit<TripRow, 'id'>, value: string) => {
    setTripRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddRow = () => {
    setTripRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleDuplicateRow = (index: number) => {
    setTripRows((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy: TripRow = { ...target, id: createRowId() };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setTripRows((prev) => {
      if (prev.length <= 1) {
        return [createEmptyRow()];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleClearAll = () => {
    setMeta(createEmptyMeta());
    setTripRows([createEmptyRow()]);
  };

  const handleLoadSample = () => {
    setMeta(SAMPLE_INVOICE_META);
    setTripRows(createSampleTripRows());
  };

  const handleDownloadClick = () => {
    setIsDownloading(true);
    window.setTimeout(() => {
      setIsDownloading(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 text-white no-print">
        <div className="mx-auto flex max-w-[1650px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            INCHARA CAB
          </span>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print
            </button>

            <a
              ref={downloadAnchorRef}
              href={pdfResource.href}
              download={pdfResource.filename}
              onClick={handleDownloadClick}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloading ? 'Downloading...' : 'Download as PDF'}
            </a>
          </div>
        </div>
      </header>

      <nav className="flex gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden no-print">
        <button
          type="button"
          onClick={() => setMobileView('form')}
          className={`flex-1 min-h-[42px] rounded-md border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mobileView === 'form'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          1. Enter Details
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 min-h-[42px] rounded-md border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            mobileView === 'preview'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          2. Preview Invoice
        </button>
      </nav>

      <main className="mx-auto grid max-w-[1650px] grid-cols-1 items-start gap-5 p-3 sm:p-4 lg:grid-cols-[490px_1fr] xl:grid-cols-[500px_1fr]">
        <div className={mobileView === 'preview' ? 'hidden lg:block' : 'block'}>
          <InvoiceEditor
            meta={meta}
            tripRows={tripRows}
            formattedData={formattedData}
            onMetaChange={handleMetaChange}
            onTripChange={handleTripChange}
            onAddRow={handleAddRow}
            onDuplicateRow={handleDuplicateRow}
            onRemoveRow={handleRemoveRow}
            onClearAll={handleClearAll}
            onLoadSample={handleLoadSample}
          />
        </div>

        <div className={mobileView === 'form' ? 'hidden lg:block' : 'block'}>
          <InvoiceSheet
            data={formattedData}
            isVisible={mobileView === 'preview' || (typeof window !== 'undefined' && window.innerWidth >= 1024)}
          />
        </div>
      </main>
    </div>
  );
}
