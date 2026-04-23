import { NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}