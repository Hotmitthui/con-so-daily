/**
 * Cloudflare D1 Database Client
 * Tự động hỗ trợ 2 cơ chế:
 * 1. Native Cloudflare D1 Binding (khi deploy trên Cloudflare Pages)
 * 2. Cloudflare D1 REST API (khi chạy ở Local Node.js npm run dev hoặc Vercel)
 */

type D1QueryResult<T = unknown> = {
  results: T[];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
};

function getCloudflareAccountId(): string {
  if (process.env.CF_ACCOUNT_ID) return process.env.CF_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || "";
  const match = endpoint.match(/https:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com/);
  return match ? match[1] : "3fdaafe0e20a9e15370f99486db92bf3";
}

/**
 * Thực thi câu lệnh SELECT trên Cloudflare D1
 */
export async function queryD1<T = unknown>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  // 1. Thử dùng Native Binding nếu đang chạy trên Cloudflare Pages
  try {
    // @ts-expect-error OpenNext Cloudflare runtime binding
    const cfContext = globalThis.__CF_ENV__ || (globalThis as unknown as { env?: { DB?: { prepare: (q: string) => { bind: (...p: unknown[]) => { all: () => Promise<{ results: T[] }> } } } } }).env;
    const db = cfContext?.DB;
    if (db && typeof db.prepare === "function") {
      const stmt = db.prepare(sql).bind(...params);
      const res = await stmt.all();
      return (res.results || []) as T[];
    }
  } catch {
    // Fallback sang REST API
  }

  // 2. Chạy qua Cloudflare D1 REST API (Môi trường Local / Vercel)
  const accountId = getCloudflareAccountId();
  const databaseId = process.env.CF_D1_DATABASE_ID;
  const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (!databaseId || !apiToken) {
    throw new Error("Thiếu cấu hình CF_D1_DATABASE_ID hoặc CF_API_TOKEN trong .env.local!");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare D1 HTTP Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || "Lỗi truy vấn Cloudflare D1";
    throw new Error(msg);
  }

  const queryResult = data.result?.[0] as D1QueryResult<T> | undefined;
  return queryResult?.results || [];
}

/**
 * Thực thi câu lệnh INSERT / UPDATE / DELETE trên Cloudflare D1
 */
export async function executeD1(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<{ success: boolean; changes?: number; lastRowId?: number }> {
  // 1. Thử dùng Native Binding
  try {
    // @ts-expect-error OpenNext Cloudflare runtime binding
    const cfContext = globalThis.__CF_ENV__ || (globalThis as unknown as { env?: { DB?: { prepare: (q: string) => { bind: (...p: unknown[]) => { run: () => Promise<{ success: boolean; meta?: { changes?: number; last_row_id?: number } }> } } } } }).env;
    const db = cfContext?.DB;
    if (db && typeof db.prepare === "function") {
      const stmt = db.prepare(sql).bind(...params);
      const res = await stmt.run();
      return {
        success: res.success,
        changes: res.meta?.changes,
        lastRowId: res.meta?.last_row_id,
      };
    }
  } catch {
    // Fallback sang REST API
  }

  // 2. Chạy qua REST API
  const accountId = getCloudflareAccountId();
  const databaseId = process.env.CF_D1_DATABASE_ID;
  const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (!databaseId || !apiToken) {
    throw new Error("Thiếu cấu hình CF_D1_DATABASE_ID hoặc CF_API_TOKEN trong .env.local!");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare D1 HTTP Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || "Lỗi thực thi Cloudflare D1";
    throw new Error(msg);
  }

  const queryResult = data.result?.[0] as D1QueryResult | undefined;
  return {
    success: queryResult?.success ?? true,
    changes: queryResult?.meta?.changes,
    lastRowId: queryResult?.meta?.last_row_id,
  };
}
