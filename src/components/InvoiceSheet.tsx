import { useEffect, useRef, useState } from 'react';
import type { InvoiceData } from '../types/invoice';

interface InvoiceSheetProps {
  data: InvoiceData;
  isVisible: boolean;
}

export function InvoiceSheet({ data, isVisible }: InvoiceSheetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [scaledSize, setScaledSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      const sheet = sheetRef.current;
      if (!container || !sheet) return;
      if (container.offsetParent === null && !isVisible) return;

      const availableWidth = container.clientWidth - 16;
      const sheetWidth = sheet.offsetWidth;
      const sheetHeight = sheet.offsetHeight;

      if (availableWidth > 0 && sheetWidth > availableWidth) {
        const nextScale = availableWidth / sheetWidth;
        setScale(nextScale);
        setScaledSize({
          width: sheetWidth * nextScale,
          height: sheetHeight * nextScale,
        });
      } else {
        setScale(1);
        setScaledSize(null);
      }
    };

    updateScale();

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;
    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }
    if (observer && sheetRef.current) {
      observer.observe(sheetRef.current);
    }
    window.addEventListener('resize', updateScale);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [data, isVisible]);

  return (
    <div ref={containerRef} className="flex w-full flex-col items-center overflow-x-auto pb-8">
      <div className="mb-3 flex w-full max-w-[210mm] items-center justify-between px-1 no-print">
        <span className="text-xs font-semibold tracking-wide text-slate-500">
          Live A4 Preview · 210 × 297 mm
        </span>
        <span className="font-mono-tabular text-xs text-slate-500">
          {Math.round(scale * 100)}% scale
        </span>
      </div>

      <div
        style={
          scaledSize
            ? {
                width: `${scaledSize.width}px`,
                height: `${scaledSize.height}px`,
              }
            : undefined
        }
        className="relative"
      >
        <div
          style={{
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
          }}
        >
          <div ref={sheetRef} id="invoiceSheet" className="invoice-sheet">
            <div className="inv-header">
              <h1 className="inv-company">INCHARA CAB</h1>
              <p className="inv-subtitle">
                ALL KINDS OF A/C &amp; NON-A/C VEHICLES AVAILABLE AROUND THE CLOCK
              </p>
              <p className="inv-address">KOTHNUR MAIN ROAD, 8TH PHASE, JP NAGAR BENGALURU</p>
            </div>

            <div className="inv-meta">
              <div className="inv-meta-item">
                <span className="inv-meta-label">VEHICLE NO: </span>
                <span className="inv-meta-value-upper">{data.meta.vehicleNo}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">WEB: </span>
                <span>{data.meta.web}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">CLASS OF VEHICLE: </span>
                <span className="inv-meta-value-upper">{data.meta.classOfVehicle}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">OFFICE MOBILE: </span>
                <span>{data.meta.officeMobile}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">USER NAME: </span>
                <span className="inv-meta-value-upper">{data.meta.userName}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">DATE: </span>
                <span>{data.meta.date}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">CLIENT NAME: </span>
                <span className="inv-meta-value-upper">{data.meta.clientName}</span>
              </div>
              <div className="inv-meta-item">
                <span className="inv-meta-label">INVOICE NO: </span>
                <span className="inv-meta-value-upper">{data.meta.invoiceNo}</span>
              </div>
            </div>

            <table className="inv-table">
              <colgroup>
                <col className="col-w-date" />
                <col className="col-w-desc" />
                <col className="col-w-kmhr" />
                <col className="col-w-amt1" />
                <col className="col-w-ex1" />
                <col className="col-w-amt2" />
                <col className="col-w-ex2" />
                <col className="col-w-amt3" />
                <col className="col-w-total" />
              </colgroup>
              <thead>
                <tr>
                  <th>TRIP DATE</th>
                  <th>DESCRIPTION</th>
                  <th>KM/HR</th>
                  <th>AMOUNT</th>
                  <th>
                    EXTRA
                    <br />
                    KM
                  </th>
                  <th>AMOUNT</th>
                  <th>
                    EXTRA
                    <br />
                    KM
                  </th>
                  <th>AMOUNT</th>
                  <th>
                    TOTAL
                    <br />
                    AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="trip-row">
                    <td>{row.tripDate}</td>
                    <td>{row.description}</td>
                    <td>{row.kmHr}</td>
                    <td>{row.amount1}</td>
                    <td>{row.extraKm1}</td>
                    <td>{row.amount2}</td>
                    <td>{row.extraKm2}</td>
                    <td>{row.amount3}</td>
                    <td className="col-total-amount">{row.totalAmount}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7} rowSpan={2} className="in-words-cell">
                    {data.amountInWords}
                  </td>
                  <td className="summary-label-cell">TOTAL</td>
                  <td className="summary-value-cell">{data.formattedTotal}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="grand-total-cell">
                    <div className="gt-title">GRAND TOTAL</div>
                    <div className="gt-value">{data.formattedTotal}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
