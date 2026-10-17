"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerVNProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

const VIETNAMESE_DAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const getTodayInVietnam = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

const getRelativeDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
};

export default function DatePickerVN({
  value,
  onChange,
  label = "Chọn ngày vé",
  className = "",
}: DatePickerVNProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD
  const selectedDateObj = useMemo(() => {
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  const [viewYear, setViewYear] = useState(() => selectedDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDateObj.getMonth()); // 0-indexed

  // Khi value thay đổi bên ngoài, cập nhật view sang tháng đó
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Format hiển thị: ví dụ "Thứ Bảy, 17/10/2026"
  const formattedDisplay = useMemo(() => {
    if (!value) return "Chưa chọn ngày";
    const dayOfWeek = selectedDateObj.getDay();
    const d = String(selectedDateObj.getDate()).padStart(2, "0");
    const m = String(selectedDateObj.getMonth() + 1).padStart(2, "0");
    const y = selectedDateObj.getFullYear();
    return `${VIETNAMESE_DAYS[dayOfWeek]}, ${d}/${m}/${y}`;
  }, [value, selectedDateObj]);

  const todayStr = useMemo(() => getTodayInVietnam(), []);

  // Chuyển tháng
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Tính lưới ngày: 1: T2, ..., 0: CN -> chuyển sang index 0..6
  const calendarCells = useMemo(() => {
    const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay();
    const firstDayIndex = (firstDayRaw + 6) % 7; // 0: T2 ... 6: CN
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Tháng trước
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Tháng hiện tại
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const m = viewMonth + 1;
      cells.push({
        dateStr: `${viewYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Tháng sau để đủ lưới bội số 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Header Label & Quick Buttons */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-purple-600" />
          {label}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => selectDate(getRelativeDate(-1))}
            className={`px-2.5 py-0.5 rounded-lg border transition-all text-[11px] font-semibold cursor-pointer ${
              value === getRelativeDate(-1)
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Hôm qua
          </button>
          <button
            type="button"
            onClick={() => selectDate(todayStr)}
            className={`px-2.5 py-0.5 rounded-lg border transition-all text-[11px] font-semibold cursor-pointer ${
              value === todayStr
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => selectDate(getRelativeDate(1))}
            className={`px-2.5 py-0.5 rounded-lg border transition-all text-[11px] font-semibold cursor-pointer ${
              value === getRelativeDate(1)
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Ngày mai
          </button>
        </div>
      </div>

      {/* Trigger Button: Hiển thị đẹp, sang trọng */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-12 px-3.5 flex items-center justify-between border border-slate-200 rounded-2xl bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all shadow-xs cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {formattedDisplay}
            </p>
            <p className="text-[11px] text-slate-400">
              {value === todayStr
                ? "Hôm nay"
                : `Ngày ${value.split("-")[2]} tháng ${value.split("-")[1]}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
            Đổi ngày
          </span>
          <span
            className={`text-slate-400 text-xs transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-full sm:w-[320px] bg-white border border-slate-200 rounded-3xl p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-bold text-slate-800">
              Tháng {viewMonth + 1}, {viewYear}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[11px] font-bold text-slate-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell) => {
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => selectDate(cell.dateStr)}
                  className={`h-9 w-full rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-200"
                      : cell.isCurrentMonth
                      ? "text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                      : "text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{cell.dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-purple-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => selectDate(todayStr)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
            >
              Về hôm nay ({todayStr.split("-")[2]}/{todayStr.split("-")[1]})
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
