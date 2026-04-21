import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Invoice data types
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  client: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  amount: number;
  status: string;
  dueDate: Date | null;
  paidDate: Date | null;
  description?: string | null;
  items?: InvoiceLineItem[] | null;
  notes?: string | null;
  createdAt: Date;
}

// Brand colors
const COLORS = {
  primary: '#E07A5F',
  text: '#2D2A26',
  muted: '#9B9B8F',
  light: '#FDFBF7',
};

// Pure function to format currency (Kenya Shillings)
const formatCurrency = (amount: number): string => {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Pure function to format date
const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Pure function to generate line items table body
const generateLineItemsTable = (
  doc: jsPDF,
  data: InvoiceData,
  startY: number
): number => {
  const lineItems = data.items && data.items.length > 0 ? data.items : [{ description: data.description || 'Services', quantity: 1, unitPrice: data.amount }];

  autoTable(doc, {
    startY,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: lineItems.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice),
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: '#FFFFFF',
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // @ts-expect-error - autoTable adds finalY property
  return doc.lastAutoTable.finalY + 10;
};

// Pure function to add totals section
const addTotalsSection = (doc: jsPDF, data: InvoiceData, startY: number): number => {
  const lineItems = data.items && data.items.length > 0 ? data.items : [{ description: data.description || 'Services', quantity: 1, unitPrice: data.amount }];
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('Subtotal:', 130, startY, { align: 'right' });
  doc.setTextColor(COLORS.text);
  doc.text(formatCurrency(subtotal), 190, startY, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('Total:', 130, startY + 8, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text(formatCurrency(subtotal), 190, startY + 8, { align: 'right' });

  return startY + 20;
};

// Pure function to add header
const addHeader = (doc: jsPDF, data: InvoiceData): void => {
  // Company name
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('Nandi Creative', 20, 25);

  // Invoice label
  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('INVOICE', 190, 25, { align: 'right' });

  // Invoice number
  doc.setFontSize(12);
  doc.setTextColor(COLORS.text);
  doc.text(data.invoiceNumber, 190, 32, { align: 'right' });
};

// Pure function to add client info
const addClientInfo = (doc: jsPDF, data: InvoiceData, startY: number): number => {
  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('Bill To:', 20, startY);

  doc.setFontSize(12);
  doc.setTextColor(COLORS.text);
  doc.text(data.client.name, 20, startY + 7);

  if (data.client.company) {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.text(data.client.company, 20, startY + 14);
  }

  if (data.client.email) {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted);
    doc.text(data.client.email, 20, startY + (data.client.company ? 21 : 14));
  }

  if (data.client.phone) {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted);
    doc.text(data.client.phone, 20, startY + (data.client.company ? 28 : 21));
  }

  return startY + 35;
};

// Pure function to add invoice meta
const addInvoiceMeta = (doc: jsPDF, data: InvoiceData, startY: number): void => {
  const metaY = startY + 10;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('Status:', 130, metaY);
  doc.setTextColor(COLORS.text);
  doc.text(data.status.toUpperCase(), 190, metaY, { align: 'right' });

  doc.setTextColor(COLORS.muted);
  doc.text('Issue Date:', 130, metaY + 7);
  doc.setTextColor(COLORS.text);
  doc.text(formatDate(data.createdAt), 190, metaY + 7, { align: 'right' });

  doc.setTextColor(COLORS.muted);
  doc.text('Due Date:', 130, metaY + 14);
  doc.setTextColor(COLORS.text);
  doc.text(formatDate(data.dueDate), 190, metaY + 14, { align: 'right' });

  if (data.paidDate) {
    doc.setTextColor(COLORS.muted);
    doc.text('Paid Date:', 130, metaY + 21);
    doc.setTextColor(COLORS.text);
    doc.text(formatDate(data.paidDate), 190, metaY + 21, { align: 'right' });
  }
};

// Pure function to add notes
const addNotes = (doc: jsPDF, data: InvoiceData, startY: number): number => {
  if (!data.notes) return startY;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text('Notes:', 20, startY);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  const lines = doc.splitTextToSize(data.notes, 170);
  doc.text(lines, 20, startY + 7);

  return startY + 7 + lines.length * 5;
};

// Main function to generate PDF
export const generateInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  
  addHeader(doc, data);
  
  let currentY = 50;
  currentY = addClientInfo(doc, data, currentY);
  addInvoiceMeta(doc, data, currentY);
  
  currentY = 80;
  currentY = generateLineItemsTable(doc, data, currentY);
  currentY = addTotalsSection(doc, data, currentY);
  addNotes(doc, data, currentY);

  return doc;
};

// Download helper
export const downloadInvoicePDF = (data: InvoiceData): void => {
  const doc = generateInvoicePDF(data);
  doc.save(`${data.invoiceNumber}.pdf`);
};