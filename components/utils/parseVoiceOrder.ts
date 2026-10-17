/**
 * Utility phân tích câu thoại tiếng Việt đặt vé số truyền thống (2 chữ số 00-99).
 * 
 * Hỗ trợ 3 trường hợp chính:
 * 1. Đọc danh sách số không kèm SL: "cho anh 49 58 37", "chọn 01 05 99" -> [{ num: "49" }, { num: "58" }, { num: "37" }]
 * 2. Đọc số kèm SL đồng nhất: "cho 57 89 23 mỗi số 5v", "57 89 23 mỗi thứ 5 vé" -> [{ num: "57", qty: 5 }, ...]
 * 3. Đọc số kèm SL riêng từng số: "lấy 12 3v, 45 3v, 67 1v", "12 3 vé, 45 3 vé, 67 1 vé" -> [{ num: "12", qty: 3 }, ...]
 */

export interface VoiceOrderItem {
  num: string; // 2 chữ số (vd "49")
  qty?: number; // Số lượng vé mong muốn
}

/**
 * Chuyển các từ đọc số tiếng Việt và cụm từ chỉ vé thành chuỗi đã chuẩn hóa
 */
export function normalizeVietnameseSpeech(text: string): string {
  if (!text) return "";
  let s = text.toLowerCase();

  // Thay thế các ký tự phân cách
  s = s.replace(/[,;.\-\n]+/g, " ");

  // Từ ghép hàng chục & số nhỏ
  const wordToNumMap: Array<[RegExp, string]> = [
    [/\bhai mươi mốt\b/g, "21"],
    [/\bhai mươi hai\b/g, "22"],
    [/\bhai mươi ba\b/g, "23"],
    [/\bhai mươi bốn\b/g, "24"],
    [/\bhai mươi tư\b/g, "24"],
    [/\bhai mươi lăm\b/g, "25"],
    [/\bhai mươi năm\b/g, "25"],
    [/\bhai mươi sáu\b/g, "26"],
    [/\bhai mươi bảy\b/g, "27"],
    [/\bhai mươi tám\b/g, "28"],
    [/\bhai mươi chín\b/g, "29"],
    [/\bhai mươi\b/g, "20"],

    [/\bba mươi mốt\b/g, "31"],
    [/\bba mươi hai\b/g, "32"],
    [/\bba mươi ba\b/g, "33"],
    [/\bba mươi bốn\b/g, "34"],
    [/\bba mươi tư\b/g, "34"],
    [/\bba mươi lăm\b/g, "35"],
    [/\bba mươi sáu\b/g, "36"],
    [/\bba mươi bảy\b/g, "37"],
    [/\bba mươi tám\b/g, "38"],
    [/\bba mươi chín\b/g, "39"],
    [/\bba mươi\b/g, "30"],

    [/\bbốn mươi mốt\b/g, "41"],
    [/\bbốn mươi hai\b/g, "42"],
    [/\bbốn mươi ba\b/g, "43"],
    [/\bbốn mươi bốn\b/g, "44"],
    [/\bbốn mươi tư\b/g, "44"],
    [/\bbốn mươi lăm\b/g, "45"],
    [/\bbốn mươi sáu\b/g, "46"],
    [/\bbốn mươi bảy\b/g, "47"],
    [/\bbốn mươi tám\b/g, "48"],
    [/\bbốn mươi chín\b/g, "49"],
    [/\bbốn mươi\b/g, "40"],

    [/\bnăm mươi mốt\b/g, "51"],
    [/\bnăm mươi hai\b/g, "52"],
    [/\bnăm mươi ba\b/g, "53"],
    [/\bnăm mươi bốn\b/g, "54"],
    [/\bnăm mươi tư\b/g, "54"],
    [/\bnăm mươi lăm\b/g, "55"],
    [/\bnăm mươi sáu\b/g, "56"],
    [/\bnăm mươi bảy\b/g, "57"],
    [/\bnăm mươi tám\b/g, "58"],
    [/\bnăm mươi chín\b/g, "59"],
    [/\bnăm mươi\b/g, "50"],

    [/\bsáu mươi mốt\b/g, "61"],
    [/\bsáu mươi hai\b/g, "62"],
    [/\bsáu mươi ba\b/g, "63"],
    [/\bsáu mươi bốn\b/g, "64"],
    [/\bsáu mươi tư\b/g, "64"],
    [/\bsáu mươi lăm\b/g, "65"],
    [/\bsáu mươi sáu\b/g, "66"],
    [/\bsáu mươi bảy\b/g, "67"],
    [/\bsáu mươi tám\b/g, "68"],
    [/\bsáu mươi chín\b/g, "69"],
    [/\bsáu mươi\b/g, "60"],

    [/\bbảy mươi mốt\b/g, "71"],
    [/\bbảy mươi hai\b/g, "72"],
    [/\bbảy mươi ba\b/g, "73"],
    [/\bbảy mươi bốn\b/g, "74"],
    [/\bbảy mươi tư\b/g, "74"],
    [/\bbảy mươi lăm\b/g, "75"],
    [/\bbảy mươi sáu\b/g, "76"],
    [/\bbảy mươi bảy\b/g, "77"],
    [/\bbảy mươi tám\b/g, "78"],
    [/\bbảy mươi chín\b/g, "79"],
    [/\bbảy mươi\b/g, "70"],

    [/\btám mươi mốt\b/g, "81"],
    [/\btám mươi hai\b/g, "82"],
    [/\btám mươi ba\b/g, "83"],
    [/\btám mươi bốn\b/g, "84"],
    [/\btám mươi tư\b/g, "84"],
    [/\btám mươi lăm\b/g, "85"],
    [/\btám mươi sáu\b/g, "86"],
    [/\btám mươi bảy\b/g, "87"],
    [/\btám mươi tám\b/g, "88"],
    [/\btám mươi chín\b/g, "89"],
    [/\btám mươi\b/g, "80"],

    [/\bchín mươi mốt\b/g, "91"],
    [/\bchín mươi hai\b/g, "92"],
    [/\bchín mươi ba\b/g, "93"],
    [/\bchín mươi bốn\b/g, "94"],
    [/\bchín mươi tư\b/g, "94"],
    [/\bchín mươi lăm\b/g, "95"],
    [/\bchín mươi sáu\b/g, "96"],
    [/\bchín mươi bảy\b/g, "97"],
    [/\bchín mươi tám\b/g, "98"],
    [/\bchín mươi chín\b/g, "99"],
    [/\bchín mươi\b/g, "90"],

    [/\bmười mốt\b/g, "11"],
    [/\bmười hai\b/g, "12"],
    [/\bmười ba\b/g, "13"],
    [/\bmười bốn\b/g, "14"],
    [/\bmười tư\b/g, "14"],
    [/\bmười lăm\b/g, "15"],
    [/\bmười sáu\b/g, "16"],
    [/\bmười bảy\b/g, "17"],
    [/\bmười tám\b/g, "18"],
    [/\bmười chín\b/g, "19"],
    [/\bmười\b/g, "10"],

    [/\bkhông\b/g, "0"],
    [/\bzero\b/g, "0"],
    [/\bmột\b/g, "1"],
    [/\bmốt\b/g, "1"],
    [/\bhai\b/g, "2"],
    [/\bba\b/g, "3"],
    [/\bbốn\b/g, "4"],
    [/\btư\b/g, "4"],
    [/\bnăm\b/g, "5"],
    [/\blăm\b/g, "5"],
    [/\bsáu\b/g, "6"],
    [/\bbảy\b/g, "7"],
    [/\btám\b/g, "8"],
    [/\bchín\b/g, "9"],
  ];

  for (const [pattern, replacement] of wordToNumMap) {
    s = s.replace(pattern, replacement);
  }

  // Chuẩn hóa từ chỉ "vé"
  s = s.replace(/\b(vé|tờ|lá)\b/g, "v");

  return s;
}

