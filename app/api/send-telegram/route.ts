import { NextResponse } from 'next/server';
import { sendTelegramDirect } from '@/lib/sendNotifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await sendTelegramDirect(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi API Telegram:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
