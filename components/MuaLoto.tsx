"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { parseLotoText } from '../lib/lotoParser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const loaiVeOptions = ['2 Số', '3 Số', '4 Số'];
const menhGiaOptions = ['10000', '20000', '50000'];

const kieuGhiMap: Record<string, string[]> = {
  '1': ['Đầu', 'Cuối', 'Đầu/Cuối', '18 Lô'],
  '2': ['Đầu', 'Cuối', 'Đầu/Cuối', '7 Lô', '17 Lô'],
  '3': ['4 Lô', '16 Lô'],
  '4': ['Đầu/Cuối', '18 Lô'],
  '5': ['Đầu/Cuối', '7 Lô', '17 Lô'],
};
const soToOptions = Array.from({ length: 10 }, (_, i) => i + 1);

const prizeStructure = [
  { name: 'Giải Tám', prize: '100k', digits: 2, count: 1 },
  { name: 'Giải Bảy', prize: '200k', digits: 3, count: 1 },
  { name: 'Giải Sáu', prize: '400k', digits: 4, count: 3 },
  { name: 'Giải Năm', prize: '1 Tr', digits: 4, count: 1 },
  { name: 'Giải Tư', prize: '3 Tr', digits: 5, count: 7 },
  { name: 'Giải Ba', prize: '10 Tr', digits: 5, count: 2 },
  { name: 'Giải Nhì', prize: '15 Tr', digits: 5, count: 1 },
  { name: 'Giải Nhất', prize: '30 Tr', digits: 5, count: 1 },
  { name: 'Giải ĐB', prize: 'Đặc Biệt', digits: 6, count: 1 },
].flatMap((prize, prizeTierIndex) =>
  Array.from({ length: prize.count }).map((_, indexInTier) => ({
    ...prize,
    label: prize.count > 1 ? `${prize.name} (${indexInTier + 1}/${prize.count})` : prize.name,
    uniqueKey: `${prizeTierIndex}-${indexInTier}`,
  }))
);

// CẤU HÌNH THÔNG TIN NGÂN HÀNG
const BANK_INFO = {
  BANK_ID: 'mb',
  ACCOUNT_NO: '0922341568',
  ACCOUNT_NAME: 'HOANG MINH VU',
  ACCOUNT_DISPLAY: '092 234 1568',
  BANK_NAME: 'Ngân Hàng Quân Đội (MB Bank)'
};

type DonHangItem = {
  loaiVe: string;
  menhGia: string;
  kieuGhi: string;
  chonSo: string;
  soTo: number;
};

const getNgayVaDaiClient = () => {
  const now = new Date();
  const vnTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const vnDate = new Date(vnTimeStr);
  const hour = vnDate.getHours();
  const minute = vnDate.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Khóa từ 15:00 (900 phút) đến trước 16:30 (990 phút)
  const isLocked = timeInMinutes >= 900 && timeInMinutes < 990;

  // Sau 16h30 (>= 990 phút) mới tự động chuyển sang ngày tiếp theo
  if (timeInMinutes >= 990) {
    vnDate.setDate(vnDate.getDate() + 1);
  }

  const ngaySoFormatted = `${String(vnDate.getDate()).padStart(2, '0')}/${String(vnDate.getMonth() + 1).padStart(2, '0')}/${vnDate.getFullYear()}`;
  const thu = vnDate.getDay();
  const daiMap = ['Lâm Đồng', 'Đồng Tháp', 'Vũng Tàu', 'Sóc Trăng', 'Bình Thuận', 'Bình Dương', 'Bình Phước'];
  return { ngaySo: ngaySoFormatted, daiSo: daiMap[thu], isLocked };
};

const getNgayVaDaiForOffset = (offsetDays: number = 0) => {
  const now = new Date();
  const vnTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const vnDate = new Date(vnTimeStr);
  if (offsetDays !== 0) {
    vnDate.setDate(vnDate.getDate() + offsetDays);
  }
  const ngaySoFormatted = `${String(vnDate.getDate()).padStart(2, '0')}/${String(vnDate.getMonth() + 1).padStart(2, '0')}/${vnDate.getFullYear()}`;
  const thu = vnDate.getDay();
  const daiMap = ['Lâm Đồng', 'Đồng Tháp', 'Vũng Tàu', 'Sóc Trăng', 'Bình Thuận', 'Bình Dương', 'Bình Phước'];
  return { ngaySo: ngaySoFormatted, daiSo: daiMap[thu] };
};

const getSoSlotForLoaiVe = (loaiVe: string) => {
  if (loaiVe === '2 Số') return 2;
  if (loaiVe === '3 Số') return 3;
  if (loaiVe === '4 Số') return 4;
  return 0;
};

const getKieuGhiKeyFor = (loaiVe: string, menhGia: string) => {
  if (loaiVe === '2 Số' && menhGia === '10000') return '1';
  if (loaiVe === '2 Số' && ['20000', '50000'].includes(menhGia)) return '4';
  if (loaiVe === '3 Số' && menhGia === '10000') return '2';
  if (loaiVe === '3 Số' && ['20000', '50000'].includes(menhGia)) return '5';
  if (loaiVe === '4 Số' && menhGia !== '') return '3';
  return '';
};

const getKieuGhiOptionsFor = (loaiVe: string, menhGia: string) => {
  const kieuGhiKey = getKieuGhiKeyFor(loaiVe, menhGia);
  return kieuGhiKey ? (kieuGhiMap[kieuGhiKey] || []) : [];
};

const getGuidePrizeValueFor = (
  guideLoaiVe: '2 Số' | '3 Số' | '4 Số' | null,
  guideKieuGhi: string | null,
  guideMenhGia: '10000' | '20000' | '50000'
) => {
  if (!guideLoaiVe || !guideKieuGhi) return null;

  if (guideMenhGia === '10000') {
    if (guideLoaiVe === '2 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return '700.000 đ';
      if (guideKieuGhi === 'Đầu/Cuối') return '350.000 đ';
      if (guideKieuGhi === '18 Lô') return '39.000 đ';
    }
    if (guideLoaiVe === '3 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return '5.000.000 đ';
      if (guideKieuGhi === 'Đầu/Cuối') return '2.500.000 đ';
      if (guideKieuGhi === '7 Lô') return '715.000 đ';
      if (guideKieuGhi === '17 Lô') return '300.000 đ';
    }
    if (guideLoaiVe === '4 Số') {
      if (guideKieuGhi === '4 Lô') return '8.000.000 đ';
      if (guideKieuGhi === '16 Lô') return '2.000.000 đ';
    }
  }

  if (guideMenhGia === '20000') {
    if (guideLoaiVe === '2 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return 'Ko ghi';
      if (guideKieuGhi === 'Đầu/Cuối') return '700.000 đ';
      if (guideKieuGhi === '18 Lô') return '78.000 đ';
    }
    if (guideLoaiVe === '3 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return 'Ko ghi';
      if (guideKieuGhi === 'Đầu/Cuối') return '5.000.000 đ';
      if (guideKieuGhi === '7 Lô') return '1.430.000 đ';
      if (guideKieuGhi === '17 Lô') return '600.000 đ';
    }
    if (guideLoaiVe === '4 Số') {
      if (guideKieuGhi === '4 Lô') return '16.000.000 đ';
      if (guideKieuGhi === '16 Lô') return '4.000.000 đ';
    }
  }

  if (guideMenhGia === '50000') {
    if (guideLoaiVe === '2 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return 'Ko ghi';
      if (guideKieuGhi === 'Đầu/Cuối') return '1.750.000 đ';
      if (guideKieuGhi === '18 Lô') return '195.000 đ';
    }
    if (guideLoaiVe === '3 Số') {
      if (guideKieuGhi === 'Đầu' || guideKieuGhi === 'Cuối') return 'Ko ghi';
      if (guideKieuGhi === 'Đầu/Cuối') return '12.500.000 đ';
      if (guideKieuGhi === '7 Lô') return '3.575.000 đ';
      if (guideKieuGhi === '17 Lô') return '1.500.000 đ';
    }
    if (guideLoaiVe === '4 Số') {
      if (guideKieuGhi === '4 Lô') return '40.000.000 đ';
      if (guideKieuGhi === '16 Lô') return '10.000.000 đ';
    }
  }

  return null;
};

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const makeGuideDigits = (seed: string, count: number) => {
  let value = hashSeed(seed);
  return Array.from({ length: count }, (_, index) => {
    value = (value * 1664525 + 1013904223 + index) >>> 0;
    return String(value % 10);
  }).join('');
};

