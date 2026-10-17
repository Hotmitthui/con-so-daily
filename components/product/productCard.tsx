"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";

export type ProductCardProps = {
  title: string;
  imageUrl: string;
  description?: string;
  badge?: string;
  details?: string[];
  className?: string;
  imageClassName?: string;
  layout?: "traditional" | "floating";
  floating?: boolean;
  onOrderClick?: () => void;
  orderLabel?: string;
};

export default function ProductCard({
  title,
  imageUrl,
  description,
  badge,
  details = [],
  className = "",
  imageClassName = "",
  layout = "traditional",
  floating = true,
  onOrderClick,
  orderLabel = "Đặt mua",
}: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const floatStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!floating) return undefined;
    return {
      animation: "product-card-float 5.8s ease-in-out infinite",
    };
  }, [floating]);

  const handleOrder = () => {
    if (onOrderClick) {
      onOrderClick();
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
  };

  const modal =
    typeof document !== "undefined" && isOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-4xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative">
                <img src={imageUrl} alt={title} className="h-72 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur hover:bg-white"
                  aria-label="Đóng popup sản phẩm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 p-5 md:p-6">
                <div>
                  {badge ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">{badge}</p>
                  ) : null}
                  <h3 className="mt-1 text-xl font-black text-slate-900">{title}</h3>
                  {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
                </div>

                {details.length > 0 ? (
                  <div className="grid gap-2">
                    {details.map((detail, index) => (
                      <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {detail}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    {orderLabel}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-slate-400">Bấm ra ngoài hoặc nhấn Esc để đóng.</p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const isFloatingLayout = layout === "floating";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative ${isFloatingLayout ? "block w-full bg-transparent p-0" : "block w-full text-left outline-none"} ${className}`}
        aria-label={`Xem chi tiết sản phẩm ${title}`}
      >
        {isFloatingLayout ? (
          <img
            src={imageUrl}
            alt={title}
            className={`block h-auto w-full object-contain ${imageClassName}`}
            style={floatStyle}
          />
        ) : (
          <div
            className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
            style={floatStyle}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
              <img
                src={imageUrl}
                alt={title}
                className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${imageClassName}`}
              />
              {badge ? (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-sm backdrop-blur">
                  {badge}
                </span>
              ) : null}
            </div>

            <div className="space-y-2 p-4">
              <h3 className="text-base font-black leading-tight text-slate-900">{title}</h3>
              {description ? <p className="text-sm leading-relaxed text-slate-500 line-clamp-2">{description}</p> : null}
              <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                Xem chi tiết
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}
      </button>

      {modal}

      <style>{`
        @keyframes product-card-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </>
  );
}
