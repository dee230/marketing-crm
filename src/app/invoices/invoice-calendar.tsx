'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string | null;
  amount: number;
  status: string;
  dueDate: Date | number | null;
}

interface InvoiceCalendarProps {
  invoices: Invoice[];
}

function getInvoiceDate(invoice: Invoice): Date | null {
  if (!invoice.dueDate) return null;
  if (invoice.dueDate instanceof Date) return invoice.dueDate;
  return new Date(invoice.dueDate);
}

export function InvoiceCalendar({ invoices }: InvoiceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get invoices for this month
  const invoicesByDay = new Map<number, Invoice[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

  for (const invoice of invoices) {
    const invoiceDate = getInvoiceDate(invoice);
    if (invoiceDate) {
      if (invoiceDate.getFullYear() === year && invoiceDate.getMonth() === month) {
        const day = invoiceDate.getDate();
        if (!invoicesByDay.has(day)) {
          invoicesByDay.set(day, []);
        }
        invoicesByDay.get(day)!.push(invoice);
      }
    }
  }

  // Check if invoice is overdue
  const isOverdue = (invoice: Invoice): boolean => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = getInvoiceDate(invoice);
    if (!dueDate) return false;
    return dueDate < fiveDaysAgo;
  };

  // Check if due today
  const isDueToday = (invoice: Invoice): boolean => {
    const dueDate = getInvoiceDate(invoice);
    if (!dueDate) return false;
    const todayStr = today.toDateString();
    return dueDate.toDateString() === todayStr;
  };

  // Get color for invoice status
  const getInvoiceColor = (invoice: Invoice): string => {
    if (invoice.status === 'paid') return '#81B29A'; // Green
    if (invoice.status === 'cancelled') return '#9B9B8F'; // Gray
    if (isOverdue(invoice)) return '#E07A5F'; // Red/Primary - overdue
    if (isDueToday(invoice)) return '#B8923D'; // Yellow/Orange - due today
    if (invoice.status === 'sent') return '#3D405B'; // Dark blue - sent
    return '#9B9B8F'; // Default gray
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24"></div>);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayInvoices = invoicesByDay.get(day) || [];
    const isCurrentDay = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    
    days.push(
      <div 
        key={day} 
        className={`min-h-[80px] p-1 rounded border ${isCurrentDay ? 'border-[#E07A5F] bg-orange-50' : 'border-gray-200'}`}
      >
        <div className={`text-xs font-medium mb-1 ${isCurrentDay ? 'text-[#E07A5F]' : 'text-gray-500'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayInvoices.slice(0, 3).map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="text-xs px-1 py-0.5 rounded truncate block"
              style={{ 
                background: `${getInvoiceColor(invoice)}20`,
                color: getInvoiceColor(invoice),
              }}
              title={`${invoice.invoiceNumber} - ${invoice.clientName || 'N/A'} - KES ${invoice.amount.toLocaleString('en-KE')}`}
            >
              {invoice.invoiceNumber}
            </Link>
          ))}
          {dayInvoices.length > 3 && (
            <div className="text-xs text-gray-400">+{dayInvoices.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#2D2A26' }}>
          Invoice Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: '#E07A5F' }}></span>
          <span style={{ color: '#9B9B8F' }}>Overdue</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: '#B8923D' }}></span>
          <span style={{ color: '#9B9B8F' }}>Due Today</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: '#3D405B' }}></span>
          <span style={{ color: '#9B9B8F' }}>Sent</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: '#81B29A' }}></span>
          <span style={{ color: '#9B9B8F' }}>Paid</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium py-1" style={{ color: '#9B9B8F' }}>
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}