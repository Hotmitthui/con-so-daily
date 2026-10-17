"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { startTransition, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { X, ChevronRight } from "lucide-react";
import MuaLoto from "../components/MuaLoto";
import MuaTruyenThong, { ENABLE_XUAN_THEME, ENABLE_83_THEME } from "../components/MuaTruyenThong";
import FallingLeaves from "../components/FallingLeaves";
import DoiThuong from "../components/doithuong";
import DieuKhoanSuDung from "../components/DieuKhoanSuDung";

// CẤU HÌNH BẬT/TẮT HIỆU ỨNG LÁ RƠI (true = Bật, false = Tắt)
const ENABLE_FALLING_LEAVES = true;
const BASE_BG = "rgb(250, 245, 255)";
const BASE_BG_RGB = [250, 245, 255] as const;
const NIGHT_BG_RGB = [80, 80, 98] as const;
const PREVIEW_SKY_LOOP = false;
const DeferredAffiliatePromoteStrip = dynamic(() => import("../components/AffiliatePromoteStrip"), {
  ssr: false,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function HomePage() {
  // Bọc component sử dụng `useSearchParams` trong một `<Suspense>`.
  // Điều này cho phép phần còn lại của trang được render tĩnh trong khi phần này được render động ở phía client.
  return (
    <Suspense fallback={<div className="min-h-screen w-full"></div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  // --- CHẾ ĐỘ NGHỈ BÁN ---
  // Đổi thành false khi bạn muốn hiển thị lại giao diện chính
  const IS_DEV_MODE = false;

  const [isTetModalOpen, setIsTetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"traditional" | "loto">("traditional");
  const [shouldRenderAffiliate, setShouldRenderAffiliate] = useState(false);
  const [refInfo, setRefInfo] = useState<{ name: string; phone?: string | null; avatarUrl?: string | null } | null>(null);
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");
  const footerParam = searchParams.get("footer");
  const [tabsCollapsed, setTabsCollapsed] = useState(false);
  type FooterKey = "message" | "terms" | "guide" | "agents" | "collab" | "reward" | "contact";
  const footerSectionFromQuery: FooterKey | null =
    footerParam === "thong-diep-nha-sang-lap"
      ? "message"
      : footerParam === "dieu-khoan-su-dung"
        ? "terms"
        : footerParam === "huong-dan-dat-ve"
          ? "guide"
          : footerParam === "danh-sach-dai-ly"
            ? "agents"
            : footerParam === "chinh-sach-ctv"
              ? "collab"
              : footerParam === "tra-thuong"
                ? "reward"
                : footerParam === "lien-he"
                  ? "contact"
                  : null;
  const [openFooterSection, setOpenFooterSection] = useState<FooterKey | null>(null);
  const hasAppliedFooterDeeplinkRef = useRef(false);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const termsRef = useRef<HTMLDivElement | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
  const agentsRef = useRef<HTMLDivElement | null>(null);
  const collabRef = useRef<HTMLDivElement | null>(null);
  const rewardRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const footerWrapRef = useRef<HTMLDivElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const BG_OFFSET_PX = 13;
  const BG_SEGMENT_OVERLAP_PX = 2;
  const BG_BASE_JOIN_PX = 22;
  const [bgMetrics, setBgMetrics] = useState<{
    baseHeight: number;
    segmentHeight: number;
    segmentCount: number;
    footerTop: number;
  }>({
    baseHeight: 0,
    segmentHeight: 0,
    segmentCount: 0,
    footerTop: 0,
  });
  const [refBarFaded, setRefBarFaded] = useState(false);
  const REF_FONT: "be" | "playfair" | "cormorant" = "be";
  const REF_TEXT_SIZE: "text-sm" | "text-base" | "text-lg" = "text-sm";
  const NAME_SIZE_MAP = {
    "text-lg": "text-base",
    "text-base": "text-sm",
    "text-sm": "text-xs",
  } as const;
  const nameShrinkClass = NAME_SIZE_MAP[REF_TEXT_SIZE];
  const refFontStyle: React.CSSProperties =
    REF_FONT === "be"
      ? { fontFamily: "var(--font-be-vietnam-pro)" }
      : REF_FONT === "playfair"
        ? { fontFamily: "var(--font-playfair-display)" }
        : { fontFamily: "var(--font-cormorant-garamond)" };

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const rgbString = (r: number, g: number, b: number) => `rgb(${r}, ${g}, ${b})`;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const revealAffiliate = () => {
      if (cancelled) return;
      startTransition(() => {
        setShouldRenderAffiliate(true);
      });
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(() => {
        revealAffiliate();
      }, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(revealAffiliate, 900);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    const applySkyColor = () => {
      if (!ENABLE_XUAN_THEME) {
        document.documentElement.style.setProperty('--sky-bg', BASE_BG);
        document.documentElement.style.setProperty('--page-base-bg', BASE_BG);
        document.documentElement.style.setProperty('--sky-night-t', '0');
        return;
      }
      if (PREVIEW_SKY_LOOP) {
        const cycleMs = 12000;
        const phase = (Date.now() % cycleMs) / cycleMs;
        const t = 0.5 - Math.cos(phase * Math.PI * 2) / 2;
        const [r1, g1, b1] = BASE_BG_RGB;
        const [r2, g2, b2] = NIGHT_BG_RGB;
        const sky = rgbString(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
        document.documentElement.style.setProperty('--sky-bg', sky);
        document.documentElement.style.setProperty('--page-base-bg', BASE_BG);
        document.documentElement.style.setProperty('--sky-night-t', String(t));
        return;
      }

      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      let t = 0;

      if (hour >= 17 && hour < 20) {
        t = (hour - 17) / 3;
      } else if (hour >= 20 || hour < 6) {
        t = 1;
      }

      const [r1, g1, b1] = BASE_BG_RGB;
      const [r2, g2, b2] = NIGHT_BG_RGB;
      const sky = rgbString(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));

      document.documentElement.style.setProperty('--sky-bg', sky);
      document.documentElement.style.setProperty('--page-base-bg', BASE_BG);
      document.documentElement.style.setProperty('--sky-night-t', String(t));
    };

    applySkyColor();
    if (!ENABLE_XUAN_THEME) return;
    const id = window.setInterval(applySkyColor, PREVIEW_SKY_LOOP ? 100 : 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!footerSectionFromQuery || hasAppliedFooterDeeplinkRef.current) return;
    const timer = window.setTimeout(() => {
      hasAppliedFooterDeeplinkRef.current = true;
      setOpenFooterSection(footerSectionFromQuery);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [footerSectionFromQuery]);

  useEffect(() => {
    if (!openFooterSection) return;
    const refMap: Record<FooterKey, React.RefObject<HTMLDivElement | null>> = {
      message: messageRef,
      terms: termsRef,
      guide: guideRef,
      agents: agentsRef,
      collab: collabRef,
      reward: rewardRef,
      contact: contactRef,
    };
    const target = refMap[openFooterSection]?.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [openFooterSection]);

  useEffect(() => {
    if (!ENABLE_83_THEME) return;
    const mainEl = mainRef.current;
    const footerEl = footerWrapRef.current;
    if (!mainEl || !footerEl) return;

    let naturalSize = { w: 0, h: 0 };
    const img = new Image();
    img.src = "/women-bg.jpg";
    img.onload = () => {
      naturalSize = { w: img.naturalWidth, h: img.naturalHeight };
      bgImageRef.current = img;
      updateMetrics();
    };

    const updateMetrics = () => {
      const width = mainEl.clientWidth;
      const footerTop = footerEl.offsetTop;
      if (!naturalSize.w || !naturalSize.h || !width) {
        setBgMetrics((prev) => ({ ...prev, footerTop }));
        return;
      }
      const scale = width / naturalSize.w;
      const baseHeight = naturalSize.h * scale;
      const segmentHeight = baseHeight * 0.6;
      const baseBottom = footerTop - BG_OFFSET_PX;
      const baseTop = baseBottom - baseHeight;
      const available = Math.max(0, baseTop);
      const segmentCount = segmentHeight > 0 ? Math.ceil((available + BG_BASE_JOIN_PX) / segmentHeight) + 1 : 0;
      setBgMetrics({ baseHeight, segmentHeight, segmentCount, footerTop });
    };

    updateMetrics();
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(mainEl);
    ro.observe(footerEl);
    window.addEventListener('resize', updateMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [openFooterSection, activeTab]);

  useEffect(() => {
    if (!openFooterSection) return;
    const refMap: Record<FooterKey, React.RefObject<HTMLDivElement | null>> = {
      message: messageRef,
      terms: termsRef,
      guide: guideRef,
      agents: agentsRef,
      collab: collabRef,
      reward: rewardRef,
      contact: contactRef,
    };
    const target = refMap[openFooterSection]?.current;
    if (!target) return;

    const isInView = () => {
      const rect = target.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < vh * 0.85 && rect.bottom > vh * 0.15;
    };

    let timer: number | null = null;
    const onScroll = () => {
      if (isInView()) {
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
      } else if (!timer) {
        timer = window.setTimeout(() => {
          setOpenFooterSection(null);
          timer = null;
        }, 3000);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [openFooterSection]);

  useEffect(() => {
    if (!refInfo) return;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setRefBarFaded(y > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [refInfo]);

  useEffect(() => {
    const loadRefInfo = async () => {
      if (typeof window === "undefined" || !supabase) return;
      if (!refParam) {
        setRefInfo(null);
        return;
      }
      const { data, error } = await supabase
        .from("ref_links")
        .select("ref_name, ref_phone, ref_avatar_url")
        .eq("ref_id", refParam)
        .maybeSingle();

      if (error || !data) {
        setRefInfo(null);
        return;
      }
      setRefInfo({ name: data.ref_name, phone: data.ref_phone, avatarUrl: data.ref_avatar_url });
    };

    loadRefInfo();
  }, [refParam]);

  // Fix lỗi trình duyệt tự động cuộn xuống hoặc ghi nhớ vị trí cũ trên mobile
  useEffect(() => {
    // 1. Ngăn trình duyệt tự động khôi phục vị trí cuộn (quan trọng cho Mobile)
    if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    return () => {
      if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, []);

  if (IS_DEV_MODE) {
    return (
      <div className="min-h-screen bg-purple-50 text-slate-800 font-sans pb-20 relative flex items-center justify-center">
        <style>{`
          @keyframes tet-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.94); }
          }
        `}</style>
        <div className="w-full animate-in fade-in zoom-in duration-500">
          <div className="relative w-full lg:w-[60%] mx-auto">
            <img
              src="/thongbaonghi.png"
              alt="Thông báo nghỉ bán"
              className="w-full h-auto object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0) 60%)'
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[20%] translate-y-6">
              <h2
                className="text-3xl font-extrabold text-yellow-300 mb-3"
                style={{ textShadow: '0 3px 10px rgba(0,0,0,0.6)' }}
              >
                THÔNG BÁO
              </h2>
              <p
                className="text-lg font-bold text-yellow-300 mb-2"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
              >
                Đại Lý Tạm nghỉ bán vào các ngày
              </p>
              <p
                className="text-2xl font-extrabold text-sky-300 mb-2"
                style={{ textShadow: '0 3px 10px rgba(0,0,0,0.6)' }}
              >
                13/2 - 14/2 và 15/2
              </p>
              <p
                className="text-lg font-bold text-yellow-300"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
              >
                Cảm ơn Quý Khách !
              </p>
              <button
                onClick={() => setIsTetModalOpen(true)}
                className="mt-5 px-6 py-2.5 rounded-full bg-purple-600 text-white font-bold shadow-lg shadow-purple-300 hover:bg-purple-700 transition-all animate-[tet-pulse_2.6s_ease-in-out_infinite]"
              >
                Đặt vé Tết
              </button>
            </div>
          </div>
        </div>

        {isTetModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setIsTetModalOpen(false)}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-purple-600 border border-purple-700 text-white hover:bg-purple-700 shadow-md flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-4">
                <MuaTruyenThong mode="tet-only" defaultTetOpen isModal refIdFromPage={refParam} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-800 font-sans pb-20 relative"
      style={{
        background: `linear-gradient(
          to bottom,
          var(--sky-bg, ${BASE_BG}) 0px,
          var(--sky-bg, ${BASE_BG}) var(--sky-cutoff, 0px),
          var(--page-base-bg, ${BASE_BG}) var(--sky-cutoff, 0px),
          var(--page-base-bg, ${BASE_BG}) 100%
        )`,
        transition: 'background 1200ms ease'
      }}
    >
      <div
        className="absolute pointer-events-none z-30"
        style={{
          top: 'calc(var(--xuan-top, 0px) - 70px)',
          left: 'var(--xuan-left, 0px)',
          width: 'var(--xuan-width, 0px)',
          height: 'calc(var(--xuan-height, 0px) - 40px)',
        }}
      >
        <FallingLeaves
          enabled={ENABLE_FALLING_LEAVES && !isTetModalOpen}
          count={8}
          scope="container"
          sizeRange={[8, 14]}
          driftRange={[6, 18]}
          swayRange={[4, 12]}
        />
      </div>
      {/* Header */}
      {!refInfo && (
        <header className="bg-white shadow-sm z-50 border-b border-purple-100">
          <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/ngua.png"
                alt="Logo Còn Số"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
              <h1 className="text-xl font-bold text-purple-900 tracking-tight">Còn Số</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[20px] font-semibold text-purple-700">ĐLVS Hoàng Vũ</span>
                <span className="text-[12px] text-slate-400 leading-none">
                  designed and created by <span style={{ fontFamily: "var(--font-playfair-display)" }}>hmt</span>
                </span>
              </div>
              {/* Khu vực hiển thị nút khóa (Portal từ MuaTruyenThong) */}
              <div id="header-lock-area" className="flex items-center justify-center min-w-9 min-h-9"></div>
            </div>
          </div>
        </header>
      )}

      {refInfo && (
        <>
          <div className="bg-white shadow-sm border-b border-purple-100 relative z-50">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/ngua.png"
                  alt="Logo Còn Số"
                  className="w-10 h-10 object-contain drop-shadow-md"
                />
                <h1 className="text-xl font-bold text-purple-900 tracking-tight">Còn Số</h1>
              </div>
              <div className="text-[20px] font-semibold text-purple-700">ĐLVS Hoàng Vũ</div>
            </div>
          </div>
          <div
            id="ref-sticky-bar"
            className={`sticky top-0 z-40 transition-colors duration-600 ${refBarFaded ? "bg-transparent border-b border-transparent" : "bg-white border-b border-purple-100"
              }`}
          >
            <div className="max-w-md mx-auto px-4 py-3">
              <div
                className={`relative ${REF_TEXT_SIZE} text-rose-700 font-semibold bg-rose-50 border border-rose-200 rounded-xl py-2 px-3 shadow-sm`}
                style={refFontStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`truncate ${refInfo.name.length > 14 ? nameShrinkClass : ""}`}
                  >
                    Đ.Lý {refInfo.name}
                  </span>
                  <span className="truncate">{refInfo.phone || ""}</span>
                </div>
                <span className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-400 shadow-sm overflow-hidden bg-purple-200">
                  {refInfo.avatarUrl ? (
                    <img
                      src={refInfo.avatarUrl}
                      alt="Avatar ref"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <main ref={mainRef} className="relative max-w-md mx-auto p-4 pt-3 pb-0">
        {ENABLE_83_THEME && (
          <>
            <style>{`
              @keyframes women-bg-fade {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .women-bg-fade {
                animation: women-bg-fade 600ms ease-out both;
              }
            `}</style>
            {bgMetrics.segmentCount > 0 && (
              <div className="absolute inset-x-0 top-0 pointer-events-none select-none">
                {Array.from({ length: bgMetrics.segmentCount }).map((_, index) => {
                  const baseTop = bgMetrics.footerTop - BG_OFFSET_PX - bgMetrics.baseHeight + BG_BASE_JOIN_PX;
                  const top =
                    baseTop -
                    (index + 1) * bgMetrics.segmentHeight +
                    (index + 1) * BG_SEGMENT_OVERLAP_PX;
                  const isFlipped = index % 2 === 0;
                  return (
                    <div
                      key={index}
                      className="absolute left-0 w-full women-bg-fade"
                      style={{
                        top,
                        height: bgMetrics.segmentHeight + BG_SEGMENT_OVERLAP_PX,
                        backgroundImage: "url('/women-bg.jpg')",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "100% auto",
                        backgroundPosition: "top center",
                        transform: isFlipped ? "scaleY(-1)" : undefined,
                        filter: "brightness(1) blur(0.9px)",
                      }}
                    />
                  );
                })}
              </div>
            )}
            <div
              className="absolute left-0 w-full pointer-events-none select-none opacity-100 women-bg-fade"
              style={{
                bottom: `calc(100% - ${bgMetrics.footerTop}px - ${BG_OFFSET_PX}px)`,
                height: bgMetrics.baseHeight || undefined,
                backgroundImage: "url('/women-bg.jpg')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% auto",
                backgroundPosition: "top center",
                filter: "brightness(1) blur(0.8px)",
              }}
            />
          </>
        )}
        <div className="relative z-10">
          {/* Tab Switcher */}
          <div className="mb-6">
            <div
              className={`relative flex items-center rounded-3xl transition-all duration-300 overflow-hidden h-10 ${tabsCollapsed
                  ? "max-w-10 bg-transparent border-transparent shadow-none"
                  : "max-w-full bg-white/35 backdrop-blur-md border border-white/40 shadow-sm"
                }`}
            >
              <button
                onClick={() => setTabsCollapsed((prev) => !prev)}
                className={`h-10 w-10 shrink-0 bg-purple-100 text-purple-700 font-bold flex items-center justify-center shadow-md ring-1 ring-purple-200 transition-all hover:shadow-lg hover:scale-105 ${tabsCollapsed ? "rounded-full" : "rounded-l-3xl border-r border-white/60"
                  }`}
                aria-label={tabsCollapsed ? "Mở tab" : "Thu tab"}
              >
                {tabsCollapsed ? "›" : "‹"}
              </button>
              <div
                className={`flex flex-1 p-1 transition-all duration-300 ${tabsCollapsed ? "opacity-0 pointer-events-none -translate-x-2" : "opacity-100"
                  }`}
              >
                <button
                  onClick={() => setActiveTab("traditional")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${activeTab === "traditional"
                      ? "text-purple-700 shadow-md shadow-purple-200/40"
                      : "text-slate-600 hover:text-purple-700"
                    }`}
                >
                  Truyền Thống
                </button>
                <button
                  onClick={() => setActiveTab("loto")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-2xl transition-all duration-300 ${activeTab === "loto"
                      ? "text-purple-700 shadow-md shadow-purple-200/40"
                      : "text-slate-600 hover:text-purple-700"
                    }`}
                >
                  Vé Số Loto
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {activeTab === "traditional" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Traditional Content Mockup */}
                <MuaTruyenThong refIdFromPage={refParam} />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Loto Content Mockup */}
                <MuaLoto refIdFromPage={refParam} />
              </div>
            )}
          </div>
          {shouldRenderAffiliate ? <DeferredAffiliatePromoteStrip /> : null}

          {/* Thông tin cuối trang + ảnh footer */}
          <div ref={footerWrapRef} className="-mx-4 px-4 pt-5 pb-0 bg-sky-100/80 border-t border-sky-200 -mb-20">
            <style>{`
            @keyframes footer-marquee {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
            <div className="max-w-md mx-auto space-y-3">
              <div className="text-center" style={{ fontFamily: "var(--font-be-vietnam-pro)" }}>
                <p className="text-xl font-bold text-sky-800 uppercase">
                  ĐẠI LÝ VÉ SỐ HOÀNG VŨ.
                </p>
                <div className="mt-1 overflow-hidden">
                  <div className="inline-block whitespace-nowrap text-xs text-slate-600 animate-[footer-marquee_12s_linear_infinite]">
                    72 NGÔ SĨ LIÊN - PHƯỜNG PHAN THIẾT - TP.LÂM ĐỒNG.
                  </div>
                </div>
              </div>
              <div className="group" ref={messageRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "message" ? null : "message"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Thông điệp từ nhà sáng lập
                </button>
                {openFooterSection === "message" && (
                  <div className="mt-2 bg-white/80 border border-sky-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full border-2 border-purple-600 shadow-md overflow-hidden bg-white shrink-0">
                        <img src="/founder-1.jpg" alt="Founder" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-sky-700">Hoàng Minh Vũ</span>
                        <span className="text-xs text-slate-600">
                          Founder at <strong>Còn Số</strong> - Father at <strong>Mít house</strong>
                        </span>
                      </div>
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line text-justify">
                      {`Việt Nam đang trong giai đoạn chuyển mình mạnh mẽ, khi hầu hết các ngành nghề đều từng bước chuyển sang môi trường số. Ngành vé số truyền thống cũng không nằm ngoài xu thế đó.
Với trăn trở làm sao để hiện đại hoá hình thức mua bán quen thuộc này, tôi đã phát triển `}<strong>Còn Số</strong>{` – một nền tảng giúp người dùng mua vé và thanh toán nhanh chóng, thuận tiện, phù hợp với nhịp phát triển của xã hội và công nghệ. Đây là ứng dụng tiên phong kết nối giữa hình thức mua vé truyền thống và đặt vé online, đồng thời sẵn sàng cho bước chuyển lớn sang hình thức vé số điện tử trong tương lai.
Tôi tin rằng, với sự đồng hành và ủng hộ của cộng đồng, `}<strong>Còn Số</strong>{` sẽ góp phần đưa ngành vé số truyền thống Việt Nam lên một tầm cao mới.`}
                    </p>
                  </div>
                )}
              </div>
              <div className="group" ref={termsRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "terms" ? null : "terms"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Điều khoản sử dụng
                </button>
                {openFooterSection === "terms" && (
                  <div className="mt-2">
                    <DieuKhoanSuDung />
                  </div>
                )}
              </div>
              <div className="group" ref={guideRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "guide" ? null : "guide"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Hướng dẫn đặt vé
                </button>
                {openFooterSection === "guide" && (
                  <div className="mt-2 bg-white/80 border border-sky-100 rounded-2xl p-4 shadow-sm">
                    <ul className="text-base text-slate-600 leading-relaxed text-justify space-y-2">
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Chọn đầu số yêu thích trên ảnh vé hoặc nhập 2 số cuối ở ô nhập, zoom to ảnh để xem đầy đủ 6 số của vé.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Chọn số lượng vé ở mục Giỏ Hàng, có thể chọn nhanh 3, 5 hoặc toàn bộ số vé đang có (Max).</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Nhập đầy đủ họ tên và số điện thoại có zalo để đại lý gửi ảnh vé, bấm &quot;xác nhận đặt vé&quot;</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Hệ thống xác nhận đặt vé thành công nghĩa là vé trong kho đủ số lượng cần mua.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Chụp màn hình hoặc nhấn giữ để lưu mã QR thanh toán.</span>
                      </li>
                      <li className="flex gap-2">
                        <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                        <span>Vào app Ngân hàng hoặc ZaloPay, Momo chọn thanh toán theo mã QR. Nội dung và số tiền đã được điền sẵn theo mã QR của app.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="group" ref={agentsRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "agents" ? null : "agents"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Danh sách đại lý
                </button>
                {openFooterSection === "agents" && (
                  <div className="mt-2 bg-white/80 border border-sky-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Danh sách đại lý đang cập nhật. Vui lòng theo dõi trong thời gian tới.
                    </p>
                  </div>
                )}
              </div>
              <div className="group" ref={collabRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "collab" ? null : "collab"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Chính sách CTV
                </button>
                {openFooterSection === "collab" && (
                  <div className="mt-2 bg-white/80 border border-sky-100 rounded-2xl p-4 shadow-sm">
                    <div className="text-base text-slate-600 leading-relaxed space-y-3">
                      <p>
                        <strong>Còn Số</strong> xây dựng hệ thống CTV theo 3 thứ hạng gồm:{" "}
                        <strong className="inline-block rounded-full border border-[#8a5a2b] bg-gradient-to-r from-[#d9a57d] to-white px-2 py-[1px] font-medium text-black shadow-sm">
                          Hạng Đồng
                        </strong>
                        ,{" "}
                        <strong className="inline-block rounded-full border border-slate-400 bg-gradient-to-r from-slate-300 to-white px-2 py-[1px] font-medium text-black shadow-sm">
                          Hạng Bạc
                        </strong>{" "}
                        và{" "}
                        <strong className="inline-block rounded-full border border-amber-400 bg-gradient-to-r from-amber-300 to-white px-2 py-[1px] font-medium text-black shadow-sm">
                          Hạng Vàng
                        </strong>
                        .
                      </p>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>
                            <strong className="inline-block rounded-full border border-[#8a5a2b] bg-gradient-to-r from-[#d9a57d] to-white px-2 py-[1px] font-medium text-black shadow-sm">
                              Hạng Đồng
                            </strong>
                            :{" "}
                            CTV gia nhập hệ thống dưới 1 năm. Quyền lợi: nhận hoa hồng cơ bản.
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>
                            <strong className="inline-block rounded-full border border-slate-400 bg-gradient-to-r from-slate-300 to-white px-2 py-[1px] font-medium text-black shadow-sm">
                              Hạng Bạc
                            </strong>
                            :{" "}
                            CTV gia nhập trên 1 năm và duy trì doanh số <strong>30 triệu/năm</strong>.{" "}
                            <span className="text-sky-700">Quyền lợi: nhận hoa hồng cơ bản + 1%.</span>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>
                            <strong className="inline-block rounded-full border border-amber-400 bg-gradient-to-r from-amber-300 to-white px-2 py-[1px] font-medium text-black shadow-sm">
                              Hạng Vàng
                            </strong>
                            :{" "}
                            CTV gia nhập trên 2 năm và duy trì doanh số <strong>60 triệu/năm</strong>.{" "}
                            <span className="text-sky-700">Quyền lợi: nhận hoa hồng cơ bản + 2%.</span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-sky-700">Thưởng cuối năm:</p>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>
                            CTV có doanh số trong năm cao nhất (tính theo ngày gia nhập) sẽ{" "}
                            <span className="text-sky-700">nhận thêm 1%</span>.
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>
                            CTV có doanh số cao nhì (tính theo ngày gia nhập) sẽ{" "}
                            <span className="text-sky-700">nhận thêm 0.5%</span>.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="group" ref={rewardRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "reward" ? null : "reward"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Trả Thưởng
                </button>
                {openFooterSection === "reward" && (
                  <div className="mt-2">
                    <DoiThuong />
                  </div>
                )}
              </div>
              <div className="group" ref={contactRef}>
                <button
                  onClick={() => setOpenFooterSection((prev) => (prev === "contact" ? null : "contact"))}
                  className="w-full text-left cursor-pointer select-none text-sm font-bold text-sky-800 drop-shadow-sm"
                >
                  Liên hệ
                </button>
                {openFooterSection === "contact" && (
                  <div className="mt-2 bg-white/80 border border-sky-100 rounded-2xl p-4 shadow-sm">
                    <div className="text-base text-slate-600 leading-relaxed space-y-2">
                      <p>Quý khách có phản hồi, vui lòng liên hệ:</p>
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>Email: vuhoang712@gmail.com</span>
                        </div>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>Zalo: 092 234 1568</span>
                        </div>
                        <div className="flex gap-2">
                          <ChevronRight className="mt-1 h-4 w-4 text-sky-600 shrink-0" />
                          <span>Phone: 0899 25 8808</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 mb-0 -mx-4 flex justify-center pointer-events-none">
              <img
                src="/newyear_bom.png"
                alt="Happy New Year"
                className="w-full object-contain opacity-100 drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
