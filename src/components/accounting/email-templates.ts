/**
 * Email Templates for Accounting
 * Professional and customizable email templates for payment reminders and overdue notices
 * 
 * Note: This module handles email sending. To enable actual email delivery,
 * install and configure one of: resend, @sendgrid/mail, or nodemailer.
 */

import { formatKES } from '@/lib/currency';

export interface InvoiceEmailData {
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  clientName: string;
  clientEmail: string;
  company?: string;
  description?: string;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY
  );
}

/**
 * Get email service configuration status
 */
export function getEmailConfigStatus(): { configured: boolean; provider: string } {
  if (process.env.RESEND_API_KEY) {
    return { configured: true, provider: 'Resend' };
  }
  if (process.env.SENDGRID_API_KEY) {
    return { configured: true, provider: 'SendGrid' };
  }
  if (process.env.SMTP_HOST) {
    return { configured: true, provider: 'SMTP' };
  }
  return { configured: false, provider: 'None' };
}

/**
 * Payment Reminder Email Template
 * Sent 3 days after due date for pending invoices
 */
export function createReminderEmail(data: InvoiceEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedAmount = formatKES(data.amount);
  const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Payment Reminder - Invoice ${data.invoiceNumber}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Inter', system-ui, sans-serif; background-color: #FDFBF7; color: #2D2A26;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: #E07A5F; border-radius: 12px; line-height: 60px; text-align: center;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h1 style="margin: 20px 0 0 0; font-size: 24px; color: #2D2A26;">Payment Reminder</h1>
    </div>

    <!-- Content Card -->
    <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(45, 42, 38, 0.08);">
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        Dear <strong>${data.clientName}</strong>,
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        This is a friendly reminder that the payment for the following invoice is now due:
      </p>

      <!-- Invoice Details -->
      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Invoice Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Amount Due</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #E07A5F; font-size: 18px;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Due Date</td>
            <td style="padding: 8px 0; text-align: right;">${formattedDueDate}</td>
          </tr>
          ${data.description ? `
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Description</td>
            <td style="padding: 8px 0; text-align: right;">${data.description}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        Please proceed with the payment at your earliest convenience. You can make your payment via:
      </p>

      <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px; line-height: 1.8;">
        <li>M-Pesa to <strong>0712 345 678</strong></li>
        <li>Bank Transfer to <strong>Account Name: Nandi Creative Agency</strong></li>
        <li>Account Number: <strong>1234567890</strong> (Equity Bank)</li>
      </ul>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        If you have already made the payment, please disregard this reminder and kindly send us the payment confirmation.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8E4DD;">
      <p style="margin: 0 0 10px 0; color: #9B9B8F; font-size: 14px;">
        Thank you for your business!
      </p>
      <p style="margin: 0; color: #9B9B8F; font-size: 12px;">
        Nandi Creative Agency | Nairobi, Kenya | info@nandicreative.co.ke
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Payment Reminder - Invoice ${data.invoiceNumber}

Dear ${data.clientName},

This is a friendly reminder that the payment for the following invoice is now due:

Invoice Number: ${data.invoiceNumber}
Amount Due: ${formattedAmount}
Due Date: ${formattedDueDate}
${data.description ? `Description: ${data.description}` : ''}

Please proceed with the payment at your earliest convenience.

Payment Methods:
- M-Pesa to 0712 345 678
- Bank Transfer to Account Name: Nandi Creative Agency
- Account Number: 1234567890 (Equity Bank)

If you have already made the payment, please disregard this reminder and kindly send us the payment confirmation.

Thank you for your business!

Nandi Creative Agency
Nairobi, Kenya
info@nandicreative.co.ke
  `;

  return { subject, html, text };
}

/**
 * Overdue Notice Email Template
 * Sent 5+ days past due date for overdue invoices
 */
export function createOverdueEmail(data: InvoiceEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedAmount = formatKES(data.amount);
  const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const daysOverdue = Math.floor(
    (new Date().getTime() - new Date(data.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const subject = `URGENT: Overdue Invoice ${data.invoiceNumber} - ${daysOverdue} Days Overdue`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Overdue Invoice Notice</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Inter', system-ui, sans-serif; background-color: #FDFBF7; color: #2D2A26;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: #E07A5F; border-radius: 12px; line-height: 60px; text-align: center;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h1 style="margin: 20px 0 0 0; font-size: 24px; color: #E07A5F;">URGENT: Payment Overdue</h1>
    </div>

    <!-- Content Card -->
    <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(45, 42, 38, 0.08); border-left: 4px solid #E07A5F;">
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        Dear <strong>${data.clientName}</strong>,
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        We hope this message finds you well. Unfortunately, we noticed that the payment for the invoice below is now <strong style="color: #E07A5F;">${daysOverdue} days overdue</strong>.
      </p>

      <!-- Invoice Details -->
      <div style="background: #FDFBF7; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Invoice Number</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Amount Outstanding</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #E07A5F; font-size: 18px;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Original Due Date</td>
            <td style="padding: 8px 0; text-align: right;">${formattedDueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9B9B8F; font-size: 14px;">Days Overdue</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #E07A5F;">${daysOverdue} days</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        We kindly request that you settle this outstanding amount as soon as possible to avoid any disruption to our services. Please make your payment via:
      </p>

      <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px; line-height: 1.8;">
        <li>M-Pesa to <strong>0712 345 678</strong></li>
        <li>Bank Transfer to <strong>Account Name: Nandi Creative Agency</strong></li>
        <li>Account Number: <strong>1234567890</strong> (Equity Bank)</li>
      </ul>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        Upon payment, please send us the confirmation via email at <strong>info@nandicreative.co.ke</strong> or WhatsApp at <strong>0712 345 678</strong>.
      </p>

      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
        If you believe this notice is in error or you have already made the payment, please contact us immediately so we can resolve this matter.
      </p>
    </div>

    <!-- Urgent Notice -->
    <div style="background: rgba(224, 122, 95, 0.1); border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #E07A5F; font-weight: 600;">
        Please contact us within 7 days to avoid further action
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8E4DD;">
      <p style="margin: 0 0 10px 0; color: #9B9B8F; font-size: 14px;">
        We value our business relationship and look forward to resolving this matter promptly.
      </p>
      <p style="margin: 0; color: #9B9B8F; font-size: 12px;">
        Nandi Creative Agency | Nairobi, Kenya | info@nandicreative.co.ke | +254 712 345 678
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
URGENT: Overdue Invoice Notice - ${data.invoiceNumber}

Dear ${data.clientName},

We hope this message finds you well. Unfortunately, we noticed that the payment for the invoice below is now ${daysOverdue} days overdue.

Invoice Number: ${data.invoiceNumber}
Amount Outstanding: ${formattedAmount}
Original Due Date: ${formattedDueDate}
Days Overdue: ${daysOverdue} days

We kindly request that you settle this outstanding amount as soon as possible to avoid any disruption to our services.

Payment Methods:
- M-Pesa to 0712 345 678
- Bank Transfer to Account Name: Nandi Creative Agency
- Account Number: 1234567890 (Equity Bank)

Upon payment, please send us the confirmation via email at info@nandicreative.co.ke or WhatsApp at 0712 345 678.

If you believe this notice is in error or you have already made the payment, please contact us immediately so we can resolve this matter.

Please contact us within 7 days to avoid further action.

We value our business relationship and look forward to resolving this matter promptly.

Nandi Creative Agency
Nairobi, Kenya
info@nandicreative.co.ke
+254 712 345 678
  `;

  return { subject, html, text };
}

/**
 * Send email using configured provider
 * Returns success status and optional error message
 * 
 * Note: This is a stub implementation. In production, you would integrate
 * with an email service. Currently returns an error indicating email is not configured.
 */
export async function sendEmail(
  to: string,
  data: { subject: string; html: string; text: string }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Check if email service is configured
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: 'Email service not configured. Please configure SMTP, Resend, or SendGrid in environment variables.',
    };
  }

  // Stub: In production, integrate with actual email service here
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const result = await resend.emails.send({...});

  return {
    success: false,
    error: 'Email service integration not implemented',
  };
}
