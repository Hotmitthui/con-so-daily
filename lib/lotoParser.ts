// Utility module bóc tách cú pháp tin nhắn ghi vé Loto (Fast Text Message Parser)

export interface ParsedLotoItem {
  loaiVe: string;
  menhGia: string;
  kieuGhi: string;
  chonSo: string;
  soTo: number;
  daiSo?: string;
  ngaySo?: string;
}

export interface ParseLotoResult {
  items: ParsedLotoItem[];
  parsedCount: number;
  errors: string[];
  message: string;
}

// Bảng Từ điển Từ khóa cho Kiểu ghi (Ưu tiên từ cụ thể -> từ ngắn/viết tắt)
const KIEU_GHI_KEYWORDS: { kieuGhi: string; keywords: string[] }[] = [
  { kieuGhi: '18 Lô', keywords: ['18l', '18 lo', '18lo', 'lo 18'] },
  { kieuGhi: '17 Lô', keywords: ['17l', '17 lo', '17lo', 'lo 17'] },
  { kieuGhi: '16 Lô', keywords: ['16l', '16 lo', '16lo', 'lo 16'] },
  { kieuGhi: '7 Lô', keywords: ['7l', '7 lo', '7lo', 'lo 7'] },
  { kieuGhi: '4 Lô', keywords: ['4l', '4 lo', '4lo', 'lo 4'] },
  { kieuGhi: 'Đầu/Cuối', keywords: ['dau cuoi', 'daucuoi', 'd/c', 'd c', 'dc', 'dau va cuoi'] },
  { kieuGhi: 'Đầu', keywords: ['dau', 'g8', 'giai8', 'giai 8', 'd'] },
  { kieuGhi: 'Cuối', keywords: ['cuoi', 'db', 'dacbiet', 'dac biet', 'c'] },
  { kieuGhi: 'BAO_LO', keywords: ['bao lo', 'baolo', 'blo', 'bl', 'b lo', 'lo'] },
];

// Loại bỏ dấu tiếng Việt và chuẩn hóa về chữ thường
export const removeAccents = (str: string): string => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * Quy đổi tổng số tiền ghi (VD: 30k, 100k...) thành các tờ vé mệnh giá hợp lệ (10k, 20k, 50k)
 */
function decomposeAmount(totalAmount: number, loaiVe: string, kieuGhi: string, baseSoTo: number = 1): { menhGia: string; soTo: number }[] {
  // Với 'Đầu' hoặc 'Cuối', duy nhất mệnh giá 10000 được phép ghi. Số tiền > 10k tự động quy thành nhiều tờ 10k.
  if (kieuGhi === 'Đầu' || kieuGhi === 'Cuối') {
    const qty = Math.max(1, Math.round(totalAmount / 10000)) * baseSoTo;
    return [{ menhGia: '10000', soTo: qty }];
  }

  // Với các kiểu ghi khác (Đầu/Cuối, 18 Lô, 17 Lô, 16 Lô, 7 Lô, 4 Lô), phân rã tiền thành 50k, 20k, 10k
  let rem = totalAmount > 0 ? totalAmount : 10000;
  const result: { menhGia: string; soTo: number }[] = [];

  if (rem >= 50000) {
    const count50 = Math.floor(rem / 50000);
    result.push({ menhGia: '50000', soTo: count50 * baseSoTo });
    rem %= 50000;
  }
  if (rem >= 20000) {
    const count20 = Math.floor(rem / 20000);
    result.push({ menhGia: '20000', soTo: count20 * baseSoTo });
    rem %= 20000;
  }
  if (rem >= 10000) {
    const count10 = Math.floor(rem / 10000);
    result.push({ menhGia: '10000', soTo: count10 * baseSoTo });
    rem %= 10000;
  }

  if (result.length === 0) {
    result.push({ menhGia: '10000', soTo: baseSoTo });
  }

  return result;
}

/**
 * Tự động chia tách dòng vé nếu số lượng tờ vượt quá 10 (Max 10 tờ / dòng)
 */
