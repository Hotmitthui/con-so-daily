"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import { Eye, EyeOff, Layers } from "lucide-react";

const DEFAULT_TICKET_IMAGES: Record<string, string> = {
  "Đồng Tháp": "/ve-mau/DT-m.webp",
  "Vũng Tàu": "/ve-mau/VT-m.webp",
  "Sóc Trăng": "/ve-mau/ST-m.webp",
  "Bình Thuận": "/ve-mau/BT-m.webp",
  "Bình Dương": "/ve-mau/BD-m.webp",
  "Bình Phước": "/ve-mau/BP-m.webp",
  "Lâm Đồng": "/ve-mau/LD-m.webp",
};

export type GridLayout = "traditional" | "one-col" | "two-col" | "three-col" | "four-col";
export type BoxCfg = { top: number; right: number; width: number; height: number; kind: "main" | "small" };
export type HeadBoxCfg = { offsetX: number; offsetY: number; size: number };
export type PreviewFontKey =
  | "arial"
  | "be-vietnam-pro"
  | "nunito"
  | "m-plus-rounded-1c"
  | "rubik"
  | "fredoka";
export type HeadColorKey = "yellow" | "pink";

export const ALL_FONT_OPTIONS: Array<{
  key: PreviewFontKey;
  label: string;
  fontFamily: string;
  headScale: number;
}> = [
    { key: "arial", label: "Arial", fontFamily: "Arial, Helvetica, sans-serif", headScale: 1 },
    { key: "be-vietnam-pro", label: "Be Vietnam Pro", fontFamily: "var(--font-be-vietnam-pro)", headScale: 0.9 },
    { key: "nunito", label: "Nunito", fontFamily: "var(--font-nunito)", headScale: 0.95 },
    { key: "m-plus-rounded-1c", label: "M PLUS Rounded 1c", fontFamily: "var(--font-m-plus-rounded-1c)", headScale: 0.92 },
    { key: "rubik", label: "Rubik", fontFamily: "var(--font-rubik)", headScale: 0.98 },
    { key: "fredoka", label: "Fredoka", fontFamily: "var(--font-fredoka)", headScale: 0.94 },
  ];

export const PREVIEW_FONT_OPTIONS: Array<{
  key: PreviewFontKey;
  label: string;
  fontFamily: string;
  headScale: number;
}> = [
    { key: "arial", label: "Arial", fontFamily: "Arial, Helvetica, sans-serif", headScale: 1 },
    { key: "be-vietnam-pro", label: "Be Vietnam Pro", fontFamily: "var(--font-be-vietnam-pro)", headScale: 0.9 },
    { key: "nunito", label: "Nunito", fontFamily: "var(--font-nunito)", headScale: 0.95 },
    { key: "m-plus-rounded-1c", label: "M PLUS Rounded 1c", fontFamily: "var(--font-m-plus-rounded-1c)", headScale: 0.92 },
    { key: "rubik", label: "Rubik", fontFamily: "var(--font-rubik)", headScale: 0.98 },
    { key: "fredoka", label: "Fredoka", fontFamily: "var(--font-fredoka)", headScale: 0.94 },
  ];

type VeDienTuGridProps = {
  ticketPreviewUrl: string | null;
  selectedNumbers: string[];
  selectedCartNumbers?: string[];
  numberSuffixes: Record<string, string>;
  inventory?: Record<string, number>;
  boxes: BoxCfg[];
  headBox: HeadBoxCfg;
  cardWidth: number;
  cardHeight: number;
  isZoomingRef?: React.RefObject<boolean>;
  backgroundUrl?: string;
  daiSo?: string;
  fullBleedMobile?: boolean;
  onNumberToggle?: (num: string) => void;
  fontKey?: PreviewFontKey;
  headColorKey?: HeadColorKey;
  loadingAnimationData?: unknown;
  onTicketImageLoad?: () => void;
  ngayHienThi?: string;
  isError?: boolean;
  onRetry?: () => void;
};

