import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Tỷ lệ trả thưởng cho 1 tờ vé (menhGiaNum * ratio)
function getLotoUnitWinPayout(loaiVe: string, kieuGhi: string, menhGiaStr: string): number {
  const menhGia = parseInt(menhGiaStr, 10) || 0;
  if (!menhGia) return 0;

  if (loaiVe === '2 Số') {
    if (kieuGhi === 'Đầu' || kieuGhi === 'Cuối') return menhGia === 10000 ? 700000 : 0;
    if (kieuGhi === 'Đầu/Cuối') return menhGia * 35;
    if (kieuGhi === '18 Lô') return menhGia * 3.9;
  }
  if (loaiVe === '3 Số') {
    if (kieuGhi === 'Đầu' || kieuGhi === 'Cuối') return menhGia === 10000 ? 5000000 : 0;
    if (kieuGhi === 'Đầu/Cuối') return menhGia * 250;
    if (kieuGhi === '7 Lô') return menhGia * 71.5;
    if (kieuGhi === '17 Lô') return menhGia * 30;
  }
  if (loaiVe === '4 Số') {
    if (kieuGhi === '4 Lô') return menhGia * 800;
    if (kieuGhi === '16 Lô') return menhGia * 200;
  }
  return 0;
}

// Lấy danh sách các giải cần so sánh từ 18 giải xổ số
function getPrizesToCheck(loaiVe: string, kieuGhi: string, prizes18: string[]): { prizes: string[]; digits: number } {
  if (!prizes18 || prizes18.length < 18) return { prizes: [], digits: 0 };

  if (loaiVe === '2 Số') {
    const digits = 2;
    if (kieuGhi === 'Đầu') return { prizes: [prizes18[0]], digits };
    if (kieuGhi === 'Cuối') return { prizes: [prizes18[17]], digits };
    if (kieuGhi === 'Đầu/Cuối') return { prizes: [prizes18[0], prizes18[17]], digits };
    if (kieuGhi === '18 Lô') return { prizes: prizes18.slice(0, 18), digits };
  }
  if (loaiVe === '3 Số') {
    const digits = 3;
    if (kieuGhi === 'Đầu') return { prizes: [prizes18[1]], digits };
    if (kieuGhi === 'Cuối') return { prizes: [prizes18[17]], digits };
    if (kieuGhi === 'Đầu/Cuối') return { prizes: [prizes18[1], prizes18[17]], digits };
    if (kieuGhi === '7 Lô') return { prizes: prizes18.slice(6, 13), digits }; // 7 giải tư (indices 6..12)
    if (kieuGhi === '17 Lô') return { prizes: prizes18.slice(1, 18), digits }; // 17 giải (indices 1..17)
  }
  if (loaiVe === '4 Số') {
    const digits = 4;
    if (kieuGhi === '4 Lô') return { prizes: prizes18.slice(2, 6), digits }; // 3 giải sáu + 1 giải năm = 4 giải (indices 2..5)
    if (kieuGhi === '16 Lô') return { prizes: prizes18.slice(2, 18), digits }; // 16 giải (indices 2..17)
  }

  return { prizes: [], digits: 0 };
}

// Kiểm tra 1 mục số Loto trong đơn hàng
function checkItemWinning(item: any, prizes18: string[]) {
  const loaiVe = String(item.loai_ve || item.loaiVe || '');
  const kieuGhi = String(item.kieu_ghi || item.kieuGhi || '');
  const menhGia = String(item.menh_gia || item.menhGia || '');
  const chonSo = String(item.so || item.chonSo || '').trim();
  const soTo = Number(item.so_to || item.soTo || 1);

  const { prizes, digits } = getPrizesToCheck(loaiVe, kieuGhi, prizes18);
  if (!prizes.length || !chonSo || digits === 0) {
    return {
      loai_ve: loaiVe,
      kieu_ghi: kieuGhi,
      menh_gia: menhGia,
      so: chonSo,
      so_to: soTo,
      hitCount: 0,
      unitPayout: 0,
      itemWinAmount: 0,
      matchedPrizes: [],
    };
  }

  const targetSuffix = chonSo.padStart(digits, '0').slice(-digits);
  let hitCount = 0;
  const matchedPrizes: string[] = [];

  prizes.forEach((p) => {
    if (!p) return;
    const pStr = String(p).trim();
    if (pStr.length >= digits && pStr.slice(-digits) === targetSuffix) {
      hitCount += 1;
      matchedPrizes.push(pStr);
    }
  });

  const unitPayout = getLotoUnitWinPayout(loaiVe, kieuGhi, menhGia);
  const itemWinAmount = unitPayout * hitCount * soTo;

  return {
    loai_ve: loaiVe,
    kieu_ghi: kieuGhi,
    menh_gia: menhGia,
    so: chonSo,
    so_to: soTo,
    hitCount,
    unitPayout,
    itemWinAmount,
    matchedPrizes,
  };
}

