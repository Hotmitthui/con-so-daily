"use client";

import { useMemo, useState } from "react";
import { Banknote } from "lucide-react";

type TicketOption = {
  label: string;
  value: number;
  sublabel?: string;
  icon?: "silver" | "gold" | "diamond";
};

const TICKET_OPTIONS: TicketOption[] = [
  { label: "100k", value: 100_000 },
  { label: "200k", value: 200_000 },
  { label: "400k", value: 400_000 },
  { label: "1 triệu", value: 1_000_000 },
  { label: "3 triệu", value: 3_000_000 },
  { label: "6 triệu", value: 6_000_000, sublabel: "khuyến khích 6 triệu", icon: "silver" },
  { label: "10 triệu", value: 10_000_000 },
  { label: "15 triệu", value: 15_000_000 },
  { label: "30 triệu", value: 30_000_000 },
  { label: "50 triệu", value: 50_000_000, sublabel: "An ủi 50 triệu", icon: "gold" },
  { label: "2 tỉ", value: 2_000_000_000, sublabel: "Đặc biệt 2 tỉ", icon: "diamond" },
];
const NORMAL_TICKET_OPTIONS = TICKET_OPTIONS.filter((option) => !option.icon);
const FEATURED_TICKET_OPTIONS = TICKET_OPTIONS.filter((option) => option.icon);
const TICKET_COUNT_OPTIONS = Array.from({ length: 16 }, (_, index) => index + 1);

const CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN");
const PIT_TAX_THRESHOLD = 20_000_000;
const EXCHANGE_FEE_RATE = 0.01;
const PIT_TAX_RATE = 0.1;

const formatCurrency = (value: number) => `${CURRENCY_FORMATTER.format(Math.round(value))}đ`;
const formatNumberInput = (digits: string) =>
  digits ? CURRENCY_FORMATTER.format(Number(digits)).replace(/,/g, ".") : "";

