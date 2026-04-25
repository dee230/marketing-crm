import { sqlRaw } from '@/db';

export async function getInvoices() {
  try {
    // Get pending/overdue invoices with client info
    const invoices = await sqlRaw`
      SELECT 
        i.id,
        i.invoice_number,
        i.client_id,
        i.amount,
        i.status,
        i.due_date,
        i.description,
        c.name as client_name,
        c.email as client_email,
        c.company as client_company
      FROM invoices i
      LEFT JOIN clients c ON c.id = i.client_id
      WHERE i.status IN ('sent', 'overdue')
      ORDER BY i.due_date ASC
    `;
    
    return invoices.map((inv: any) => ({
      ...inv,
      client: {
        name: inv.client_name,
        email: inv.client_email,
        company: inv.client_company,
      },
    }));
  } catch (e) {
    console.error('Error fetching pending invoices:', e);
    return [];
  }
}