/**
 * Main parser function: Trả về danh sách { num: "49", qty: 5 }
 */
export function parseVoiceOrder(transcript: string): VoiceOrderItem[] {
  if (!transcript || !transcript.trim()) return [];

  const norm = normalizeVietnameseSpeech(transcript);
  const items: VoiceOrderItem[] = [];
  const seenNumbers = new Set<string>();

  // Kịch bản 3: Tách từng cặp (số 2 chữ số + số lượng vé)
  // Ví dụ: "12 3v 45 3v 67 1v" hoặc "12 3 v 45 3 v"
  const pairRegex = /\b([0-9]{2})\s+([0-9]{1,2})\s*v\b/gi;
  let pairMatch: RegExpExecArray | null;
  const pairFoundNumbers = new Set<string>();

  while ((pairMatch = pairRegex.exec(norm)) !== null) {
    const num = pairMatch[1].padStart(2, "0");
    const qty = parseInt(pairMatch[2], 10);
    if (num && qty > 0) {
      items.push({ num, qty });
      pairFoundNumbers.add(num);
      seenNumbers.add(num);
    }
  }

  if (items.length > 0) {
    return items;
  }

  // Kịch bản 2: Đồng nhất số lượng ("cho 57 89 23 mỗi số 5v", "57 89 23 mỗi thứ 5 v")
  const uniformMatch = norm.match(/\b(?:mỗi|mỗi thứ|mỗi số|mỗi con|thứ)\s+([0-9]{1,2})\s*v?\b/i) ||
    norm.match(/\b([0-9]{1,2})\s*v?\s+(?:mỗi|mỗi thứ|mỗi số|mỗi con)\b/i);

  let uniformQty: number | undefined;
  if (uniformMatch) {
    const parsedQty = parseInt(uniformMatch[1], 10);
    if (parsedQty > 0 && parsedQty <= 100) {
      uniformQty = parsedQty;
    }
  }

  // Lấy tất cả các chuỗi 2 chữ số tách rời trong câu
  const tokens = norm.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].replace(/[^0-9]/g, "");
    if (token.length === 2) {
      const num = token;
      if (!seenNumbers.has(num)) {
        seenNumbers.add(num);
        items.push({
          num,
          qty: uniformQty,
        });
      }
    }
  }

  return items;
}
