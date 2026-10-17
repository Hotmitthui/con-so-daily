import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

const getClient = () => {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
};

export async function POST(req: Request) {
  try {
    const client = getClient();
    if (!client || !R2_BUCKET) {
      return NextResponse.json(
        { error: "Thiếu cấu hình R2." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const prefix = (formData.get("prefix") || "") as string;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file upload." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const safePrefix = prefix ? prefix.replace(/^\/+/, "").replace(/\s+/g, "") : "";
    const fileName = file.name.replace(/^\/+/, "");
    const key = `${safePrefix}${fileName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type || "application/octet-stream",
      })
    );

    let publicUrl: string | null = null;
    if (R2_PUBLIC_BASE_URL) {
      publicUrl = `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    }

    return NextResponse.json({ key, publicUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload R2 thất bại." },
      { status: 500 }
    );
  }
}
