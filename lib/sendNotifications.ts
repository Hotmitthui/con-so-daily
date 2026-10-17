import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnon =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseService =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function sendTelegramDirect(payload: { message: string; refId?: string | null; topic?: string }) {
  const { message, refId, topic } = payload;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;

  if (topic === 'loto' && process.env.TELEGRAM_CHAT_ID_LOTO) {
    chatId = process.env.TELEGRAM_CHAT_ID_LOTO;
  }

  if (!token || !chatId) {
    console.error('Thiếu cấu hình Telegram (Token hoặc Chat ID)');
    return { success: false, error: 'Chưa cấu hình Telegram' };
  }

  let targetChatId = chatId;
  if (refId) {
    const client = supabaseAnon || supabaseService;
    if (client) {
      const { data, error } = await client
        .from('ref_telegram_map')
        .select('telegram_chat_id')
        .eq('ref_id', refId)
        .maybeSingle();

      if (error && supabaseService && client !== supabaseService) {
        const fallback = await supabaseService
          .from('ref_telegram_map')
          .select('telegram_chat_id')
          .eq('ref_id', refId)
          .maybeSingle();
        if (fallback.data?.telegram_chat_id) {
          targetChatId = fallback.data.telegram_chat_id;
        }
      } else if (data?.telegram_chat_id) {
        targetChatId = data.telegram_chat_id;
      }
    }
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: targetChatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Lỗi gửi Telegram:', errorData);
    return { success: false, error: 'Lỗi gửi tin nhắn Telegram' };
  }

  return { success: true };
}

export async function sendEmailDirect(body: any) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    console.error('Thiếu cấu hình Gmail (GMAIL_USER hoặc GMAIL_PASS)');
    return { success: false, error: 'Chưa cấu hình Gmail' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  let mailOptions;

  if (body.html && body.subject) {
    mailOptions = {
      from: `"🌸 Web Còn Số" <${user}>`,
      to: user,
      subject: body.subject,
      html: body.html,
    };
  } else {
    const { tenKhachHang, soDienThoai, donHang, tongTien, hinhThucThanhToan } = body;
    const danhSachVeHTML = (donHang || []).map((item: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.kieuGhi}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.chonSo}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${parseInt(item.menhGia).toLocaleString('vi-VN')}đ</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.soTo}</td>
      </tr>
    `).join('');

    mailOptions = {
      from: `"Web Còn Số" <${user}>`,
      to: user,
      subject: `🔥 Đơn hàng mới từ ${tenKhachHang} - ${soDienThoai}`,
      html: `
        <h2>Chi tiết đơn hàng mới</h2>
        <p><strong>Khách hàng:</strong> ${tenKhachHang}</p>
        <p><strong>SĐT:</strong> <a href="tel:${soDienThoai}">${soDienThoai}</a></p>
        <p><strong>Thanh toán:</strong> ${hinhThucThanhToan}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Kiểu ghi</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Số</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Giá</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">SL</th>
          </tr>
          ${danhSachVeHTML}
        </table>
        
        <h3 style="color: #d32f2f;">Tổng tiền: ${(tongTien || 0).toLocaleString('vi-VN')} đ</h3>
      `,
    };
  }

  await transporter.sendMail(mailOptions);
  return { success: true };
}