function pushItemWithMaxSoTo(targetArray: ParsedLotoItem[], item: ParsedLotoItem, maxQty: number = 10) {
  let rem = item.soTo;
  if (rem <= maxQty) {
    targetArray.push(item);
    return;
  }

  while (rem > 0) {
    const qty = Math.min(rem, maxQty);
    targetArray.push({
      ...item,
      soTo: qty,
    });
    rem -= qty;
  }
}

export function parseLotoText(
  rawText: string,
  defaultDaiSo?: string,
  defaultNgaySo?: string
): ParseLotoResult {
  if (!rawText || !rawText.trim()) {
    return {
      items: [],
      parsedCount: 0,
      errors: ['Vui lòng nhập hoặc dán nội dung tin nhắn loto.'],
      message: '',
    };
  }

  // Tách văn bản theo các dòng, dấu phẩy, dấu chấm phẩy
  const clauses = rawText
    .split(/[\n;\r,]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const resultItems: ParsedLotoItem[] = [];
  const errorLogs: string[] = [];

  clauses.forEach((clauseText, clauseIndex) => {
    const norm = removeAccents(clauseText);

    // 1. Tìm Mệnh giá rõ ràng nếu người dùng ghi (ví dụ: 50k, 20k, 10k, 50000, 20000, 10000)
    let explicitMenhGia: string | null = null;
    const menhGiaMatch = norm.match(/\b(50k|50000|50\.000|20k|20000|20\.000|10k|10000|10\.000)\b/);
    if (menhGiaMatch) {
      const mgStr = menhGiaMatch[1].replace(/\./g, '');
      if (mgStr.startsWith('50')) explicitMenhGia = '50000';
      else if (mgStr.startsWith('20')) explicitMenhGia = '20000';
      else if (mgStr.startsWith('10')) explicitMenhGia = '10000';
    }

    // 2. Tìm số tờ nhân rõ ràng (x2, x 2, 2 to, 2 ve, 10 to, 10 ve, 19 to, 19 tờ...)
    let explicitSoTo: number | null = null;
    const soToMatch = norm.match(/(?:x|\*|\bto|\bve|\bcai)\s*(\d{1,3})\b|\b(\d{1,3})\s*(?:to|ve|cai)\b|\bx\s*(\d{1,3})/);
    if (soToMatch) {
      const foundQty = parseInt(soToMatch[1] || soToMatch[2] || soToMatch[3], 10);
      if (foundQty > 0 && foundQty <= 500) {
        explicitSoTo = foundQty;
      }
    }

    // 3. Bóc tách Tổng tiền nếu chỉ ghi chung (ví dụ: 30k, 100k...)
    let totalAmount = 10000;
    const kMatch = norm.match(/\b(\d{1,3})\s*(?:k|kđ|kd|d|đ|ngan|ngàn|g)\b|\b(\d{4,6})\b/);
    if (kMatch) {
      const valStr = kMatch[1] || kMatch[2];
      const valNum = parseInt(valStr, 10);
      if (valNum) {
        totalAmount = kMatch[1] ? valNum * 1000 : valNum;
      }
    }

    // 4. Tìm Kiểu ghi từ từ điển (bắt buộc khớp chính xác từ ranh giới \b nếu từ ngắn <= 2 ký tự)
    let rawKieuGhi: string | null = null;
    for (const entry of KIEU_GHI_KEYWORDS) {
      if (
        entry.keywords.some((kw) => {
          const isShort = kw.length <= 2;
          const pattern = isShort ? `\\b${kw}\\b` : `\\b${kw}\\b|\\b${kw}`;
          return new RegExp(pattern, 'i').test(norm);
        })
      ) {
        rawKieuGhi = entry.kieuGhi;
        break;
      }
    }

    // 5. Lọc bỏ các từ tiền & số tờ khỏi chuỗi để trích xuất danh sách các con số Loto
    const cleanClauseForDigits = norm
      .replace(/\b\d{1,3}\s*(?:k|kđ|kd|d|đ|ngan|ngàn|g)\b/g, ' ')
      .replace(/\b(10000|20000|50000|30000|40000|100000|200000|500000)\b/g, ' ')
      .replace(/(?:x|\*|\bto|\bve|\bcai)\s*\d{1,3}\b|\b\d{1,3}\s*(?:to|ve|cai)\b/g, ' ');

    const digitMatches = cleanClauseForDigits.match(/\b\d{2,4}\b/g) || [];
    const uniqueDigits = Array.from(new Set(digitMatches));

    if (uniqueDigits.length === 0) {
      errorLogs.push(`Cụm ${clauseIndex + 1}: "${clauseText}" - Không tìm thấy con số Loto hợp lệ (2, 3 hoặc 4 chữ số).`);
      return;
    }

    // Duyệt qua từng con số Loto được trích xuất
    uniqueDigits.forEach((digitStr) => {
      let loaiVe = '';
      if (digitStr.length === 2) loaiVe = '2 Số';
      else if (digitStr.length === 3) loaiVe = '3 Số';
      else if (digitStr.length === 4) loaiVe = '4 Số';

      if (!loaiVe) return;

      // Áp dụng quy tắc mặc định cho kiểu ghi (Đặc biệt là Bao Lô)
      let resolvedKieuGhi: string = rawKieuGhi || '';
      if (!resolvedKieuGhi || resolvedKieuGhi === 'BAO_LO') {
        if (loaiVe === '2 Số') resolvedKieuGhi = '18 Lô';
        else if (loaiVe === '3 Số') resolvedKieuGhi = '17 Lô';
        else if (loaiVe === '4 Số') resolvedKieuGhi = '16 Lô';
        else resolvedKieuGhi = '18 Lô';
      }

      // Trường hợp 1: Người dùng chỉ định rõ Mệnh giá (VD: 50k) VÀ Số tờ (VD: 19 tờ)
      if (explicitMenhGia && explicitSoTo) {
        let finalMenhGia = explicitMenhGia;
        let finalSoTo = explicitSoTo;

        // Với 'Đầu' hoặc 'Cuối', duy nhất 10k hợp lệ -> tự động quy 50k x 10 tờ = 10k x 50 tờ
        if ((resolvedKieuGhi === 'Đầu' || resolvedKieuGhi === 'Cuối') && explicitMenhGia !== '10000') {
          const mult = parseInt(explicitMenhGia, 10) / 10000;
          finalMenhGia = '10000';
          finalSoTo = explicitSoTo * mult;
        }

        pushItemWithMaxSoTo(resultItems, {
          loaiVe,
          menhGia: finalMenhGia,
          kieuGhi: resolvedKieuGhi,
          chonSo: digitStr,
          soTo: finalSoTo,
          daiSo: defaultDaiSo,
          ngaySo: defaultNgaySo,
        });
      } else {
        // Trường hợp 2: Người dùng ghi tổng tiền (VD: 30k) hoặc không ghi số tờ -> phân rã thành mệnh giá hợp lệ
        const baseSoTo = explicitSoTo || 1;
        const decomposed = decomposeAmount(totalAmount, loaiVe, resolvedKieuGhi, baseSoTo);
        decomposed.forEach((dec) => {
          pushItemWithMaxSoTo(resultItems, {
            loaiVe,
            menhGia: dec.menhGia,
            kieuGhi: resolvedKieuGhi,
            chonSo: digitStr,
            soTo: dec.soTo,
            daiSo: defaultDaiSo,
            ngaySo: defaultNgaySo,
          });
        });
      }
    });
  });

  const parsedCount = resultItems.length;
  const message =
    parsedCount > 0
      ? `Đã nhận diện và bóc tách thành công ${parsedCount} vé loto!`
      : 'Không thể nhận diện được thông tin vé loto từ văn bản.';

  return {
    items: resultItems,
    parsedCount,
    errors: errorLogs,
    message,
  };
}
