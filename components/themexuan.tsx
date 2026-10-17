import React, { useEffect, useRef } from 'react';

type ThemeXuanProps = {
  enabled: boolean;
  sunPreview?: boolean;
};

export default function ThemeXuan({ enabled, sunPreview = false }: ThemeXuanProps) {
  if (!enabled) return null;

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const updateCutoff = () => {
      const rect = el.getBoundingClientRect();
      const cutoff = rect.bottom + window.scrollY - 60;
      document.documentElement.style.setProperty('--sky-cutoff', `${cutoff}px`);
      document.documentElement.style.setProperty('--xuan-top', `${rect.top + window.scrollY}px`);
      document.documentElement.style.setProperty('--xuan-left', `${rect.left + window.scrollX}px`);
      document.documentElement.style.setProperty('--xuan-width', `${rect.width}px`);
      document.documentElement.style.setProperty('--xuan-height', `${rect.height}px`);
    };

    const updateSun = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 120) {
        document.documentElement.style.setProperty('--sun-ready', '0');
        return;
      }
      let hour = 0;

      if (sunPreview) {
        const cycleMs = 12000;
        const phase = (Date.now() % cycleMs) / cycleMs;
        hour = phase * 24;
      } else {
        const now = new Date();
        const vnTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
        const vnDate = new Date(vnTimeStr);
        hour = vnDate.getHours() + vnDate.getMinutes() / 60;
      }

      const xStart = rect.width * 0.92;
      const xEnd = rect.width * 0.08;

      const baseY = rect.height * 0.48;
      const amp = rect.height * 0.26;
      const offsetY = 120;

      const calcY = (t: number) => baseY + (1 - Math.sin(Math.PI * t)) * amp - offsetY;
      const calcX = (t: number) => xStart + (xEnd - xStart) * t;

      const isDay = hour >= 6 && hour < 18;
      const tDay = hour <= 6 ? 0 : hour >= 18 ? 1 : (hour - 6) / 12;

      const tNight = hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12;
      const xNight = xEnd + (xStart - xEnd) * tNight; // đi ngược lại
      const yNight = calcY(tNight);

      const xDay = calcX(tDay);
      const yDay = calcY(tDay);

      const radius = 32;
      const clamp = (v: number) => Math.max(radius, Math.min(rect.width - radius, v));
      document.documentElement.style.setProperty('--sun-x', `${clamp(xDay)}px`);
      document.documentElement.style.setProperty('--sun-y', `${yDay}px`);
      document.documentElement.style.setProperty('--sun-vis', isDay ? '1' : '0');
      document.documentElement.style.setProperty('--moon-x', `${clamp(xNight)}px`);
      document.documentElement.style.setProperty('--moon-y', `${yNight}px`);
      document.documentElement.style.setProperty('--moon-vis', isDay ? '0' : '1');
      document.documentElement.style.setProperty('--sun-ready', '1');
    };

    const updatePosition = () => {
      updateCutoff();
      updateSun();
    };

    updatePosition();

    const ro = new ResizeObserver(updatePosition);
    ro.observe(el);
    window.addEventListener('resize', updatePosition);
    const sunTimer = window.setInterval(updateSun, sunPreview ? 500 : 60 * 1000);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.clearInterval(sunTimer);
      document.documentElement.style.setProperty('--sky-cutoff', '0px');
      document.documentElement.style.setProperty('--xuan-top', '0px');
      document.documentElement.style.setProperty('--xuan-left', '0px');
      document.documentElement.style.setProperty('--xuan-width', '0px');
      document.documentElement.style.setProperty('--xuan-height', '0px');
      document.documentElement.style.setProperty('--sun-x', '0px');
      document.documentElement.style.setProperty('--sun-y', '0px');
      document.documentElement.style.setProperty('--sun-vis', '0');
      document.documentElement.style.setProperty('--moon-x', '0px');
      document.documentElement.style.setProperty('--moon-y', '0px');
      document.documentElement.style.setProperty('--moon-vis', '0');
      document.documentElement.style.setProperty('--sun-ready', '0');
    };
  }, [sunPreview]);

  return (
    <div ref={wrapRef} className="relative w-[calc(100%+2rem)] -mx-4 sm:mx-0 sm:w-full pointer-events-none mb-2 mt-20">
      <img
        src="/spring_girl.png"
        alt="Spring Girl"
        className="relative z-10 w-full h-auto object-contain"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)'
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(250,245,255,0) 0%, rgba(250,245,255,0.7) 65%, rgba(250,245,255,0.9) 100%)'
        }}
      />
      <div
        className="absolute w-16 h-16 rounded-full z-0"
        style={{
          left: 'var(--sun-x, 0px)',
          top: 'var(--sun-y, 0px)',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 30% 30%, rgba(254, 202, 202, 0.95), rgba(253, 230, 138, 0.85) 55%, rgba(244, 114, 182, 0.55) 100%)',
          border: '2px solid rgba(244, 114, 182, 0.6)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18), inset 0 8px 16px rgba(255,255,255,0.45), inset 0 -10px 20px rgba(244,114,182,0.25)',
          opacity: 'calc(var(--sun-vis, 1) * var(--sun-ready, 0))',
          transition: 'opacity 400ms ease',
        }}
      />
      <div
        className="absolute w-16 h-16 rounded-full z-0"
        style={{
          left: 'var(--moon-x, 0px)',
          top: 'var(--moon-y, 0px)',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 30% 30%, rgba(254, 202, 202, 0.95), rgba(253, 230, 138, 0.85) 55%, rgba(244, 114, 182, 0.55) 100%)',
          border: '2px solid rgba(244, 114, 182, 0.6)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18), inset 0 8px 16px rgba(255,255,255,0.45), inset 0 -10px 20px rgba(244,114,182,0.25)',
          opacity: 'calc(var(--moon-vis, 0) * var(--sun-ready, 0))',
          transition: 'opacity 400ms ease',
        }}
      >
        <span
          className="absolute rounded-full"
          style={{
            top: '10px',
            left: '12px',
            width: '7px',
            height: '7px',
            background: 'rgba(40, 40, 50, 0.6)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.7)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '26px',
            left: '30px',
            width: '6px',
            height: '6px',
            background: 'rgba(30, 30, 40, 0.55)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.65)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '36px',
            left: '14px',
            width: '5px',
            height: '5px',
            background: 'rgba(20, 20, 30, 0.5)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.6)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '18px',
            left: '38px',
            width: '4px',
            height: '4px',
            background: 'rgba(25, 25, 35, 0.45)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.55)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '8px',
            left: '30px',
            width: '4px',
            height: '4px',
            background: 'rgba(35, 35, 45, 0.5)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.55)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '30px',
            left: '22px',
            width: '3px',
            height: '3px',
            background: 'rgba(30, 30, 40, 0.5)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.5)',
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            top: '24px',
            left: '8px',
            width: '3px',
            height: '3px',
            background: 'rgba(28, 28, 38, 0.5)',
            opacity: 'calc(var(--sky-night-t, 0) * 0.5)',
          }}
        />
      </div>
    </div>
  );
}
