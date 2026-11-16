import { Copy, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import type { InvoiceData, InvoiceMeta, TripRow } from '../types/invoice';

interface InvoiceEditorProps {
  meta: InvoiceMeta;
  tripRows: TripRow[];
  formattedData: InvoiceData;
  onMetaChange: (field: keyof InvoiceMeta, value: string) => void;
  onTripChange: (index: number, field: keyof Omit<TripRow, 'id'>, value: string) => void;
  onAddRow: () => void;
  onDuplicateRow: (index: number) => void;
  onRemoveRow: (index: number) => void;
  onClearAll: () => void;
  onLoadSample: () => void;
}

const META_FIELDS: Array<{
  key: keyof InvoiceMeta;
  label: string;
  placeholder: string;
  type?: 'text' | 'tel';
}> = [
  { key: 'vehicleNo', label: 'Vehicle No', placeholder: 'e.g. KA03AL6461' },
  { key: 'web', label: 'Web', placeholder: 'e.g. incharacab.com' },
  { key: 'classOfVehicle', label: 'Class of Vehicle', placeholder: 'e.g. INNOVA CRYSTA' },
  { key: 'officeMobile', label: 'Office Mobile', placeholder: 'e.g. 9845211281', type: 'tel' },
  { key: 'userName', label: 'User Name', placeholder: 'e.g. MR. SANDEEP DATTA' },
  { key: 'date', label: 'Date (DD/MM/YY)', placeholder: 'DD/MM/YY' },
  { key: 'clientName', label: 'Client Name', placeholder: 'e.g. BANNERGHATTA ROAD' },
  { key: 'invoiceNo', label: 'Invoice No', placeholder: 'e.g. 232' },
];

const inputClassName =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15';

const labelClassName = 'text-xs font-medium text-slate-600';

export function InvoiceEditor({
  meta,
  tripRows,
  formattedData,
  onMetaChange,
  onTripChange,
  onAddRow,
  onDuplicateRow,
  onRemoveRow,
  onClearAll,
  onLoadSample,
}: InvoiceEditorProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto no-print">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">Invoice Details</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Load Sample
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Clear All
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {META_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label htmlFor={`meta-${field.key}`} className={labelClassName}>
              {field.label}
            </label>
            <input
              id={`meta-${field.key}`}
              type={field.type ?? 'text'}
              value={meta[field.key]}
              onChange={(e) => onMetaChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={inputClassName}
            />
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Trip Details · {tripRows.length} {tripRows.length === 1 ? 'row' : 'rows'}
        </h2>
        <button
          type="button"
          onClick={onAddRow}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-[#1a4d8f] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#153e73] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Row
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {tripRows.map((row, idx) => (
          <div
            key={row.id}
            className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Trip Row #{idx + 1}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDuplicateRow(idx)}
                  title="Duplicate row"
                  className="inline-flex min-h-[32px] items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRow(idx)}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor={`tripDate-${row.id}`} className={labelClassName}>
                  Trip Date
                </label>
                <input
                  id={`tripDate-${row.id}`}
                  type="text"
                  value={row.tripDate}
                  onChange={(e) => onTripChange(idx, 'tripDate', e.target.value)}
                  placeholder="DD/MM/YY"
                  className={inputClassName}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor={`description-${row.id}`} className={labelClassName}>
                  Description
                </label>
                <textarea
                  id={`description-${row.id}`}
                  rows={2}
                  value={row.description}
                  onChange={(e) => onTripChange(idx, 'description', e.target.value)}
                  placeholder="e.g. BANGALORE LOCAL USE"
                  className={`${inputClassName} min-h-[54px] resize-y leading-snug`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`kmHr-${row.id}`} className={labelClassName}>
                  KM/HR
                </label>
                <input
                  id={`kmHr-${row.id}`}
                  type="text"
                  value={row.kmHr}
                  onChange={(e) => onTripChange(idx, 'kmHr', e.target.value)}
                  placeholder="-"
                  className={inputClassName}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor={`amount1-${row.id}`} className={labelClassName}>
                  Amount (Multi-line)
                </label>
                <textarea
                  id={`amount1-${row.id}`}
                  rows={2}
                  value={row.amount1}
                  onChange={(e) => onTripChange(idx, 'amount1', e.target.value)}
                  placeholder={'e.g. 2700 +\nRs.185\nTOLL'}
                  className={`${inputClassName} min-h-[54px] resize-y leading-snug`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`extraKm1-${row.id}`} className={labelClassName}>
                  Extra KM
                </label>
                <input
                  id={`extraKm1-${row.id}`}
                  type="text"
                  value={row.extraKm1}
                  onChange={(e) => onTripChange(idx, 'extraKm1', e.target.value)}
                  placeholder="-"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`amount2-${row.id}`} className={labelClassName}>
                  Amount
                </label>
                <input
                  id={`amount2-${row.id}`}
                  type="text"
                  value={row.amount2}
                  onChange={(e) => onTripChange(idx, 'amount2', e.target.value)}
                  placeholder="-"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`extraKm2-${row.id}`} className={labelClassName}>
                  Extra KM
                </label>
                <input
                  id={`extraKm2-${row.id}`}
                  type="text"
                  value={row.extraKm2}
                  onChange={(e) => onTripChange(idx, 'extraKm2', e.target.value)}
                  placeholder="-"
                  className={inputClassName}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`amount3-${row.id}`} className={labelClassName}>
                  Amount
                </label>
                <input
                  id={`amount3-${row.id}`}
                  type="text"
                  value={row.amount3}
                  onChange={(e) => onTripChange(idx, 'amount3', e.target.value)}
                  placeholder="-"
                  className={inputClassName}
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor={`totalAmount-${row.id}`} className={labelClassName}>
                  Total Amount
                </label>
                <input
                  id={`totalAmount-${row.id}`}
                  type="text"
                  inputMode="decimal"
                  value={row.totalAmount}
                  onChange={(e) => onTripChange(idx, 'totalAmount', e.target.value)}
                  placeholder="e.g. 2885"
                  className={`${inputClassName} font-mono-tabular`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-slate-700">Total Amount</span>
          <span className="font-mono-tabular text-base font-bold text-slate-900">
            {formattedData.formattedTotal}
          </span>
        </div>
        <div className="text-xs leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-700">Amount in Words: </span>
          <span>{formattedData.amountInWords}</span>
        </div>
      </div>
    </section>
  );
}
