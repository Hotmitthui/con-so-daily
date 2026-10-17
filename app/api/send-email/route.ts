import { NextResponse } from 'next/server';
import { sendEmailDirect } from '@/lib/sendNotifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await sendEmailDirect(body);
    if (!result.success) {
      return NextResponse.json({ message: result.error || 'Failed to send email' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi gửi mail:', error);
    return NextResponse.json({ message: error?.message || 'Failed to send email' }, { status: 500 });
  }
}