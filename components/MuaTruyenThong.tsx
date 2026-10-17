"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import Lottie from 'lottie-react';
import { Trash2, Download, ChevronLeft, ChevronRight, Mic, MicOff, Volume2 } from 'lucide-react';
import VeDienTuGrid, { BoxCfg as VeDienTuBoxCfg, HeadBoxCfg as VeDienTuHeadBoxCfg, type HeadColorKey, type PreviewFontKey } from './vedientu';
import LuckyWheel from './LuckyWheel';
import ThemeTet from './ThemeTet';
import ThemeXuan from './themexuan';
import Theme83 from './theme83';
import { useSpeechToNumber } from './hooks/useSpeechToNumber';
import { parseVoiceOrder } from './utils/parseVoiceOrder';

// CẤU HÌNH BẬT/TẮT THEME TẾT (true = Bật, false = Tắt)
const ENABLE_TET_THEME = false;
// CẤU HÌNH BẬT/TẮT THEME XUÂN (true = Bật, false = Tắt)
export const ENABLE_XUAN_THEME = true;
// CẤU HÌNH BẬT/TẮT THEME 8/3 (true = Bật, false = Tắt)
export const ENABLE_83_THEME = false;
// CẤU HÌNH BẬT/TẮT PLACEHOLDER THAY THẾ THEME XUÂN
const ENABLE_XUAN_PLACEHOLDER = false;
// CẤU HÌNH BẬT/TẮT VÉ ĐIỆN TỬ
const ENABLE_VEDIENTU = true;
// CẤU HÌNH BẬT/TẮT ĐẶT VÉ BẰNG GIỌNG NÓI (true = Bật, false = Tắt)
const ENABLE_VOICE_ORDER = false;

// Cấu hình Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const getCenteredHeadBox = (_cardW: number, _cardH: number, size = 72) => {
  const safeSize = Math.max(1, size);
  return {
    offsetX: 0,
    offsetY: 0,
    size: safeSize,
  };
};

// CẤU HÌNH THÔNG TIN NGÂN HÀNG (Sửa ở đây sẽ cập nhật cả QR và Text)
const BANK_INFO = {
  BANK_ID: 'mb', // Mã ngân hàng (MB Bank) cho VietQR
  ACCOUNT_NO: '0922341568', // Số tài khoản (viết liền để tạo QR)
  ACCOUNT_NAME: 'HOANG MINH VU', // Tên tài khoản không dấu
  ACCOUNT_DISPLAY: '092 234 1568', // Số tài khoản hiển thị đẹp
  BANK_NAME: 'Ngân Hàng Quân Đội (MB Bank)'
};

interface MuaTruyenThongProps {
  mode?: 'normal' | 'tet-only';
  defaultTetOpen?: boolean;
  isModal?: boolean;
  sunPreview?: boolean;
  refIdFromPage?: string | null;
}

const getNgayVaDaiClient = (overrideNgaySo?: string): { ngaySo: string; ngayHienThi: string; daiSo: string } => {
  const daiMap = ['Lâm Đồng', 'Đồng Tháp', 'Vũng Tàu', 'Sóc Trăng', 'Bình Thuận', 'Bình Dương', 'Bình Phước'];

  if (overrideNgaySo) {
    const [y, m, d] = overrideNgaySo.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const ngayHienThi = `${day}/${month}/${year}`;
    const thu = date.getDay();
    return { ngaySo: overrideNgaySo, ngayHienThi, daiSo: daiMap[thu] };
  }

  const now = new Date();
  const vnTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  const vnDate = new Date(vnTimeStr);

  const hour = vnDate.getHours();
  const minutes = vnDate.getMinutes();
  if (hour > 16 || (hour === 16 && minutes >= 30)) vnDate.setDate(vnDate.getDate() + 1);

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, '0');
  const day = String(vnDate.getDate()).padStart(2, '0');
  const ngaySo = `${year}-${month}-${day}`;
  const ngayHienThi = `${day}/${month}/${year}`;

  const thu = vnDate.getDay();
  return { ngaySo, ngayHienThi, daiSo: daiMap[thu] };
};