export async function GET(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Chưa cấu hình Supabase trên Server' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Vui lòng cung cấp tham số date' }, { status: 400 });
    }

    // Format date string
    let dateIso = dateParam.trim(); // YYYY-MM-DD
    let dateVn = dateParam.trim();  // DD/MM/YYYY

    if (dateParam.includes('-')) {
      const parts = dateParam.split('-');
      if (parts.length === 3) {
        dateVn = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    } else if (dateParam.includes('/')) {
      const parts = dateParam.split('/');
      if (parts.length === 3) {
        dateIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // 1. Truy vấn kết quả xổ số từ ket_qua_xo_so (Cột ngay_so trong DB là dạng DATE yyyy-mm-dd)
    let lotteryRow: any = null;

    const { data: kqData, error: kqError } = await supabase
      .from('ket_qua_xo_so')
      .select('ket_qua, dai, ngay_so')
      .eq('ngay_so', dateIso)
      .limit(1);

    if (kqError) {
      console.error('Lỗi lấy kết quả xổ số (eq dateIso):', kqError);
    }

    if (kqData && kqData.length > 0) {
      lotteryRow = kqData[0];
    }

    let prizes18: string[] = [];
    let daiName = '';

    if (lotteryRow && lotteryRow.ket_qua) {
      daiName = lotteryRow.dai || '';
      if (Array.isArray(lotteryRow.ket_qua)) {
        prizes18 = lotteryRow.ket_qua.map((n: any) => String(n));
      } else if (typeof lotteryRow.ket_qua === 'string') {
        try {
          const parsed = JSON.parse(lotteryRow.ket_qua);
          if (Array.isArray(parsed)) prizes18 = parsed.map((n: any) => String(n));
        } catch (e) {}
      }
    }

    // 2. Truy vấn danh sách đơn hàng Loto từ don_hang_loto (Cột ngay_so lưu dạng text dd/mm/yyyy)
    let rawOrders: any[] = [];
    const { data: ordersData, error: ordersError } = await supabase
      .from('don_hang_loto')
      .select('*')
      .eq('ngay_so', dateVn)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Lỗi lấy đơn hàng Loto (eq dateVn):', ordersError);
    }

    if (ordersData && ordersData.length > 0) {
      rawOrders = ordersData;
    } else {
      // Fallback thử tìm bằng dateIso
      const { data: ordersIsoData } = await supabase
        .from('don_hang_loto')
        .select('*')
        .eq('ngay_so', dateIso)
        .order('created_at', { ascending: false });

      if (ordersIsoData) {
        rawOrders = ordersIsoData;
      }
    }
    // 18 giải phải có đủ 18 chuỗi số hợp lệ (không rỗng và chỉ chứa chữ số)
    const validPrizes = prizes18.filter((p) => p && String(p).trim().length > 0 && /^\d+$/.test(String(p).trim()));
    const hasLotteryResult = validPrizes.length >= 18;

    let totalWinningOrders = 0;
    let totalWinningAmount = 0;

    const processedOrders = rawOrders.map((order: any) => {
      let chiTietItems: any[] = [];
      if (Array.isArray(order.chi_tiet_don)) {
        chiTietItems = order.chi_tiet_don;
      } else if (typeof order.chi_tiet_don === 'string') {
        try {
          chiTietItems = JSON.parse(order.chi_tiet_don);
        } catch (e) {}
      }

      let orderWinTotal = 0;
      const checkedItems = chiTietItems.map((item: any) => {
        if (!hasLotteryResult) {
          return {
            loai_ve: item.loai_ve || item.loaiVe || '',
            kieu_ghi: item.kieu_ghi || item.kieuGhi || '',
            menh_gia: String(item.menh_gia || item.menhGia || ''),
            so: String(item.so || item.chonSo || ''),
            so_to: Number(item.so_to || item.soTo || 1),
            hitCount: 0,
            unitPayout: 0,
            itemWinAmount: 0,
            matchedPrizes: [],
          };
        }
        const res = checkItemWinning(item, prizes18);
        orderWinTotal += res.itemWinAmount;
        return res;
      });

      const isWinningOrder = hasLotteryResult && orderWinTotal > 0;
      if (isWinningOrder) {
        totalWinningOrders += 1;
        totalWinningAmount += orderWinTotal;
      }

      return {
        id: order.id,
        created_at: order.created_at,
        ngay_so: order.ngay_so,
        ho_ten: order.ho_ten,
        sdt: order.sdt,
        tong_tien: Number(order.tong_tien || 0),
        ref_id: order.ref_id || null,
        chi_tiet_don: checkedItems,
        isWinningOrder,
        orderWinningAmount: orderWinTotal,
      };
    });

    return NextResponse.json({
      success: true,
      hasLotteryResult,
      dai: daiName,
      dateIso,
      dateVn,
      prizes18,
      summary: {
        totalOrders: rawOrders.length,
        winningOrders: totalWinningOrders,
        totalWinningAmount,
      },
      orders: processedOrders,
    });
  } catch (error: any) {
    console.error('Lỗi API dò kết quả Loto:', error);
    return NextResponse.json({ error: error?.message || 'Lỗi xử lý server' }, { status: 500 });
  }
}
