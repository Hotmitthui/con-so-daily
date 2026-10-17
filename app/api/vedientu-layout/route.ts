import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "public", "json", "vedientu-layout.json");

export async function GET() {
  // 1. Khi chạy trên Vercel / Node.js runtime: Đọc từ file JSON trong public/ như cũ
  try {
    const { promises: fs } = await import("fs");
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    if (raw) {
      return NextResponse.json(JSON.parse(raw));
    }
  } catch (fsErr) {
    console.warn("Client/Node fs read failed, falling back to Supabase ve_dien_tu_layout table:", fsErr);
  }

  // 2. Khi chạy trên Cloudflare Workers Edge (không có fs): Đọc từ bảng ve_dien_tu_layout trên Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: rows, error } = await supabase
        .from("ve_dien_tu_layout")
        .select("dai_so, boxes, head_box, card_width, card_height, tail_letter_spacing_px");

      if (!error && Array.isArray(rows) && rows.length > 0) {
        const layoutMap: Record<string, any> = {};
        rows.forEach((row) => {
          if (row.dai_so) {
            layoutMap[row.dai_so] = {
              boxes: row.boxes || [],
              headBox: row.head_box || null,
              cardWidth: Number(row.card_width) || 500,
              cardHeight: Number(row.card_height) || 800,
              tailLetterSpacingPx: Number(row.tail_letter_spacing_px) || 0,
            };
          }
        });
        return NextResponse.json(layoutMap);
      }
    }
  } catch (supaErr) {
    console.error("Error fetching ve_dien_tu_layout from Supabase:", supaErr);
  }

  return NextResponse.json({});
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { daiSo, boxes, headBox, cardWidth, cardHeight, tailLetterSpacingPx } = body || {};

    if (!daiSo || !Array.isArray(boxes)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const safeLetterSpacingPx = Number.isFinite(Number(tailLetterSpacingPx)) ? Number(tailLetterSpacingPx) : 0;

    // 1. Lưu vào file JSON nếu có fs (Vercel/Local)
    try {
      const { promises: fs } = await import("fs");
      const dir = path.dirname(DATA_PATH);
      await fs.mkdir(dir, { recursive: true });
      let data: Record<string, any> = {};
      try {
        const raw = await fs.readFile(DATA_PATH, "utf-8");
        data = raw ? JSON.parse(raw) : {};
      } catch {
        // file chưa tồn tại
      }
      data[daiSo] = { boxes, headBox, cardWidth, cardHeight, tailLetterSpacingPx: safeLetterSpacingPx };
      await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Cannot write to filesystem:", fsErr);
    }

    // 2. Lưu/Cập nhật vào bảng ve_dien_tu_layout trên Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("ve_dien_tu_layout")
          .upsert({
            dai_so: daiSo,
            boxes,
            head_box: headBox,
            card_width: cardWidth,
            card_height: cardHeight,
            tail_letter_spacing_px: safeLetterSpacingPx,
            updated_at: new Date().toISOString(),
          }, { onConflict: "dai_so" });
      }
    } catch (supaErr) {
      console.error("Error upserting ve_dien_tu_layout to Supabase:", supaErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "write_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
