"use client";

import React, { useState, useEffect } from 'react';

interface FallingLeavesProps {
  count?: number; // Số lượng lá (mặc định 20)
  enabled?: boolean; // Bật/tắt (mặc định true)
  scope?: 'screen' | 'container';
  sizeRange?: [number, number];
  driftRange?: [number, number];
  swayRange?: [number, number];
}

export default function FallingLeaves({
  count = 20,
  enabled = true,
  scope = 'screen',
  sizeRange = [15, 35],
  driftRange = [20, 80],
  swayRange = [10, 35],
}: FallingLeavesProps) {
  const [leaves, setLeaves] = useState<{
    id: number;
    left: number;
    duration: number;
    delay: number;
    type: string;
    size: number;
    // Thuộc tính tùy chỉnh cho animation
    driftX: number;
    swayAmp: number;
    swayDur: number;
    rotAmp: number;
    rotDur: number;
  }[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Tạo danh sách lá ngẫu nhiên
    setLeaves(Array.from({ length: count }).map((_, i) => {
      const duration = 30 + Math.random() * 30; // Rơi chậm hơn (30-60s) để giảm tải
      const windDirection = Math.random() > 0.5 ? 1 : -1; // 1 = phải, -1 = trái
      const isStraight = Math.random() < 0.25; // 25% lá rơi thẳng
      const swayBase = swayRange[0] + Math.random() * (swayRange[1] - swayRange[0]);
      const swayAmp = isStraight ? 0 : swayBase * (Math.random() > 0.6 ? 1.6 : 1);
      const rotAmp = isStraight ? 5 : 10 + Math.random() * 25;
      const minSize = sizeRange[0];
      const maxSize = sizeRange[1];
      const size = minSize + Math.random() * (maxSize - minSize);
      const driftBase = driftRange[0] + Math.random() * (driftRange[1] - driftRange[0]);
      return {
        id: i,
        left: Math.random() * 100,
        duration: duration,
        delay: Math.random() * duration, // Trì hoãn ngẫu nhiên để lá rơi không đồng đều
        type: Math.random() > 0.6 ? '🍁' : (Math.random() > 0.5 ? '🍀' : '🌸'),
        size,
        // Tùy chỉnh đường bay
        driftX: driftBase * windDirection,
        swayAmp: swayAmp * windDirection,
        swayDur: 3 + Math.random() * 4, // 3-7s
        rotAmp: rotAmp * windDirection,
        rotDur: 4 + Math.random() * 5, // 4-9s
      };
    }));
  }, [count, enabled, sizeRange, driftRange, swayRange]);

  if (!enabled) return null;

  const containerClass =
    scope === 'container'
      ? 'absolute inset-0 pointer-events-none z-10 overflow-hidden'
      : 'fixed inset-0 pointer-events-none z-20 overflow-hidden';
  const fallAnimation = scope === 'container' ? 'leaf-fall-container' : 'leaf-fall-screen';
  const leafClass = scope === 'container' ? 'absolute' : 'absolute -top-12';

  return (
    <div className={containerClass} aria-hidden="true">
      <style>{`
        @keyframes leaf-fall-screen {
          0% { transform: translate(0, -12vh); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate(calc(var(--driftX) * 1px), 110vh); opacity: 0; }
        }
        @keyframes leaf-fall-container {
          0% { top: -10%; transform: translateX(0); opacity: 0; }
          8% { opacity: 1; }
          100% { top: 110%; transform: translateX(calc(var(--driftX) * 1px)); opacity: 0; }
        }
        @keyframes leaf-sway {
          0% { transform: translateX(calc(var(--swayAmp) * 1px)); }
          50% { transform: translateX(calc(var(--swayAmp) * -1px)); }
          100% { transform: translateX(calc(var(--swayAmp) * 1px)); }
        }
        @keyframes leaf-rotate {
          0% { transform: rotate(calc(var(--rotAmp) * 1deg)); }
          50% { transform: rotate(calc(var(--rotAmp) * -1deg)); }
          100% { transform: rotate(calc(var(--rotAmp) * 1deg)); }
        }
      `}</style>
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className={leafClass}
          style={{
            left: `${leaf.left}%`,
            fontSize: `${leaf.size}px`,
            animation: `${fallAnimation} ${leaf.duration}s linear infinite`,
            animationDelay: `-${leaf.delay}s`,
            '--driftX': leaf.driftX,
          } as React.CSSProperties}
        >
          <div
            style={{
              animation: `leaf-sway ${leaf.swayDur}s ease-in-out infinite`,
              '--swayAmp': leaf.swayAmp,
            } as React.CSSProperties}
          >
            <div
              style={{
                animation: `leaf-rotate ${leaf.rotDur}s ease-in-out infinite`,
                '--rotAmp': leaf.rotAmp,
              } as React.CSSProperties}
            >
              {leaf.type}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
