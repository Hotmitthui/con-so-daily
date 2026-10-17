const EXTRA_CHAR_MAP = {
  đ: "d",
  Đ: "D",
  ð: "d",
  Ð: "D",
  þ: "th",
  Þ: "TH",
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  ħ: "h",
  Ħ: "H",
  ŋ: "n",
  Ŋ: "N",
  ĸ: "k",
};

const transliterateExtraChars = (value) =>
  Array.from(value)
    .map((char) => EXTRA_CHAR_MAP[char] ?? char)
    .join("");

export const toSafeSlug = (value) =>
  transliterateExtraChars(String(value || ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
