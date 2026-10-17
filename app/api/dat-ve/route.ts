import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramDirect, sendEmailDirect } from '@/lib/sendNotifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient(userAgent?: string | null) {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  const clientUserAgent = userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        'user-agent': clientUserAgent,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent');
    const supabase = getSupabaseClient(userAgent);

    if (!supabase) {
      return NextResponse.json({ error: 'Chưa cấu hình Supabase trên Server' }, { status: 500 });
    }

    const body = await request.json();
    const { type } = body; // 'truyen_thong' hoặc 'loto'

    if (type === 'truyen_thong') {
      const {
        mode, // 'normal' | 'tet' | 'admin'
        ngaySo,
        hoTen,
        sdt,
        danhSachDat,
        refId,
        adminPassword,
        hienThiDat,
        totalAmount,
        dateDisplay
      } = body;

      if (!ngaySo || !hoTen || !sdt || !danhSachDat) {
        return NextResponse.json({ error: 'Thiếu thông tin đặt vé truyền thống' }, { status: 400 });
      }

      let dbError: any = null;

      if (mode === 'tet') {
        const args: any = {
          p_ngay_so: ngaySo,
          p_ho_ten: hoTen,
          p_sdt: sdt,
          p_danh_sach_so: danhSachDat,
        };
        if (refId) args.p_ref_id = refId;
        const res = await supabase.rpc('dat_ve_tet', args);
        dbError = res.error;
      } else if (mode === 'admin') {
        if (!adminPassword) {
          return NextResponse.json({ error: 'Mật khẩu Admin là bắt buộc' }, { status: 400 });
        }
        const args: any = {
          p_ngay_so: ngaySo,
          p_ho_ten: hoTen,
          p_sdt: sdt,
          p_danh_sach_so: danhSachDat,
          p_password: adminPassword,
        };
        const res = await supabase.rpc('dat_ve_truyen_thong_admin', args);
        dbError = res.error;
      } else {
        // Normal mode
        const args: any = {
          p_ngay_so: ngaySo,
          p_ho_ten: hoTen,
          p_sdt: sdt,
          p_danh_sach_so: danhSachDat,
        };
        if (refId) args.p_ref_id = refId;
        const res = await supabase.rpc('dat_ve_truyen_thong', args);
        dbError = res.error;
      }

      if (dbError) {
        console.error('Lỗi Supabase RPC (Vé Truyền Thống):', dbError);
        return NextResponse.json({ error: dbError.message || 'Lỗi đặt vé trên Database' }, { status: 400 });
      }

      // --- ĐẶT HÀNG THÀNH CÔNG -> GỬI THÔNG BÁO TELEGRAM & EMAIL ---
      const refLine = refId ? `Ref: ${refId}\n` : '';
      const formattedDate = dateDisplay || ngaySo;
      const formattedTotal = typeof totalAmount === 'number' ? `${totalAmount.toLocaleString('vi-VN')}đ` : '';

      const telegramBody = {
        message: `💸 <b>ĐƠN VÉ SỐ MỚI!</b>\n${refLine}\n👤 Khách: <b>${hoTen}</b>\n📞 SĐT: <code>${sdt}</code>\n📅 Ngày: ${formattedDate}\n🎫 Vé: ${hienThiDat || JSON.stringify(danhSachDat)}\n💰 Tổng: <b>${formattedTotal}</b>`,
        refId,
      };

      const emailBody = {
        subject: `Đơn Vé Số Mới: ${hoTen} - ${sdt}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #7e22ce;">Đơn hàng Vé Số Truyền Thống Mới</h2>
            ${refId ? `<p><strong>Ref:</strong> ${refId}</p>` : ''}
            <p><strong>Khách hàng:</strong> ${hoTen}</p>
            <p><strong>SĐT:</strong> <a href="tel:${sdt}">${sdt}</a></p>
            <p><strong>Ngày xổ:</strong> ${formattedDate}</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Vé đặt:</strong> ${hienThiDat || JSON.stringify(danhSachDat)}</p>
              <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Tổng tiền:</strong> <span style="color: #d946ef; font-weight: bold;">${formattedTotal}</span></p>
            </div>
            <p><em>Vui lòng kiểm tra Supabase và tài khoản ngân hàng.</em></p>
          </div>
        `,
      };

      // Gửi thông báo bất đồng bộ trực tiếp trong RAM (Solution 1: Direct Import)
      await Promise.allSettled([
        sendTelegramDirect(telegramBody),
        sendEmailDirect(emailBody),
      ]);

      return NextResponse.json({ success: true, message: 'Đã đặt vé truyền thống thành công' }, { status: 200 });
    }

    if (type === 'loto') {
      const { ngaySo, hoTen, sdt, chiTietDon, refId, tongTien, orderData, adminPassword, isAdminOverride } = body;

      if (!ngaySo || !hoTen || !sdt || !chiTietDon) {
        return NextResponse.json({ error: 'Thiếu thông tin đặt vé Loto' }, { status: 400 });
      }

      // Kiểm tra khung giờ ngưng nhận vé 15:00 - 16:30
      const now = new Date();
      const vnTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      const vnDate = new Date(vnTimeStr);
      const hour = vnDate.getHours();
      const minute = vnDate.getMinutes();
      const timeInMinutes = hour * 60 + minute;
      const isLockedTime = timeInMinutes >= 900 && timeInMinutes < 990;

      if (isLockedTime || isAdminOverride) {
        const expectedPass = process.env.ADMIN_UNLOCK_PASSWORD || 'admin123456';
        if (!adminPassword || String(adminPassword).trim() !== String(expectedPass).trim()) {
          return NextResponse.json(
            { error: 'Đại lý ngưng nhận vé Loto (15:00 - 16:30). Cần mật khẩu Admin chính xác để mở khóa!' },
            { status: 403 }
          );
        }
      }

      const { error: dbError } = await supabase.rpc('dat_ve_loto', {
        p_ngay_so: ngaySo,
        p_ho_ten: hoTen,
        p_sdt: sdt,
        p_chi_tiet_don: chiTietDon,
        p_ref_id: refId || null,
        p_tong_tien: tongTien,
      });

      if (dbError) {
        console.error('Lỗi Supabase RPC (Vé Loto):', dbError);
        return NextResponse.json({ error: dbError.message || 'Lỗi đặt vé Loto' }, { status: 400 });
      }

      // --- ĐẶT HÀNG THÀNH CÔNG -> GỬI THÔNG BÁO TELEGRAM & EMAIL ---
      const refLine = refId ? `\nRef: ${refId}` : '';
      const adminTag = isAdminOverride || isLockedTime ? '\n🔑 <b>[ĐƠN ADMIN MỞ KHÓA SAU 15H]</b>' : '';
      const formattedTotal = typeof tongTien === 'number' ? `${tongTien.toLocaleString('vi-VN')}đ` : '';

      const chiTietStr = Array.isArray(chiTietDon)
        ? chiTietDon.map((d: any) => `- ${(parseInt(d.menh_gia) || 0).toLocaleString('vi-VN')}đ - ${d.kieu_ghi} - ${d.so} - ${d.so_to} tờ`).join('\n')
        : '';

      const telegramMessage = `🚀 <b>ĐƠN LOTO MỚI!</b>${adminTag}${refLine}\n\n👤 Khách: <b>${hoTen}</b>\n📞 SĐT: <code>${sdt}</code>\n📅 Ngày: <b>${ngaySo}</b>\n💰 Tổng: <b>${formattedTotal}</b>\n\n📝 Chi tiết:\n${chiTietStr}`;

      const telegramPayload = {
        message: telegramMessage,
        refId: refId || null,
        topic: 'loto',
      };

      const emailPayload = orderData || {
        tenKhachHang: hoTen,
        soDienThoai: sdt,
        donHang: chiTietDon.map((d: any) => ({
          kieuGhi: d.kieu_ghi,
          chonSo: d.so,
          menhGia: d.menh_gia,
          soTo: d.so_to,
        })),
        tongTien,
        hinhThucThanhToan: body.hinhThucThanhToan || 'Chuyển khoản',
      };

      // Gửi thông báo bất đồng bộ trực tiếp trong RAM (Solution 1: Direct Import)
      await Promise.allSettled([
        sendTelegramDirect(telegramPayload),
        sendEmailDirect(emailPayload),
      ]);

      return NextResponse.json({ success: true, message: 'Đã đặt vé Loto thành công' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Loại đặt vé không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    console.error('Lỗi xử lý đặt vé:', error);
    return NextResponse.json({ error: error.message || 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
