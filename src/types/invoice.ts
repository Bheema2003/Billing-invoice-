export interface InvoiceMeta {
  vehicleNo: string;
  web: string;
  classOfVehicle: string;
  officeMobile: string;
  userName: string;
  date: string;
  clientName: string;
  invoiceNo: string;
}

export interface TripRow {
  id: string;
  tripDate: string;
  description: string;
  kmHr: string;
  amount1: string;
  extraKm1: string;
  amount2: string;
  extraKm2: string;
  amount3: string;
  totalAmount: string;
}

export interface FormattedTripRow {
  id: string;
  tripDate: string;
  description: string;
  kmHr: string;
  amount1: string;
  extraKm1: string;
  amount2: string;
  extraKm2: string;
  amount3: string;
  totalAmount: string;
}

export interface InvoiceData {
  meta: InvoiceMeta;
  rows: FormattedTripRow[];
  grandTotal: number;
  formattedTotal: string;
  amountInWords: string;
}
