import { promises as fs } from "fs";
import path from "path";

export const catalogConfigPath = path.join(process.cwd(), "public", "catalog.json");

export const normalizeList = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;

  return value
    .map((item) => String(item || "").trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index);
};

export const readCatalogConfig = async () => {
  try {
    const raw = await fs.readFile(catalogConfigPath, "utf8");
    const payload = JSON.parse(raw);

    return {
      affiliateCatalogs: normalizeList(payload?.affiliateCatalogs, []),
      affiliateOfferTypes: normalizeList(payload?.affiliateOfferTypes, []),
      affiliateBrands: normalizeList(payload?.affiliateBrands, []),
    };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return {
        affiliateCatalogs: [],
        affiliateOfferTypes: [],
        affiliateBrands: [],
      };
    }

    throw err;
  }
};

export const writeCatalogConfig = async (value) => {
  const nextConfig = {
    affiliateCatalogs: normalizeList(value?.affiliateCatalogs, []),
    affiliateOfferTypes: normalizeList(value?.affiliateOfferTypes, []),
    affiliateBrands: normalizeList(value?.affiliateBrands, []),
  };

  await fs.writeFile(catalogConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

  return nextConfig;
};