export default function DoiThuong() {
  const [ticketValue, setTicketValue] = useState<number>(100_000);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [customTicketValueInput, setCustomTicketValueInput] = useState("");

  const customTicketValue = useMemo(() => {
    if (!customTicketValueInput) return 0;
    const parsed = Number(customTicketValueInput.replace(/\D/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [customTicketValueInput]);
  const effectiveTicketValue = customTicketValue > 0 ? customTicketValue : ticketValue;
  const isUsingCustomValue = customTicketValue > 0;
  const selectedTicketLabel =
    TICKET_OPTIONS.find((option) => option.value === ticketValue)?.label ?? formatCurrency(ticketValue);

  const summary = useMemo(() => {
    const safeCount = Number.isFinite(ticketCount) && ticketCount > 0 ? Math.floor(ticketCount) : 0;
    const totalPrizeValue = effectiveTicketValue * safeCount;
    const taxPerTicket =
      effectiveTicketValue > PIT_TAX_THRESHOLD
        ? (effectiveTicketValue - PIT_TAX_THRESHOLD) * PIT_TAX_RATE
        : 0;
    const totalPitTax = taxPerTicket * safeCount;
    const exchangeFee = (totalPrizeValue - totalPitTax) * EXCHANGE_FEE_RATE;
    const finalPayout = totalPrizeValue - totalPitTax - exchangeFee;

    return {
      safeCount,
      totalPrizeValue,
      taxPerTicket,
      totalPitTax,
      exchangeFee,
      finalPayout,
    };
  }, [effectiveTicketValue, ticketCount]);

  return (
    <div
      className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm"
      style={{ fontFamily: "var(--font-be-vietnam-pro)" }}
    >
      <div className="space-y-1">
        <p className="text-base font-semibold text-sky-800">Công cụ tính đổi thưởng</p>
        <p className="text-sm leading-relaxed text-slate-500">
          Nhập giá trị vé và số lượng vé trúng để hệ thống tự tính thuế, phí đổi thưởng và số tiền
          cuối cùng khách nhận.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Giá trị tờ vé
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NORMAL_TICKET_OPTIONS.map((option) => {
              const selected = ticketValue === option.value;
              return (
                <TicketOptionButton
                  key={option.value}
                  option={option}
                  selected={selected}
                  onClick={() => setTicketValue(option.value)}
                />
              );
            })}
          </div>
          <div className="mt-3 space-y-2">
            {FEATURED_TICKET_OPTIONS.map((option) => {
              const selected = ticketValue === option.value;
              return (
                <TicketOptionButton
                  key={option.value}
                  option={option}
                  selected={selected}
                  onClick={() => setTicketValue(option.value)}
                  stacked
                />
              );
            })}
          </div>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Số lượng vé trúng
          </span>
          <select
            value={ticketCount}
            onChange={(event) => setTicketCount(Number(event.target.value))}
            className="w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
          >
            {TICKET_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} vé
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Giá trị trúng khác cho 1 vé
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={customTicketValueInput}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
            setCustomTicketValueInput(formatNumberInput(digits));
          }}
          className="w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
          placeholder="Ví dụ: 10.400.000"
        />
        <div className="flex items-start justify-between gap-3 text-xs leading-relaxed text-slate-500">
          <p>
            Dùng cho trường hợp 1 vé trúng nhiều giải cùng lúc. Nếu để trống, hệ thống sẽ dùng mệnh
            giá đã chọn ở trên.
          </p>
          {isUsingCustomValue && (
            <button
              type="button"
              onClick={() => setCustomTicketValueInput("")}
              className="shrink-0 rounded-full border border-sky-200 px-3 py-1 font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              Xóa
            </button>
          )}
        </div>
        {isUsingCustomValue && (
          <p className="text-xs font-medium text-emerald-700">
            Đang tính theo giá trị nhập tay: {formatCurrency(customTicketValue)}
          </p>
        )}
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-violet-300 bg-gradient-to-r from-violet-200 via-white to-violet-100 px-4 py-3 text-center">
          <p className="text-base font-bold text-rose-600">
            {isUsingCustomValue ? formatCurrency(customTicketValue) : selectedTicketLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-300 bg-gradient-to-r from-violet-200 via-white to-violet-100 px-4 py-3 text-center">
          <p className="text-base font-bold text-rose-600">{summary.safeCount} vé</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600">
        {summary.taxPerTicket > 0
          ? `Thuế TNCN mỗi vé = (${formatCurrency(effectiveTicketValue)} - ${formatCurrency(
              PIT_TAX_THRESHOLD
            )}) x 10% = ${formatCurrency(summary.taxPerTicket)}.`
          : `Vé từ 20 triệu trở xuống không phát sinh thuế TNCN theo công thức hiện tại.`}
      </div>

      <div className="mt-4 space-y-3">
        <ResultRow
          label="Tổng giá trị vé trúng"
          formula={`${formatCurrency(effectiveTicketValue)} x ${summary.safeCount} vé`}
          value={formatCurrency(summary.totalPrizeValue)}
        />
        <ResultRow
          label="Tổng thuế TNCN"
          formula={
            summary.taxPerTicket > 0
              ? `${formatCurrency(summary.taxPerTicket)} x ${summary.safeCount} vé`
              : "Không phát sinh"
          }
          value={formatCurrency(summary.totalPitTax)}
        />
        <ResultRow
          label="Tổng phí đổi thưởng"
          formula={`(${formatCurrency(summary.totalPrizeValue)} - ${formatCurrency(
            summary.totalPitTax
          )}) x 1%`}
          value={formatCurrency(summary.exchangeFee)}
        />
      </div>

      <div className="mt-4 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
          Giá trị trả thưởng cuối cùng
        </p>
        <p className="mt-2 text-2xl font-bold text-emerald-700">
          {formatCurrency(summary.finalPayout)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {formatCurrency(summary.totalPrizeValue)} - {formatCurrency(summary.totalPitTax)} -{" "}
          {formatCurrency(summary.exchangeFee)}
        </p>
      </div>
    </div>
  );
}

type ResultRowProps = {
  label: string;
  formula: string;
  value: string;
};

function ResultRow({ label, formula, value }: ResultRowProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{formula}</p>
        </div>
        <p className="text-sm font-bold text-sky-700">{value}</p>
      </div>
    </div>
  );
}

type TicketOptionButtonProps = {
  option: TicketOption;
  selected: boolean;
  onClick: () => void;
  stacked?: boolean;
};

function TicketOptionButton({ option, selected, onClick, stacked = false }: TicketOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
        stacked ? "min-h-[64px]" : "",
        selected
          ? "border-sky-500 bg-sky-50 shadow-sm ring-2 ring-sky-200"
          : "border-sky-100 bg-sky-50/60 hover:border-sky-300 hover:bg-white",
      ].join(" ")}
    >
      <TicketIcon kind={option.icon} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{option.label}</p>
        {option.sublabel ? (
          <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{option.sublabel}</p>
        ) : null}
      </div>
    </button>
  );
}

function TicketIcon({ kind }: { kind?: TicketOption["icon"] }) {
  if (kind === "silver") {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-300 shadow-sm">
        <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-white/80" />
        <span className="h-5 w-5 rounded-md bg-gradient-to-br from-slate-400 via-white to-slate-500 shadow-inner" />
      </span>
    );
  }

  if (kind === "gold") {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-100 via-white to-amber-300 shadow-sm">
        <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-white/85" />
        <span className="h-5 w-5 rounded-md bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-600 shadow-inner" />
      </span>
    );
  }

  if (kind === "diamond") {
    return (
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-100 shadow-sm">
        <span className="absolute h-6 w-6 rotate-45 rounded-[8px] bg-gradient-to-br from-cyan-300 via-white to-sky-400 shadow-inner" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white/95" />
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700 shadow-sm">
      <Banknote className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}
