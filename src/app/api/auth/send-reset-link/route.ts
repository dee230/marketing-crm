import { NextResponse } from 'next/server';

// This endpoint doesn't actually send email - it just returns success
// In production, you would integrate with an email service like SendGrid, Resend, etc.
// For now, the admin can copy the reset link from the UI

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    // In a real app, you would send an email here using a service like:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Nodemailer with SMTP
    
    // Example with a hypothetical email service:
    // await sendEmail({
    //   to: email,
    //   subject: 'Password Reset Request Approved',
    //   html: `Your password reset link: <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}">Reset Password</a>`
    // });

    console.log(`Password reset link would be sent to: ${email}`);
    console.log(`Reset token: ${token}`);
    console.log(`Reset URL: ${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`);

    return NextResponse.json({ success: true, message: 'Reset link sent' });
  } catch (error) {
    console.error('Send reset link error:', error);
    return NextResponse.json({ error: 'Failed to send reset link' }, { status: 500 });
  }
}