export default function MuaTruyenThong({ mode = 'normal', defaultTetOpen = false, isModal = false, sunPreview = false, refIdFromPage = null }: MuaTruyenThongProps) {
  const [showTetBox, setShowTetBox] = useState(defaultTetOpen);
  const [selectedTetDate, setSelectedTetDate] = useState<string | null>(null);
  const [showPreTetBox, setShowPreTetBox] = useState(false);
  const [selectedPreTetDate, setSelectedPreTetDate] = useState<string | null>(null);
  const [showAdminDateBox, setShowAdminDateBox] = useState(false);
  const [selectedAdminDate, setSelectedAdminDate] = useState<string | null>(null);
  const [selectedNextDayDate, setSelectedNextDayDate] = useState<string | null>(null);
  const [nextDayEnabled, setNextDayEnabled] = useState(false);
  const [nextDayDate, setNextDayDate] = useState<string | null>(null);

  // Bật/tắt tính năng đặt vé Tết (đơn vào don_tet)
  const ENABLE_TET_BOOKING = false;
  // Bật/tắt thông báo nghỉ bán cho ngày hiện tại
  const ENABLE_TODAY_OFF = false;
  // Bật/tắt hiển thị Vòng Quay (true = Bật, false = Tắt)
  const ENABLE_WHEEL = false;

  // Initialized synchronously with valid client date to avoid empty-string query race conditions
  const [ngaySo, setNgaySo] = useState(() => getNgayVaDaiClient().ngaySo);
  const [ngayHienThi, setNgayHienThi] = useState(() => getNgayVaDaiClient().ngayHienThi);
  const [daiSo, setDaiSo] = useState(() => getNgayVaDaiClient().daiSo);
  const [baseNgaySo, setBaseNgaySo] = useState(() => getNgayVaDaiClient().ngaySo);
  const [tetDateOptions, setTetDateOptions] = useState<{ label: string; date: string }[]>([]);
  const [adminDateOptions, setAdminDateOptions] = useState<{ date: string; label: string }[]>(() => {
    const { ngaySo: initialBaseNgaySo } = getNgayVaDaiClient();
    if (!initialBaseNgaySo) return [];
    const [y, m, d] = initialBaseNgaySo.split('-').map(Number);
    const base = new Date(y, (m || 1) - 1, d || 1);
    const addDays = (days: number) => {
      const dt = new Date(base);
      dt.setDate(dt.getDate() + days);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return { date: `${yyyy}-${mm}-${dd}`, label: `${dd}/${mm}` };
    };
    return [addDays(1), addDays(2)];
  });

  // State nhập liệu (Chỉ giữ 1 cặp ô nhập duy nhất)
  const [currentInput, setCurrentInput] = useState<string[]>(['', '']);
  const [bunnyData, setBunnyData] = useState<any>(null);
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const hoTenInputRef = useRef<HTMLInputElement>(null);
  const sdtInputRef = useRef<HTMLInputElement>(null);

  // State dữ liệu từ Supabase
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [isInventoryError, setIsInventoryError] = useState(false);
  const [ticketImage, setTicketImage] = useState<string | null>(null); // Ảnh vé
  const [ticketImageFallback, setTicketImageFallback] = useState<string | null>(null);
  const [veDienTuMap, setVeDienTuMap] = useState<Record<string, { qty?: number; tail?: string }>>({});
  const [veMauUrl, setVeMauUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'vedientu'>('vedientu');
  const [vedientuBoxes, setVedientuBoxes] = useState<VeDienTuBoxCfg[]>([
    { top: 20, right: 20, width: 220, height: 60, kind: 'main' }
  ]);
  const [vedientuHeadBox, setVedientuHeadBox] = useState<VeDienTuHeadBoxCfg>(() => getCenteredHeadBox(500, 800, 72));
  const [vedientuCardWidth, setVedientuCardWidth] = useState(500);
  const [vedientuCardHeight, setVedientuCardHeight] = useState(800);
  const [, setVedientuTailLetterSpacingPx] = useState(0);
  const [vedientuFontKey, setVedientuFontKey] = useState<PreviewFontKey>("rubik");
  const [vedientuHeadColorKey, setVedientuHeadColorKey] = useState<HeadColorKey>("yellow");
  const [isVedientuLayoutReady, setIsVedientuLayoutReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maxRows, setMaxRows] = useState<number>(5); // Số hàng tối đa cho Grid ảnh
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false); // Trạng thái xem ảnh
  const [showPlaceholder, setShowPlaceholder] = useState(true); // Trạng thái hiển thị placeholder (2s)

  // State giỏ hàng (Danh sách số đã chọn)
  // Structure: { so: "01", soLuongMua: 1, soLuongKho: 5 }
  const [cart, setCart] = useState<{ so: string; soLuongMua: number; soLuongKho: number }[]>([]);

  // State thông tin khách hàng
  const [hoTen, setHoTen] = useState('');
  const [sdt, setSdt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const retryRef = useRef<number>(0);

  // State thông báo 
  const [thongBao, setThongBao] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<React.ReactNode | null>(null); // State cho thông báo tùy chỉnh (String hoặc JSX)
  const [lastOrder, setLastOrder] = useState<{ amount: number; info: string } | null>(null); // Thông tin đơn hàng để tạo QR
  const [activeInfoTab, setActiveInfoTab] = useState<'available' | 'soldout' | null>(null); // Tab hiển thị vé còn/hết
  const [isSystemLocked, setIsSystemLocked] = useState(false); // Trạng thái khóa từ Server
  const [isAdminMode, setIsAdminMode] = useState(false); // Trạng thái Admin của máy hiện tại
  const [showPasswordModal, setShowPasswordModal] = useState(false); // Hiển thị popup nhập mật khẩu
  const [passwordInput, setPasswordInput] = useState(''); // Lưu mật khẩu nhập vào
  const [inputError, setInputError] = useState<string | null>(null); // Lỗi hiển thị dưới ô nhập
  const [isLocking, setIsLocking] = useState(false); // Trạng thái đang xử lý khóa (Loading)
  const [showWheel, setShowWheel] = useState(false); // Trạng thái hiển thị vòng quay
  const [isZoomed, setIsZoomed] = useState(false); // Trạng thái zoom màn hình (ẩn số gợi ý)
  const [isZoomedIcon, setIsZoomedIcon] = useState(false); // Trạng thái zoom để ẩn icon kính lúp
  const [overlayColor, setOverlayColor] = useState<'yellow' | 'red' | 'white'>('yellow'); // Màu hiển thị số
  const [mounted, setMounted] = useState(false); // Trạng thái mount để render Portal
  const prevAlertMessageRef = useRef<React.ReactNode | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lockCountdown, setLockCountdown] = useState<number>(30);
  const adminPasswordRef = useRef<string | null>(null);
  const [qtyPulse, setQtyPulse] = useState<Record<string, number>>({});
  const [imageSource, setImageSource] = useState<'r2' | 'supa'>('r2');

  const [isInstallButtonLarge, setIsInstallButtonLarge] = useState(false); // State cho nút Cài App
  // State PWA (Cài App)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isTetMode = (mode === 'tet-only') || (ENABLE_TET_BOOKING && Boolean(selectedTetDate));
  const effectiveTetDate = mode === 'tet-only' ? (selectedTetDate || tetDateOptions[0]?.date) : selectedTetDate;
  const effectiveDate = selectedAdminDate || selectedNextDayDate || selectedPreTetDate || effectiveTetDate || undefined;
  const cartStorageKey = `cart_${ngaySo}`;
  const tetYear = ngaySo.slice(0, 4);
  const tetCutoff = `${tetYear}-02-19`;
  const tetBadgeSrc = ngaySo.endsWith('-02-17')
    ? '/mung-1.png'
    : ngaySo.endsWith('-02-18')
      ? '/mung-2.png'
      : ngaySo.endsWith('-02-19')
        ? '/mung-3.png'
        : ngaySo > tetCutoff
          ? '/mung-tet.png'
          : null;
  const selectedTetLabel = tetDateOptions.find(o => o.date === effectiveTetDate)?.label || '';
  const selectedPreTetLabel = tetDateOptions.find(o => o.date === selectedPreTetDate)?.label || '';
  const ordersTable = selectedPreTetDate ? 'don_hang' : (isTetMode ? 'don_tet' : 'don_hang');
  const shouldShowTodayOff = ENABLE_TODAY_OFF && !selectedPreTetDate && !selectedAdminDate && !effectiveTetDate && mode === 'normal';

  const availablePreTetOptions = tetDateOptions.filter(o => o.date > baseNgaySo);
  const shouldShowPreTetBox = mode === 'normal' && availablePreTetOptions.length > 0;
  const shouldShowAdminDateBox = mode === 'normal' && isAdminMode;
  const shouldShowNextDayArrow = mode === 'normal' && !isAdminMode;
  const hasInventoryGrid = Object.keys(inventory).length > 0;
  const manualAdminMode = isAdminMode && !hasInventoryGrid;
  const isNextDayBlocked = Boolean(selectedNextDayDate && !nextDayEnabled);
  const vedientuSuffixes = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(veDienTuMap).forEach(([num, item]) => {
      if (item && typeof item.tail === 'string') {
        out[num] = item.tail.replace(/[^0-9]/g, '').slice(-4);
      }
    });
    return out;
  }, [veDienTuMap]);

  const vedientuNumbers = useMemo(() => {
    const keys = new Set<string>();
    Object.keys(veDienTuMap).forEach((k) => keys.add(k));
    Object.keys(inventory).forEach((k) => keys.add(k));
    return Array.from(keys).sort();
  }, [veDienTuMap, inventory]);

  const vedientuTicketUrl = veMauUrl;

  // Reset form khi đổi ngày sổ (ví dụ chuyển sang ngày Tết)
  useEffect(() => {
    setCart([]);
    setCurrentInput(['', '']);
    setInputError(null);
    setThongBao('');
    setLastOrder(null);
  }, [ngaySo]);

  // Client-side only effect to calculate dates and prevent hydration mismatch
  useEffect(() => {
    const getNgayVaDaiClient = (overrideNgaySo?: string): { ngaySo: string; ngayHienThi: string; daiSo: string } => {
      const daiMap = ['Lâm Đồng', 'Đồng Tháp', 'Vũng Tàu', 'Sóc Trăng', 'Bình Thuận', 'Bình Dương', 'Bình Phước'];

      if (overrideNgaySo) {
        const [y, m, d] = overrideNgaySo.split('-').map(Number);
        const date = new Date(y, (m || 1) - 1, d || 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const ngayHienThi = `${day}/${month}/${year}`;
        const thu = date.getDay();
        return { ngaySo: overrideNgaySo, ngayHienThi, daiSo: daiMap[thu] };
      }

      const now = new Date();
      const vnTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
      const vnDate = new Date(vnTimeStr);

      const hour = vnDate.getHours();
      const minutes = vnDate.getMinutes();
      if (hour > 16 || (hour === 16 && minutes >= 30)) vnDate.setDate(vnDate.getDate() + 1);

      const year = vnDate.getFullYear();
      const month = String(vnDate.getMonth() + 1).padStart(2, '0');
      const day = String(vnDate.getDate()).padStart(2, '0');
      const ngaySo = `${year}-${month}-${day}`;
      const ngayHienThi = `${day}/${month}/${year}`;

      const thu = vnDate.getDay();
      return { ngaySo, ngayHienThi, daiSo: daiMap[thu] };
    };

    const { ngaySo: currentNgaySo, ngayHienThi: currentNgayHienThi, daiSo: currentDaiSo } = getNgayVaDaiClient(effectiveDate);
    setNgaySo(currentNgaySo);
    setNgayHienThi(currentNgayHienThi);
    setDaiSo(currentDaiSo);

    const { ngaySo: initialBaseNgaySo } = getNgayVaDaiClient();
    if (initialBaseNgaySo) {
      if (baseNgaySo !== initialBaseNgaySo) {
        setBaseNgaySo(initialBaseNgaySo);
      }

      const year = new Date().getFullYear();
      setTetDateOptions([
        { label: 'Mùng 1 Tết', date: `${year}-02-17` },
        { label: 'Mùng 2 Tết', date: `${year}-02-18` },
        { label: 'Mùng 3 Tết', date: `${year}-02-19` },
      ]);

      const [y, m, d] = initialBaseNgaySo.split('-').map(Number);
      const base = new Date(y, (m || 1) - 1, d || 1);
      const addDays = (days: number) => { const dt = new Date(base); dt.setDate(dt.getDate() + days); const yyyy = dt.getFullYear(); const mm = String(dt.getMonth() + 1).padStart(2, '0'); const dd = String(dt.getDate()).padStart(2, '0'); return { date: `${yyyy}-${mm}-${dd}`, label: `${dd}/${mm}` }; };
      setAdminDateOptions([addDays(1), addDays(2)]);
    }
  }, [effectiveDate, baseNgaySo]);

  useEffect(() => {
    if (!daiSo) return;
    let cancelled = false;
    const loadLayout = async () => {
      setIsVedientuLayoutReady(false);
      try {
        const res = await fetch('/api/vedientu-layout', { cache: 'no-store' });
        if (!res.ok) throw new Error('load_failed');
        const data = await res.json();
        const entry = data?.[daiSo];
        if (entry?.boxes && Array.isArray(entry.boxes) && entry.boxes.length > 0) {
          if (cancelled) return;
          setVedientuBoxes(entry.boxes);
          const maybePx = Number(entry.tailLetterSpacingPx);
          const maybeEm = Number(entry.tailLetterSpacingEm);
          if (Number.isFinite(maybePx)) setVedientuTailLetterSpacingPx(maybePx);
          else if (Number.isFinite(maybeEm)) setVedientuTailLetterSpacingPx(Math.round(maybeEm * 100) / 100);
          else setVedientuTailLetterSpacingPx(0);
          const loadedCardWidth = Number(entry.cardWidth) || vedientuCardWidth;
          const loadedCardHeight = Number(entry.cardHeight) || vedientuCardHeight;
          if (Number.isFinite(loadedCardWidth) && loadedCardWidth > 0) setVedientuCardWidth(loadedCardWidth);
          if (Number.isFinite(loadedCardHeight) && loadedCardHeight > 0) setVedientuCardHeight(loadedCardHeight);
          if (entry.headBox) {
            const legacyW = Number(entry.headBox.width) || 0;
            const legacyH = Number(entry.headBox.height) || 0;
            const nextSize = Number(entry.headBox.size) || Math.max(legacyW, legacyH, 72);
            const maybeOffsetX = Number(entry.headBox.offsetX);
            const maybeOffsetY = Number(entry.headBox.offsetY);
            if (Number.isFinite(maybeOffsetX) && Number.isFinite(maybeOffsetY)) {
              setVedientuHeadBox({
                offsetX: maybeOffsetX,
                offsetY: maybeOffsetY,
                size: nextSize,
              });
            } else {
              const legacyTop = Number(entry.headBox.top) || 0;
              const legacyRight = Number(entry.headBox.right) || 0;
              const centerTop = Math.round((loadedCardHeight - nextSize) / 2);
              const centerRight = Math.round((loadedCardWidth - nextSize) / 2);
              setVedientuHeadBox({
                offsetX: centerRight - legacyRight,
                offsetY: legacyTop - centerTop,
                size: nextSize,
              });
            }
          } else {
            setVedientuHeadBox(getCenteredHeadBox(loadedCardWidth, loadedCardHeight, 72));
          }
        } else if (!cancelled) {
          setVedientuBoxes([{ top: 20, right: 20, width: 220, height: 60, kind: 'main' }]);
          setVedientuHeadBox(getCenteredHeadBox(vedientuCardWidth, vedientuCardHeight, 72));
          setVedientuTailLetterSpacingPx(0);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsVedientuLayoutReady(true);
      }
    };
    loadLayout();
    return () => {
      cancelled = true;
    };
  }, [daiSo, vedientuCardWidth, vedientuCardHeight]);

  // Khôi phục giỏ hàng sau reload (theo ngày hiện tại)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(cartStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch {
      // ignore
    }
  }, [cartStorageKey]);

  // Lưu giỏ hàng để tránh mất khi reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (cart.length === 0) {
        window.localStorage.removeItem(cartStorageKey);
      } else {
        window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
      }
    } catch {
      // ignore
    }
  }, [cart, cartStorageKey]);

  // Tự mở box Tết và chọn ngày đầu tiên khi ở chế độ Tết
  useEffect(() => {
    if (mode === 'tet-only') {
      setShowTetBox(true);
      if (!selectedTetDate) {
        setSelectedTetDate(tetDateOptions[0]?.date || null);
      }
    }
  }, [mode, selectedTetDate, tetDateOptions]);

  useEffect(() => {
    if (selectedPreTetDate && !availablePreTetOptions.find(o => o.date === selectedPreTetDate)) {
      setSelectedPreTetDate(null);
      setShowPreTetBox(false);
    }
  }, [selectedPreTetDate, availablePreTetOptions]);

  useEffect(() => {
    if (!isAdminMode && selectedAdminDate) {
      setSelectedAdminDate(null);
      setShowAdminDateBox(false);
    }
  }, [isAdminMode, selectedAdminDate]);

  // Effect: Kiểm tra trạng thái PWA và thiết bị
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    }

    // Lắng nghe sự kiện cài đặt trên Android/PC
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Chặn popup mặc định của trình duyệt
      setDeferredPrompt(e); // Lưu lại để kích hoạt sau
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      // Android/PC: Hiện popup cài đặt chuẩn
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') setDeferredPrompt(null);
      });
    } else if (isIOS) {
      // iOS: Hiện hướng dẫn thủ công
      setAlertMessage(
        <div className="text-left text-sm space-y-3">
          <p className="font-bold text-center text-base mb-2 text-purple-700">HƯỚNG DẪN CÀI APP TRÊN IPHONE</p>
          <p className="leading-relaxed">
            1. Bấm nút <b>Chia sẻ</b>
            <span className="inline-flex items-center justify-center w-6 h-6 mx-1 bg-slate-100 rounded text-blue-600 align-bottom shadow-sm border border-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </span>
            ở đáy màn hình.
          </p>
          <p className="leading-relaxed">
            2. Kéo xuống chọn <b>Thêm vào MH chính</b> (Add to Home Screen) <span className="inline-block bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-600">+</span>.
          </p>
          <p className="leading-relaxed">3. Bấm <b>Thêm</b> ở góc trên cùng bên phải.</p>
        </div>
      );
    }
  };

  // Hàm lấy dữ liệu kho vé thực tế (Tính toán: Gốc - Đã bán)
  const syncVeDienTu = (veDienTu: unknown, veMau: string | null) => {
    if (veDienTu && typeof veDienTu === 'object') {
      setVeDienTuMap(veDienTu as Record<string, { qty?: number; tail?: string }>);
    } else {
      setVeDienTuMap({});
    }
    setVeMauUrl(veMau || null);
  };

  const fetchRealTimeInventory = async () => {
    if (!supabase || !ngaySo) {
      return {
        stock: {} as Record<string, number>,
        imageUrl: null,
        imageFallback: null,
        rows: 5,
        locked: false,
        veDienTu: null,
        veMauUrl: null,
      };
    }

    // 1. Lấy kho gốc từ ve_truyen_thong
    const { data: ticketData } = await supabase
      .from('ve_truyen_thong')
      .select('chi_tiet_ve, anh_ve_url, anh_ve_r2_url, so_hang, trang_thai_khoa, ve_dien_tu, ve_mau_r2_url')
      .eq('ngay_so', ngaySo)
      .single();

    const initialStock: Record<string, number> = ticketData?.chi_tiet_ve || {};
    const r2Url = ticketData?.anh_ve_r2_url || null;
    const supaUrl = ticketData?.anh_ve_url || null;
    const imageUrl =
      imageSource === 'r2'
        ? (r2Url || supaUrl)
        : (supaUrl || r2Url);
    const imageFallback =
      imageSource === 'r2'
        ? (supaUrl && supaUrl !== imageUrl ? supaUrl : null)
        : (r2Url && r2Url !== imageUrl ? r2Url : null);
    const rows = ticketData?.so_hang || 5;
    const locked = ticketData?.trang_thai_khoa || false;
    const veDienTu = ticketData?.ve_dien_tu || null;
    const veMauUrl = ticketData?.ve_mau_r2_url || null;

    // 2. Lấy danh sách vé đã bán từ bảng đơn tương ứng
    const { data: orders } = await supabase
      .from(ordersTable)
      .select('danh_sach_so')
      .eq('ngay_so', ngaySo);

    const soldStock: Record<string, number> = {};
    if (orders) {
      orders.forEach((order: any) => {
        const items = order.danh_sach_so;
        if (items) {
          // Cộng dồn số lượng đã bán cho từng số
          Object.entries(items).forEach(([num, qty]) => {
            soldStock[num] = (soldStock[num] || 0) + Number(qty);
          });
        }
      });
    }

    // 3. Trừ đi để ra tồn kho thực tế
    const realStock: Record<string, number> = {};
    Object.keys(initialStock).forEach(num => {
      const initial = initialStock[num] || 0;
      const sold = soldStock[num] || 0;
      const remaining = initial - sold;
      realStock[num] = Math.max(0, remaining);
    });

    return { stock: realStock, imageUrl, imageFallback, rows, locked, veDienTu, veMauUrl };
  };

  // Effect: Đồng bộ tồn kho trong giỏ hàng khi inventory thay đổi (Realtime)
  useEffect(() => {
    setCart(prevCart => prevCart.map(item => {
      const currentStock = inventory[item.so];
      // Nếu tồn kho thay đổi (vd: Admin update kho từ 2 -> 4), cập nhật lại thông tin trong giỏ
      if (currentStock !== undefined && currentStock !== item.soLuongKho) {
        return { ...item, soLuongKho: currentStock };
      }
      return item;
    }));
  }, [inventory]);

  // Effect: Lấy dữ liệu vé từ Supabase khi vào trang
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        setIsInventoryError(false);
        const { stock, imageUrl, imageFallback, rows, locked, veDienTu, veMauUrl } = await fetchRealTimeInventory();
        setInventory(stock);
        setTicketImage(imageUrl || null);
        setTicketImageFallback(imageFallback);
        if (rows) setMaxRows(rows);
        setIsSystemLocked(locked);
        syncVeDienTu(veDienTu, veMauUrl);

        // Không query prebooking ở đây (chỉ query khi user click vào box)
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setIsInventoryError(true);
      } finally {
        setLoading(false);
      }
    };

    // Hàm refresh dữ liệu nhẹ (không hiện loading) dùng cho Realtime
    const refreshData = async () => {
      try {
        const { stock, imageUrl, imageFallback, rows, locked, veDienTu, veMauUrl } = await fetchRealTimeInventory();
        setIsInventoryError(false);
        setInventory(stock);
        setTicketImage(imageUrl || null);
        setTicketImageFallback(imageFallback);
        if (rows) setMaxRows(rows);
        setIsSystemLocked(locked);
        syncVeDienTu(veDienTu, veMauUrl);
      } catch (err) {
        console.error("Lỗi cập nhật dữ liệu:", err);
      }
    };

    initData();

    // Kiểm tra thời gian hiển thị Vòng Quay (Chủ Nhật 8h-16h)
    const checkWheelTime = () => {
      const now = new Date();
      const vnTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
      const vnDate = new Date(vnTimeStr);
      const day = vnDate.getDay(); // 0 là Chủ Nhật
      const hour = vnDate.getHours();

      const isSundayEvent = day === 0 && hour >= 8 && hour < 16;

      // --- CHẾ ĐỘ TEST: Bật true để test thoải mái ---
      const IS_TESTING_WHEEL = false;

      setShowWheel(ENABLE_WHEEL && (IS_TESTING_WHEEL || isSundayEvent));
    };
    checkWheelTime();

    setMounted(true); // Đánh dấu đã mount để render Portal

    // --- REALTIME SUBSCRIPTION ---
    // Lắng nghe thay đổi Tồn kho (Admin update) và Đơn hàng (Khách mua)
    if (supabase) {
      setRealtimeStatus('connecting');
      const channel = supabase
        .channel('realtime-updates')
        .on(
          'postgres_changes',
          {
            event: '*', // Lắng nghe mọi sự kiện (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 've_truyen_thong',
            filter: `ngay_so=eq.${ngaySo}`,
          },
          () => refreshData() // Tải lại dữ liệu khi Admin cập nhật vé/khóa
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: ordersTable,
            filter: `ngay_so=eq.${ngaySo}`,
          },
          () => refreshData() // Tải lại dữ liệu khi có người mua vé
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeStatus('disconnected');
          } else {
            setRealtimeStatus('connecting');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [ngaySo, ordersTable, imageSource]);

  // Effect: Tải file Lottie Bunny (bỏ qua khi ở modal để giảm tải)
  useEffect(() => {
    if (isModal) return;
    fetch('/lottie/bunny.json')
      .then(res => res.json())
      .then(data => setBunnyData(data))
      .catch(err => console.error("Lỗi tải bunny.json:", err));
  }, [isModal]);

  // Effect: Reset placeholder và đặt timer 2s khi có ảnh mới
  useEffect(() => {
    if (ticketImage) {
      setIsImageLoaded(false);
      setShowPlaceholder(true);
      const timer = setTimeout(() => {
        setShowPlaceholder(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    // Không có ảnh -> giữ placeholder để tránh layout nhảy
    setIsImageLoaded(false);
    setShowPlaceholder(true);
  }, [ticketImage]);



  // Effect: Lắng nghe sự kiện Zoom màn hình (Visual Viewport)
  useEffect(() => {
    let rafId: number | null = null;
    const handleZoom = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        const vvScale = window.visualViewport?.scale;
        const fallbackScale = window.devicePixelRatio;
        const raw = vvScale && Number.isFinite(vvScale) ? vvScale : fallbackScale;
        const next = raw && Number.isFinite(raw) && raw > 0 ? raw : 1;

        // Hiệu ứng ẩn/hiện số: zoom từ 1.1x -> 1.2x
        const startZoom = 1.1;
        const endZoom = 1.2;
        const progress = Math.max(0, Math.min(1, (next - startZoom) / (endZoom - startZoom)));
        const mainOpacity = 0.18 + progress * 0.82;
        const headOpacity = 1 - progress;
        document.documentElement.style.setProperty("--vedientu-main-opacity", String(mainOpacity));
        document.documentElement.style.setProperty("--vedientu-head-opacity", String(headOpacity));

        setIsZoomed(next > 2.5);
        setIsZoomedIcon(next > 1.2);
        rafId = null;
      });
    };

    handleZoom();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', handleZoom);
    window.addEventListener('resize', handleZoom);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      vv?.removeEventListener('resize', handleZoom);
      window.removeEventListener('resize', handleZoom);
    };
  }, []);

  // Effect: Khi đang bị khóa, tự refresh trạng thái khóa mỗi 30s để mở lại nếu admin đã mở
  useEffect(() => {
    if (!supabase || !isSystemLocked) return;
    setLockCountdown(30);
    const tickId = window.setInterval(() => {
      setLockCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const intervalId = window.setInterval(async () => {
      try {
        setLockCountdown(30);
        const { data: ticketData } = await supabase
          .from('ve_truyen_thong')
          .select('trang_thai_khoa')
          .eq('ngay_so', ngaySo)
          .single();
        const locked = ticketData?.trang_thai_khoa || false;
        setIsSystemLocked(locked);
      } catch (err) {
        console.error("Lỗi refresh trạng thái khóa:", err);
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(tickId);
    };
  }, [isSystemLocked, ngaySo, ordersTable]);

  // Effect: Tự động cập nhật lại dữ liệu khi người dùng quay lại tab (Focus/Mở lại điện thoại)
  // Khắc phục vấn đề bị miss sự kiện Realtime khi điện thoại tắt màn hình hoặc chuyển tab
  useEffect(() => {
    const handleReFocus = async () => {
      if (document.visibilityState === 'visible') {
        // Gọi lại hàm lấy dữ liệu để cập nhật trạng thái mới nhất (Khóa, Tồn kho...)
        const { stock, imageUrl, imageFallback, rows, locked, veDienTu, veMauUrl } = await fetchRealTimeInventory();
        setInventory(stock);
        setTicketImage(imageUrl || null);
        setTicketImageFallback(imageFallback);
        if (rows) setMaxRows(rows);
        setIsSystemLocked(locked);
        syncVeDienTu(veDienTu, veMauUrl);
      }
    };

    document.addEventListener('visibilitychange', handleReFocus);
    window.addEventListener('focus', handleReFocus); // Thêm sự kiện focus cho chắc chắn trên Desktop

    return () => {
      document.removeEventListener('visibilitychange', handleReFocus);
      window.removeEventListener('focus', handleReFocus);
    };
  }, [ngaySo]);

  // Effect: Xử lý scroll để phóng to/thu nhỏ nút Cài App
  useEffect(() => {
    const handleScroll = () => {
      // Vị trí cuối màn hình của user
      const bottomOfScreen = window.scrollY + window.innerHeight;
      // Tổng chiều cao của trang
      const pageHeight = document.documentElement.scrollHeight;

      // Nếu user kéo xuống gần cuối trang (cách đáy 150px) thì phóng to nút
      if (pageHeight - bottomOfScreen < 150) {
        setIsInstallButtonLarge(true);
      } else {
        setIsInstallButtonLarge(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect: Xử lý focus khi hiện/ẩn thông báo
  useEffect(() => {
    // Logic này chạy mỗi khi alertMessage thay đổi
    if (alertMessage) {
      // 1. Hiện popup -> Out focus (Blur) để ẩn bàn phím
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } else {
      // 2. Tắt popup -> Focus lại ô nhập liệu phù hợp
      // Chỉ chạy logic focus khi alert vừa được tắt (chuyển từ có giá trị -> null)
      if (prevAlertMessageRef.current) {
        if (cart.length > 0 && !hoTen.trim()) {
          hoTenInputRef.current?.focus();
        } else if (cart.length > 0 && !sdt.trim()) {
          sdtInputRef.current?.focus();
        } else {
          if (inputRef1.current) inputRef1.current.focus();
        }
      }
    }
    prevAlertMessageRef.current = alertMessage;
  }, [alertMessage, cart.length, hoTen, sdt]);

  // Tính toán danh sách vé cho tab thông tin
  const availableList = Object.entries(inventory).filter(([_, qty]) => qty > 0).map(([num]) => num).sort();
  const soldOutList = Object.entries(inventory).filter(([_, qty]) => qty === 0).map(([num]) => num).sort();

  // Hàm xử lý khi click vào ô lưới trên ảnh
  const handleGridClick = (num: string) => {
    if (isNextDayBlocked) {
      return setAlertMessage("Chưa cho phép đặt vé ngày này.");
    }
    // Nếu bị khóa và không phải Admin -> Chặn
    if (isSystemLocked && !isAdminMode) {
      return setAlertMessage("Đại lý đang cập nhập tồn kho . Vui lòng chờ trong giây lát...");
    }

    // Kiểm tra xem đã có trong giỏ chưa (Dùng state hiện tại)
    const inCart = cart.find(item => item.so === num);
    if (inCart) {
      removeFromCart(num);
    } else {
      // Kiểm tra tồn kho từ dữ liệu đã tải (Không fetch lại để tránh lag)
      const stock = inventory[num] || 0;
      if (stock > 0) {
        const defaultQty = stock >= 2 ? 2 : 1; // Mặc định là 2 nếu kho đủ
        // Dùng functional update để tránh race condition (trùng số)
        setCart(prev => {
          if (prev.find(i => i.so === num)) return prev;
          return [...prev, { so: num, soLuongMua: defaultQty, soLuongKho: stock }];
        });
      } else {
        setAlertMessage(`Rất tiếc, số ${num} đã hết vé!`);
      }
    }
  };

  // Hàm xử lý khi nhập số
  const handleInputChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, '').slice(0, 1);
    if (inputError) setInputError(null); // Xóa lỗi khi nhập lại
    const newInput = [...currentInput];
    newInput[index] = val;
    setCurrentInput(newInput);

    // Auto focus logic
    if (index === 0 && val && inputRef2.current) {
      inputRef2.current.focus();
    }

    // Logic kiểm tra khi nhập đủ 2 số
    if (index === 1 && val && newInput[0]) {
      const fullNumber = newInput[0] + val;
      // Thêm độ trễ nhỏ để UI kịp hiển thị số thứ 2 trước khi hiện thông báo
      setTimeout(() => {
        checkAndAddNumber(fullNumber);
      }, 50);
    }
  };

  // Hàm kiểm tra và thêm vào giỏ hàng
  const checkAndAddNumber = (numStr: string) => {
    if (isNextDayBlocked) {
      setInputError("Chưa cho phép đặt vé ngày này.");
      return;
    }
    // Dùng dữ liệu tồn kho local để kiểm tra nhanh
    const stock = inventory[numStr] || 0;

    if (manualAdminMode) {
      // Admin không có grid: cho phép nhập tự do, bỏ qua tồn kho
      setCart(prev => {
        if (prev.find(i => i.so === numStr)) return prev;
        return [...prev, { so: numStr, soLuongMua: 1, soLuongKho: 16 }];
      });
    } else if (stock > 0) {
      // Dùng functional update để đảm bảo không thêm trùng
      setCart(prev => {
        if (prev.find(i => i.so === numStr)) return prev;
        const defaultQty = stock >= 2 ? 2 : 1;
        return [...prev, { so: numStr, soLuongMua: defaultQty, soLuongKho: stock }];
      });
    } else {
      setInputError(`Số ${numStr} đã hết vé!`);
    }
    // Reset ô nhập và focus lại ô đầu tiên (cho cả trường hợp có vé và hết vé)
    setCurrentInput(['', '']);
    if (inputRef1.current) inputRef1.current.focus();
  };

  // Xử lý nhận diện giọng nói đặt vé (đổ tự động vào cart)
  const processedVoiceRef = useRef<Set<string>>(new Set());

  const handleVoiceOrderRecognized = React.useCallback(
    (_digits: string, fullTranscript: string) => {
      if (!fullTranscript || !fullTranscript.trim()) return;

      const parsedItems = parseVoiceOrder(fullTranscript);
      if (parsedItems.length === 0) return;

      const signature = parsedItems.map((i) => `${i.num}:${i.qty || 'def'}`).join('|');
      if (processedVoiceRef.current.has(signature)) return;
      processedVoiceRef.current.add(signature);

      if (isNextDayBlocked) {
        setInputError('Chưa cho phép đặt vé ngày này.');
        return;
      }
      if (isSystemLocked && !isAdminMode) {
        setInputError('Đại lý đang cập nhập tồn kho.');
        return;
      }

      const outOfStockList: string[] = [];

      setCart((prevCart) => {
        let nextCart = [...prevCart];

        parsedItems.forEach(({ num, qty }) => {
          const stock = manualAdminMode ? 16 : inventory[num] || 0;

          if (stock > 0) {
            const targetQty = qty && qty > 0 ? Math.min(qty, stock) : stock >= 2 ? 2 : 1;
            const existingIndex = nextCart.findIndex((item) => item.so === num);

            if (existingIndex >= 0) {
              nextCart[existingIndex] = {
                ...nextCart[existingIndex],
                soLuongMua: targetQty,
                soLuongKho: stock,
              };
            } else {
              nextCart.push({
                so: num,
                soLuongMua: targetQty,
                soLuongKho: stock,
              });
            }
            if (parsedItems.length === 1 && num.length === 2) {
              setCurrentInput([num[0], num[1]]);
            }
          } else {
            outOfStockList.push(num);
          }
        });

        return nextCart;
      });

      if (outOfStockList.length > 0) {
        setInputError(`Số ${outOfStockList.join(', ')} đã hết vé!`);
      } else {
        setInputError(null);
      }

      window.setTimeout(() => {
        processedVoiceRef.current.clear();
        if (resetTranscriptRef.current) {
          resetTranscriptRef.current();
        }
      }, 300);
    },
    [inventory, isNextDayBlocked, isSystemLocked, isAdminMode, manualAdminMode]
  );

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToNumber({
    lang: 'vi-VN',
    onDigitsRecognized: handleVoiceOrderRecognized,
  });

  const resetTranscriptRef = useRef(resetTranscript);
  useEffect(() => {
    resetTranscriptRef.current = resetTranscript;
  }, [resetTranscript]);

  // Hàm cập nhật số lượng mua
  const updateQuantity = (so: string, qtyStr: string) => {
    const newQty = parseInt(qtyStr) || 0;
    const pulseKey = Date.now();
    setQtyPulse(prev => ({ ...prev, [so]: pulseKey }));
    window.setTimeout(() => {
      setQtyPulse(prev => (prev[so] === pulseKey ? { ...prev, [so]: 0 } : prev));
    }, 400);

    const itemInCart = cart.find(i => i.so === so);
    if (itemInCart && newQty > itemInCart.soLuongKho) {
      setAlertMessage(`Chỉ còn ${itemInCart.soLuongKho} vé cho số ${so}`);
      setCart(prev => prev.map(item =>
        item.so === so ? { ...item, soLuongMua: itemInCart.soLuongKho } : item
      ));
    } else {
      setCart(prev => prev.map(item =>
        item.so === so ? { ...item, soLuongMua: newQty } : item
      ));
    }
  };

  // Hàm xóa khỏi giỏ hàng
  const removeFromCart = (so: string) => {
    setCart(prev => prev.filter(item => item.so !== so));
  };

  // Hàm xử lý đặt vé
  const handleDatVe = async () => {
    if (!supabase) return setAlertMessage('Lỗi kết nối hệ thống!');
    if (isNextDayBlocked) return setAlertMessage('Chưa cho phép đặt vé ngày này.');
    if (!hoTen.trim() || !sdt.trim()) return setAlertMessage('Vui lòng nhập đầy đủ Họ tên và SĐT!');
    if (cart.length === 0) return setAlertMessage('Vui lòng chọn ít nhất 1 số!');

    // Kiểm tra khóa lần cuối
    if (isSystemLocked && !isAdminMode) {
      return setAlertMessage("Hệ thống đang tạm khóa để xử lý đơn Offline. Vui lòng thử lại sau ít phút.");
    }

    setIsSubmitting(true);
    try {
      const showConnectionError = () => {
        setAlertMessage(
          <div className="space-y-3">
            <p>Mất kết nối. Vui lòng thử lại.</p>
            <button
              onClick={() => {
                setAlertMessage(null);
                retryRef.current += 1;
                if (retryRef.current >= 2) {
                  window.location.reload();
                  return;
                }
                handleDatVe();
              }}
              className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold"
            >
              Thử lại
            </button>
          </div>
        );
      };

      if (!manualAdminMode) {
        // 1. CHECK TRẠNG THÁI KHÓA + TỒN KHO LẠI LẦN CUỐI TRƯỚC KHI GỬI (Quan trọng)
        let freshStock: Record<string, number> = {};
        let locked = false;
        try {
          const res = await fetchRealTimeInventory();
          freshStock = res.stock;
          locked = res.locked;
          syncVeDienTu(res.veDienTu, res.veMauUrl);
        } catch (err) {
          setIsSubmitting(false);
          showConnectionError();
          return;
        }
        const hasFreshStock = Object.keys(freshStock).length > 0;
        if (hasFreshStock) {
          setInventory(freshStock); // Cập nhật UI luôn
        } else {
          // Nếu không lấy được tồn kho (rỗng) thì không cập nhật/clear giỏ hàng
          setIsSubmitting(false);
          showConnectionError();
          return;
        }
        setIsSystemLocked(locked);

        if (locked && !isAdminMode) {
          setAlertMessage("Hệ thống đang tạm khóa để xử lý đơn Offline. Vui lòng thử lại sau ít phút.");
          setIsSubmitting(false);
          return;
        }

        // Kiểm tra xem giỏ hàng có hợp lệ với tồn kho mới không
        let isStockChanged = false;
        const updatedCart = cart.map(item => {
          const currentStock = freshStock[item.so] || 0;
          // Nếu tồn kho ít hơn số lượng muốn mua -> Cập nhật lại số lượng mua
          if (currentStock < item.soLuongMua) {
            isStockChanged = true;
            return { ...item, soLuongMua: currentStock, soLuongKho: currentStock };
          }
          return { ...item, soLuongKho: currentStock };
        }).filter(item => item.soLuongMua > 0); // Lọc bỏ vé nếu tồn kho về 0

        if (isStockChanged) {
          setCart(updatedCart);
          setAlertMessage("Tồn kho vừa thay đổi! Giỏ hàng đã được cập nhật lại theo thực tế. Vui lòng kiểm tra và bấm Đặt vé lại.");
          setIsSubmitting(false);
          return; // Dừng lại, không gửi đơn
        }
      }

      // Chuẩn bị dữ liệu lưu dạng JSON object { "số": số_lượng } cho đồng bộ với chi_tiet_ve
      const danhSachDat: Record<string, number> = {};
      cart.forEach(item => {
        danhSachDat[item.so] = item.soLuongMua;
      });
      const refFromUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref')
          : null;
      const refId =
        refFromUrl && refIdFromPage && refFromUrl === refIdFromPage ? refFromUrl : null;

      // Format hiển thị: 10 (3 vé), 20 (1 vé)
      const hienThiDat = cart.map(item => `${item.so} (${item.soLuongMua} vé)`).join(', ');

      // Tính tổng tiền và nội dung cho QR Code
      const totalAmount = cart.reduce((sum, item) => sum + (item.soLuongMua * 10000), 0);
      const dateDisplay = selectedTetLabel ? `${ngaySo} (${selectedTetLabel})` : ngaySo;

      if (manualAdminMode && !adminPasswordRef.current) {
        setAlertMessage("Cần xác thực lại mật khẩu Admin để tạo đơn khi chưa có tồn kho.");
        setIsSubmitting(false);
        return;
      }

      // Gọi API Server duy nhất để xử lý đặt đơn và tự động gửi thông báo Telegram + Email trên Server
      const apiPayload = {
        type: 'truyen_thong',
        mode: isTetMode ? 'tet' : (manualAdminMode ? 'admin' : 'normal'),
        ngaySo,
        hoTen,
        sdt,
        danhSachDat,
        refId,
        adminPassword: manualAdminMode ? adminPasswordRef.current : undefined,
        hienThiDat,
        totalAmount,
        dateDisplay
      };

      const res = await fetch('/api/dat-ve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Đặt vé thất bại, vui lòng thử lại.');
      }

      const infoText = (() => {
        if (!hoTen.trim()) return "Thanh-toan-ve-so";
        const parts = ngaySo.split('-');
        const dd = parts[2] || '';
        const mm = parts[1] || '';
        return `${dd} ${mm} ${hoTen.trim()}`.trim();
      })();
      setLastOrder({ amount: totalAmount, info: infoText });

      setThongBao(`Đơn hàng của bạn đã được gửi thành công!\nSố đặt: ${hienThiDat}\nChúng tôi sẽ liên hệ SĐT ${sdt} để xác nhận.`);
      // Reset form
      setCart([]);
      setHoTen('');
      setSdt('');
    } catch (error: any) {
      console.error('Lỗi đặt vé:', error);

      // FIX LỖI: Phân loại lỗi để không báo sai về tồn kho
      // TypeError: Load failed / Failed to fetch là lỗi do mạng yếu hoặc timeout
      if (error.message && (error.message.includes('Load failed') || error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
        setAlertMessage('Mất kết nối. Vui lòng thử lại.');
      } else {
        setAlertMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm reset để mua vé mới
  const handleNewBooking = async () => {
    setLastOrder(null);
    setCurrentInput(['', '']);
    setInputError(null);

    // Cập nhật lại kho vé mới nhất
    setLoading(true);
    try {
      const { stock, imageUrl, rows, veDienTu, veMauUrl } = await fetchRealTimeInventory();
      setInventory(stock);
      setTicketImage(imageUrl || null);
      if (rows) setMaxRows(rows);
      setThongBao('');
      syncVeDienTu(veDienTu, veMauUrl);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm bật/tắt chế độ khóa (Dành cho Admin)
  const handleToggleLock = () => {
    if (!supabase) return;
    setPasswordInput(''); // Reset ô nhập
    setShowPasswordModal(true); // Mở popup thay vì dùng prompt
  };

  // Xử lý khi bấm xác nhận mật khẩu trong Popup
  const handleConfirmLock = async () => {
    if (!supabase) return;

    setIsLocking(true); // Bắt đầu loading (giữ Modal lại)
    try {
      // Gọi hàm bảo mật trên Server (RPC)
      const { error } = await supabase.rpc('admin_toggle_lock', {
        p_ngay_so: ngaySo,
        p_password: passwordInput
      });

      if (error) {
        console.error("RPC Error:", error);
        setAlertMessage(error.message);
      } else {
        // Thành công
        const newState = !isSystemLocked;
        setIsSystemLocked(newState);
        // Nếu vừa khóa thành công -> Bật chế độ Admin
        // Nếu vừa mở khóa -> Tắt chế độ Admin
        setIsAdminMode(newState);
        // Lưu mật khẩu đã xác thực để dùng cho RPC admin khác trong phiên này
        adminPasswordRef.current = passwordInput;
      }
    } catch (err: any) {
      console.error("System Error:", err);
      setAlertMessage("Lỗi kết nối: " + (err.message || "Vui lòng kiểm tra mạng"));
    } finally {
      setIsLocking(false);
      setShowPasswordModal(false); // Chỉ đóng Modal sau khi đã xử lý xong
    }
  };

  const updateNextDayConfig = async (date: string, enabled: boolean) => {
    if (!supabase) return;
    try {
      if (!adminPasswordRef.current) {
        setAlertMessage("Cần xác thực lại mật khẩu Admin để bật đặt vé ngày tiếp theo.");
        return;
      }
      const { error } = await supabase.rpc('admin_set_prebooking', {
        p_ngay_so: date,
        p_enabled: enabled,
        p_password: adminPasswordRef.current
      });
      if (error) throw error;

      if (enabled) {
        setNextDayEnabled(true);
        setNextDayDate(date);
      } else {
        setNextDayEnabled(false);
        setNextDayDate(null);
      }
    } catch (err) {
      console.error("Lỗi cập nhật đặt vé ngày tiếp theo:", err);
      setAlertMessage("Không thể cập nhật đặt vé ngày tiếp theo!");
    }
  };

  const getNextDayDate = () => {
    const [y, m, d] = baseNgaySo.split('-').map(Number);
    const baseDate = new Date(y, (m || 1) - 1, d || 1);
    baseDate.setDate(baseDate.getDate() + 1);
    const yyyy = baseDate.getFullYear();
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    const dd = String(baseDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleNextDayClick = async () => {
    if (!supabase) return;
    const nextDate = getNextDayDate();
    try {
      const { data: nextConfig } = await supabase
        .from('ve_truyen_thong')
        .select('allow_prebooking')
        .eq('ngay_so', nextDate)
        .maybeSingle();

      const allowed = Boolean(nextConfig?.allow_prebooking);
      setNextDayDate(nextDate);
      setNextDayEnabled(allowed);
      setSelectedNextDayDate(nextDate);
      setSelectedPreTetDate(null);
      setSelectedTetDate(null);
      setSelectedAdminDate(null);
      setShowPreTetBox(false);
      setShowTetBox(false);
    } catch (err) {
      console.error("Lỗi kiểm tra đặt vé ngày tiếp theo:", err);
      setAlertMessage("Không thể kiểm tra đặt vé ngày tiếp theo!");
    }
  };

  const handleReturnToToday = () => {
    setSelectedNextDayDate(null);
  };

  // --- CHẾ ĐỘ ĐANG PHÁT TRIỂN ---
  // Đổi thành false khi bạn muốn hiển thị lại giao diện chính
  const IS_DEV_MODE = false;

  if (IS_DEV_MODE) {
    return (
      <div className="flex flex-col items-center justify-center min-h-75 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-purple-900 mb-3">Tính năng đang phát triển</h3>
        <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
          Hệ thống đặt vé Truyền Thống đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="text-slate-800 relative min-h-screen">
      <style>{`
        @keyframes spin-3d {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        .animate-spin-3d {
          animation: spin-3d 12s linear infinite;
          transform-style: preserve-3d;
        }
        @keyframes tet-border-glow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes tet-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.94); }
        }
        @keyframes qty-bubble {
          0% { transform: scale(1, 1); border-radius: 10px; }
          40% { transform: scale(1.5, 1.5); border-radius: 18px; }
          100% { transform: scale(1, 1); border-radius: 10px; }
        }
        .qty-bubble-wrap {
          position: relative;
          display: inline-block;
          border-radius: 10px;
          transform-origin: center;
        }
        .qty-bubble-wrap.is-bubbling {
          animation: qty-bubble 420ms ease-out;
        }
        @keyframes tet-ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes diag-reveal-clip {
          0% {
            clip-path: polygon(0 0, 2% 0, 0 2%, 0 0);
          }
          100% {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
        }
        @keyframes diag-reveal-fade {
          0% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .diag-reveal {
          animation: diag-reveal-clip 560ms ease-out both;
          will-change: clip-path;
        }
        .diag-reveal-inner {
          animation: diag-reveal-fade 520ms ease-out both;
          will-change: opacity, transform;
        }
      `}</style>
      <div className="relative z-10">
        {/* Vòng Quay May Mắn (Chỉ hiện CN hàng tuần) */}
        {showWheel && (
          <div className="-mt-6">
            <LuckyWheel />
          </div>
        )}

        <ThemeTet
          enabled={ENABLE_TET_THEME}
          tetBadgeSrc={tetBadgeSrc}
          decorations={
            ENABLE_83_THEME ? (
              <Theme83 enabled={ENABLE_83_THEME} />
            ) : ENABLE_XUAN_THEME ? (
              <ThemeXuan enabled={ENABLE_XUAN_THEME} sunPreview={sunPreview} />
            ) : (
              ENABLE_XUAN_PLACEHOLDER ? (
                <div className="relative w-[calc(100%+2rem)] -mx-4 sm:mx-0 sm:w-full pointer-events-none mb-2 mt-20 h-[200px]" />
              ) : null
            )
          }
        >
          <div className="relative w-[calc(100%+2rem)] -mx-4 sm:-mx-4 sm:w-[calc(100%+2rem)]">
            <div className="relative text-center bg-white/70 backdrop-blur-[1px] border-y border-purple-100 py-2 px-4 rounded-none">
              {daiSo && ngayHienThi ? (
                <>
                  <h2 className="text-2xl font-bold text-pink-600">Vé Số {daiSo}</h2>
                  <p className="text-lg font-bold text-purple-600">Ngày xổ - {ngayHienThi}</p>
                </>
              ) : (
                <>
                  <div className="h-8 bg-slate-200 rounded-md animate-pulse w-48 mx-auto mb-1"></div>
                  <div className="h-7 bg-slate-200 rounded-md animate-pulse w-56 mx-auto"></div>
                </>
              )}
              <div className="hidden mt-0 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('default')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${viewMode === 'default'
                    ? 'bg-sky-100 text-sky-700 border-sky-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  Mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('vedientu')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${viewMode === 'vedientu'
                    ? 'bg-sky-100 text-sky-700 border-sky-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  Vé điện tử
                </button>
              </div>
              {shouldShowNextDayArrow && selectedNextDayDate && (
                <button
                  onClick={handleReturnToToday}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-[1px] text-slate-600 hover:bg-white/85 transition-colors flex items-center justify-center"
                  title="Về ngày hiện tại"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {shouldShowNextDayArrow && !selectedNextDayDate && (
                <button
                  onClick={handleNextDayClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 backdrop-blur-[1px] text-sky-700 hover:bg-white/85 transition-colors flex items-center justify-center"
                  title="Mua vé ngày tiếp theo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </ThemeTet>

        {/* Box Đặt Vé Tết (ẩn khi tắt) */}
        {ENABLE_TET_BOOKING && (
          <div className={`mb-4 ${isModal ? '' : 'sticky top-16 z-30'}`}>
            <div className={mode === 'normal' && !showTetBox ? 'animate-[tet-pulse_2.6s_ease-in-out_infinite]' : ''}>
              <div
                className="relative rounded-2xl p-0.5 shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, rgba(244,114,182,0.9), rgba(250,204,21,0.9), rgba(129,140,248,0.9), rgba(244,114,182,0.9))',
                  backgroundSize: '300% 300%',
                  animation: 'tet-border-glow 6s linear infinite'
                }}
              >
                <div className="relative bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
                  {mode === 'normal' ? (
                    <button
                      onClick={() => setShowTetBox(prev => !prev)}
                      className="w-full flex items-center justify-center gap-2 text-center"
                    >
                      <span className="text-base font-bold text-purple-700">Đặt vé Tết (Mùng 1 - Mùng 3)</span>
                      <span className={`text-rose-500 text-xl transition-transform ${showTetBox ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>
                  ) : (
                    <div className="w-full text-center">
                      <span className="text-base font-bold text-purple-700">Đặt vé Tết (Mùng 1 - Mùng 3)</span>
                    </div>
                  )}

                  {showTetBox && (
                    <>
                      <div className="mt-2 flex justify-center">
                        <div className="flex gap-2">
                          {tetDateOptions.map(option => (
                            <button
                              key={option.date}
                              onClick={() => setSelectedTetDate(option.date)}
                              className={`py-2 px-3 min-w-24 text-center rounded-xl text-xs font-bold border transition-all ${selectedTetDate === option.date
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {effectiveTetDate
                            ? `Đang chọn: ${selectedTetLabel} (Ngày ${effectiveTetDate.split('-')[2]}/${effectiveTetDate.split('-')[1]})`
                            : 'Chưa chọn ngày Tết'}
                        </span>
                        {mode === 'normal' && selectedTetDate && (
                          <button
                            onClick={() => setSelectedTetDate(null)}
                            className="text-xs font-semibold text-purple-600 hover:underline"
                          >
                            Về ngày thường
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Box Chọn Ngày Tiếp Theo (Admin) */}
        {shouldShowAdminDateBox && (
          <div className="mb-4">
            <div className={`relative rounded-2xl p-0.5 shadow-lg ${!showAdminDateBox ? 'animate-[tet-pulse_2.6s_ease-in-out_infinite]' : ''}`}>
              <div
                className="relative rounded-2xl p-0.5"
                style={{
                  background: 'linear-gradient(90deg, rgba(16,185,129,0.9), rgba(59,130,246,0.9), rgba(16,185,129,0.9))',
                  backgroundSize: '300% 300%',
                  animation: 'tet-border-glow 6s linear infinite'
                }}
              >
                <div className="relative bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                  <button
                    onClick={() => setShowAdminDateBox(prev => !prev)}
                    className="w-full flex items-center justify-center gap-2 text-center"
                  >
                    <span className="text-base font-bold text-emerald-700">Chọn ngày tiếp theo (Admin)</span>
                    <span className={`text-emerald-500 text-xl transition-transform ${showAdminDateBox ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {showAdminDateBox && (
                    <>
                      <div className="mt-2 flex justify-center">
                        <div className="flex gap-2">
                          {adminDateOptions.map(option => (
                            <button
                              key={option.date}
                              onClick={() => {
                                setSelectedAdminDate(option.date);
                                setSelectedPreTetDate(null);
                                setSelectedTetDate(null);
                                setShowPreTetBox(false);
                                setShowTetBox(false);
                              }}
                              className={`py-2 px-3 min-w-24 text-center rounded-xl text-xs font-bold border transition-all ${selectedAdminDate === option.date
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {selectedAdminDate
                            ? `Đang chọn: Ngày ${selectedAdminDate.split('-')[2]}/${selectedAdminDate.split('-')[1]}`
                            : 'Chưa chọn ngày'}
                        </span>
                        {selectedAdminDate && (
                          <button
                            onClick={() => setSelectedAdminDate(null)}
                            className="text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            Về ngày thường
                          </button>
                        )}
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            if (!selectedAdminDate) {
                              setAlertMessage("Vui lòng chọn ngày trước khi cho phép đặt vé.");
                              return;
                            }
                            const nextState = !(nextDayEnabled && nextDayDate === selectedAdminDate);
                            updateNextDayConfig(selectedAdminDate, nextState);
                          }}
                          className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${nextDayEnabled && nextDayDate === selectedAdminDate
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                          {nextDayEnabled && nextDayDate === selectedAdminDate
                            ? 'Đang cho phép đặt vé'
                            : 'Cho phép đặt vé'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Box Mua Vé Tết (đơn vào don_hang) */}
        {shouldShowPreTetBox && (
          <div className="mb-4">
            <div className={`relative rounded-2xl p-0.5 shadow-lg ${!showPreTetBox ? 'animate-[tet-pulse_2.6s_ease-in-out_infinite]' : ''}`}>
              <div
                className="relative rounded-2xl p-0.5"
                style={{
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.9), rgba(236,72,153,0.9), rgba(99,102,241,0.9))',
                  backgroundSize: '300% 300%',
                  animation: 'tet-border-glow 6s linear infinite'
                }}
              >
                <div className="relative bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                  <button
                    onClick={() => setShowPreTetBox(prev => !prev)}
                    className="w-full flex items-center justify-center gap-2 text-center"
                  >
                    <span className="text-base font-bold text-purple-700">Mua trước vé Tết (Mùng 1 - Mùng 3)</span>
                    <span className={`text-purple-500 text-xl transition-transform ${showPreTetBox ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {showPreTetBox && (
                    <>
                      <div className="mt-2 flex justify-center">
                        <div className="flex gap-2">
                          {availablePreTetOptions.map(option => (
                            <button
                              key={option.date}
                              onClick={() => {
                                setSelectedPreTetDate(option.date);
                                setSelectedTetDate(null);
                              }}
                              className={`py-2 px-3 min-w-24 text-center rounded-xl text-xs font-bold border transition-all ${selectedPreTetDate === option.date
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                                }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {selectedPreTetDate
                            ? `Đang chọn: ${selectedPreTetLabel} (Ngày ${selectedPreTetDate.split('-')[2]}/${selectedPreTetDate.split('-')[1]})`
                            : 'Chưa chọn ngày Tết'}
                        </span>
                        {selectedPreTetDate && (
                          <button
                            onClick={() => setSelectedPreTetDate(null)}
                            className="text-xs font-semibold text-purple-600 hover:underline"
                          >
                            Về ngày thường
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thông báo khi bị khóa (Cho khách) */}
        {isSystemLocked && !isAdminMode && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-red-100 text-red-500 rounded-full flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-sm text-red-700 font-medium">
              Hệ thống đang tạm khóa để cập nhập tồn kho. Vui lòng chờ trong giây lát...
            </p>
          </div>
        )}

        {isSystemLocked && (
          <div className="mb-3 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold">Cập nhập trạng thái khóa:</span>
            <span>{lockCountdown}s</span>
          </div>
        )}

        {/* Realtime status (Admin debug) */}
        {isAdminMode && (
          <div className="mb-3 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold">Realtime:</span>
            <span className={`px-2 py-0.5 rounded-full border ${realtimeStatus === 'connected'
              ? 'bg-green-50 text-green-700 border-green-200'
              : realtimeStatus === 'disconnected'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
              {realtimeStatus === 'connected' ? 'Connected' : realtimeStatus === 'disconnected' ? 'Disconnected' : 'Connecting'}
            </span>
          </div>
        )}

        {/* Toggle nguồn ảnh (Admin) */}
        {isAdminMode && (
          <div className="mb-4 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold">Nguồn ảnh:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setImageSource('r2')}
                className={`px-2 py-1 rounded-full border ${imageSource === 'r2'
                  ? 'bg-sky-100 text-sky-700 border-sky-200'
                  : 'bg-white text-slate-500 border-slate-200'
                  }`}
              >
                R2
              </button>
              <button
                onClick={() => setImageSource('supa')}
                className={`px-2 py-1 rounded-full border ${imageSource === 'supa'
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-white text-slate-500 border-slate-200'
                  }`}
              >
                Supa
              </button>
            </div>
          </div>
        )}

        {/* Nút Cài App (Chỉ hiện khi chưa cài và (là Android có prompt hoặc là iOS)) */}
        {!isModal && !isStandalone && (deferredPrompt || isIOS) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 flex justify-end pointer-events-none animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={handleInstallApp}
              className={`pointer-events-auto flex items-center bg-pink-500 text-white rounded-full font-bold text-sm shadow-xl shadow-purple-200 border border-rose-200 hover:bg-purple-700 transition-all duration-300 ease-in-out ${isInstallButtonLarge ? 'gap-2 px-6 py-3' : 'gap-0 p-3'}`}
            >
              <Download className="w-6 h-6 animate-bounce" />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isInstallButtonLarge ? 'max-w-75 opacity-100' : 'max-w-0 opacity-0'}`}>
                {isIOS ? "Thêm vào màn hình chính" : "Cài đặt App ngay"}
              </span>
            </button>
          </div>
        )}

        {/* Phần 0: Hình ảnh vé (Mới) */}
        {viewMode === 'default' && (
          <div className="diag-reveal">
            <div className={`diag-reveal-inner mb-2 relative ${ticketImage && isImageLoaded ? '' : 'min-h-64'}`}>
              {selectedNextDayDate && !nextDayEnabled && (
                <div className="absolute inset-0 z-30 rounded-lg border border-rose-200 bg-linear-to-br from-rose-100 via-purple-100 to-blue-100 flex items-center justify-center text-center px-4">
                  <div>
                    <p className="text-base font-bold text-rose-700">Chưa cho phép đặt vé</p>
                    <p className="text-xs text-rose-600 mt-1">Vui lòng quay lại sau</p>
                  </div>
                </div>
              )}
              {/* Placeholder Animation - Absolute Overlay with Fade Effect */}
              <div
                className={`absolute inset-0 bg-slate-50 rounded-lg border border-purple-100 flex flex-col items-center justify-center z-20 transition-opacity duration-1000 ease-in-out ${(loading || showPlaceholder) ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-100/30 to-transparent animate-pulse"></div>

                {/* Lottie Bunny Animation */}
                <div className="relative w-32 h-32 mb-2">
                  {!isModal && bunnyData ? (
                    <Lottie animationData={bunnyData} loop={true} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full animate-pulse bg-purple-50 rounded-full opacity-50" />
                  )}
                </div>

                <p className="text-purple-500 text-sm font-bold animate-pulse z-10">Đang tải vé...</p>
              </div>

              <div className={`relative group select-none transition-opacity duration-1000 ease-in-out ${(loading || showPlaceholder) ? 'opacity-0' : 'opacity-100'} ${selectedNextDayDate && !nextDayEnabled ? 'opacity-0 pointer-events-none' : ''}`}>
                {ticketImage ? (
                  <img
                    src={ticketImage}
                    alt="Vé số tham khảo"
                    className="w-full h-auto rounded-lg shadow-md border border-purple-100 object-contain"
                    onLoad={() => {
                      setIsImageLoaded(true);
                      setShowPlaceholder(false);
                    }}
                    onError={() => {
                      if (ticketImageFallback && ticketImageFallback !== ticketImage) {
                        setTicketImage(`${ticketImageFallback}?ts=${Date.now()}`);
                        setTicketImageFallback(null);
                        return;
                      }
                      setTicketImage(null);
                      setIsImageLoaded(false);
                      setShowPlaceholder(true);
                    }}
                  />
                ) : (
                  <div className="w-full min-h-64 rounded-lg shadow-md border border-purple-100 bg-linear-to-br from-rose-100 via-purple-100 to-blue-100" />
                )}

                {shouldShowTodayOff && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-md">
                      <p className="text-sm font-bold text-purple-700">Đại lý tạm nghỉ bán hôm nay</p>
                    </div>
                  </div>
                )}

                {/* Nút phóng to ảnh (Góc trên phải) */}
                {ticketImage && (
                  <button
                    onClick={() => setIsImageViewerOpen(true)}
                    className={`absolute top-1 right-1 z-20 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full backdrop-blur-sm transition-all shadow-sm ${isZoomedIcon ? 'opacity-0' : 'opacity-60'}`}
                    title="Phóng to ảnh"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                    </svg>
                  </button>
                )}

                {/* Lớp phủ Grid tương tác */}
                {hasInventoryGrid && (ticketImage ? isImageLoaded : showPlaceholder) && (
                  <div className={`absolute inset-0 flex z-10 transition-opacity duration-700 ease-out ${ticketImage ? (isImageLoaded ? 'opacity-100' : 'opacity-0') : 'opacity-100'
                    }`}>
                    {[4, 3, 2, 1, 0].map((colIndex) => {
                      // Lọc các số thuộc cột này (VD: Cột 0 là đầu 0,1)
                      const colHeads = [colIndex * 2, colIndex * 2 + 1].map(h => h.toString());
                      const colNumbers = Object.keys(inventory)
                        .filter(num => colHeads.includes(num[0]))
                        .sort(); // Sắp xếp tăng dần: số nhỏ ở dưới

                      return (
                        <div key={colIndex} className="flex-1 flex flex-col-reverse">
                          {Array.from({ length: maxRows }).map((_, rowIndex) => {
                            const num = colNumbers[rowIndex];
                            const isSoldOut = num && inventory[num] === 0;
                            const isSelected = num && cart.some(item => item.so === num);
                            const isLockedUI = isSystemLocked && !isAdminMode; // UI bị khóa
                            const shouldRenderNumber = num && !isSoldOut && !isSelected && !isLockedUI;

                            return (
                              <div
                                key={rowIndex}
                                className={`flex-1 flex items-center justify-center relative ${num && !isSoldOut && !isLockedUI ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed'}`}
                                onClick={() => num && !isSoldOut && handleGridClick(num)}
                              >
                                {/* Hiển thị số mờ (Overlay) khi chưa chọn & chưa zoom */}
                                {shouldRenderNumber && (
                                  <span
                                    className={`pointer-events-none ${overlayColor === 'red' ? 'text-red-400' : (overlayColor === 'white' ? 'text-white' : 'text-yellow-300')} font-black text-xl md:text-2xl select-none z-0 transition-opacity duration-500 ease-in-out ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
                                    style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1.5px black' }}
                                  >
                                    {num}
                                  </span>
                                )}

                                {/* Hiệu ứng đã chọn */}
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-600 bg-white border border-pink-600 rounded-full shadow-sm">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}

                                {/* Hiệu ứng hết vé */}
                                {isSoldOut && (
                                  <div className="w-[90%] h-[90%] bg-black/60 rounded flex items-center justify-center backdrop-blur-[1px] shadow-sm">
                                    <span className="text-yellow-300 font-bold text-[10px] md:text-xs uppercase -rotate-12 border border-blue-500 px-1 rounded bg-white/10">hết vé</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Thanh chọn màu hiển thị số */}
            {hasInventoryGrid && !isNextDayBlocked && (ticketImage || Object.keys(inventory).length > 0) && (
              <div className="flex justify-center items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-3 bg-white p-1.5 rounded-full shadow-sm border border-purple-100">
                  <button
                    onClick={() => setOverlayColor('yellow')}
                    className={`w-6 h-6 rounded-full bg-yellow-300 border transition-transform ${overlayColor === 'yellow' ? 'border-purple-600 scale-125 ring-1 ring-purple-300' : 'border-slate-200 hover:scale-110'}`}
                  />
                  <button
                    onClick={() => setOverlayColor('red')}
                    className={`w-6 h-6 rounded-full bg-red-500 border transition-transform ${overlayColor === 'red' ? 'border-purple-600 scale-125 ring-1 ring-purple-300' : 'border-slate-200 hover:scale-110'}`}
                  />
                  <button
                    onClick={() => setOverlayColor('white')}
                    className={`w-6 h-6 rounded-full bg-white border transition-transform ${overlayColor === 'white' ? 'border-purple-600 scale-125 ring-1 ring-purple-300' : 'border-slate-200 hover:scale-110'}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'vedientu' && (
          ENABLE_VEDIENTU ? (
            <div className="diag-reveal">
              <div className="diag-reveal-inner">
                <VeDienTuGrid
                  ticketPreviewUrl={vedientuTicketUrl}
                  selectedNumbers={vedientuNumbers}
                  selectedCartNumbers={cart.map((item) => item.so)}
                  numberSuffixes={vedientuSuffixes}
                  inventory={inventory}
                  boxes={vedientuBoxes}
                  headBox={vedientuHeadBox}
                  cardWidth={vedientuCardWidth}
                  cardHeight={vedientuCardHeight}
                  backgroundUrl="/women-bg.jpg"
                  daiSo={daiSo}
                  fullBleedMobile={false}
                  fontKey={vedientuFontKey}
                  headColorKey={vedientuHeadColorKey}
                  loadingAnimationData={bunnyData}
                  onNumberToggle={handleGridClick}
                  ngayHienThi={ngayHienThi}
                  isError={isInventoryError}
                  onRetry={async () => {
                    setLoading(true);
                    setIsInventoryError(false);
                    try {
                      const { stock, imageUrl, imageFallback, rows, locked, veDienTu, veMauUrl } = await fetchRealTimeInventory();
                      setInventory(stock);
                      setTicketImage(imageUrl || null);
                      setTicketImageFallback(imageFallback);
                      if (rows) setMaxRows(rows);
                      setIsSystemLocked(locked);
                      syncVeDienTu(veDienTu, veMauUrl);
                    } catch {
                      setIsInventoryError(true);
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
                <div className="mt-2 mb-4 flex justify-center items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-1.5 rounded-full shadow-sm border border-purple-100">
                    <button
                      type="button"
                      onClick={() => setVedientuFontKey("be-vietnam-pro")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${vedientuFontKey === "be-vietnam-pro"
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      Be Vietnam Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setVedientuFontKey("rubik")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${vedientuFontKey === "rubik"
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      Rubik
                    </button>
                    <div className="h-6 w-px bg-purple-100" />
                    <button
                      type="button"
                      onClick={() => setVedientuHeadColorKey("yellow")}
                      aria-label="Chọn màu vàng cho headbox"
                      className={`flex h-6 w-6 items-center justify-center transition-transform ${vedientuHeadColorKey === "yellow"
                        ? "scale-115"
                        : "hover:scale-105"
                        }`}
                    >
                      <span className="h-4 w-4 rounded-full border border-black bg-yellow-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVedientuHeadColorKey("pink")}
                      aria-label="Chọn màu hồng cho headbox"
                      className={`flex h-6 w-6 items-center justify-center transition-transform ${vedientuHeadColorKey === "pink"
                        ? "scale-115"
                        : "hover:scale-105"
                        }`}
                    >
                      <span className="h-4 w-4 rounded-full border border-black bg-pink-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white/70 backdrop-blur-[1px] rounded-2xl border border-purple-100">
              <p className="font-bold text-purple-700">Chức năng đang được xây dựng</p>
              <p className="text-sm text-slate-500 mt-2">Vui lòng quay lại sau nhé!</p>
            </div>
          )
        )}



        {/* Modal xem ảnh full màn hình */}
        {viewMode === 'default' && isImageViewerOpen && ticketImage && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsImageViewerOpen(false)}
          >
            <img
              src={ticketImage}
              alt="Vé số Full"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Phần hiển thị danh sách vé (Accordion) */}
        {!thongBao && hasInventoryGrid && !isNextDayBlocked && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveInfoTab(activeInfoTab === 'available' ? null : 'available')}
                className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${activeInfoTab === 'available'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-white/70 backdrop-blur-[1px] text-slate-500 border-slate-100 hover:border-purple-200'
                  }`}
              >
                Vé còn ({availableList.length})
              </button>
              <button
                onClick={() => setActiveInfoTab(activeInfoTab === 'soldout' ? null : 'soldout')}
                className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all ${activeInfoTab === 'soldout'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-white/70 backdrop-blur-[1px] text-slate-500 border-slate-100 hover:border-purple-200'
                  }`}
              >
                Vé hết ({soldOutList.length})
              </button>
            </div>

            {/* Nội dung tab */}
            {activeInfoTab === 'available' && (
              <div className="mt-3 p-4 bg-green-50/70 backdrop-blur-[1px] rounded-2xl border border-green-100 animate-in slide-in-from-top-2">
                <p className="text-xs text-green-600 mb-2 font-semibold">Các số đang còn trong kho:</p>
                {availableList.length > 0 ? (
                  <>
                    <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                      <div className="flex flex-wrap gap-2 pb-2">
                        {availableList.map(num => (
                          <span key={num} className="inline-block px-2 py-1 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-bold shadow-sm">
                            {num} <span className="text-[13px] font-normal text-red-600">({inventory[num]})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-200 text-left">
                      <p className="text-sm font-bold text-green-700">
                        Tổng cộng: {availableList.reduce((sum, num) => sum + (inventory[num] || 0), 0)} vé
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xl font-black text-red-500 animate-pulse">HẾT VÉ</p>
                  </div>
                )}
              </div>
            )}

            {activeInfoTab === 'soldout' && (
              <div className="mt-3 p-4 bg-red-50/70 backdrop-blur-[1px] rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
                <p className="text-xs text-red-600 mb-2 font-semibold">Các số đã bán hết:</p>
                {soldOutList.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    <div className="flex flex-wrap gap-2 pb-8">
                      {soldOutList.map(num => (
                        <span key={num} className="inline-block px-2 py-1 bg-white border border-red-200 text-red-400 rounded-lg text-xs font-bold shadow-sm line-through decoration-red-400">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa có số nào bán hết.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phần 1: Chọn số */}
        {!thongBao && !isNextDayBlocked && (
          <div className="mb-6 p-6 bg-white/70 backdrop-blur-[1px] rounded-3xl shadow-sm border border-purple-100">
            <h3 className="font-semibold text-lg mb-4 text-purple-700 text-center">
              Nhập 2 số cuối vé bạn muốn mua ! Hoặc chọn trực tiếp trên ảnh vé !
            </h3>

            <div className="flex justify-center gap-3 mb-2">
              <input
                ref={inputRef1}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={currentInput[0]}
                onChange={(e) => handleInputChange(0, e.target.value)}
                className="w-14 h-14 text-center text-3xl font-bold text-purple-700 border-2 border-purple-100 rounded-xl bg-purple-50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              />
              <input
                ref={inputRef2}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={currentInput[1]}
                onChange={(e) => handleInputChange(1, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !currentInput[1] && inputRef1.current) {
                    inputRef1.current.focus();
                  }
                }}
                className="w-14 h-14 text-center text-3xl font-bold text-purple-700 border-2 border-purple-100 rounded-xl bg-purple-50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
              />
            </div>
            {inputError ? (
              <p className="text-center text-sm text-red-500 font-bold mt-4 animate-pulse">{inputError}</p>
            ) : (
              <p className="text-center text-xs text-slate-400 mt-2">Nhập đủ 2 số để kiểm tra vé</p>
            )}
          </div>
        )}

        {/* Phần 2: Kết quả tìm kiếm & Form đặt vé */}
        {!thongBao && !isNextDayBlocked && cart.length > 0 && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-semibold text-lg mb-3 text-rose-700 px-2">Giỏ Hàng Vé Đã Chọn</h3>

            <div className="bg-white/70 backdrop-blur-[1px] p-5 rounded-2xl border border-purple-100 shadow-sm mb-4">
              {loading ? <p className="text-center text-slate-500">Đang tải...</p> : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    {cart.map((item) => (
                      <div key={item.so} className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white font-bold rounded-lg text-lg shadow-sm">
                            {item.so}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-purple-700">Còn: {item.soLuongKho} vé</span>
                            <span className="text-xs text-slate-500">10.000đ/vé</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.so, String(item.soLuongKho))}
                            className="self-stretch px-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                            title={`Chọn tối đa (${item.soLuongKho})`}
                          >
                            MAX
                          </button>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => { if (item.soLuongKho >= 3) updateQuantity(item.so, '3') }}
                              disabled={item.soLuongKho < 3}
                              className="h-6 w-16 flex items-center justify-center text-[14px] font-bold rounded-t-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 disabled:bg-slate-50 disabled:text-slate-300 transition-colors"
                              title="Chọn nhanh 3 vé"
                            >
                              3
                            </button>
                            <div className={`qty-bubble-wrap ${qtyPulse[item.so] ? 'is-bubbling' : ''}`}>
                              <select
                                value={item.soLuongMua}
                                onChange={(e) => updateQuantity(item.so, e.target.value)}
                                className="w-16 p-1.5 text-center border-y border-purple-200 font-bold text-white focus:outline-none focus:border-purple-500 bg-purple-600 shadow-sm rounded-xl"
                              >
                                {Array.from({ length: item.soLuongKho }, (_, i) => i + 1).map((num) => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => { if (item.soLuongKho >= 5) updateQuantity(item.so, '5') }}
                              disabled={item.soLuongKho < 5}
                              className="h-6 w-16 flex items-center justify-center text-[14px] font-bold rounded-b-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 disabled:bg-slate-50 disabled:text-slate-300 transition-colors"
                              title="Chọn nhanh 5 vé"
                            >
                              5
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.so)}
                            className="self-stretch text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Xóa vé này"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dòng tổng kết */}
                  <div className="mt-4 pt-4 border-t border-dashed border-purple-200 flex justify-between items-center">
                    <span className="text-md font-bold text-slate-600">
                      Tổng cộng:
                    </span>
                    <div className="text-right">
                      <p className="text-base font-bold text-purple-700">
                        {cart.reduce((sum, item) => sum + item.soLuongMua, 0)} vé
                      </p>
                      <p className="text-md font-bold text-red-600">
                        {(cart.reduce((sum, item) => sum + (item.soLuongMua * 10000), 0)).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  {/* Form thông tin khách hàng */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                    <p className="text-sm font-bold text-slate-700">Thông tin nhận vé:</p>
                    <input
                      ref={hoTenInputRef}
                      type="text"
                      placeholder="Họ và tên của bạn"
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                      value={hoTen}
                      onChange={(e) => setHoTen(e.target.value)}
                    />
                    <input
                      ref={sdtInputRef}
                      type="tel"
                      placeholder="Số điện thoại (có Zalo) để ĐL gửi vé"
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                      value={sdt}
                      onChange={(e) => setSdt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Nút Đặt vé */}
            <button
              onClick={handleDatVe}
              disabled={isSubmitting || (isSystemLocked && !isAdminMode)}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${!isSubmitting && (!isSystemLocked || isAdminMode)
                ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                : "bg-slate-300 cursor-not-allowed"
                }`}
            >
              {isSubmitting ? 'Đang gửi yêu cầu...' : (isSystemLocked && !isAdminMode ? 'Đang tạm khóa...' : 'Xác nhận Đặt vé')}
            </button>
          </div>
        )}

        {/* Thông báo */}
        {thongBao && (
          <div className="mt-6 p-4 bg-white rounded-2xl border border-green-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="font-bold text-green-700">Yêu cầu thành công!</p>
            </div>
            <p className="text-slate-700 whitespace-pre-line text-sm pl-11">
              {thongBao}
            </p>

            {/* Hiển thị mã QR Thanh toán */}
            {lastOrder && (
              <div className="mt-6 flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-bold text-purple-900 mb-2">Quét/Lưu mã QR để thanh toán</p>
                <div className="text-center text-sm text-slate-600 mb-3 space-y-1">
                  <p className="font-semibold">{BANK_INFO.BANK_NAME}</p>
                  <p>Tên TK: <span className="font-bold uppercase">{BANK_INFO.ACCOUNT_NAME}</span></p>
                  <p>Số TK: <span className="font-bold text-purple-700">{BANK_INFO.ACCOUNT_DISPLAY}</span></p>
                </div>
                <img
                  src={`https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-qr.png?amount=${lastOrder.amount}&addInfo=${encodeURIComponent(lastOrder.info)}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`}
                  alt="QR Code Thanh Toán"
                  className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm bg-white"
                />
                <p className="text-sm text-slate-500 mt-3 font-medium">
                  Tổng tiền: <span className="text-purple-700 font-bold text-lg">{lastOrder.amount.toLocaleString('vi-VN')}đ</span>
                </p>
              </div>
            )}

            <button
              onClick={handleNewBooking}
              disabled={loading}
              className={`mt-4 w-full py-3 font-bold rounded-xl shadow-lg transition-all ${loading
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200"
                }`}
            >
              {loading ? 'Đang làm mới dữ liệu...' : 'Mua vé mới'}
            </button>
          </div>
        )}

        {/* Custom Alert Popup (Thay thế window.alert) */}
        {alertMessage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setAlertMessage(null)}
          >
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center mx-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-slate-800 font-medium text-lg mb-2">Thông báo</p>
              {/* Thêm whitespace-pre-line để hiển thị xuống dòng cho hướng dẫn iOS */}
              <div className="text-slate-600 mb-4 whitespace-pre-line text-sm">{alertMessage}</div>
              <p className="text-xs text-slate-400">(Chạm bất kỳ đâu để đóng)</p>
            </div>
          </div>
        )}

        {/* Popup Nhập Mật Khẩu Admin (Thay thế prompt xấu xí) */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full mx-4 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-purple-900 mb-2 text-center">
                {isSystemLocked ? "Mở Khóa Hệ Thống" : "Khóa Bán Offline"}
              </h3>
              <p className="text-sm text-slate-500 mb-4 text-center">
                Nhập mật khẩu quản trị để tiếp tục
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmLock()}
                className="w-full p-3 border border-purple-200 rounded-xl mb-4 focus:outline-none focus:border-purple-500 text-center font-bold text-purple-900 tracking-widest"
                placeholder="••••••"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmLock}
                  disabled={isLocking}
                  className={`flex-1 py-2.5 font-bold rounded-xl shadow-lg transition-all ${isLocking ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'}`}
                >
                  {isLocking ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nút Micro Nổi Giọng Nói Đặt Vé (Tạm tắt theo cấu hình ENABLE_VOICE_ORDER) */}
        {ENABLE_VOICE_ORDER && isSpeechSupported && (
          <div className="fixed left-4 bottom-[33vh] z-40 flex flex-col items-start gap-2 select-none">
            {/* Hộp hiển thị kết quả nghe thời gian thực */}
            {isListening && (
              <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md border border-purple-400/40 text-xs max-w-[220px] animate-in fade-in slide-in-from-left-4 duration-200">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                  <Volume2 className="w-4 h-4 text-purple-400 animate-bounce shrink-0" />
                  <span>Đang nghe đặt vé...</span>
                </div>
                <p className="text-slate-200 font-medium leading-relaxed">
                  {transcript ? `"${transcript}"` : 'Đọc số: "Cho 49 58", "57 89 mỗi số 5v" hoặc "12 3v 45 3v"'}
                </p>
                {speechError && <p className="text-rose-400 text-[11px] mt-1">{speechError}</p>}
              </div>
            )}

            {/* Nút Floating Icon Micro */}
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
              className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300 scale-110 shadow-rose-400/50'
                  : 'bg-white/90 backdrop-blur-md text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white hover:scale-105 shadow-purple-200'
                }`}
              title={isListening ? 'Tắt micro' : 'Nhấp để đặt vé bằng giọng nói 🎙️'}
              aria-label="Đặt vé bằng giọng nói"
            >
              {isListening ? (
                <MicOff className="w-7 h-7 animate-bounce" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
              {!isListening && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500"></span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Portal: Đưa nút Khóa lên Header của Page */}
        {mounted && document.getElementById('header-lock-area') && createPortal(
          <button
            onClick={handleToggleLock}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isSystemLocked
              ? (isAdminMode ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600')
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            title={isSystemLocked ? "Hệ thống đang KHÓA (Bấm để mở)" : "Bấm để KHÓA bán Offline"}
          >
            {isSystemLocked
              ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" /></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 0 1-1.5 0V6.75a3.75 3.75 0 1 0-7.5 0v3a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3v-6.75a3 3 0 0 1 3-3h9v-3c0-2.9 2.35-5.25 5.25-5.25Z" /></svg>
            }
          </button>,
          document.getElementById('header-lock-area')!
        )}
      </div>
    </div>
  );
}