export default function VeDienTuGrid({
  ticketPreviewUrl,
  selectedNumbers,
  selectedCartNumbers = [],
  numberSuffixes,
  inventory,
  boxes,
  headBox,
  cardWidth,
  cardHeight,
  isZoomingRef,
  backgroundUrl,
  daiSo,
  fullBleedMobile = true,
  onNumberToggle,
  fontKey = "arial",
  headColorKey = "yellow",
  loadingAnimationData,
  onTicketImageLoad,
  ngayHienThi,
  isError = false,
  onRetry,
}: VeDienTuGridProps) {
  const gridWrapRef = useRef<HTMLDivElement | null>(null);
  const layoutPanelRef = useRef<HTMLDivElement | null>(null);
  const layoutTabsRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollLayoutRef = useRef(false);
  const [gridWrapWidth, setGridWrapWidth] = useState(0);
  const [gridColWidth, setGridColWidth] = useState(0);
  const [visibleCells, setVisibleCells] = useState<Record<string, boolean>>({});
  const [gridLayout, setGridLayout] = useState<GridLayout>("traditional");
  const [pendingGridLayout, setPendingGridLayout] = useState<GridLayout | null>(null);
  const [gridRevealKey, setGridRevealKey] = useState(0);
  const [expandedOneColNumber, setExpandedOneColNumber] = useState<string | null>(null);
  const [isMainBoxPreviewForced, setIsMainBoxPreviewForced] = useState(false);
  const [isTwoColStacked, setIsTwoColStacked] = useState(false);
  const gridSwitchTimerRef = useRef<number | null>(null);
  const selectedGridLayout = pendingGridLayout ?? gridLayout;
  const bgUrl = backgroundUrl || "/women-bg.jpg";
  const isMainBoxForceActive = isMainBoxPreviewForced || isTwoColStacked;
  const fontConfig = useMemo(
    () => ALL_FONT_OPTIONS.find((opt) => opt.key === fontKey) || ALL_FONT_OPTIONS[0],
    [fontKey]
  );
  const headColor = headColorKey === "pink" ? "#ec4899" : "#facc15";
  const headBoxDisplaySize = useMemo(
    () => (gridLayout === "one-col" ? Math.max(1, Math.round(headBox.size * 0.92)) : headBox.size),
    [gridLayout, headBox.size]
  );

  const finalTicketPreviewUrl = useMemo(() => {
    if (ticketPreviewUrl) {
      return ticketPreviewUrl;
    }
    if (daiSo && DEFAULT_TICKET_IMAGES[daiSo]) {
      return DEFAULT_TICKET_IMAGES[daiSo];
    }
    return DEFAULT_TICKET_IMAGES["Đồng Tháp"] || "/ve-mau/DT-m.webp";
  }, [ticketPreviewUrl, daiSo]);

  const requestGridLayout = (next: GridLayout) => {
    if (next === gridLayout && !pendingGridLayout) return;
    if (gridSwitchTimerRef.current) window.clearTimeout(gridSwitchTimerRef.current);
    if (next !== "one-col") {
      setExpandedOneColNumber(null);
    }
    if (next !== "two-col") {
      setIsTwoColStacked(false);
    }
    shouldScrollLayoutRef.current = true;
    setPendingGridLayout(next);
    gridSwitchTimerRef.current = window.setTimeout(() => {
      setGridLayout(next);
      setGridRevealKey((k) => k + 1);
      setPendingGridLayout(null);
      gridSwitchTimerRef.current = null;
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (gridSwitchTimerRef.current) window.clearTimeout(gridSwitchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollLayoutRef.current) return;
    const el = layoutTabsRef.current || layoutPanelRef.current;
    if (!el) return;
    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = 10;
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - offset),
          behavior: "smooth",
        });
        shouldScrollLayoutRef.current = false;
      });
      return () => window.cancelAnimationFrame(raf2);
    });
    return () => window.cancelAnimationFrame(raf1);
  }, [gridLayout]);

  useEffect(() => {
    if (gridLayout !== "one-col") return;
    if (!expandedOneColNumber) return;
    const el = layoutTabsRef.current || layoutPanelRef.current;
    if (!el) return;
    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = 10;
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - offset),
          behavior: "smooth",
        });
      });
      return () => window.cancelAnimationFrame(raf2);
    });
    return () => window.cancelAnimationFrame(raf1);
  }, [expandedOneColNumber, gridLayout]);

  const getSuffixText = (num: string) =>
    (numberSuffixes[num] || "1234").padStart(4, "0").slice(-4);

  const isAvailable = useCallback((num: string) => {
    if (!inventory) return true;
    const qty = inventory[num];
    return !(Number.isFinite(qty) && qty <= 0);
  }, [inventory]);

  const availableNumbers = useMemo(
    () => selectedNumbers.filter((num) => isAvailable(num)),
    [selectedNumbers, isAvailable]
  );

  const columns = useMemo(() => {
    const sorted = [...selectedNumbers].sort();
    const colHeads = [
      ["8", "9"],
      ["6", "7"],
      ["4", "5"],
      ["2", "3"],
      ["0", "1"],
    ];
    return colHeads.map((heads) => sorted.filter((num) => heads.includes(num[0])));
  }, [selectedNumbers]);

  const maxRows = useMemo(() => {
    const lengths = columns.map((c) => c.length);
    return Math.max(1, ...lengths);
  }, [columns]);

  const flexLayout = useMemo(() => {
    if (gridLayout === "traditional") return { cols: 5, cells: [] as Array<string | null> };

    const sorted = [...availableNumbers].sort();
    const byTens = new Map<string, string[]>();
    for (const num of sorted) {
      const tens = num[0] || "0";
      const arr = byTens.get(tens);
      if (arr) arr.push(num);
      else byTens.set(tens, [num]);
    }

    const maxCols =
      gridLayout === "two-col" ? 2 : gridLayout === "three-col" ? 3 : gridLayout === "four-col" ? 4 : 5;
    const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const maxGroupLen = digits.reduce((acc, d) => Math.max(acc, (byTens.get(d) || []).length), 0);
    const effectiveCols = Math.max(2, Math.min(maxCols, maxGroupLen || 0));

    const out: Array<string | null> = [];
    for (const d of digits) {
      const arr = byTens.get(d) || [];
      for (let i = 0; i < arr.length; i += effectiveCols) {
        const chunk: Array<string | null> = arr.slice(i, i + effectiveCols);
        while (chunk.length < effectiveCols) chunk.push(null);
        out.push(...chunk);
      }
    }

    if (out.length > 0 && out.length < effectiveCols) {
      while (out.length < effectiveCols) out.push(null);
    }
    return { cols: effectiveCols || 3, cells: out };
  }, [gridLayout, availableNumbers]);

  useEffect(() => {
    if (!gridWrapRef.current) return;
    const el = gridWrapRef.current;
    const update = () => {
      if (isZoomingRef?.current) return;
      const rect = el.getBoundingClientRect();
      setGridWrapWidth(rect.width);
      const firstChild = el.firstElementChild as HTMLElement | null;
      const measuredCell =
        gridLayout === "two-col" && isTwoColStacked
          ? ((firstChild?.firstElementChild as HTMLElement | null) ?? null)
          : firstChild;
      if (measuredCell) {
        const colRect = measuredCell.getBoundingClientRect();
        if (Number.isFinite(colRect.width) && colRect.width > 0) setGridColWidth(colRect.width);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ticketPreviewUrl, gridLayout, selectedNumbers, isZoomingRef, isTwoColStacked]);

  useEffect(() => {
    if (!gridWrapRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const root = gridWrapRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCells((prev) => {
          let next = prev;
          let changed = false;
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            const key = target.dataset.cellKey;
            if (!key) continue;
            const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
            if (prev[key] !== isVisible) {
              if (next === prev) next = { ...prev };
              next[key] = isVisible;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      },
      { root, rootMargin: "50% 0px", threshold: 0.01 }
    );

    const nodes = root.querySelectorAll<HTMLElement>("[data-cell-key]");
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ticketPreviewUrl, gridLayout, selectedNumbers, availableNumbers, maxRows, isTwoColStacked]);

  const gridMetrics = useMemo(() => {
    const wrapW = gridWrapWidth || 0;
    const ratio = cardWidth ? cardHeight / cardWidth : 0;
    if (!wrapW || !cardWidth || !ratio) {
      return { cellW: cardWidth * 0.25, cellH: cardHeight * 0.25, scale: 0.25 };
    }
    const gap = 4; // gap-1
    const cols =
      gridLayout === "traditional" ? 5 : gridLayout === "one-col" ? 1 : flexLayout.cols;
    const fallbackCellW = (wrapW - gap * (cols - 1)) / cols;
    const cellW = gridColWidth > 0 ? gridColWidth : fallbackCellW;
    const scale = cellW / cardWidth;
    const cellH = Math.round(cellW * ratio);
    return { cellW, cellH, scale: Number.isFinite(scale) ? scale : 0.25 };
  }, [gridWrapWidth, gridColWidth, cardWidth, cardHeight, gridLayout, flexLayout.cols]);

  const mainDigitsRowStyle = useMemo(() => {
    if (!boxes[0]) return null;
    const box = boxes[0];
    const horizontalInsetPx = 12;
    const verticalInsetPx = 3;
    const contentHeight = Math.max(12, box.height - verticalInsetPx * 2);
    const usableWidth = Math.max(36, box.width - horizontalInsetPx * 2);
    const slotWidth = usableWidth / 6;
    const fontPx = Math.max(12, Math.round(Math.min(contentHeight * 0.94, slotWidth * 1.16)));
    return {
      top: box.top + verticalInsetPx,
      right: box.right + horizontalInsetPx,
      width: usableWidth,
      height: contentHeight,
      fontSize: `${fontPx}px`,
      fontWeight: 900,
      position: "absolute" as const,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      whiteSpace: "nowrap" as const,
      fontFamily: fontConfig.fontFamily,
      opacity: "var(--vedientu-main-opacity, 0.18)",
    };
  }, [boxes, fontConfig.fontFamily]);

  const mainDigitTextStyle = useMemo(
    () => ({
      color: "#db2777",
      flex: "1 1 0",
      minWidth: 0,
      textAlign: "center" as const,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      fontFamily: fontConfig.fontFamily,
    }),
    [fontConfig.fontFamily]
  );

  const headNumberStyle = useMemo(() => {
    const centerTop = Math.round((cardHeight - headBoxDisplaySize) / 2);
    const centerRight = Math.round((cardWidth - headBoxDisplaySize) / 2);
    const headTop = centerTop + headBox.offsetY;
    const headRight = centerRight - headBox.offsetX;
    const fontPx = Math.max(14, Math.round(headBoxDisplaySize * 0.82 * fontConfig.headScale));
    return {
      top: headTop,
      right: headRight,
      width: headBoxDisplaySize,
      height: headBoxDisplaySize,
      lineHeight: `${Math.max(14, headBoxDisplaySize)}px`,
      fontSize: `${fontPx}px`,
      color: headColor,
      fontWeight: 900,
      WebkitTextStroke: "5px #111",
      textShadow: "0 5px 8px rgba(0,0,0,1), 0 0 7px rgba(0,0,0,1)",
      position: "absolute" as const,
      zIndex: 21,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap" as const,
      overflow: "visible" as const,
      fontFamily: fontConfig.fontFamily,
      opacity: "var(--vedientu-head-opacity, 1)",
    };
  }, [headBox, headBoxDisplaySize, cardHeight, cardWidth, fontConfig.fontFamily, fontConfig.headScale, headColor]);

  const headBoxPosition = useMemo(() => {
    const centerTop = Math.round((cardHeight - headBoxDisplaySize) / 2);
    const centerRight = Math.round((cardWidth - headBoxDisplaySize) / 2);
    return {
      top: centerTop + headBox.offsetY,
      right: centerRight - headBox.offsetX,
    };
  }, [headBox, headBoxDisplaySize, cardHeight, cardWidth]);

  const oneColNumbers = useMemo(
    () => [...availableNumbers].sort(),
    [availableNumbers]
  );

  const twoColStackRows = useMemo(() => {
    const sorted = [...availableNumbers].sort();
    return Array.from({ length: Math.ceil(sorted.length / 2) }, (_, index) => ({
      key: `twocol-stack-row-${index}`,
      index,
      numbers: [sorted[index * 2] || null, sorted[index * 2 + 1] || null] as [string | null, string | null],
    }));
  }, [availableNumbers]);

  const twoColStackRowsRender = useMemo(
    () => [...twoColStackRows].reverse(),
    [twoColStackRows]
  );

  const expandedOneColCount = useMemo(() => {
    if (!expandedOneColNumber) return 0;
    if (inventory) return Math.max(0, inventory[expandedOneColNumber] || 0);
    return 1;
  }, [expandedOneColNumber, inventory]);

  const expandedOneColStack = useMemo(() => {
    if (!expandedOneColNumber || expandedOneColCount <= 0) return [];
    return Array.from({ length: expandedOneColCount }, (_, index) => ({
      key: `${expandedOneColNumber}-${index}`,
      index,
    }));
  }, [expandedOneColNumber, expandedOneColCount]);

  const expandedOneColStackRender = useMemo(
    () => [...expandedOneColStack].reverse(),
    [expandedOneColStack]
  );
  const selectedCartSet = useMemo(() => new Set(selectedCartNumbers), [selectedCartNumbers]);
  const hasReadyData = Boolean(finalTicketPreviewUrl);
  const shouldAnimateGridReveal = gridRevealKey > 0 || hasReadyData;

  const detailStackStep = useMemo(() => {
    const defaultStep = Math.max(1, gridMetrics.cellH * 0.4);
    const mainBoxTop = boxes[0]?.top ?? 0;
    const safeStep = Math.max(1, gridMetrics.cellH - mainBoxTop * gridMetrics.scale);
    if (!Number.isFinite(defaultStep) || !Number.isFinite(safeStep)) return defaultStep;
    return Math.max(defaultStep, Math.min(gridMetrics.cellH || defaultStep, safeStep));
  }, [boxes, gridMetrics.cellH, gridMetrics.scale]);

  const renderTicketCell = (opts: {
    num: string | null;
    cellKey: string;
    reactKey: string;
    suffixText?: string;
    rowIndex?: number;
    isSoldOut?: boolean;
    onClick?: (() => void) | null;
    forceVisible?: boolean;
    detailMode?: boolean;
  }) => {
    const { num, cellKey, reactKey, suffixText = "", rowIndex = 0, isSoldOut = false, onClick = null, forceVisible = false, detailMode = false } = opts;
    const cellHeight = gridMetrics.cellH || 0;
    const safeScale = Number.isFinite(gridMetrics.scale) ? gridMetrics.scale : 0.25;
    const isVisible = forceVisible || !!visibleCells[cellKey];
    const shouldAnimate = shouldAnimateGridReveal;
    const delayMs = Math.min(900, Math.max(0, rowIndex) * 80);
    const isPicked = !detailMode && gridLayout !== "one-col" && !!num && selectedCartSet.has(num);
    const shouldUseMainBoxSelection = isPicked && gridLayout === "two-col" && isTwoColStacked;
    const digitsRowStyle = mainDigitsRowStyle
      ? {
        ...mainDigitsRowStyle,
        opacity: detailMode ? 1 : mainDigitsRowStyle.opacity,
        ...(shouldUseMainBoxSelection
          ? {
            opacity: 1,
            transform: "scale(1.1)",
            transformOrigin: "right bottom",
            zIndex: 27,
          }
          : null),
      }
      : null;
    const tickLayoutScale =
      gridLayout === "traditional" ? 1 :
        gridLayout === "three-col" ? 1.38 :
          gridLayout === "four-col" ? 1.28 :
            1;
    const tickSize = Math.max(18, Math.min(40, Math.round((gridMetrics.cellH || 0) * 0.32 * tickLayoutScale)));
    const tickStroke = Math.max(1, Math.round(tickSize * 0.075));
    return (
      <div
        key={reactKey}
        className={`relative rounded-sm overflow-hidden ${num ? "bg-white" : "bg-transparent"} ${onClick ? "cursor-pointer" : ""}`}
        data-cell-key={cellKey}
        onClick={onClick || undefined}
        style={{
          height: cellHeight,
          ...(shouldAnimate
            ? {
              animation: "vedientu-grid-reveal 520ms ease both",
              animationDelay: `${delayMs}ms`,
            }
            : null),
        }}
      >
        {num ? (
          <>
            {isVisible && (
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  transform: `scale(${safeScale})`,
                }}
              >
                <img
                  src={finalTicketPreviewUrl as string}
                  alt={`Vé ${num}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                  onLoad={onTicketImageLoad}
                />
                {boxes.map((b, i) => (
                  <div
                    key={`cell-${cellKey}-box-${i}`}
                    className={`absolute rounded-lg shadow-sm ${shouldUseMainBoxSelection && i === 0
                        ? "bg-emerald-100 border border-transparent"
                        : "bg-white/93 border border-white/60"
                      }`}
                    style={{
                      top: b.top,
                      right: b.right,
                      width: b.width,
                      height: b.height,
                      ...(shouldUseMainBoxSelection && i === 0
                        ? {
                          transform: "scale(1.09)",
                          transformOrigin: "right bottom",
                          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.2)",
                          zIndex: 24,
                        }
                        : null),
                    }}
                  />
                ))}
                <div
                  className="absolute rounded-lg"
                  style={{
                    top: headBoxPosition.top,
                    right: headBoxPosition.right,
                    width: headBoxDisplaySize,
                    height: headBoxDisplaySize,
                  }}
                />
                {!isSoldOut && digitsRowStyle && (
                  <div style={digitsRowStyle}>
                    {[...`${suffixText}${num}`.slice(0, 6)].map((digit, index) => (
                      <span
                        key={`${reactKey}-digit-${index}`}
                        style={mainDigitTextStyle}
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                )}
                {!isSoldOut && !isPicked && (
                  !detailMode && (
                    <div style={headNumberStyle}>
                      <span>{num}</span>
                    </div>
                  )
                )}
              </div>
            )}
            {isPicked && !shouldUseMainBoxSelection && (
              <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-200 pointer-events-none z-30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="text-purple-600 bg-white rounded-full shadow-sm"
                  style={{
                    width: tickSize,
                    height: tickSize,
                    borderWidth: tickStroke,
                    borderStyle: "solid",
                    borderColor: "#db2777",
                  }}
                >
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="w-[90%] h-[90%] bg-black/60 rounded flex items-center justify-center backdrop-blur-[1px] shadow-sm">
                  <span className="text-yellow-300 font-bold text-[10px] md:text-xs uppercase -rotate-12 border border-blue-500 px-1 rounded bg-white/10">
                    hết vé
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full" />
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={layoutPanelRef}
        className={`${fullBleedMobile ? "-mx-6 sm:mx-0 px-6 sm:px-0" : "mx-0 px-0"
          } w-full bg-transparent p-0 sm:p-6 pt-1 pb-4 sm:py-6 rounded-none sm:rounded-3xl mb-2`}
        style={
          isMainBoxForceActive
            ? {
              ["--vedientu-main-opacity" as string]: "1",
              ["--vedientu-head-opacity" as string]: "0",
            }
            : undefined
        }
      >
        <div>
          <div ref={layoutTabsRef} className="mt-0 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => requestGridLayout("traditional")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedGridLayout === "traditional"
                  ? "bg-sky-100 text-sky-700 border-sky-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              Truyền thống
            </button>
            {selectedGridLayout === "two-col" ? (
              <div className="relative rounded-full border border-sky-200 bg-sky-100 text-sky-700">
                <button
                  type="button"
                  onClick={() => setIsTwoColStacked((prev) => !prev)}
                  className={`relative inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${isTwoColStacked ? "text-purple-700" : "text-sky-600 hover:text-sky-700"
                    }`}
                  aria-label={isTwoColStacked ? "Bỏ xếp chồng đầu số" : "Xếp chồng đầu số"}
                  title={isTwoColStacked ? "Bỏ xếp chồng đầu số" : "Xếp chồng đầu số"}
                >
                  <span className="invisible">2 cot</span>
                  <Layers className="absolute h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => requestGridLayout("two-col")}
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                2 cột
              </button>
            )}
            <button
              type="button"
              onClick={() => requestGridLayout("three-col")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedGridLayout === "three-col"
                  ? "bg-sky-100 text-sky-700 border-sky-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              3 cột
            </button>
            <button
              type="button"
              onClick={() => requestGridLayout("four-col")}
              className={`hidden px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedGridLayout === "four-col"
                  ? "bg-sky-100 text-sky-700 border-sky-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              4 cột
            </button>
            <button
              type="button"
              onClick={() => requestGridLayout("one-col")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedGridLayout === "one-col"
                  ? "bg-sky-100 text-sky-700 border-sky-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              1 cột
            </button>
          </div>

          <div className="mt-2 flex justify-center">
            <div className="rounded-full border border-rose-200 bg-rose-50/70 px-3 py-1.5">
              <p className="flex items-center gap-1.5 text-sm md:text-base font-bold text-rose-600 whitespace-nowrap tracking-wide select-none">
                <span>Zoom hoặc nhấn</span>
                <button
                  type="button"
                  onClick={() => setIsMainBoxPreviewForced((prev) => !prev)}
                  className="inline-flex h-6 w-6 items-center justify-center text-sky-500 transition-colors hover:text-sky-600"
                  aria-label="Xem dãy 6 số trong main box"
                  title="Xem dãy 6 số trong main box"
                >
                  {isMainBoxForceActive ? (
                    <EyeOff className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={2.5} />
                  ) : (
                    <Eye className="h-4 w-4 md:h-[18px] md:w-[18px]" strokeWidth={2.5} />
                  )}
                </button>
                <span>để xem hết dãy 6 số</span>
              </p>
            </div>
          </div>

          {!hasReadyData && (
            <div className="mt-4">
              <div className="min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-purple-100 bg-slate-50/90 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-100/30 to-transparent animate-pulse" />
                <div className="relative w-28 h-28 mb-2">
                  {loadingAnimationData ? (
                    <Lottie animationData={loadingAnimationData as object} loop className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full animate-pulse bg-purple-50 rounded-full opacity-60" />
                  )}
                </div>
                <p className="relative text-purple-500 text-sm font-bold animate-pulse z-10">Đang tải vé...</p>
              </div>
            </div>
          )}
        </div>

        {hasReadyData && (
          <div className={`mt-4 ${fullBleedMobile ? "mx-2 sm:mx-0" : "mx-0"}`}>
            <div className="relative rounded-xl overflow-hidden p-1">
              <div
                key={`grid-bg-${gridRevealKey}`}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('${bgUrl}')`,
                  ...(shouldAnimateGridReveal
                    ? { animation: "vedientu-grid-bg-reveal 640ms ease both" }
                    : null),
                }}
              />

              {isError ? (
                <div className="relative z-10 my-6 mx-2 p-6 bg-red-50/90 backdrop-blur-md rounded-2xl border border-red-200 shadow-lg text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-red-900">Không thể kết nối máy chủ Supabase</p>
                  <p className="text-xs text-red-600 mt-1 mb-4">Vui lòng kiểm tra lại kết nối mạng trên thiết bị của bạn.</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-200"
                    >
                      🔄 Thử kết nối lại
                    </button>
                  )}
                </div>
              ) : selectedNumbers.length === 0 ? (
                <div className="relative z-10 my-6 mx-2 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-purple-200 shadow-lg text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-purple-900">
                    Chưa có dữ liệu vé cho ngày {ngayHienThi || "này"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Vui lòng quay lại sau hoặc chọn ngày khác nhé!
                  </p>
                </div>
              ) : gridLayout === "one-col" ? (
                <div className="relative z-10">
                  {expandedOneColNumber ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 px-2 py-1.5 bg-white/80 backdrop-blur rounded-xl border border-white/70">
                        <div className="text-sm font-bold text-slate-700">
                          Đầu số <span className="text-purple-700">{expandedOneColNumber}</span>
                          {inventory ? (
                            <span className="ml-2 text-xs font-semibold text-slate-500">
                              ({expandedOneColCount} vé)
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedOneColNumber(null)}
                          className="px-3 py-1 rounded-full text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors"
                        >
                          Quay lại
                        </button>
                      </div>

                      {expandedOneColCount <= 0 ? (
                        <div className="py-8 text-center">
                          <span className="text-sm font-bold text-yellow-300 uppercase bg-black/60 px-3 py-2 rounded-full border border-blue-500">
                            hết vé
                          </span>
                        </div>
                      ) : (
                        <div
                          className="pr-1 rounded-xl"
                          style={{
                            overflow: "visible",
                          }}
                        >
                          <div
                            className="relative"
                            style={{
                              height: gridMetrics.cellH
                                ? gridMetrics.cellH + (Math.max(expandedOneColCount, 1) - 1) * detailStackStep
                                : undefined,
                            }}
                          >
                            {expandedOneColStackRender.map(({ key, index }) => (
                              <div
                                key={key}
                                className="absolute left-0 right-0"
                                style={{
                                  top: index * detailStackStep,
                                }}
                              >
                                {renderTicketCell({
                                  num: expandedOneColNumber,
                                  cellKey: `onecol-detail-${expandedOneColNumber}-${index}`,
                                  suffixText: getSuffixText(expandedOneColNumber),
                                  rowIndex: index,
                                  reactKey: `${gridRevealKey}-onecol-detail-${expandedOneColNumber}-${index}`,
                                  isSoldOut: false,
                                  forceVisible: true,
                                  detailMode: true,
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      ref={gridWrapRef}
                      className="grid grid-cols-1 gap-1"
                      style={{
                        maxHeight: gridMetrics.cellH ? gridMetrics.cellH * 5 : undefined,
                        overflowY: "auto",
                      }}
                    >
                      {oneColNumbers.map((num, rowIndex) => {
                        const cellKey = `onecol-${rowIndex}`;
                        const suffixText = num ? getSuffixText(num) : "";
                        const isSoldOut = !!num && !isAvailable(num);
                        return (
                          <div key={`${gridRevealKey}-${cellKey}`}>
                            {renderTicketCell({
                              num,
                              cellKey,
                              suffixText,
                              rowIndex,
                              isSoldOut,
                              reactKey: `${gridRevealKey}-${cellKey}`,
                              onClick: num ? () => setExpandedOneColNumber(num) : null,
                              forceVisible: true,
                              detailMode: false,
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : gridLayout !== "traditional" && inventory && availableNumbers.length === 0 ? (
                <div className="relative z-10 py-8 text-center">
                  <span className="text-sm font-bold text-yellow-300 uppercase bg-black/60 px-3 py-2 rounded-full border border-blue-500">
                    hết vé
                  </span>
                </div>
              ) : gridLayout === "two-col" && isTwoColStacked ? (
                <div
                  ref={gridWrapRef}
                  className="relative z-10"
                  style={{
                    height:
                      gridMetrics.cellH > 0
                        ? gridMetrics.cellH + Math.max(twoColStackRows.length - 1, 0) * detailStackStep
                        : undefined,
                    overflow: "visible",
                  }}
                >
                  {twoColStackRowsRender.map(({ key, index, numbers }) => (
                    <div
                      key={`${gridRevealKey}-${key}`}
                      className="absolute left-0 right-0 grid grid-cols-2 gap-1"
                      style={{
                        top: index * detailStackStep,
                      }}
                    >
                      {numbers.map((num, colIndex) =>
                        (() => {
                          const isSoldOut = !!num && !isAvailable(num);
                          return renderTicketCell({
                            num,
                            cellKey: `twocol-stack-${index}-${colIndex}`,
                            suffixText: num ? getSuffixText(num) : "",
                            rowIndex: index,
                            isSoldOut,
                            reactKey: `${gridRevealKey}-twocol-stack-${index}-${colIndex}`,
                            onClick: num && !isSoldOut && onNumberToggle ? () => onNumberToggle(num) : null,
                            forceVisible: true,
                            detailMode: false,
                          });
                        })()
                      )}
                    </div>
                  ))}
                </div>
              ) : gridLayout === "traditional" ? (
                <div ref={gridWrapRef} className="relative z-10 grid grid-cols-5 gap-1">
                  {columns.map((col, colIndex) => (
                    <div key={colIndex} className="flex flex-col-reverse gap-1">
                      {Array.from({ length: maxRows }).map((_, rowIndex) => {
                        const num = col[rowIndex] || null;
                        const cellKey = `trad-${colIndex}-${rowIndex}`;
                        const suffixText = num ? getSuffixText(num) : "";
                        const isSoldOut = !!num && !isAvailable(num);
                        return renderTicketCell({
                          num,
                          cellKey,
                          suffixText,
                          rowIndex,
                          isSoldOut,
                          reactKey: `${gridRevealKey}-${cellKey}`,
                          onClick: num && !isSoldOut && onNumberToggle ? () => onNumberToggle(num) : null,
                        });
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  ref={gridWrapRef}
                  className={`relative z-10 grid gap-1 ${flexLayout.cols === 2
                      ? "grid-cols-2"
                      : flexLayout.cols === 3
                        ? "grid-cols-3"
                        : flexLayout.cols === 4
                          ? "grid-cols-4"
                          : "grid-cols-5"
                    }`}
                >
                  {flexLayout.cells.map((num, idx) => {
                    const colIndex = flexLayout.cols ? idx % flexLayout.cols : 0;
                    const rowIndex = flexLayout.cols ? Math.floor(idx / flexLayout.cols) : 0;
                    const cellKey = `flex-${flexLayout.cols}-${rowIndex}-${colIndex}`;
                    const suffixText = num ? getSuffixText(num) : "";
                    return renderTicketCell({
                      num,
                      cellKey,
                      suffixText,
                      rowIndex,
                      isSoldOut: !!num && !isAvailable(num),
                      reactKey: `${gridRevealKey}-${cellKey}`,
                      onClick: num && isAvailable(num) && onNumberToggle ? () => onNumberToggle(num) : null,
                    });
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes vedientu-grid-reveal {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes vedientu-grid-bg-reveal {
          0% {
            opacity: 0;
            clip-path: inset(0 0 100% 0);
          }
          100% {
            opacity: 1;
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
    </>
  );
}
