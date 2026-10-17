import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPass = process.env.ADMIN_UNLOCK_PASSWORD || 'admin123456';

    if (!password || String(password).trim() !== String(expectedPass).trim()) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mở khóa Admin không chính xác!' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: 'Xác thực mật khẩu Admin thành công' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi xác thực mật khẩu' },
      { status: 500 }
    );
  }
}
