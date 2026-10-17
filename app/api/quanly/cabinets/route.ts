import { NextRequest, NextResponse } from "next/server";
import { queryD1, executeD1 } from "@/lib/d1";

export interface CabinetItem {
  id: number;
  ten_tu: string;
  dia_chi: string;
  is_default?: boolean;
}

interface AgencyRow {
  agency_slug: string;
  ten_dai_ly: string;
  dia_chi_chinh: string;
  danh_sach_tu: string;
}

// GET: Lấy danh sách tủ vé (chi nhánh) của đại lý từ Cloudflare D1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencySlug = (searchParams.get("agencySlug") || "").toLowerCase().trim();

    if (!agencySlug) {
      return NextResponse.json(
        { success: false, error: "Thiếu tham số agencySlug" },
        { status: 400 }
      );
    }

    const rows = await queryD1<AgencyRow>(
      `SELECT agency_slug, ten_dai_ly, dia_chi_chinh, danh_sach_tu
       FROM dai_ly
       WHERE agency_slug = ?
       LIMIT 1`,
      [agencySlug]
    );

    let cabinets: CabinetItem[] = [];
    let agencyName = agencySlug;
    let mainAddress = "";

    if (rows.length > 0) {
      const row = rows[0];
      agencyName = row.ten_dai_ly || agencySlug;
      mainAddress = row.dia_chi_chinh || "";
      try {
        cabinets = typeof row.danh_sach_tu === "string" ? JSON.parse(row.danh_sach_tu) : row.danh_sach_tu || [];
      } catch {
        cabinets = [];
      }
    }

    // Nếu chưa có tủ nào hoặc đại lý chưa có dòng trong DB -> cấp 1 Tủ chính mặc định
    if (!Array.isArray(cabinets) || cabinets.length === 0) {
      cabinets = [
        {
          id: 1,
          ten_tu: `Tủ chính - ${agencyName}`,
          dia_chi: mainAddress || "Trụ sở chính",
          is_default: true,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        agencySlug,
        agencyName,
        cabinets,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("GET /api/quanly/cabinets error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: Lưu / Cập nhật toàn bộ danh sách tủ vé của đại lý vào Cloudflare D1
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agencySlug = String(body.agencySlug || "").toLowerCase().trim();
    const rawCabinets = body.cabinets;

    if (!agencySlug) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin agencySlug" },
        { status: 400 }
      );
    }

    if (!Array.isArray(rawCabinets) || rawCabinets.length === 0) {
      return NextResponse.json(
        { success: false, error: "Danh sách tủ vé không hợp lệ (phải có ít nhất 1 tủ vé)" },
        { status: 400 }
      );
    }

    // Chuẩn hóa danh sách tủ vé
    const cleanCabinets: CabinetItem[] = rawCabinets.map((cab, index) => ({
      id: Number(cab.id) || index + 1,
      ten_tu: String(cab.ten_tu || `Tủ ${index + 1}`).trim(),
      dia_chi: String(cab.dia_chi || "").trim(),
      is_default: Boolean(cab.is_default),
    }));

    // Đảm bảo có ít nhất 1 tủ là default
    const hasDefault = cleanCabinets.some((c) => c.is_default);
    if (!hasDefault && cleanCabinets.length > 0) {
      cleanCabinets[0].is_default = true;
    }

    const jsonString = JSON.stringify(cleanCabinets);

    // Upsert vào bảng dai_ly trên Cloudflare D1
    await executeD1(
      `INSERT INTO dai_ly (agency_slug, ten_dai_ly, danh_sach_tu, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(agency_slug) DO UPDATE SET
         danh_sach_tu = excluded.danh_sach_tu,
         updated_at = datetime('now')`,
      [agencySlug, agencySlug, jsonString]
    );

    return NextResponse.json({
      success: true,
      message: `Đã lưu danh sách ${cleanCabinets.length} tủ vé cho đại lý ${agencySlug}!`,
      data: {
        cabinets: cleanCabinets,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("POST /api/quanly/cabinets error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
