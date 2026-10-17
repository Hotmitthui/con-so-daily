"use client";

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// Danh sách 20 giải thưởng (5 cột x 4 hàng)
const PRIZES = [
  { id: 1, label: '10.000đ', color: 'bg-purple-100 text-purple-700' },
  { id: 2, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 3, label: '20.000đ', color: 'bg-pink-100 text-pink-700' },
  { id: 4, label: 'Thêm lượt', color: 'bg-blue-100 text-blue-700' },
  { id: 5, label: '50.000đ', color: 'bg-yellow-100 text-yellow-700' },
  { id: 6, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 7, label: '10.000đ', color: 'bg-purple-100 text-purple-700' },
  { id: 8, label: '100.000đ', color: 'bg-red-100 text-red-700' },
  { id: 9, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 10, label: '20.000đ', color: 'bg-pink-100 text-pink-700' },
  { id: 11, label: 'Thêm lượt', color: 'bg-blue-100 text-blue-700' },
  { id: 12, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 13, label: '10.000đ', color: 'bg-purple-100 text-purple-700' },
  { id: 14, label: '50.000đ', color: 'bg-yellow-100 text-yellow-700' },
  { id: 15, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 16, label: '20.000đ', color: 'bg-pink-100 text-pink-700' },
  { id: 17, label: 'Thêm lượt', color: 'bg-blue-100 text-blue-700' },
  { id: 18, label: 'May mắn', color: 'bg-slate-100 text-slate-500' },
  { id: 19, label: '10.000đ', color: 'bg-purple-100 text-purple-700' },
  { id: 20, label: '100.000đ', color: 'bg-red-100 text-red-700' },
];

export default function LuckyWheel() {
  const [prizes, setPrizes] = useState(PRIZES);
  const prizesRef = useRef(PRIZES);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Refs để quản lý animation mà không phụ thuộc vào render cycle
  const speedRef = useRef<number>(100);
  const stepRef = useRef<number>(0);
  const maxStepsRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeIndexRef = useRef<number>(0); // Để track index hiện tại trong loop

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Xáo trộn vị trí các giải thưởng
    const shuffledPrizes = [...PRIZES].sort(() => Math.random() - 0.5);
    setPrizes(shuffledPrizes);
    prizesRef.current = shuffledPrizes;
    
    // Reset trạng thái
    speedRef.current = 50; // Tốc độ ban đầu (ms) - càng nhỏ càng nhanh
    stepRef.current = 0;
    activeIndexRef.current = activeIndex !== null ? activeIndex : 0;
    
    // Random kết quả theo trọng số (Weighted Random) dựa trên danh sách đã xáo trộn
    // 100k: 1%, 50k: 3%, 20k: 5%, Còn lại: 10%
    const weights = shuffledPrizes.map(p => {
      if (p.label.includes('100.000')) return 1; 
      if (p.label.includes('50.000')) return 3;  
      if (p.label.includes('20.000')) return 5;  
      return 10; // 10k, May mắn, Thêm lượt
    });
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let winnerIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        winnerIndex = i;
        break;
      }
      random -= weights[i];
    }
    
    // Tính tổng số bước nhảy:
    // Quay ít nhất 3 vòng (3 * 20 = 60 bước) + khoảng cách đến đích
    const currentPos = activeIndexRef.current;
    const distance = (winnerIndex - currentPos + PRIZES.length) % PRIZES.length;
    const minRounds = 3;
    maxStepsRef.current = (minRounds * PRIZES.length) + distance;

    runAnimation();
  };

  const runAnimation = () => {
    // Nếu đã chạy đủ số bước
    if (stepRef.current >= maxStepsRef.current) {
      setIsSpinning(false);
      const winnerIndex = activeIndexRef.current;
      const winnerLabel = prizesRef.current[winnerIndex].label;
      setResult(winnerLabel);

      // Hiệu ứng pháo hoa nếu trúng giải có tiền (chứa 'đ')
      if (winnerLabel.includes('đ')) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#eab308']
        });
      }
      return;
    }

    // Tăng bước
    stepRef.current += 1;
    
    // Di chuyển đến ô tiếp theo
    activeIndexRef.current = (activeIndexRef.current + 1) % PRIZES.length;
    setActiveIndex(activeIndexRef.current);

    // Điều chỉnh tốc độ (Hiệu ứng trượt dốc)
    // Nhanh ở đầu, chậm dần về cuối
    const remainingSteps = maxStepsRef.current - stepRef.current;
    
    if (remainingSteps < 10) {
      speedRef.current += 30; // Chậm dần đều khi còn 10 bước
    } else if (remainingSteps < 20) {
      speedRef.current += 10; // Bắt đầu giảm tốc
    }

    // Gọi vòng lặp tiếp theo
    timerRef.current = setTimeout(runAnimation, speedRef.current);
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-top-4">
      {/* Header / Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full bg-white text-purple-900 p-4 shadow-md border border-purple-100 flex items-center justify-between transition-all duration-300 z-20 relative ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 p-2 rounded-full text-xl">🎡</div>
          <div className="text-left">
            <h3 className="font-bold text-base">Vòng Quay May Mắn</h3>
            <p className="text-sm text-red-400">Bản Trải nghiệm</p>
          </div>
        </div>
        <div className={`bg-purple-50 text-purple-400 p-1.5 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Expandable Game Area */}
      <div className={`bg-white border-x border-b border-purple-100 shadow-sm overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 rounded-b-2xl' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 flex flex-col items-center">

        {/* Grid Layout 5 cột x 4 hàng */}
        <div className="grid grid-cols-5 gap-2 w-full mb-6">
          {prizes.map((prize, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={prize.id}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-center p-1
                  transition-all duration-100 border-2 relative
                  ${isActive 
                    ? 'border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)] scale-110 z-10 bg-yellow-100' 
                    : 'border-transparent ' + prize.color
                  }
                `}
              >
                <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-purple-700' : ''}`}>
                  {prize.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nút quay */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`
            px-10 py-3 rounded-full font-bold text-white shadow-lg transition-all transform
            ${isSpinning 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 active:scale-95 hover:-translate-y-1'
            }
          `}
        >
          {isSpinning ? 'Đang quay...' : 'BẮT ĐẦU QUAY'}
        </button>

        {/* Kết quả */}
        {result && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center w-full animate-in zoom-in duration-300">
            {result.includes('May mắn') ? (
              <p className="text-lg font-bold text-slate-600">Chúc bạn may mắn lần quay sau</p>
            ) : result.includes('Thêm lượt') ? (
              <p className="text-lg font-bold text-blue-600">Bạn được cộng thêm 1 lượt quay</p>
            ) : (
              <>
                <p className="text-slate-500 text-xs mb-1">Chúc mừng bạn nhận được:</p>
                <p className="text-2xl font-bold text-purple-600 uppercase">{result}</p>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
