import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseReadClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseWriteClient =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const normalizeBrandName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export async function GET(req) {
  try {
    if (!supabaseReadClient) {
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const catalog = String(searchParams.get("catalog") || "").trim();
    const keyword = String(searchParams.get("q") || "").trim();

    let query = supabaseReadClient
      .from("affiliate")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (catalog) {
      query = query.eq("catalog", catalog);
    }

    if (keyword) {
      query = query.or(
        [
          `title.ilike.%${keyword}%`,
          `brand.ilike.%${keyword}%`,
          `platform.ilike.%${keyword}%`,
          `catalog.ilike.%${keyword}%`,
          `offer_type.ilike.%${keyword}%`,
        ].join(",")
      );
    }

    const [{ data, error }, { data: brandRows, error: brandError }] = await Promise.all([
      query,
      supabaseReadClient.from("affiliate_brands").select("brand_name, logo_url"),
    ]);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Không tải được danh sách affiliate." },
        { status: 500 }
      );
    }

    if (brandError) {
      return NextResponse.json(
        { error: brandError.message || "Không tải được danh sách brand affiliate." },
        { status: 500 }
      );
    }

    const brandLogoMap = new Map();
    (brandRows || []).forEach((row) => {
      const normalizedBrandName = normalizeBrandName(row?.brand_name);
      if (!normalizedBrandName) return;
      brandLogoMap.set(normalizedBrandName, String(row?.logo_url || "").trim() || null);
    });

    const enrichedRows = (data || []).map((row) => ({
      ...row,
      brand_logo_url: brandLogoMap.get(normalizeBrandName(row?.brand)) || null,
    }));

    return NextResponse.json({ data: enrichedRows });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Không tải được danh sách affiliate." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    if (!supabaseWriteClient) {
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
    }

    const body = await req.json();
    const slug = String(body?.slug || "").trim();

    if (!slug) {
      return NextResponse.json({ error: "Thiếu slug affiliate." }, { status: 400 });
    }

    const updates = {};
    const coverImage =
      body?.coverImage && typeof body.coverImage === "object" ? body.coverImage : null;

    if (typeof body?.isActive === "boolean") {
      updates.is_active = body.isActive;
    }

    if (Number.isFinite(Number(body?.sortOrder))) {
      updates.sort_order = Number(body.sortOrder);
    }

    if (coverImage) {
      const nextImageKey = String(coverImage.key || "").trim();
      const nextImageUrl = String(coverImage.url || "").trim();

      if (!nextImageKey || !nextImageUrl) {
        return NextResponse.json({ error: "Thiếu dữ liệu ảnh đại diện." }, { status: 400 });
      }

      updates.image_key = nextImageKey;
      updates.image_url = nextImageUrl;
      updates.file_name = String(coverImage.fileName || "").trim() || null;
      updates.mime_type = String(coverImage.mimeType || "").trim() || null;
      updates.file_size = Number.isFinite(Number(coverImage.fileSize)) ? Number(coverImage.fileSize) : null;
      updates.width = Number.isFinite(Number(coverImage.width)) ? Number(coverImage.width) : null;
      updates.height = Number.isFinite(Number(coverImage.height)) ? Number(coverImage.height) : null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseWriteClient
      .from("affiliate")
      .update(updates)
      .eq("slug", slug)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Cập nhật affiliate thất bại." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Cập nhật affiliate thất bại." },
      { status: 500 }
    );
  }
}