interface MuaLotoProps {
  refIdFromPage?: string | null;
}

export default function MuaLoto({ refIdFromPage = null }: MuaLotoProps) {
  const [ngayDai, setNgayDai] = useState(() => getNgayVaDaiClient());
  const { ngaySo: defaultNgaySo, daiSo: defaultDaiSo, isLocked } = ngayDai;

  const [adminTargetDate, setAdminTargetDate] = useState<'today' | 'tomorrow'>('today');

  useEffect(() => {
    const timer = setInterval(() => {
      setNgayDai(getNgayVaDaiClient());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const ticketRef = useRef<HTMLDivElement>(null);
  const [loaiVe, setLoaiVe] = useState('');
  const [menhGia, setMenhGia] = useState('');
  const [kieuGhi, setKieuGhi] = useState('');
  const [chonSo, setChonSo] = useState<string[]>([]);
  const [soVuaNhap, setSoVuaNhap] = useState('');
  const [soTo] = useState(1);
  const [donHang, setDonHang] = useState<DonHangItem[]>([]);
  const [daMuaVe, setDaMuaVe] = useState(false);

  // State cho phần thanh toán
  const [tenKhachHang, setTenKhachHang] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [hinhThucThanhToan, setHinhThucThanhToan] = useState('Chuyển khoản');
  const [showQrCode, setShowQrCode] = useState(false);
  const [thongBaoMua, setThongBaoMua] = useState<React.ReactNode>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // State cho Mở khóa Admin
  const [adminPass, setAdminPass] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminUnlockModal, setShowAdminUnlockModal] = useState(false);
  const [unlockPassInput, setUnlockPassInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);

  // Khôi phục mật khẩu Admin và ngày đã chọn từ sessionStorage nếu có
  useEffect(() => {
    try {
      const savedPass = sessionStorage.getItem('loto_admin_pass');
      const savedTarget = sessionStorage.getItem('loto_admin_target_date') as 'today' | 'tomorrow' | null;
      if (savedPass) {
        setAdminPass(savedPass);
        setIsAdminUnlocked(true);
      }
      if (savedTarget === 'today' || savedTarget === 'tomorrow') {
        setAdminTargetDate(savedTarget);
      }
    } catch (e) {}
  }, []);

  // Tự động hủy trạng thái mở khóa khi hết giờ khóa (sau 16:30 sang ngày mới)
  useEffect(() => {
    if (!isLocked && isAdminUnlocked) {
      setIsAdminUnlocked(false);
      setAdminPass('');
      try {
        sessionStorage.removeItem('loto_admin_pass');
        sessionStorage.removeItem('loto_admin_target_date');
      } catch (e) {}
    }
  }, [isLocked, isAdminUnlocked]);

  const effectiveIsLocked = isLocked && !isAdminUnlocked;

  const effectiveNgayDai = React.useMemo(() => {
    if (isLocked && isAdminUnlocked) {
      return getNgayVaDaiForOffset(adminTargetDate === 'tomorrow' ? 1 : 0);
    }
    return { ngaySo: defaultNgaySo, daiSo: defaultDaiSo };
  }, [isLocked, isAdminUnlocked, adminTargetDate, defaultNgaySo, defaultDaiSo]);

  const ngaySo = effectiveNgayDai.ngaySo;
  const daiSo = effectiveNgayDai.daiSo;

  const handleSetAdminTargetDate = (target: 'today' | 'tomorrow') => {
    setAdminTargetDate(target);
    try {
      sessionStorage.setItem('loto_admin_target_date', target);
    } catch (e) {}
  };

  const handleVerifyAdminPass = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUnlockError('');
    if (!unlockPassInput.trim()) {
      setUnlockError('Vui lòng nhập mật khẩu Admin');
      return;
    }

    setIsVerifyingPass(true);
    try {
      const res = await fetch('/api/verify-admin-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: unlockPassInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminPass(unlockPassInput.trim());
        setIsAdminUnlocked(true);
        setShowAdminUnlockModal(false);
        setUnlockPassInput('');
        try {
          sessionStorage.setItem('loto_admin_pass', unlockPassInput.trim());
        } catch (err) {}
      } else {
        setUnlockError(data.error || 'Mật khẩu Admin không chính xác!');
      }
    } catch (err) {
      setUnlockError('Lỗi kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setIsVerifyingPass(false);
    }
  };

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<'prizes' | 'guide' | 'results'>('prizes');
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null);

  // State cho Đặt nhanh qua tin nhắn
  const [quickInputText, setQuickInputText] = useState('');
  const [quickInputMessage, setQuickInputMessage] = useState('');
  const [quickInputStatus, setQuickInputStatus] = useState<'success' | 'error' | ''>('');

  const handleParseAndAddToCart = () => {
    setQuickInputMessage('');
    setQuickInputStatus('');
    if (!quickInputText.trim()) return;

    const parseResult = parseLotoText(quickInputText, daiSo, ngaySo);
    if (parseResult.items.length === 0) {
      setQuickInputStatus('error');
      setQuickInputMessage(parseResult.errors[0] || 'Không tìm thấy số loto hợp lệ từ nội dung tin nhắn.');
      return;
    }

    setDonHang((prev) => [...prev, ...parseResult.items]);
    setQuickInputStatus('success');
    setQuickInputMessage(`Đã tự động nhận diện và thêm ${parseResult.items.length} vé Loto vào giỏ hàng!`);
    setQuickInputText('');
    setThongBaoMua('');
    setShowQrCode(false);
    setDaMuaVe(false);
  };

  // State cho Tab Kết quả trúng thưởng
  const [checkResultsDate, setCheckResultsDate] = useState(() => {
    const now = new Date();
    const vnTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnDate = new Date(vnTimeStr);
    const yyyy = vnDate.getFullYear();
    const mm = String(vnDate.getMonth() + 1).padStart(2, '0');
    const dd = String(vnDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [resultsData, setResultsData] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [resultsFilter, setResultsFilter] = useState<'all' | 'winning' | 'losing'>('all');

  const fetchLotoResults = useCallback(async (dateIso: string) => {
    if (!dateIso) return;
    setIsLoadingResults(true);
    setResultsError('');
    try {
      const res = await fetch(`/api/loto/check-results?date=${dateIso}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lấy dữ liệu kết quả Loto.');
      }
      setResultsData(data);
    } catch (err: any) {
      console.error('Lỗi gọi API check-results:', err);
      setResultsError(err.message || 'Lỗi khi tải kết quả trúng thưởng');
      setResultsData(null);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    if (activeHelpTab === 'results') {
      fetchLotoResults(checkResultsDate);
    }
  }, [activeHelpTab, checkResultsDate, fetchLotoResults]);

  const [guideLoaiVe, setGuideLoaiVe] = useState<'2 Số' | '3 Số' | '4 Số' | null>(null);
  const [guideKieuGhi, setGuideKieuGhi] = useState<string | null>(null);
  const [guideMenhGia, setGuideMenhGia] = useState<'10000' | '20000' | '50000'>('10000');
  const [guidePrizeDisplayValue, setGuidePrizeDisplayValue] = useState('');
  const [guidePrizeRevealPhase, setGuidePrizeRevealPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const guidePrizeDisplayValueRef = useRef('');
  const guidePanelRef = useRef<HTMLDivElement>(null);
  const lotoTitleRef = useRef<HTMLHeadingElement>(null);
  const chonSoInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const guidePrizeRevealTimerRef = useRef<number | null>(null);
  const submitLockRef = useRef(false);
  const [soToPulseIndex, setSoToPulseIndex] = useState<number | null>(null);
  const soToPulseTimerRef = useRef<number | null>(null);

  const openImageViewer = (imageUrl: string) => {
    setSelectedImageForViewer(imageUrl);
    setIsImageViewerOpen(true);
  };

  const guideKieuGhiOptions = guideLoaiVe === '2 Số'
    ? ['Đầu', 'Cuối', 'Đầu/Cuối', '18 Lô']
    : guideLoaiVe === '3 Số'
      ? ['Đầu', 'Cuối', 'Đầu/Cuối', '7 Lô', '17 Lô']
      : guideLoaiVe === '4 Số'
        ? ['4 Lô', '16 Lô']
        : [];
  const guidePrizeValue = getGuidePrizeValueFor(guideLoaiVe, guideKieuGhi, guideMenhGia);
  const canBuyGuideSelection = Boolean(guidePrizeValue && guidePrizeValue !== 'Ko ghi' && !effectiveIsLocked);
  const guidePrizeInputs = prizeStructure.map((prize) => makeGuideDigits(prize.uniqueKey, prize.digits));
  const canShowChonSo = Boolean(loaiVe && menhGia && kieuGhi);
  useEffect(() => {
    guidePrizeDisplayValueRef.current = guidePrizeDisplayValue;
  }, [guidePrizeDisplayValue]);

  useLayoutEffect(() => {
    if (!canShowChonSo) return;
    focusChonSoInput(0);
  }, [loaiVe, menhGia, kieuGhi, chonSo.length, canShowChonSo]);

  useEffect(() => {
    if (activeHelpTab !== 'guide') return;
    const timer = window.setTimeout(() => {
      const el = guidePanelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('header');
      const headerHeight = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
      const refStickyBar = document.getElementById('ref-sticky-bar');
      const refBarHeight = refStickyBar ? refStickyBar.getBoundingClientRect().height : 0;
      const offset = refIdFromPage ? refBarHeight : headerHeight / 4;
      const targetTop = window.scrollY + rect.top - offset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [activeHelpTab, refIdFromPage]);

  useEffect(() => {
    return () => {
      if (guidePrizeRevealTimerRef.current) {
        window.clearTimeout(guidePrizeRevealTimerRef.current);
      }
      if (soToPulseTimerRef.current) {
        window.clearTimeout(soToPulseTimerRef.current);
      }
    };
  }, []);

  const syncGuidePrizeReveal = (nextValue: string) => {
    const currentValue = guidePrizeDisplayValueRef.current;

    if (guidePrizeRevealTimerRef.current) {
      window.clearTimeout(guidePrizeRevealTimerRef.current);
      guidePrizeRevealTimerRef.current = null;
    }

    if (nextValue === currentValue) return;

    if (!currentValue) {
      setGuidePrizeDisplayValue(nextValue);
      setGuidePrizeRevealPhase(nextValue ? 'in' : 'idle');
      if (nextValue) {
        guidePrizeRevealTimerRef.current = window.setTimeout(() => {
          setGuidePrizeRevealPhase('idle');
          guidePrizeRevealTimerRef.current = null;
        }, 260);
      }
      return;
    }

    setGuidePrizeRevealPhase('out');
    guidePrizeRevealTimerRef.current = window.setTimeout(() => {
      setGuidePrizeDisplayValue(nextValue);
      guidePrizeDisplayValueRef.current = nextValue;
      setGuidePrizeRevealPhase(nextValue ? 'in' : 'idle');
      guidePrizeRevealTimerRef.current = window.setTimeout(() => {
        setGuidePrizeRevealPhase('idle');
        guidePrizeRevealTimerRef.current = null;
      }, 260);
    }, 180);
  };

  const handleLoaiVeChange = (item: string) => {
    setLoaiVe(item);
    setChonSo(Array(getSoSlotForLoaiVe(item)).fill(''));
    setSoVuaNhap('');

    const availableOptions = getKieuGhiOptionsFor(item, menhGia);
    if (kieuGhi && !availableOptions.includes(kieuGhi)) {
      setKieuGhi('');
    }
  };

  const handleMenhGiaChange = (item: string) => {
    setMenhGia(item);
    setSoVuaNhap('');

    const availableOptions = getKieuGhiOptionsFor(loaiVe, item);
    if (kieuGhi && !availableOptions.includes(kieuGhi)) {
      setKieuGhi('');
    }
  };

  const handleKieuGhiChange = (item: string) => {
    setKieuGhi(item);
    setSoVuaNhap('');
  };

  const handleGuideLoaiVeChange = (item: '2 Số' | '3 Số' | '4 Số') => {
    const nextKieuGhi = item === '4 Số' ? '4 Lô' : 'Đầu';
    setGuideLoaiVe(item);
    setGuideKieuGhi(nextKieuGhi);
    syncGuidePrizeReveal(getGuidePrizeValueFor(item, nextKieuGhi, guideMenhGia) || '');
  };

  const handleGuideKieuGhiChange = (item: string) => {
    if (!guideLoaiVe) return;
    setGuideKieuGhi(item);
    syncGuidePrizeReveal(getGuidePrizeValueFor(guideLoaiVe, item, guideMenhGia) || '');
  };

  const handleGuideMenhGiaChange = (item: '10000' | '20000' | '50000') => {
    setGuideMenhGia(item);
    syncGuidePrizeReveal(getGuidePrizeValueFor(guideLoaiVe, guideKieuGhi, item) || '');
  };

  const focusChonSoInput = (index: number) => {
    const input = chonSoInputRefs.current[index];
    if (!input) return;
    input.focus();
    input.select();
  };

  const handleAutoAddToCart = (digits: string[]) => {
    if (effectiveIsLocked) return false;
    if (!loaiVe || !menhGia || !kieuGhi) return false;
    if (digits.length === 0 || digits.includes('')) return false;
    const completedDigits = digits.join('');

    const newDon = {
      loaiVe,
      menhGia,
      kieuGhi,
      chonSo: completedDigits,
      soTo,
      daiSo,
      ngaySo,
    };
    setSoVuaNhap(completedDigits);
    setDonHang((prev) => [...prev, newDon]);
    setChonSo(Array(digits.length).fill(''));
    setThongBaoMua('');
    setShowQrCode(false);
    setDaMuaVe(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        focusChonSoInput(0);
      });
    });

    return true;
  };

  const updateDonHangSoTo = (index: number, qtyStr: string) => {
    const nextQty = Math.min(Math.max(parseInt(qtyStr, 10) || 1, 1), 10);
    setDonHang((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, soTo: nextQty } : item
    )));
    setSoToPulseIndex(index);
    if (soToPulseTimerRef.current) {
      window.clearTimeout(soToPulseTimerRef.current);
    }
    soToPulseTimerRef.current = window.setTimeout(() => {
      setSoToPulseIndex((current) => (current === index ? null : current));
      soToPulseTimerRef.current = null;
    }, 360);
  };

  const handleBuyGuideSelection = () => {
    if (!canBuyGuideSelection || !guideLoaiVe || !guideKieuGhi || effectiveIsLocked) return;
    setLoaiVe(guideLoaiVe);
    setMenhGia(guideMenhGia);
    setKieuGhi(guideKieuGhi);
    setChonSo(Array(getSoSlotForLoaiVe(guideLoaiVe)).fill(''));
    window.setTimeout(() => {
      const el = lotoTitleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('header');
      const headerHeight = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
      const refStickyBar = document.getElementById('ref-sticky-bar');
      const refBarHeight = refStickyBar ? refStickyBar.getBoundingClientRect().height : 0;
      const offset = refIdFromPage ? refBarHeight : headerHeight / 4;
      const targetTop = window.scrollY + rect.top - offset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }, 50);
  };

  const handleMuaVe = async () => {
    if (submitLockRef.current) return;
    if (effectiveIsLocked) {
      setErrors({ submit: `Đại lý ngưng nhận ghi loto cho ${daiSo} - ${ngaySo}` });
      return;
    }
    setThongBaoMua('');
    setErrors({});

    const newErrors: { [key: string]: string } = {};
    if (!tenKhachHang.trim()) newErrors.ten = 'Vui lòng nhập tên';
    if (!soDienThoai.trim()) {
      newErrors.sdt = 'Vui lòng nhập số điện thoại';
    }
    if (!hinhThucThanhToan) newErrors.thanhToan = 'Vui lòng chọn hình thức thanh toán';
    if (donHang.length === 0) newErrors.donHang = 'Chưa có vé nào được chọn';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    submitLockRef.current = true;
    setIsSubmittingOrder(true);
    try {
      // Giả lập gọi API (giữ nguyên logic cũ)
      const orderData = {
        refId: refIdFromPage, // Thêm refId vào data gửi mail
        tenKhachHang,
        soDienThoai,
        hinhThucThanhToan,
        donHang,
        ngaySo,
        daiSo,
        ngayDatVe: new Date().toISOString(),
        tongSoVe: donHang.reduce((acc, item) => acc + item.soTo, 0),
        tongTien: donHang.reduce((acc, item) => acc + (parseInt(item.menhGia) * item.soTo), 0)
      };

      console.log("Gửi đơn hàng:", orderData);
      // Ở đây bạn có thể bỏ comment fetch API khi backend sẵn sàng

      // Lưu vào Supabase & Gửi thông báo thông qua API Server an toàn
      const chiTietDonJson = donHang.map(d => ({
        menh_gia: d.menhGia,
        kieu_ghi: d.kieuGhi,
        so: d.chonSo,
        loai_ve: d.loaiVe,
        so_to: d.soTo
      }));

      const res = await fetch('/api/dat-ve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'loto',
          ngaySo,
          hoTen: tenKhachHang,
          sdt: soDienThoai,
          chiTietDon: chiTietDonJson,
          refId: refIdFromPage,
          tongTien: orderData.tongTien,
          hinhThucThanhToan,
          orderData,
          adminPassword: adminPass,
          isAdminOverride: isAdminUnlocked,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Đặt vé Loto thất bại, vui lòng thử lại.');
      }

      setDaMuaVe(true);
      if (hinhThucThanhToan === 'Tiền mặt') {
        setThongBaoMua(
          <span>
            Quý khách đã mua vé thành công.<br />
            Vui lòng thanh toán & nhận vé tại<br />
            72 Ngô Sĩ Liên <span className="font-bold text-red-600">trước 15h</span>.
          </span>
        );
      } else {
        setShowQrCode(true);
        setThongBaoMua('Quý khách đã mua vé thành công, lưu lại mã QR để thanh toán.');
      }
    } catch (err) {
      console.error("Lỗi đặt vé Loto:", err);
      setThongBaoMua('');
      setErrors((prev) => ({ ...prev, submit: 'Đặt vé thất bại, vui lòng thử lại.' }));
    } finally {
      submitLockRef.current = false;
      setIsSubmittingOrder(false);
    }
  };

  const handleSaveImage = () => {
    if (!ticketRef.current) return;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const ticketRows = donHang.map((d) => `
        <div style="padding:12px 14px; border:1px solid #e9d5ff; border-radius:14px; background:#fff; margin-bottom:10px;">
          <div style="display:grid; grid-template-columns:minmax(0,1.5fr) auto auto; gap:14px; align-items:center;">
            <div style="min-width:0; text-align:left;">
              <div style="display:inline-flex; align-items:center; justify-content:center; padding:5px 12px; border-radius:8px; background:${getBgColorHex(d.menhGia)}; color:#581c87; font-weight:700; font-size:13px; margin-bottom:6px;">${parseInt(d.menhGia).toLocaleString('vi-VN')}</div>
              <div style="font-size:14px; font-weight:600; color:#334155; line-height:1.35; margin-bottom:2px;">${escapeHtml(d.loaiVe)}</div>
              <div style="font-size:14px; font-weight:600; color:#dc2626; line-height:1.35;">${escapeHtml(d.kieuGhi)}</div>
            </div>
            <div style="min-width:0; text-align:center; font-size:32px; font-weight:800; color:#7e22ce; line-height:1;">${escapeHtml(d.chonSo)}</div>
            <div style="min-width:72px; text-align:center; font-size:14px; font-weight:700; color:#334155; line-height:1.35;">
              <div style="color:#64748b; font-size:12px; font-weight:600; margin-bottom:4px;">Số tờ</div>
              <div>${d.soTo} tờ</div>
            </div>
          </div>
        </div>
      `).join('');

      const totalTickets = donHang.reduce((acc, item) => acc + item.soTo, 0);
      const totalMoney = donHang.reduce((acc, item) => acc + (parseInt(item.menhGia) * item.soTo), 0);

      newWindow.document.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Vé đã mua</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; background: #f8fafc; font-family: Arial, sans-serif; padding: 16px; box-sizing: border-box; color: #1e293b; }
            </style>
          </head>
          <body>
            <div style="max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #e9d5ff; border-radius: 18px; padding: 18px;">
              <h1 style="margin: 0 0 14px; font-size: 22px; font-weight: 800; color: #581c87; text-align: center;">Vé đã mua</h1>
              <div style="padding: 14px; border-radius: 14px; background: #faf5ff; border: 1px solid #f3e8ff; margin-bottom: 14px;">
                <div style="margin-bottom: 8px; font-size: 14px;"><span style="color:#64748b;">Tên KH:</span> <strong>${escapeHtml(tenKhachHang)}</strong></div>
                <div style="margin-bottom: 8px; font-size: 14px;"><span style="color:#64748b;">Số ĐT:</span> <strong>${escapeHtml(soDienThoai)}</strong></div>
                <div style="margin-bottom: 8px; font-size: 14px;"><span style="color:#64748b;">Ngày:</span> <strong>${escapeHtml(ngaySo)}</strong></div>
                <div style="display:flex; justify-content:space-between; gap:12px; margin-top: 10px; font-size: 14px;">
                  <span><span style="color:#64748b;">Tổng vé:</span> <strong>${totalTickets}</strong></span>
                  <span><span style="color:#64748b;">Thành tiền:</span> <strong>${totalMoney.toLocaleString('vi-VN')} đ</strong></span>
                </div>
              </div>
              <div>${ticketRows}</div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert('Vui lòng cho phép mở cửa sổ bật lên (Pop-up) để xem phiếu vé!');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Đã sao chép: ${text}`);
    });
  };

  const getBgColorHex = (val: string) => {
    if (val === '10000') return '#fde68a'; // vàng nhạt đậm hơn
    if (val === '20000') return '#bbf7d0'; // xanh lá nhạt đậm hơn
    if (val === '50000') return '#fbcfe8'; // hồng nhạt đậm hơn
    return '#f3e8ff';
  };

  return (
    <div className="text-slate-800">
      <style>{`
        @keyframes spin-border {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .btn-active-effect {
          position: relative;
          overflow: hidden;
          color: white;
          z-index: 1;
        }
        /* Dải sáng xoay tròn bên dưới */
        .btn-active-effect::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300%;
          height: 300%;
          background: conic-gradient(#f3e8ff 70%, #d946ef 100%);
          animation: spin-border 3s linear infinite;
          z-index: -2;
        }
        /* Lớp nền màu tím che ở giữa để tạo hiệu ứng viền */
        .btn-active-effect::after {
          content: '';
          position: absolute;
          inset: 3px; /* Độ dày viền */
          background-color: #9333ea; /* purple-600 */
          border-radius: 0.6rem; /* Bo góc khớp với rounded-xl */
          z-index: -1;
        }
      `}</style>
      <style>{`
        @keyframes pulse-pop {
          0% { transform: scale(1); }
          45% { transform: scale(1.12); }
          100% { transform: scale(1); }
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
        .guide-pulse {
          transition: background-color 700ms ease, color 700ms ease, border-color 700ms ease, box-shadow 700ms ease;
          color: #dc2626 !important; /* red-600 */
          background: #fde047; /* yellow-300 */
          border-color: #f59e0b; /* amber-500 */
          box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.25);
        }
        .guide-prize-pulse {
          animation: pulse-pop 2.4s ease-in-out infinite;
          display: inline-block;
          transform-origin: center;
        }
        @keyframes guide-prize-reveal-in {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        @keyframes guide-prize-reveal-out {
          from { transform: scaleX(1); opacity: 1; }
          to { transform: scaleX(0); opacity: 0; }
        }
        .guide-prize-reveal-in {
          animation: guide-prize-reveal-in 340ms ease-out both;
          transform-origin: left center;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
        }
        .guide-prize-reveal-out {
          animation: guide-prize-reveal-out 340ms ease-in both;
          transform-origin: right center;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
        }
      `}</style>
      <div className="text-center mb-6">
        {/* Banner: 3 ảnh vé Loto */}
        <div className="flex p-1 mb-2">
          <button
            onClick={() => setActiveHelpTab('prizes')}
            className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${activeHelpTab === 'prizes'
                ? 'bg-white/70 text-purple-700 shadow-md shadow-purple-200/40'
                : 'bg-transparent text-slate-600 hover:text-purple-700'
              }`}
          >
            Cơ cấu trả thưởng
          </button>
          <button
            onClick={() => setActiveHelpTab('guide')}
            className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${activeHelpTab === 'guide'
                ? 'bg-white/70 text-purple-700 shadow-md shadow-purple-200/40'
                : 'bg-transparent text-slate-600 hover:text-purple-700'
              }`}
          >
            Hướng dẫn dò vé
          </button>
        </div>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setActiveHelpTab('results')}
            className={`px-5 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeHelpTab === 'results'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'bg-white/70 text-purple-700 hover:bg-purple-50 border border-purple-100'
            }`}
          >
            <span>🏆</span>
            <span>Kết quả trúng thưởng</span>
          </button>
        </div>

        {activeHelpTab === 'prizes' && (
          <div className="grid grid-cols-3 gap-2 mb-4 animate-in fade-in duration-300">
            <div
              className="rounded-xl overflow-hidden shadow-md bg-slate-100 h-28 cursor-pointer"
              onClick={() => openImageViewer('/loto-10k.jpg')}
            >
              <div className="relative w-full h-full">
                <Image src="/loto-10k.jpg" alt="Vé Loto 10k" fill className="object-cover" sizes="(max-width: 768px) 33vw, 180px" />
              </div>
            </div>
            <div
              className="rounded-xl overflow-hidden shadow-md bg-slate-100 h-28 cursor-pointer"
              onClick={() => openImageViewer('/loto-20k.jpg')}
            >
              <div className="relative w-full h-full">
                <Image src="/loto-20k.jpg" alt="Vé Loto 20k" fill className="object-cover" sizes="(max-width: 768px) 33vw, 180px" />
              </div>
            </div>
            <div
              className="rounded-xl overflow-hidden shadow-md bg-slate-100 h-28 cursor-pointer"
              onClick={() => openImageViewer('/loto-50k.jpg')}
            >
              <div className="relative w-full h-full">
                <Image src="/loto-50k.jpg" alt="Vé Loto 50k" fill className="object-cover" sizes="(max-width: 768px) 33vw, 180px" />
              </div>
            </div>
          </div>
        )}

        {activeHelpTab === 'guide' && (
          <div ref={guidePanelRef} className="mb-4 animate-in fade-in duration-300">
            <div className="bg-white/80 border border-purple-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {prizeStructure.map((prize, prizeIndex) => {
                    const showLabel = prizeIndex === 0 || prizeStructure[prizeIndex - 1]?.name !== prize.name;
                    const labelMap: Record<string, string> = {
                      'Giải Tám': 'Giải 100K',
                      'Giải Bảy': 'Giải 200K',
                      'Giải Sáu': 'Giải 400K',
                      'Giải Năm': 'Giải 1 Triệu',
                      'Giải Tư': 'Giải 3 Triệu',
                      'Giải Ba': 'Giải 10 Triệu',
                      'Giải Nhì': 'Giải 15 Triệu',
                      'Giải Nhất': 'Giải 30 Triệu',
                      'Giải ĐB': 'Giải Đặc Biệt',
                    };
                    const isG8 = prize.name === 'Giải Tám';
                    const isG7 = prize.name === 'Giải Bảy';
                    const isG6 = prize.name === 'Giải Sáu';
                    const isG5 = prize.name === 'Giải Năm';
                    const isDB = prize.name === 'Giải ĐB';
                    const prizeOrder = ['Giải Tám', 'Giải Bảy', 'Giải Sáu', 'Giải Năm', 'Giải Tư', 'Giải Ba', 'Giải Nhì', 'Giải Nhất', 'Giải ĐB'];
                    const isFromG7ToDB = prizeOrder.indexOf(prize.name) >= prizeOrder.indexOf('Giải Bảy');
                    const isFromG6ToDB = prizeOrder.indexOf(prize.name) >= prizeOrder.indexOf('Giải Sáu');
                    const highlightDigits = guideLoaiVe === '2 Số' ? 2 : guideLoaiVe === '3 Số' ? 3 : guideLoaiVe === '4 Số' ? 4 : 0;
                    const lastNStart = Math.max(prize.digits - highlightDigits, 0);
                    const shouldPulse =
                      (guideLoaiVe === '2 Số' && (
                        (guideKieuGhi === 'Đầu' && isG8) ||
                        (guideKieuGhi === 'Cuối' && isDB) ||
                        (guideKieuGhi === 'Đầu/Cuối' && (isG8 || isDB)) ||
                        (guideKieuGhi === '18 Lô')
                      )) ||
                      (guideLoaiVe === '3 Số' && (
                        (guideKieuGhi === 'Đầu' && isG7) ||
                        (guideKieuGhi === 'Cuối' && isDB) ||
                        (guideKieuGhi === 'Đầu/Cuối' && (isG7 || isDB)) ||
                        (guideKieuGhi === '7 Lô' && prize.name === 'Giải Tư') ||
                        (guideKieuGhi === '17 Lô' && isFromG7ToDB)
                      )) ||
                      (guideLoaiVe === '4 Số' && (
                        (guideKieuGhi === '4 Lô' && (isG6 || isG5)) ||
                        (guideKieuGhi === '16 Lô' && isFromG6ToDB)
                      ));

                    return (
                      <div key={prize.uniqueKey} className="grid grid-cols-[88px_1fr] items-center gap-1.5">
                        <label
                          className={`text-[12px] font-semibold text-left leading-4 ${isDB ? 'text-red-600 font-bold' : 'text-slate-600'
                            }`}
                        >
                          {showLabel ? (labelMap[prize.name] || prize.label) : ''}
                        </label>
                        <div className="flex gap-1 justify-start">
                          {Array.from({ length: prize.digits }).map((_, digitIndex) => (
                            <div
                              key={digitIndex}
                              className={`w-[24px] h-[26px] text-center text-[15px] leading-none font-bold text-purple-700 border border-purple-100 rounded-md bg-purple-50 flex items-center justify-center ${shouldPulse && digitIndex >= lastNStart ? 'guide-pulse' : ''
                                }`}
                            >
                              {(guidePrizeInputs[prizeIndex]?.[digitIndex]) || ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="w-[108px] shrink-0 pt-[1px]">
                  <div className="flex justify-end gap-1.5 mb-2">
                    {(['2 Số', '3 Số', '4 Số'] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => handleGuideLoaiVeChange(item)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${guideLoaiVe === item
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
                          }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {guideLoaiVe && (
                    <div className="flex flex-col items-end gap-1.5">
                      {guideKieuGhiOptions.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleGuideKieuGhiChange(item)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${guideKieuGhi === item
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-transparent text-slate-500 hover:text-purple-700'
                            }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="w-full border-t-2 border-sky-200/90" />
              </div>
              <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                <div className="text-center text-[13px] font-bold text-purple-700">
                  Mệnh giá
                </div>
                <div className="text-center text-[13px] font-bold text-purple-700">
                  Số tiền trúng thưởng
                </div>
                <div className="flex flex-col gap-1">
                  {([
                    { value: '10000', label: '10k' },
                    { value: '20000', label: '20k' },
                    { value: '50000', label: '50k' },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      onClick={() => handleGuideMenhGiaChange(item.value)}
                      className={`h-7 rounded-md text-[11px] font-semibold transition-all ${guideMenhGia === item.value
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-[92px] flex flex-col items-center justify-center text-center">
                  <span className="guide-prize-pulse inline-flex w-55 max-w-full min-h-12 items-center justify-center overflow-hidden text-[28px] leading-tight font-extrabold text-red-600">
                    <span
                      className={`${guidePrizeRevealPhase === 'out'
                          ? 'guide-prize-reveal-out'
                          : guidePrizeRevealPhase === 'in'
                            ? 'guide-prize-reveal-in'
                            : ''
                        }`}
                      style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {guidePrizeDisplayValue || ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleBuyGuideSelection}
                    disabled={!canBuyGuideSelection}
                    className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all ${canBuyGuideSelection
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200'
                        : 'bg-slate-300 cursor-not-allowed'
                      }`}
                  >
                    Mua kiểu ghi này
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeHelpTab === 'results' && (
          <div className="mb-6 animate-in fade-in duration-300 text-left">
            <div className="bg-white/90 border border-purple-100 rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-purple-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <span>🏆</span> Kết quả trúng thưởng Loto
                  </h3>
                  <p className="text-xs text-slate-500">Tự động dò số & tính tiền trúng thưởng cho các đơn hàng Loto</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Chọn ngày xổ:</label>
                  <input
                    type="date"
                    value={checkResultsDate}
                    onChange={(e) => setCheckResultsDate(e.target.value)}
                    className="p-2 rounded-xl border border-purple-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fetchLotoResults(checkResultsDate)}
                    className="p-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                    title="Tải lại kết quả"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingResults ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingResults ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-medium">Đang tải và tự động dò vé Loto...</p>
                </div>
              ) : resultsError ? (
                <div className="py-8 text-center text-red-600 bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="font-semibold text-sm">{resultsError}</p>
                </div>
              ) : resultsData ? (
                <div className="space-y-4">
                  {/* Thẻ cảnh báo nếu chưa có kết quả xổ số */}
                  {!resultsData.hasLotteryResult && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-medium flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Chưa có dữ liệu kết quả xổ số cho ngày <strong>{resultsData.dateVn}</strong>. Kết quả trúng sẽ được tự động cập nhật khi có bảng mở thưởng.</span>
                    </div>
                  )}

                  {/* Thống kê tổng quan */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Tổng đơn hàng</p>
                      <p className="text-xl sm:text-2xl font-black text-purple-900">{resultsData.summary?.totalOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[11px] font-semibold text-emerald-600 uppercase">Đơn trúng thưởng</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-700">{resultsData.summary?.winningOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[11px] font-semibold text-rose-600 uppercase">Tổng tiền trúng</p>
                      <p className="text-base sm:text-xl font-black text-rose-600 truncate">
                        {(resultsData.summary?.totalWinningAmount || 0).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  {/* Lọc danh sách đơn */}
                  <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                    <span className="text-xs font-bold text-slate-700">
                      {resultsData.dai ? `Đài ${resultsData.dai} (${resultsData.dateVn})` : `Ngày ${resultsData.dateVn}`}
                    </span>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setResultsFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resultsFilter === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Tất cả ({resultsData.orders?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultsFilter('winning')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resultsFilter === 'winning' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Trúng ({resultsData.summary?.winningOrders || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultsFilter('losing')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          resultsFilter === 'losing' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {resultsData.hasLotteryResult
                          ? `Chưa trúng/Trật (${ (resultsData.summary?.totalOrders || 0) - (resultsData.summary?.winningOrders || 0) })`
                          : `Chờ xổ số (${resultsData.orders?.length || 0})`}
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các đơn Loto */}
                  {resultsData.orders && resultsData.orders.length > 0 ? (
                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                      {resultsData.orders
                        .filter((ord: any) => {
                          if (resultsFilter === 'winning') return ord.isWinningOrder;
                          if (resultsFilter === 'losing') return !ord.isWinningOrder;
                          return true;
                        })
                        .map((ord: any, idx: number) => (
                          <div
                            key={ord.id || idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              ord.isWinningOrder
                                ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">{ord.ho_ten}</span>
                                  <span className="text-xs text-slate-500 font-mono">({ord.sdt})</span>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  Đặt ngày: {ord.created_at ? new Date(ord.created_at).toLocaleString('vi-VN') : ord.ngay_so}
                                </p>
                              </div>

                              <div>
                                {ord.isWinningOrder ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-md shadow-emerald-200">
                                    🎉 TRÚNG {ord.orderWinningAmount.toLocaleString('vi-VN')} đ
                                  </span>
                                ) : resultsData.hasLotteryResult ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                                    Trật
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                                    Chờ xổ số
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chi tiết từng con số đặt */}
                            <div className="space-y-1.5">
                              {ord.chi_tiet_don?.map((item: any, iIdx: number) => (
                                <div
                                  key={iIdx}
                                  className={`p-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 ${
                                    item.hitCount > 0
                                      ? 'bg-white border-2 border-emerald-400 font-medium text-slate-800 shadow-sm'
                                      : 'bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                      {item.loai_ve}
                                    </span>
                                    <span className="font-semibold text-red-600">{item.kieu_ghi}</span>
                                    <span className="font-mono font-black text-sm text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                                      {item.so}
                                    </span>
                                    <span className="text-slate-500">({parseInt(item.menh_gia).toLocaleString('vi-VN')}đ x {item.so_to} tờ)</span>
                                  </div>

                                  <div>
                                    {item.hitCount > 0 ? (
                                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                                        ✨ Trúng {item.hitCount} lô (+{item.itemWinAmount.toLocaleString('vi-VN')}đ)
                                      </span>
                                    ) : resultsData.hasLotteryResult ? (
                                      <span className="text-slate-400">Trật</span>
                                    ) : (
                                      <span className="text-slate-400">---</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-2xl">
                      Không tìm thấy đơn hàng Loto nào trong ngày {resultsData.dateVn}.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        <h2 ref={lotoTitleRef} className="text-2xl font-bold text-red-600 uppercase">LOTO BÌNH THUẬN</h2>
        {daiSo && ngaySo ? (
          <p className="text-slate-600 font-medium text-xl">{daiSo} - {ngaySo}</p>
        ) : (
          <div className="h-7 bg-slate-200 rounded-md animate-pulse w-40 mx-auto mt-1"></div>
        )}
      </div>

      {effectiveIsLocked ? (
        <div className="rounded-3xl shadow-sm border border-amber-200 p-6 sm:p-8 bg-gradient-to-b from-amber-50 to-orange-50 mb-8 text-center animate-in fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 mb-3 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">Tạm Ngưng Nhận Vé</h3>
          <p className="text-amber-800 font-bold text-lg sm:text-xl">
            Đại lý ngưng nhận ghi loto cho {daiSo} - {ngaySo}
          </p>
          <p className="text-xs sm:text-sm text-amber-700 mt-3 font-medium">
            (Thời gian ngưng nhận: 15:00 - 16:30. Sau 16:30 hệ thống sẽ tự động mở lại cho ngày hôm sau)
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setShowAdminUnlockModal(true);
                setUnlockError('');
                setUnlockPassInput('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-200 text-amber-900 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
            >
              <span>🔑</span>
              <span>Mở khóa Admin</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl shadow-sm border border-purple-100 p-6 bg-white mb-8">
          {/* Ô nhập Đặt nhanh Loto qua tin nhắn */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-sm text-purple-900">
                <span>⚡</span>
                <span>Đặt nhanh qua tin nhắn (Copy / Zalo / SMS)</span>
              </div>
              {quickInputText && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickInputText('');
                    setQuickInputMessage('');
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 underline font-medium cursor-pointer"
                >
                  Xóa chữ
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Dán hoặc nhập tin nhắn (Ví dụ: <code className="bg-purple-100/80 text-purple-900 px-1.5 py-0.5 rounded font-mono">18 lo 10k 52 79 x2</code> hoặc <code className="bg-purple-100/80 text-purple-900 px-1.5 py-0.5 rounded font-mono">dau cuoi 20k 88</code>)
            </p>
            <textarea
              rows={2}
              value={quickInputText}
              onChange={(e) => setQuickInputText(e.target.value)}
              placeholder="Dán nội dung tin nhắn loto vào đây..."
              className="w-full p-3 rounded-xl border border-purple-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-sm font-mono text-slate-800 bg-white placeholder:text-slate-400"
            />
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleParseAndAddToCart}
                disabled={!quickInputText.trim()}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer ${
                  quickInputText.trim()
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <span>⚡</span>
                <span>Phân tích & Thêm vào giỏ hàng</span>
              </button>
            </div>
            {quickInputMessage && (
              <p className={`mt-2 text-xs font-semibold ${quickInputStatus === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                {quickInputMessage}
              </p>
            )}
          </div>

          {isAdminUnlocked && isLocked && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs sm:text-sm">
                  <span>🔑</span>
                  <span>Đã mở khóa Admin — Đang chọn ghi vé Loto</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminUnlocked(false);
                    setAdminPass('');
                    try {
                      sessionStorage.removeItem('loto_admin_pass');
                      sessionStorage.removeItem('loto_admin_target_date');
                    } catch (e) {}
                  }}
                  className="text-xs text-purple-600 underline hover:text-purple-800 font-semibold cursor-pointer"
                >
                  Khóa lại
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100">
                <span className="text-xs font-semibold text-slate-600">Ghi vé cho:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetAdminTargetDate('today')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adminTargetDate === 'today'
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                        : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    Ngày hiện tại ({getNgayVaDaiForOffset(0).daiSo} - {getNgayVaDaiForOffset(0).ngaySo})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAdminTargetDate('tomorrow')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      adminTargetDate === 'tomorrow'
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                        : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    Ngày tiếp theo ({getNgayVaDaiForOffset(1).daiSo} - {getNgayVaDaiForOffset(1).ngaySo})
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Loại vé */}
          <div className="mb-6">
            <p className="mb-3 font-semibold text-slate-700">Chọn loại vé</p>
            <div className="flex gap-3 flex-wrap">
              {loaiVeOptions.map((item) => (
                <button key={item}
                  onClick={() => handleLoaiVeChange(item)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${loaiVe === item
                    ? 'btn-active-effect shadow-lg shadow-purple-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-purple-50'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Mệnh giá */}
          <div className="mb-6">
            <p className="mb-3 font-semibold text-slate-700">Chọn mệnh giá</p>
            <div className="flex gap-3 flex-wrap">
              {menhGiaOptions.map((item) => (
                <button key={item}
                  onClick={() => handleMenhGiaChange(item)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${menhGia === item
                    ? 'btn-active-effect shadow-lg shadow-purple-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-purple-50'}`}>
                  {parseInt(item).toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          {/* Kiểu ghi */}
          {getKieuGhiKeyFor(loaiVe, menhGia) && (
            <div className="mb-6">
              <p className="mb-3 font-semibold text-slate-700">Chọn kiểu ghi</p>
              <div className="flex gap-3 flex-wrap">
                {kieuGhiMap[getKieuGhiKeyFor(loaiVe, menhGia)].map((item) => (
                  <button key={item}
                    onClick={() => handleKieuGhiChange(item)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${kieuGhi === item
                      ? 'btn-active-effect shadow-lg shadow-purple-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-purple-50'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nhập số */}
          {canShowChonSo && (
            <div className={soVuaNhap ? 'mb-1' : 'mb-6'}>
              <p className="mb-3 font-semibold text-slate-700">Chọn số</p>
              <div className="flex gap-3 justify-center">
                {chonSo.map((val, idx) => (
                  <input
                    key={idx}
                    maxLength={1}
                    type="tel"
                    autoComplete="off"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-12 h-14 text-center text-2xl font-bold text-purple-700 border-2 border-purple-100 rounded-xl bg-purple-50 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                    value={val}
                    ref={(el) => {
                      chonSoInputRefs.current[idx] = el;
                    }}
                    onChange={(e) => {
                      const newArr = [...chonSo];
                      const input = e.target as HTMLInputElement;
                      newArr[idx] = input.value.replace(/[^0-9]/g, '').slice(0, 1);
                      setChonSo(newArr);
                      if (newArr[idx] && idx < chonSo.length - 1) {
                        focusChonSoInput(idx + 1);
                      }
                      if (idx === chonSo.length - 1 && newArr.every((digit) => digit !== '')) {
                        handleAutoAddToCart(newArr);
                      }
                    }}
                    onKeyDown={(e) => {
                      const input = e.target as HTMLInputElement;
                      if (e.key === 'Backspace' && !input.value && idx > 0) {
                        focusChonSoInput(idx - 1);
                      }
                    }}
                  />
                ))}
              </div>
              {soVuaNhap && (
                <div className="mt-2 pt-5 text-center">
                  <p className="text-4xl font-black tracking-[0.22em] text-rose-600">{soVuaNhap}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vé đã chọn */}
      {donHang.length > 0 && (
        <div ref={ticketRef} className="mb-8 p-2 rounded-2xl" style={{ backgroundColor: '#faf5ff', border: '1px solid #f3e8ff', color: '#1e293b' }}>
          <h2 className="font-bold text-xl mb-2" style={{ color: '#581c87' }}>
            {daMuaVe ? "Vé đã mua" : "Giỏ hàng của bạn"}
          </h2>
          <div className="space-y-1.5">
            {donHang.map((d, i) => (
              <div key={i} className="p-2 rounded-2xl grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3e8ff' }}>
                <div className="min-w-0">
                  <div className="flex flex-col items-center gap-0.5 text-center">
                    <span
                      className="inline-flex w-fit self-center rounded px-3 py-1 text-sm font-bold leading-none"
                      style={{ backgroundColor: getBgColorHex(d.menhGia), color: '#581c87' }}
                    >
                      {parseInt(d.menhGia).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-sm font-medium text-slate-700 truncate w-full">{d.loaiVe}</span>
                    <span className="text-sm font-semibold text-red-500 truncate w-full">{d.kieuGhi}</span>
                  </div>
                </div>

                <div className="min-w-0 flex items-center justify-center">
                  <span className="block text-center text-3xl font-black leading-none tracking-tight text-purple-700 sm:text-4xl">
                    {d.chonSo}
                  </span>
                </div>

                <div className="flex items-stretch gap-2 shrink-0 justify-self-end">
                  {daMuaVe ? (
                    <div className="flex flex-col justify-center items-center min-w-[72px] text-center rounded-xl border border-purple-100 bg-purple-50 px-2 py-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Số tờ</span>
                      <span className={`text-base font-bold text-purple-700 leading-tight transition-transform duration-200 ${soToPulseIndex === i ? 'scale-125' : 'scale-100'}`}>
                        {d.soTo}
                      </span>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => updateDonHangSoTo(i, '5')}
                        className="self-stretch w-12 flex items-center justify-center text-[14px] font-bold rounded-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                        title="Chọn nhanh 5 vé"
                      >
                        5
                      </button>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => updateDonHangSoTo(i, '2')}
                          className="h-6 w-16 flex items-center justify-center text-[14px] font-bold rounded-t-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                          title="Chọn nhanh 2 vé"
                        >
                          2
                        </button>
                        <div className={`qty-bubble-wrap ${soToPulseIndex === i ? 'is-bubbling' : ''}`}>
                          <select
                            value={d.soTo}
                            onChange={(e) => updateDonHangSoTo(i, e.target.value)}
                            className="w-16 p-1.5 text-center border-y border-purple-200 font-bold text-white focus:outline-none focus:border-purple-500 bg-purple-600 shadow-sm rounded-xl cursor-pointer"
                          >
                            {Array.from(new Set([...soToOptions, d.soTo])).sort((a, b) => a - b).map((num) => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateDonHangSoTo(i, '3')}
                          className="h-6 w-16 flex items-center justify-center text-[14px] font-bold rounded-b-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                          title="Chọn nhanh 3 vé"
                        >
                          3
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const newDonHang = [...donHang];
                          newDonHang.splice(i, 1);
                          setDonHang(newDonHang);
                        }}
                        className="self-stretch text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form thanh toán */}
      {donHang.length > 0 && !thongBaoMua && (
        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 animate-in fade-in">
          <h3 className="font-bold text-lg mb-4 text-purple-900">Thông tin thanh toán</h3>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nhập họ và tên"
              value={tenKhachHang}
              onChange={(e) => setTenKhachHang(e.target.value)}
              className={`w-full p-3 rounded-xl border placeholder:text-slate-400 placeholder:opacity-70 ${errors.ten ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-white'} focus:outline-none`}
            />

            <input
              type="tel"
              placeholder="Nhập số phone có Zalo để đại lý gửi vé"
              value={soDienThoai}
              onChange={(e) => setSoDienThoai(e.target.value.replace(/[^0-9]/g, ''))}
              className={`w-full p-3 rounded-xl border placeholder:text-slate-400 placeholder:opacity-70 ${errors.sdt ? 'border-red-400 bg-red-50' : 'border-purple-200 bg-white'} focus:outline-none`}
            />

            <div className="bg-white p-4 rounded-xl border border-purple-100">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-slate-500">Tổng số vé:</span>
                <span className="font-bold">{donHang.reduce((acc, item) => acc + item.soTo, 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-purple-900">
                <span>Thành tiền:</span>
                <span>{donHang.reduce((acc, item) => acc + (parseInt(item.menhGia) * item.soTo), 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {errors.submit && (
              <p className="text-sm font-semibold text-red-600 text-center">
                {errors.submit}
              </p>
            )}

            <button
              onClick={handleMuaVe}
              disabled={isSubmittingOrder}
              className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 ${isSubmittingOrder
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                'Xác nhận mua vé'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Thông báo thành công & QR */}
      {thongBaoMua && (
        <div className="mt-6 bg-white p-6 rounded-3xl border border-green-200 shadow-sm text-center animate-in zoom-in duration-300">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-slate-800 font-medium mb-4 whitespace-pre-line">{thongBaoMua}</p>

          {showQrCode && (
            <div className="mb-6">
              {(() => {
                const amount = donHang.reduce((acc, item) => acc + (parseInt(item.menhGia) * item.soTo), 0);
                const infoText = `Loto ${tenKhachHang.trim()} ${ngaySo}`.trim();
                const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-qr.png?amount=${amount}&addInfo=${encodeURIComponent(infoText)}&accountName=${encodeURIComponent(BANK_INFO.ACCOUNT_NAME)}`;

                return (
                  <div className="flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="font-bold text-purple-900 mb-2">Quét/Lưu mã QR để thanh toán</p>

                    <div className="text-center text-sm text-slate-600 mb-4 space-y-2 w-full">
                      <p className="font-semibold">{BANK_INFO.BANK_NAME}</p>
                      <p>Tên TK: <span className="font-bold uppercase">{BANK_INFO.ACCOUNT_NAME}</span></p>

                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500">Số TK:</span>
                        <span className="font-bold text-purple-700 text-base">{BANK_INFO.ACCOUNT_DISPLAY}</span>
                        <button onClick={() => handleCopy(BANK_INFO.ACCOUNT_NO)} className="text-purple-600 hover:bg-purple-50 p-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500">Nội dung:</span>
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{infoText}</span>
                        <button onClick={() => handleCopy(infoText)} className="text-purple-600 hover:bg-purple-50 p-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <Image src={qrUrl} alt="QR Code" width={192} height={192} className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm bg-white" />
                  </div>
                );
              })()}
            </div>
          )}

          <button
            onClick={handleSaveImage}
            className="w-full py-3 mb-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Xem & Lưu vé đã mua
          </button>

          <button
            onClick={() => {
              setThongBaoMua('');
              setShowQrCode(false);
              setDonHang([]);
              setHinhThucThanhToan('Chuyển khoản');
              setDaMuaVe(false);
            }}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-full transition-colors"
          >
            Mua vé mới
          </button>
        </div>
      )}

      {/* Modal xem ảnh full màn hình */}
      {isImageViewerOpen && selectedImageForViewer && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <div className="relative w-full h-full max-w-full max-h-full">
            <Image
              src={selectedImageForViewer}
              alt="Vé loto"
              fill
              className="object-contain rounded-lg shadow-2xl"
              sizes="100vw"
            />
          </div>
          <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal Mở khóa Admin */}
      {showAdminUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-purple-100">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 text-xl">
                🔑
              </div>
              <h3 className="text-lg font-bold text-slate-800">Mở khóa Ghi Loto (Admin)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập mật khẩu Admin để ghi vé cho ngày hôm nay trước 16:30.
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPass} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu Admin..."
                  value={unlockPassInput}
                  onChange={(e) => setUnlockPassInput(e.target.value)}
                  autoFocus
                  className="w-full p-3 rounded-xl border border-purple-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-slate-800 font-semibold"
                />
                {unlockError && (
                  <p className="text-xs font-semibold text-red-600 mt-1.5 text-center">
                    {unlockError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminUnlockModal(false);
                    setUnlockError('');
                    setUnlockPassInput('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPass}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-md shadow-purple-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingPass ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Mở khóa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
