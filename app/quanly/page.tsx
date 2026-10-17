"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Hash,
  Layers,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Save,
  Search,
  Store,
  Trash2,
  Calendar,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useSpeechToNumber } from "@/components/hooks/useSpeechToNumber";
import DatePickerVN from "@/components/DatePickerVN";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const getTodayInVietnam = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

const VIETNAMESE_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const formatVietnameseDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  const dayName = VIETNAMESE_DAYS[dateObj.getDay()] || "";
  return `${dayName}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

const getRelativeDateString = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
};

// Danh sách đài xổ mặc định theo thứ (fallback khi chưa load từ bảng daiso)
// 0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7 (khớp với Date.getDay())
const DEFAULT_DAI_SO_BY_DAY: Record<number, string[]> = {
  1: ["TP.HCM", "Cà Mau", "Đồng Tháp"],
  2: ["Bến Tre", "Bạc Liêu", "Vũng Tàu"],
  3: ["Đồng Nai", "Cần Thơ", "Sóc Trăng"],
  4: ["Tây Ninh", "An Giang", "Bình Thuận"],
  5: ["Vĩnh Long", "Trà Vinh", "Bình Dương"],
  6: ["TP.HCM", "Long An", "Hậu Giang", "Bình Phước"],
  0: ["Tiền Giang", "Kiên Giang", "Lâm Đồng (Đà Lạt)"],
};

// Đài xổ mặc định cho mỗi ngày
const DEFAULT_STATION_BY_DAY: Record<number, string> = {
  1: "Đồng Tháp",
  2: "Vũng Tàu",
  3: "Sóc Trăng",
  4: "Bình Thuận",
  5: "Bình Dương",
  6: "Bình Phước",
  0: "Lâm Đồng",
};

const findPreferredStation = (stations: string[], day: number): string => {
  if (!stations || stations.length === 0) return "";
  const preferredName = DEFAULT_STATION_BY_DAY[day];
  if (!preferredName) return stations[0] || "";

  // 1. Khớp chính xác
  const exact = stations.find((s) => s.toLowerCase() === preferredName.toLowerCase());
  if (exact) return exact;

  // 2. Khớp một phần
  const partial = stations.find(
    (s) =>
      s.toLowerCase().includes(preferredName.toLowerCase()) ||
      preferredName.toLowerCase().includes(s.toLowerCase())
  );
  if (partial) return partial;

  // 3. Fallback lấy đài đầu tiên
  return stations[0] || "";
};

const getDayOfWeekFromDate = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return new Date(year, month - 1, day).getDay();
};

// Danh sách các số thuộc lốc/đầu số K (tổng 2 chữ số mod 10 = K)
// VD: K = 0 (Lốc 00): 00, 19, 28, 37, 46, 55, 64, 73, 82, 91
// VD: K = 1 (Lốc 01): 01, 10, 29, 38, 47, 56, 65, 74, 83, 92
const getHeadNumbers = (headKey: number): string[] => {
  const list: string[] = [];
  for (let i = 0; i <= 99; i++) {
    const tens = Math.floor(i / 10);
    const units = i % 10;
    if ((tens + units) % 10 === headKey) {
      list.push(String(i).padStart(2, "0"));
    }
  }
  return list;
};

// Mảng số lượng vé từ 1 đến 16
const QUANTITY_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);

interface CabinetItem {
  id: number;
  ten_tu: string;
  dia_chi: string;
  is_default?: boolean;
}

const subscribeToHostname = () => () => { };

const getAgencySlugFromHostname = () => {
  if (typeof window === "undefined") return "demo";
  const hostname = window.location.hostname.toLowerCase();
  const suffix = ".con-so.io.vn";
  if (!hostname.endsWith(suffix)) return "demo";
  const subdomain = hostname.slice(0, -suffix.length);
  return subdomain && !subdomain.includes(".") ? subdomain : "demo";
};

const DEMO_AGENCIES = [
  { slug: "hotmit", name: "Đại lý Hột Mít" },
  { slug: "tanbinh", name: "Đại lý Tân Bình" },
  { slug: "quan1", name: "Đại lý Quận 1" },
  { slug: "thuduc", name: "Đại lý Thủ Đức" },
  { slug: "binhthanh", name: "Đại lý Bình Thạnh" },
];

export default function AgencyManagementPage() {
  const detectedAgencySlug = useSyncExternalStore(
    subscribeToHostname,
    getAgencySlugFromHostname,
    () => "demo"
  );
  // Nếu đang ở local/demo (không có subdomain), cho phép chọn giữa 5 đại lý mẫu
  const [selectedDemoSlug, setSelectedDemoSlug] = useState("hotmit");
  const isRealDomain = detectedAgencySlug !== "demo";
  const agencySlug = isRealDomain ? detectedAgencySlug : selectedDemoSlug;

  // Quản lý Tủ vé (chi nhánh / điểm bán) của đại lý
  const [cabinets, setCabinets] = useState<CabinetItem[]>([
    { id: 1, ten_tu: "Tủ chính", dia_chi: "Trụ sở chính", is_default: true },
  ]);
  const [selectedCabinetId, setSelectedCabinetId] = useState<number>(1);
  const [isLoadingCabinets, setIsLoadingCabinets] = useState(false);
  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<CabinetItem | null>(null);
  const [cabinetFormName, setCabinetFormName] = useState("");
  const [cabinetFormAddress, setCabinetFormAddress] = useState("");
  const [cabinetFormDefault, setCabinetFormDefault] = useState(false);
  const [isSavingCabinet, setIsSavingCabinet] = useState(false);

  const [ticketDate, setTicketDate] = useState(getTodayInVietnam);
  const [dbDaiSoMap, setDbDaiSoMap] = useState<Record<number, string[]>>({});
  const [isFromDatabase, setIsFromDatabase] = useState(false);
  const [selectedDaiSo, setSelectedDaiSo] = useState<string>("");

  // Map vé 6 số: Key là chuỗi 6 chữ số (vd: "121201"), Value là số lượng vé (từ 1 đến 16)
  const [tickets, setTickets] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Nhập tay
  const [manualTail, setManualTail] = useState("");
  const [manualHead, setManualHead] = useState("");
  const [manualEntryPreview, setManualEntryPreview] = useState<{
    title: string;
    value: string;
    description: string;
    tone: "success" | "error";
  } | null>(null);

  // Tìm kiếm / lọc trong danh sách vé
  const [searchFilter, setSearchFilter] = useState("");
  const [notice, setNotice] = useState("");

  const manualTailRef = useRef<HTMLInputElement>(null);
  const manualHeadRef = useRef<HTMLInputElement>(null);
  const processedVoiceTicketsRef = useRef<Set<string>>(new Set());
  const resetTranscriptRef = useRef<() => void>(() => { });

  // Tải danh sách đài xổ từ bảng public.daiso
  useEffect(() => {
    if (!supabase) return;
    let isCancelled = false;

    const fetchDaiSo = async () => {
      try {
        const { data, error } = await supabase
          .from("daiso")
          .select("thu, ten_dai, thu_tu")
          .order("thu_tu", { ascending: true });

        if (!error && data && data.length > 0 && !isCancelled) {
          const map: Record<number, string[]> = {};
          data.forEach((row: { thu: number; ten_dai: string }) => {
            if (!map[row.thu]) map[row.thu] = [];
            map[row.thu].push(row.ten_dai);
          });
          setDbDaiSoMap(map);
          setIsFromDatabase(true);
        }
      } catch (err) {
        console.warn("Lỗi tải đài xổ từ bảng daiso:", err);
      }
    };

    fetchDaiSo();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Tính thứ trong tuần và danh sách đài tương ứng cho ngày được chọn
  const currentDayOfWeek = useMemo(() => getDayOfWeekFromDate(ticketDate), [ticketDate]);

  const availableStations = useMemo(() => {
    return dbDaiSoMap[currentDayOfWeek] || DEFAULT_DAI_SO_BY_DAY[currentDayOfWeek] || [];
  }, [dbDaiSoMap, currentDayOfWeek]);

  // Đài mặc định của ngày hiện tại (nằm đầu tiên bên trái)
  const defaultStation = useMemo(() => {
    return findPreferredStation(availableStations, currentDayOfWeek);
  }, [availableStations, currentDayOfWeek]);

  // Các đài phụ còn lại trong ngày (kích thước nhỏ hơn, nằm sau)
  const otherStations = useMemo(() => {
    return availableStations.filter((s) => s !== defaultStation);
  }, [availableStations, defaultStation]);

  // Tủ vé hiện tại đang được chọn
  const activeCabinet = useMemo(() => {
    return cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0];
  }, [cabinets, selectedCabinetId]);

  // Quản lý trạng thái kết nối Cloudflare D1
  const [d1Status, setD1Status] = useState<"loading" | "connected" | "error">("loading");

  // Tải danh sách Tủ vé của đại lý từ Cloudflare D1 khi đổi đại lý
  const loadCabinets = useCallback(async () => {
    if (!agencySlug) return;
    setIsLoadingCabinets(true);
    setD1Status("loading");
    try {
      const res = await fetch(`/api/quanly/cabinets?agencySlug=${agencySlug}`);
      const json = await res.json();
      if (json.success && json.data) {
        const list: CabinetItem[] = json.data.cabinets || [];
        if (list.length > 0) {
          setCabinets(list);
          const defaultCab = list.find((c) => c.is_default) || list[0];
          setSelectedCabinetId(defaultCab.id);
        }
        setD1Status("connected");
      } else {
        setD1Status("error");
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách tủ vé từ D1:", err);
      setD1Status("error");
    } finally {
      setIsLoadingCabinets(false);
    }
  }, [agencySlug]);

  useEffect(() => {
    loadCabinets();
  }, [loadCabinets]);

  // Khi đổi ngày vé hoặc vừa tải đài xong, tự động chọn đài mặc định ưu tiên của ngày đó
  useEffect(() => {
    if (defaultStation) {
      setSelectedDaiSo(defaultStation);
    } else if (availableStations.length > 0) {
      setSelectedDaiSo(availableStations[0]);
    } else {
      setSelectedDaiSo("");
    }
  }, [ticketDate, defaultStation]);

  // Đảm bảo selectedDaiSo luôn hợp lệ khi danh sách đài có cập nhật
  useEffect(() => {
    if (availableStations.length > 0) {
      if (!selectedDaiSo || !availableStations.includes(selectedDaiSo)) {
        setSelectedDaiSo(defaultStation || availableStations[0]);
      }
    } else {
      setSelectedDaiSo("");
    }
  }, [availableStations, defaultStation, selectedDaiSo]);

  // Tự động tải tủ vé từ Cloudflare D1 khi đổi đại lý, tủ vé cụ thể, ngày vé, hoặc đài xổ
  useEffect(() => {
    if (!agencySlug || !ticketDate || !selectedDaiSo || !selectedCabinetId) return;
    let isCancelled = false;
    setIsLoadingTickets(true);

    const loadTickets = async () => {
      try {
        const res = await fetch(
          `/api/quanly/tickets?agencySlug=${agencySlug}&tuVeId=${selectedCabinetId}&ticketDate=${ticketDate}&daiSo=${encodeURIComponent(selectedDaiSo)}`
        );
        const json = await res.json();
        if (!isCancelled && json.success) {
          if (json.data && json.data.chiTietVe) {
            setTickets(json.data.chiTietVe as Record<string, number>);
            const count = Object.keys(json.data.chiTietVe).length;
            setNotice(`Đã tải ${count} lốc vé cho ${activeCabinet?.ten_tu || "Tủ"} (Đài ${selectedDaiSo}).`);
          } else {
            // Chưa có vé lưu cho tủ này ngày này
            setTickets({});
            setNotice("");
          }
        }
      } catch (err) {
        console.warn("Lỗi tải tủ vé từ D1:", err);
      } finally {
        if (!isCancelled) setIsLoadingTickets(false);
      }
    };

    loadTickets();
    return () => {
      isCancelled = true;
    };
  }, [agencySlug, selectedCabinetId, ticketDate, selectedDaiSo, activeCabinet?.ten_tu]);

  // Phân nhóm các vé theo 2 số cuối (Đầu số: 00 - 99)
  const ticketsByHead = useMemo(() => {
    const map: Record<string, { fullNumber: string; tail: string; qty: number }[]> = {};
    for (const [fullNumber, qty] of Object.entries(tickets)) {
      if (/^\d{6}$/.test(fullNumber)) {
        const tail = fullNumber.slice(0, 4); // 4 số đầu
        const head = fullNumber.slice(4, 6); // 2 số cuối (đầu số)
        if (!map[head]) map[head] = [];
        map[head].push({ fullNumber, tail, qty });
      }
    }
    return map;
  }, [tickets]);

  // Thống kê tổng số lốc và tổng số vé
  const totalSeriesCount = useMemo(() => Object.keys(tickets).length, [tickets]);
  const totalTicketsCount = useMemo(() => {
    return Object.values(tickets).reduce((sum, q) => sum + (Number(q) || 0), 0);
  }, [tickets]);

  // Nhóm các lốc vé theo Đầu số cho hiển thị cột (có lọc theo tìm kiếm)
  const groupedFilteredHeads = useMemo(() => {
    const heads = Object.keys(ticketsByHead).sort();
    const result: {
      head: string;
      items: { fullNumber: string; tail: string; qty: number }[];
      totalQty: number;
    }[] = [];

    for (const head of heads) {
      let items = ticketsByHead[head] || [];
      if (searchFilter.trim()) {
        const cleanSearch = searchFilter.trim();
        items = items.filter((it) => it.fullNumber.includes(cleanSearch));
      }
      if (items.length > 0) {
        const totalQty = items.reduce((s, it) => s + it.qty, 0);
        result.push({ head, items, totalQty });
      }
    }

    return result;
  }, [ticketsByHead, searchFilter]);

  // Xử lý mở Modal Thêm Tủ Mới
  const handleOpenCreateCabinet = () => {
    setEditingCabinet(null);
    setCabinetFormName("");
    setCabinetFormAddress("");
    setCabinetFormDefault(cabinets.length === 0);
    setIsCabinetModalOpen(true);
  };

  // Xử lý mở Modal Chỉnh Sửa Tủ
  const handleOpenEditCabinet = (cab: CabinetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCabinet(cab);
    setCabinetFormName(cab.ten_tu);
    setCabinetFormAddress(cab.dia_chi || "");
    setCabinetFormDefault(Boolean(cab.is_default));
    setIsCabinetModalOpen(true);
  };

  // Lưu form Tủ vé lên Cloudflare D1
  const handleSaveCabinetForm = async () => {
    if (!cabinetFormName.trim()) {
      alert("Vui lòng nhập tên tủ vé!");
      return;
    }

    setIsSavingCabinet(true);
    try {
      let updatedList: CabinetItem[] = [];

      if (editingCabinet) {
        // Cập nhật tủ hiện có
        updatedList = cabinets.map((c) => {
          if (c.id === editingCabinet.id) {
            return {
              ...c,
              ten_tu: cabinetFormName.trim(),
              dia_chi: cabinetFormAddress.trim(),
              is_default: cabinetFormDefault,
            };
          }
          return cabinetFormDefault ? { ...c, is_default: false } : c;
        });
      } else {
        // Thêm tủ mới (ID tự tăng)
        const newId = Math.max(0, ...cabinets.map((c) => c.id)) + 1;
        const newCab: CabinetItem = {
          id: newId,
          ten_tu: cabinetFormName.trim(),
          dia_chi: cabinetFormAddress.trim(),
          is_default: cabinetFormDefault || cabinets.length === 0,
        };

        updatedList = cabinetFormDefault
          ? [...cabinets.map((c) => ({ ...c, is_default: false })), newCab]
          : [...cabinets, newCab];
      }

      const res = await fetch("/api/quanly/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencySlug,
          cabinets: updatedList,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCabinets(updatedList);
        if (editingCabinet) {
          setSelectedCabinetId(editingCabinet.id);
        } else {
          // Tự chọn tủ vừa tạo
          const created = updatedList[updatedList.length - 1];
          if (created) setSelectedCabinetId(created.id);
        }
        setIsCabinetModalOpen(false);
        setNotice("✅ Đã cập nhật danh sách tủ vé thành công!");
      } else {
        alert(json.error || "Không thể lưu tủ vé!");
      }
    } catch (err) {
      alert("Lỗi kết nối khi lưu tủ vé!");
    } finally {
      setIsSavingCabinet(false);
    }
  };

  // Xóa 1 Tủ vé
  const handleDeleteCabinet = async (cabinetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cabinets.length <= 1) {
      alert("Đại lý phải có ít nhất 1 tủ vé!");
      return;
    }

    const cabToDelete = cabinets.find((c) => c.id === cabinetId);
    if (!window.confirm(`Bạn có chắc muốn xóa "${cabToDelete?.ten_tu || "Tủ vé"}"?`)) {
      return;
    }

    let nextCabinets = cabinets.filter((c) => c.id !== cabinetId);
    if (cabToDelete?.is_default && nextCabinets.length > 0) {
      nextCabinets[0].is_default = true;
    }

    try {
      const res = await fetch("/api/quanly/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencySlug,
          cabinets: nextCabinets,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCabinets(nextCabinets);
        if (selectedCabinetId === cabinetId) {
          setSelectedCabinetId(nextCabinets[0]?.id || 1);
        }
        setNotice(`Đã xóa tủ "${cabToDelete?.ten_tu}".`);
      } else {
        alert(json.error || "Không thể xóa tủ vé!");
      }
    } catch {
      alert("Lỗi kết nối khi xóa tủ vé!");
    }
  };

  // Xử lý nhập tay 4 số đuôi
  const handleManualTailChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setManualTail(cleanValue);
    if (cleanValue.length === 4) {
      manualHeadRef.current?.focus();
      manualHeadRef.current?.select();
    }
  };

  // Xử lý nhập tay 2 số đầu -> ghép thành 6 số và kiểm tra trùng
  const handleManualHeadChange = (value: string) => {
    const cleanHead = value.replace(/[^0-9]/g, "").slice(0, 2);
    setManualHead(cleanHead);
    if (cleanHead.length !== 2) return;
    if (manualTail.length < 4) {
      manualTailRef.current?.focus();
      return;
    }

    const head = cleanHead.padStart(2, "0");
    const tail = manualTail.padStart(4, "0").slice(-4);
    const fullNumber = `${tail}${head}`;

    // QUY TẮC NGHIỆP VỤ: Nếu đã tồn tại vé 6 số -> BÁO LỖI, KHÔNG CỘNG DỒN
    if (tickets[fullNumber] !== undefined) {
      setManualHead("");
      setManualTail("");
      setManualEntryPreview({
        title: "Số đã tồn tại",
        value: `${tail} ${head}`,
        description: `Dãy 6 số này đã có trong tủ ${activeCabinet?.ten_tu || ""} (tối đa 16 vé/lốc, không cộng dồn)!`,
        tone: "error",
      });
      return;
    }

    // Chưa có -> thêm mới với số lượng mặc định 16 vé
    setTickets((prev) => ({ ...prev, [fullNumber]: 16 }));
    setManualHead("");
    setManualTail("");
    setManualEntryPreview({
      title: "Thêm thành công",
      value: `${tail} ${head}`,
      description: `Đã thêm lốc vé vào ${activeCabinet?.ten_tu || "tủ"} (16 vé). Nhấn hoặc gõ tiếp số khác.`,
      tone: "success",
    });
  };

  // Xử lý giọng nói đọc 6 số
  const handleVoiceDigitsRecognized = useCallback(
    (extractedDigits: string) => {
      if (extractedDigits.length < 6) return;
      const digits = extractedDigits.slice(0, 6);
      if (processedVoiceTicketsRef.current.has(digits)) return;
      processedVoiceTicketsRef.current.add(digits);

      const tail = digits.slice(0, 4);
      const head = digits.slice(4, 6);
      setManualTail("");
      setManualHead("");

      // QUY TẮC NGHIỆP VỤ: Nếu đã có vé 6 số -> BÁO LỖI, KHÔNG CỘNG DỒN
      if (tickets[digits] !== undefined) {
        setManualEntryPreview({
          title: "Số đã tồn tại 🎙️",
          value: `${tail} ${head}`,
          description: `Số ${digits} đã có trong tủ ${activeCabinet?.ten_tu || ""}! Tuyệt đối không cộng dồn số lượng.`,
          tone: "error",
        });
      } else {
        setTickets((prev) => ({ ...prev, [digits]: 16 }));
        setManualEntryPreview({
          title: "Nhập bằng giọng nói 🎙️",
          value: `${tail} ${head}`,
          description: `Đã tự động thêm lốc vé 6 số: ${digits} (16 vé) vào ${activeCabinet?.ten_tu || "tủ"}`,
          tone: "success",
        });
      }

      window.setTimeout(() => {
        processedVoiceTicketsRef.current.clear();
        resetTranscriptRef.current();
      }, 200);
    },
    [tickets, activeCabinet?.ten_tu]
  );

  const {
    isListening,
    transcript,
    digits: voiceDigits,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToNumber({
    lang: "vi-VN",
    onDigitsRecognized: handleVoiceDigitsRecognized,
  });

  useEffect(() => {
    resetTranscriptRef.current = resetTranscript;
  }, [resetTranscript]);

  const closeManualEntryPreview = () => {
    setManualEntryPreview(null);
    window.setTimeout(() => {
      manualTailRef.current?.focus();
      manualTailRef.current?.select();
    }, 0);
  };

  // Xóa 1 lốc vé 6 số
  const handleDeleteTicket = (fullNumber: string) => {
    setTickets((prev) => {
      const next = { ...prev };
      delete next[fullNumber];
      return next;
    });
  };

  // Cập nhật số lượng vé cho 1 lốc 6 số (từ 1 đến 16 vé)
  const handleUpdateTicketQty = (fullNumber: string, qty: number) => {
    const validQty = Math.min(16, Math.max(1, qty));
    setTickets((prev) => ({
      ...prev,
      [fullNumber]: validQty,
    }));
  };

  // Áp dụng số lượng cho TOÀN BỘ các lốc vé hiện có thuộc lốc K (00 - 09)
  const handleApplyHeadGroupQuantity = (headGroupIndex: number, newQty: number) => {
    const headNumbers = getHeadNumbers(headGroupIndex);
    const validQty = Math.min(16, Math.max(1, newQty));
    setTickets((prev) => {
      const next = { ...prev };
      let updatedCount = 0;
      for (const [fullNum] of Object.entries(next)) {
        if (fullNum.length === 6) {
          const head = fullNum.slice(4, 6);
          if (headNumbers.includes(head)) {
            next[fullNum] = validQty;
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        setNotice(`Đã đổi ${validQty} vé cho ${updatedCount} lốc vé thuộc Lốc 0${headGroupIndex}.`);
      }
      return next;
    });
  };

  // Xóa TOÀN BỘ các lốc vé hiện có thuộc lốc K (00 - 09)
  const handleDeleteHeadGroup = (headGroupIndex: number) => {
    const headGroupLabel = String(headGroupIndex).padStart(2, "0");
    const headNumbers = getHeadNumbers(headGroupIndex);
    const matchingTickets = Object.keys(tickets).filter((fullNum) => {
      return fullNum.length === 6 && headNumbers.includes(fullNum.slice(4, 6));
    });

    if (matchingTickets.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa tất cả ${matchingTickets.length} lốc vé thuộc Lốc ${headGroupLabel}?`)) {
      setTickets((prev) => {
        const next = { ...prev };
        for (const fullNum of matchingTickets) {
          delete next[fullNum];
        }
        return next;
      });
      setNotice(`Đã xóa ${matchingTickets.length} lốc vé thuộc Lốc ${headGroupLabel}.`);
    }
  };

  // Xóa toàn bộ tủ vé của ngày/đài hiện tại
  const handleClearAll = () => {
    if (Object.keys(tickets).length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả các vé trong ${activeCabinet?.ten_tu || "tủ này"}?`)) {
      setTickets({});
      setNotice("Đã xóa trắng tủ vé.");
    }
  };

  // Lưu tủ vé vào Cloudflare D1
  const handleSaveTickets = async () => {
    if (!ticketDate) {
      setNotice("Vui lòng chọn ngày vé!");
      return;
    }
    if (!selectedDaiSo) {
      setNotice("Vui lòng chọn đài xổ!");
      return;
    }

    setIsSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/quanly/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencySlug,
          tuVeId: selectedCabinetId,
          ticketDate,
          daiSo: selectedDaiSo,
          chiTietVe: tickets,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNotice(`✅ ${json.message || `Đã lưu tủ vé thành công cho ${activeCabinet?.ten_tu}!`}`);
      } else {
        setNotice(`❌ Lỗi lưu vé: ${json.error || "Không thể lưu vào D1"}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi kết nối";
      setNotice(`❌ Lỗi kết nối: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-8 text-slate-800 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header thông tin đại lý & Quản lý Tủ vé chi nhánh */}
        <header className="mb-6 rounded-3xl border border-violet-100 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-600">Khu vực đại lý</p>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Quản lý tủ vé đại lý
                </h1>
              </div>
            </div>
            {d1Status === "loading" ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                CLOUDFLARE D1 · ĐANG KẾT NỐI...
              </span>
            ) : d1Status === "connected" ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CLOUDFLARE D1 · ĐÃ KẾT NỐI ({cabinets.length} TỦ VÉ)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => loadCabinets()}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 flex items-center gap-1.5 shadow-xs hover:bg-rose-100 transition-colors cursor-pointer"
                title="Bấm để thử kết nối lại"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                CLOUDFLARE D1 · LỖI TẢI (THỬ LẠI)
              </button>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <span className="text-slate-500">Mã đại lý đang thao tác:</span>{" "}
                <strong className="text-violet-700 font-black text-base">{agencySlug}</strong>
                {isRealDomain ? (
                  <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Subdomain thực tế
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Môi trường Demo / Local
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {isRealDomain ? "Đang chạy trên tên miền riêng của đại lý." : "Chọn đại lý mẫu bên dưới để thử nghiệm lưu & cách ly tủ vé:"}
              </p>
            </div>

            {!isRealDomain && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold mr-1">5 Đại lý thử nghiệm:</span>
                {DEMO_AGENCIES.map((agency) => {
                  const isActive = agencySlug === agency.slug;
                  return (
                    <button
                      key={agency.slug}
                      type="button"
                      onClick={() => {
                        setSelectedDemoSlug(agency.slug);
                        setNotice("");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-violet-600 text-white shadow-sm shadow-violet-200 ring-2 ring-violet-400"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50"
                      }`}
                    >
                      {agency.name} <span className="opacity-75 font-normal">({agency.slug})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* KHU VỰC CHỌN TỦ VÉ (CHI NHÁNH / ĐIỂM BÁN OFFLINE) */}
          <div className="mt-5 pt-4 border-t border-slate-200/70">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  {isLoadingCabinets ? (
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                  ) : (
                    <Store className="w-4 h-4 text-purple-600" />
                  )}
                  Tủ vé / Điểm bán ({cabinets.length} tủ):
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateCabinet}
                className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm tủ vé mới
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {cabinets.map((cab) => {
                const isSelected = selectedCabinetId === cab.id;
                return (
                  <div
                    key={cab.id}
                    onClick={() => {
                      setSelectedCabinetId(cab.id);
                      setNotice("");
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-50/90 border-purple-500 shadow-sm shadow-purple-100 ring-2 ring-purple-300"
                        : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isSelected ? "bg-purple-600 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <span className="font-bold text-sm text-slate-800 truncate" title={cab.ten_tu}>
                          {cab.ten_tu}
                        </span>
                      </div>
                      {cab.is_default && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                          Tủ chính
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 truncate" title={cab.dia_chi || "Chưa có địa chỉ"}>
                      📍 {cab.dia_chi || "Chưa có địa chỉ"}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className={isSelected ? "font-bold text-purple-700" : "text-slate-400"}>
                        {isSelected ? "● Đang thao tác" : "Nhấp để chọn"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditCabinet(cab, e)}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-100/60 transition-colors"
                          title="Sửa tên / địa chỉ tủ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {cabinets.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCabinet(cab.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Xóa tủ vé này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        {/* Khung chức năng quản lý vé */}
        <section className="bg-white/85 p-6 rounded-3xl shadow-sm border border-purple-100 ring-1 ring-slate-200/40 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {isLoadingTickets ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  ) : (
                    "1"
                  )}
                </span>
                Nhập Số Liệu Vé Truyền Thống 6 Chữ Số
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Đang nhập cho: <strong className="text-purple-700 font-bold">{activeCabinet?.ten_tu || "Tủ chính"}</strong>
                {activeCabinet?.dia_chi ? <span className="text-slate-400 font-normal"> ({activeCabinet.dia_chi})</span> : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {totalSeriesCount} lốc số
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                {totalTicketsCount} vé tổng
              </span>
            </div>
          </div>

          {/* Chọn ngày vé và đài xổ */}
          <div className="grid sm:grid-cols-2 gap-4">
            <DatePickerVN
              value={ticketDate}
              onChange={setTicketDate}
              label="Chọn ngày vé"
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Chọn đài xổ ({availableStations.length} đài)
                </label>
                {isFromDatabase ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase DB
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Dữ liệu mẫu (Code)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] mt-1">
                {/* 1. Đài mặc định nằm đầu tiên bên trái (h-9) */}
                {defaultStation && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDaiSo(defaultStation);
                      setNotice("");
                    }}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs select-none ${
                      selectedDaiSo === defaultStation
                        ? "bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-200 ring-2 ring-purple-300"
                        : "bg-white border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                    title="Đài mặc định của ngày"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        selectedDaiSo === defaultStation ? "bg-white animate-pulse" : "bg-purple-400"
                      }`}
                    />
                    <span>{defaultStation}</span>
                  </button>
                )}

                {/* Khoảng cách nhỏ giữa đài mặc định và các đài còn lại */}
                {otherStations.length > 0 && <span className="w-1.5" />}

                {/* 2. Các đài còn lại: kích thước nhỏ hơn (h-7) */}
                {otherStations.map((station) => {
                  const isCurrent = selectedDaiSo === station;
                  return (
                    <button
                      key={station}
                      type="button"
                      onClick={() => {
                        setSelectedDaiSo(station);
                        setNotice("");
                      }}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1 cursor-pointer select-none ${
                        isCurrent
                          ? "bg-purple-600 border-purple-600 text-white font-bold shadow-xs ring-1 ring-purple-300"
                          : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCurrent ? "bg-white animate-pulse" : "bg-slate-300"
                        }`}
                      />
                      {station}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Đang nhập cho đài: <b className="text-purple-700 font-bold">{selectedDaiSo || "—"}</b>
              </p>
            </div>
          </div>

          {/* Ô Nhập Tay Nhanh & Giọng Nói */}
          <div className="mt-5 p-4 rounded-2xl border border-purple-100 bg-slate-50 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span>Nhập tay nhanh &amp; Giọng nói</span>
                <span className="text-xs font-normal text-slate-500">(Mỗi dãy 6 số mặc định 16 vé)</span>
              </div>
              {isSpeechSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      resetTranscript();
                      startListening();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                  }`}
                  title={isListening ? "Tắt micro" : "Bật micro đọc 6 số tiếng Việt"}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Tắt Mic
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Đọc Số 🎙️
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                  Micro (Dùng Chrome/Safari)
                </span>
              )}
            </div>

            {isListening && (
              <div className="mb-3 p-3 rounded-2xl bg-purple-50/90 border border-purple-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Volume2 className="w-4 h-4 text-purple-600 animate-bounce shrink-0" />
                  <div className="text-xs text-purple-900 truncate">
                    <span className="font-bold text-purple-700">Đang nghe: </span>
                    <span className="font-medium text-slate-700">
                      {transcript || "Hãy đọc 6 số (bạn có thể đọc nhanh hoặc đọc chậm từng số)..."}
                    </span>
                  </div>
                </div>

                {/* 6 ô số trực quan hiển thị từng chữ số được ghi nhận theo thời gian thực */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-purple-700 mr-0.5">
                    Đã nhận ({(voiceDigits || "").length}/6):
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const d = (voiceDigits || "")[idx];
                      return (
                        <span
                          key={idx}
                          className={`w-6 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-all ${
                            d
                              ? "bg-purple-600 text-white shadow-xs scale-105"
                              : "bg-white text-slate-300 border border-purple-200"
                          }`}
                        >
                          {d || "·"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {speechError && (
              <div className="mb-3 p-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                {speechError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Đuôi số (4 số đầu)
                </label>
                <input
                  ref={manualTailRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="VD: 1212"
                  value={manualTail}
                  onChange={(event) => handleManualTailChange(event.target.value)}
                  className="w-full p-2.5 text-center font-bold text-base tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Đầu số (2 số cuối)
                </label>
                <input
                  ref={manualHeadRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  placeholder="VD: 01"
                  value={manualHead}
                  onChange={(event) => handleManualHeadChange(event.target.value)}
                  className="w-full p-2.5 text-center font-bold text-base tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              * Gõ xong 4 số đuôi con trỏ tự nhảy sang ô đầu số. Gõ xong 2 số đầu hệ thống tự thêm vé (16 vé/lốc).
            </p>
          </div>

          {/* VỊ TRÍ 1: DANH SÁCH LỐC VÉ 6 SỐ */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Danh Sách Lốc Vé 6 Số ({totalSeriesCount} lốc · {totalTicketsCount} vé)
                </h3>
                <p className="text-xs text-slate-500">
                  Thuộc về: <strong className="text-purple-700">{activeCabinet?.ten_tu}</strong> · Phân nhóm theo đầu số (2 số cuối)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Tìm kiếm nhanh */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo dãy số..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                  />
                </div>

                {/* Nút Xóa tất cả */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={totalSeriesCount === 0}
                  className="text-xs px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  title="Xóa tất cả các lốc vé đã nhập trong tủ này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa tất cả ({totalSeriesCount})
                </button>
              </div>
            </div>

            {/* THANH ÁP DỤNG NHANH THEO LỐC SỐ (00 ĐẾN 09) NẰM TRÊN CÙNG - CHIA 2 HÀNG (MỖI HÀNG 5 LỐC) */}
            <div className="mb-5 p-4 bg-gradient-to-r from-purple-50/90 via-violet-50/70 to-purple-50/90 rounded-2xl border border-purple-200/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-600 fill-purple-600" />
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Thao tác nhanh theo Lốc số (00 — 09):
                  </span>
                </div>
                <span className="text-[11px] text-purple-700 italic">
                  * Áp dụng cho các lốc vé hiện có trong {activeCabinet?.ten_tu || "tủ"}
                </span>
              </div>

              {/* 2 hàng: hàng trên Lốc 00-04, hàng dưới Lốc 05-09 */}
              <div className="space-y-2.5">
                {[
                  [0, 1, 2, 3, 4],
                  [5, 6, 7, 8, 9],
                ].map((rowHeads, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {rowHeads.map((headGroupIdx) => {
                      const headGroupLabel = String(headGroupIdx).padStart(2, "0");
                      const headGroupNumbers = getHeadNumbers(headGroupIdx);
                      // Đếm số lốc vé trong tủ hiện đang thuộc nhóm lốc này
                      const matchingTickets = Object.keys(tickets).filter((fullNum) => {
                        return fullNum.length === 6 && headGroupNumbers.includes(fullNum.slice(4, 6));
                      });
                      const countInGroup = matchingTickets.length;
                      const totalQtyInGroup = matchingTickets.reduce((sum, num) => sum + (tickets[num] || 0), 0);
                      const hasMatching = countInGroup > 0;

                      return (
                        <div
                          key={headGroupIdx}
                          className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            hasMatching
                              ? "bg-white border-purple-300 shadow-xs ring-1 ring-purple-100"
                              : "bg-white/70 border-slate-200/80 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-purple-900 leading-none">
                              Lốc {headGroupLabel}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hasMatching ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {hasMatching ? `${countInGroup} lốc · ${totalQtyInGroup}v` : "0 lốc"}
                            </span>
                          </div>

                          {/* Các tùy chọn: 16v, 8v, list chọn 1-16v, xóa */}
                          <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!hasMatching}
                                onClick={() => handleApplyHeadGroupQuantity(headGroupIdx, 16)}
                                className="px-2 py-1 text-[11px] font-bold bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title={`Đặt 16 vé cho toàn bộ lốc vé thuộc Lốc ${headGroupLabel}`}
                              >
                                16v
                              </button>

                              <button
                                type="button"
                                disabled={!hasMatching}
                                onClick={() => handleApplyHeadGroupQuantity(headGroupIdx, 8)}
                                className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title={`Đặt 8 vé cho toàn bộ lốc vé thuộc Lốc ${headGroupLabel}`}
                              >
                                8v
                              </button>

                              {/* List chọn từ 1-16v */}
                              <select
                                disabled={!hasMatching}
                                defaultValue=""
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (val >= 1 && val <= 16) {
                                    handleApplyHeadGroupQuantity(headGroupIdx, val);
                                    e.target.value = "";
                                  }
                                }}
                                className="px-1.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-purple-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                title="Chọn số lượng vé từ 1 đến 16 cho lốc này"
                              >
                                <option value="" disabled>
                                  SL
                                </option>
                                {QUANTITY_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}v
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Nút xóa lốc */}
                            <button
                              type="button"
                              disabled={!hasMatching}
                              onClick={() => handleDeleteHeadGroup(headGroupIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title={`Xóa tất cả lốc vé thuộc Lốc ${headGroupLabel}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* CÁC CỘT ĐẦU SỐ CÓ VIỀN BAO NGOÀI */}
            <div className={`transition-opacity duration-200 ${isLoadingTickets ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              {groupedFilteredHeads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
                  {searchFilter
                    ? "Không tìm thấy lốc vé nào khớp với từ khóa tìm kiếm."
                    : `Chưa có lốc vé nào được thêm cho ${activeCabinet?.ten_tu || "tủ này"}. Hãy nhập vé ở trên hoặc dùng giọng nói!`}
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto p-1">
                {groupedFilteredHeads.map(({ head, items, totalQty }) => (
                  <div
                    key={head}
                    className="rounded-2xl border-2 border-purple-200 bg-white shadow-xs overflow-hidden flex flex-col hover:border-purple-300 transition-colors"
                  >
                    {/* Header cột của nhóm đầu số có viền bao ngoài */}
                    <div className="bg-purple-50/90 px-3.5 py-2.5 border-b border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Đầu số:</span>
                        <span className="text-base font-black text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-xs">
                          {head}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-full">
                        {items.length} lốc · {totalQty}v
                      </span>
                    </div>

                    {/* Danh sách các lốc số trong cột */}
                    <div className="p-2.5 space-y-2 flex-1 divide-y divide-slate-100">
                      {items.map(({ fullNumber, tail, qty }) => (
                        <div
                          key={fullNumber}
                          className="pt-2 first:pt-0 flex items-center justify-between gap-1"
                        >
                          {/* Hiển thị số 6 số: 4 số đầu + 2 số cuối (không có dòng Đầu/Đuôi) */}
                          <div className="font-mono text-sm font-black flex items-center tracking-wider">
                            <span className="text-slate-600">{tail}</span>
                            <span className="text-purple-700 bg-purple-100/90 px-1.5 py-0.5 rounded ml-1.5 font-black">
                              {head}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Nút chỉnh 16v */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketQty(fullNumber, 16)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                                qty === 16
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:text-purple-700 hover:bg-purple-50"
                              }`}
                            >
                              16v
                            </button>

                            {/* Nút chỉnh 8v */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTicketQty(fullNumber, 8)}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                                qty === 8
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-600 hover:text-purple-700 hover:bg-purple-50"
                              }`}
                            >
                              8v
                            </button>

                            {/* List chọn số lượng từ 1-16v */}
                            <select
                              value={qty}
                              onChange={(e) => handleUpdateTicketQty(fullNumber, Number(e.target.value))}
                              className="px-1 py-0.5 text-[10px] font-bold rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                              title="Chọn số lượng vé từ 1 đến 16"
                            >
                              {QUANTITY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}v
                                </option>
                              ))}
                            </select>

                            {/* Nút xóa lốc */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(fullNumber)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa lốc này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Nút Lưu tủ vé vào Cloudflare D1 */}
          <button
            type="button"
            disabled={isSaving || isLoadingTickets}
            onClick={handleSaveTickets}
            className={`mt-6 w-full py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSaving || isLoadingTickets
                ? "bg-slate-400 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.99]"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang lưu tủ vé vào Cloudflare D1...
              </>
            ) : isLoadingTickets ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải dữ liệu tủ vé...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lưu vào {activeCabinet?.ten_tu || "Tủ vé"} ({totalSeriesCount} lốc · {totalTicketsCount} vé - Đài {selectedDaiSo || "..."})
              </>
            )}
          </button>

          {notice && (
            <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {notice}
            </p>
          )}
        </section>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA TỦ VÉ */}
      {isCabinetModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Quản lý tủ vé</p>
                <h3 className="text-xl font-black text-slate-800">
                  {editingCabinet ? "Chỉnh sửa tủ vé" : "Thêm tủ vé mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCabinetModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên tủ vé (*)</label>
                <input
                  type="text"
                  placeholder="VD: Tủ 1 - Chợ Bến Thành"
                  value={cabinetFormName}
                  onChange={(e) => setCabinetFormName(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ quầy / tủ vé</label>
                <input
                  type="text"
                  placeholder="VD: 123 Lê Lợi, P. Bến Thành, Q.1"
                  value={cabinetFormAddress}
                  onChange={(e) => setCabinetFormAddress(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cabinetFormDefault}
                  onChange={(e) => setCabinetFormDefault(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Đặt làm tủ chính mặc định</span>
              </label>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCabinetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSavingCabinet || !cabinetFormName.trim()}
                onClick={handleSaveCabinetForm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                {isSavingCabinet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editingCabinet ? "Cập nhật tủ vé" : "Tạo tủ vé"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP THÔNG BÁO THÊM / CẢNH BÁO TRÙNG SỐ */}
      {manualEntryPreview ? (
        <button
          type="button"
          onClick={closeManualEntryPreview}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/25 px-4 py-6 backdrop-blur-[2px]"
          aria-label="Đóng kiểm tra số vừa nhập"
        >
          <div
            className={`rounded-[28px] border bg-white px-8 py-6 text-center shadow-2xl max-w-sm ${
              manualEntryPreview.tone === "error" ? "border-rose-200" : "border-purple-200"
            }`}
          >
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.22em] ${
                manualEntryPreview.tone === "error" ? "text-rose-500" : "text-purple-500"
              }`}
            >
              {manualEntryPreview.title}
            </p>
            <p
              className={`mt-3 text-5xl font-black tracking-[0.16em] ${
                manualEntryPreview.tone === "error" ? "text-rose-700" : "text-purple-700"
              }`}
            >
              {manualEntryPreview.value}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {manualEntryPreview.description}
            </p>
            <p className="mt-2 text-[10px] text-slate-400">
              (Chạm vào đây hoặc gõ phím bất kỳ để tiếp tục)
            </p>
          </div>
        </button>
      ) : null}
    </main>
  );
}
