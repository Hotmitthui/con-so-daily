import { NextRequest, NextResponse } from "next/server";
import { queryD1, executeD1 } from "@/lib/d1";

interface TicketRow {
  agency_slug: string;
  ngay_so: string;
  dai_so: string;
  chi_tiet_ve: string;
  trang_thai_khoa: number;
  updated_at: string;
}

// GET: Tải tủ vé của đại lý theo tủ vé, ngày và đài xổ từ Cloudflare D1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencySlug = (searchParams.get("agencySlug") || "").toLowerCase().trim();
    const tuVeId = Math.max(1, Number(searchParams.get("tuVeId")) || 1);
    const ticketDate = searchParams.get("ticketDate");
    const daiSo = searchParams.get("daiSo");

    if (!agencySlug || !ticketDate || !daiSo) {
      return NextResponse.json(
        { success: false, error: "Thiếu tham số agencySlug, ticketDate hoặc daiSo" },
        { status: 400 }
      );
    }

    const rows = await queryD1<TicketRow>(
      `SELECT chi_tiet_ve, trang_thai_khoa, updated_at
       FROM ve_truyen_thong_dly
       WHERE agency_slug = ? AND tu_ve_id = ? AND ngay_so = ? AND dai_so = ?
       LIMIT 1`,
      [agencySlug, tuVeId, ticketDate, daiSo]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const row = rows[0];
    let chiTietVe: Record<string, number> = {};

    try {
      chiTietVe = typeof row.chi_tiet_ve === "string" ? JSON.parse(row.chi_tiet_ve) : row.chi_tiet_ve || {};
    } catch {
      chiTietVe = {};
    }

    return NextResponse.json({
      success: true,
      data: {
        chiTietVe,
        trangThaiKhoa: Boolean(row.trang_thai_khoa),
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("GET /api/quanly/tickets error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: Lưu hoặc cập nhật tủ vé của đại lý vào Cloudflare D1
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agencySlug = String(body.agencySlug || "").toLowerCase().trim();
    const tuVeId = Math.max(1, Number(body.tuVeId) || 1);
    const ticketDate = String(body.ticketDate || "").trim();
    const daiSo = String(body.daiSo || "").trim();
    const rawChiTietVe = body.chiTietVe || {};

    if (!agencySlug || !ticketDate || !daiSo) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin agencySlug, ticketDate hoặc daiSo" },
        { status: 400 }
      );
    }

    // Chuẩn hóa và làm sạch dữ liệu vé:
    // Key phải là chuỗi 6 chữ số (^\d{6}$)
    // Số lượng vé là số nguyên từ 1 đến 16 (mặc định 16)
    const cleanChiTietVe: Record<string, number> = {};
    for (const [key, val] of Object.entries(rawChiTietVe)) {
      const cleanKey = String(key).trim();
      if (/^\d{6}$/.test(cleanKey)) {
        const qty = Math.min(16, Math.max(1, Number(val) || 16));
        cleanChiTietVe[cleanKey] = qty;
      }
    }

    const chiTietVeJson = JSON.stringify(cleanChiTietVe);

    await executeD1(
      `INSERT INTO ve_truyen_thong_dly (agency_slug, tu_ve_id, ngay_so, dai_so, chi_tiet_ve, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(agency_slug, tu_ve_id, ngay_so, dai_so) DO UPDATE SET
         chi_tiet_ve = excluded.chi_tiet_ve,
         updated_at = datetime('now')`,
      [agencySlug, tuVeId, ticketDate, daiSo, chiTietVeJson]
    );

    const totalSeries = Object.keys(cleanChiTietVe).length;
    const totalTickets = Object.values(cleanChiTietVe).reduce((acc, q) => acc + q, 0);

    return NextResponse.json({
      success: true,
      message: `Đã lưu thành công ${totalSeries} lốc số (${totalTickets} vé) cho đại lý ${agencySlug} (Tủ #${tuVeId} - Đài ${daiSo} - Ngày ${ticketDate})!`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("POST /api/quanly/tickets error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
