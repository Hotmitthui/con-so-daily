import React from 'react';

type Theme83Props = {
  enabled: boolean;
  womenAvaTop?: string;
  womenAvaLeft?: string;
  womenAvaScale?: number;
  womenAvaTranslateX?: string;
  womenTextTop?: string;
  womenTextRight?: string;
  womenTextScale?: number;
  womenTextTranslateX?: string;
};

export default function Theme83({
  enabled,
  womenAvaTop = '0px',
  womenAvaLeft = '22%',
  womenAvaScale = 1.5,
  womenAvaTranslateX = '-50%',
  womenTextTop = '18px',
  womenTextRight = '12%',
  womenTextScale = 1.3,
  womenTextTranslateX = '0',
}: Theme83Props) {
  if (!enabled) return null;

  return (
    <div className="relative w-[calc(100%+2rem)] -mx-4 sm:mx-0 sm:w-full pointer-events-none mb-2 mt-20">
      <style>{`
        @keyframes gentle-sway {
          0% { transform: rotate(-1.2deg); }
          50% { transform: rotate(1.2deg); }
          100% { transform: rotate(-1.2deg); }
        }
        .women-text-sway {
          animation: gentle-sway 4.5s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes sparkle {
          0% { opacity: 0.15; transform: scale(0.7); }
          40% { opacity: 0.9; transform: scale(1.1); }
          100% { opacity: 0.15; transform: scale(0.7); }
        }
        .sparkle-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,183,213,0.95) 35%, rgba(255,130,190,0.75) 55%, rgba(255,255,255,0) 78%);
          box-shadow: 0 0 10px rgba(255, 151, 196, 0.9);
          filter: drop-shadow(0 0 6px rgba(255, 151, 196, 0.9));
          animation: sparkle 2.4s ease-in-out infinite;
          z-index: 2;
        }
        .sparkle-pink {
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,183,213,0.95) 35%, rgba(255,130,190,0.75) 55%, rgba(255,255,255,0) 78%);
          box-shadow: 0 0 10px rgba(255, 151, 196, 0.9);
          filter: drop-shadow(0 0 6px rgba(255, 151, 196, 0.9));
        }
        .sparkle-blue {
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(147,197,253,0.95) 35%, rgba(59,130,246,0.75) 55%, rgba(255,255,255,0) 78%);
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.9);
          filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.9));
        }
        .sparkle-yellow {
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(253,224,71,0.95) 35%, rgba(251,191,36,0.75) 55%, rgba(255,255,255,0) 78%);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.9);
          filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.9));
        }
        .sparkle-purple {
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(216,180,254,0.95) 35%, rgba(168,85,247,0.75) 55%, rgba(255,255,255,0) 78%);
          box-shadow: 0 0 10px rgba(196, 131, 255, 0.9);
          filter: drop-shadow(0 0 6px rgba(196, 131, 255, 0.9));
        }
      `}</style>
      <div
        className="absolute z-10"
        style={{
          top: womenAvaTop,
          left: womenAvaLeft,
          transform: `scale(${womenAvaScale}) translateX(${womenAvaTranslateX})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="relative inline-block">
          <img
            src="/women-ava.png"
            alt="Women Avatar"
            className="w-32 h-auto object-contain"
          />
          <div className="absolute inset-0 pointer-events-none">
            <span className="sparkle-dot sparkle-pink" style={{ top: '10%', left: '12%', animationDelay: '0.1s' }} />
            <span className="sparkle-dot sparkle-blue" style={{ top: '20%', right: '14%', animationDelay: '0.4s' }} />
            <span className="sparkle-dot sparkle-yellow" style={{ top: '34%', left: '6%', animationDelay: '0.7s' }} />
            <span className="sparkle-dot sparkle-purple" style={{ top: '42%', right: '6%', animationDelay: '1.0s' }} />
            <span className="sparkle-dot sparkle-blue" style={{ top: '52%', left: '20%', animationDelay: '1.3s' }} />
            <span className="sparkle-dot sparkle-pink" style={{ top: '58%', right: '18%', animationDelay: '1.6s' }} />
            <span className="sparkle-dot sparkle-yellow" style={{ bottom: '28%', left: '10%', animationDelay: '1.9s' }} />
            <span className="sparkle-dot sparkle-purple" style={{ bottom: '22%', right: '12%', animationDelay: '2.2s' }} />
            <span className="sparkle-dot sparkle-blue" style={{ bottom: '12%', left: '26%', animationDelay: '2.5s' }} />
            <span className="sparkle-dot sparkle-pink" style={{ bottom: '8%', right: '22%', animationDelay: '2.8s' }} />
            <span className="sparkle-dot sparkle-yellow" style={{ top: '26%', left: '36%', animationDelay: '3.1s' }} />
            <span className="sparkle-dot sparkle-purple" style={{ top: '14%', right: '34%', animationDelay: '3.4s' }} />
          </div>
        </div>
      </div>
      <div
        className="absolute z-10 women-text-sway"
        style={{
          top: womenTextTop,
          right: womenTextRight,
          transformOrigin: 'center',
        }}
      >
        <img
          src="/women-text.png"
          alt="Women Text"
          className="w-40 h-auto object-contain"
          style={{
            transform: `scale(${womenTextScale}) translateX(${womenTextTranslateX})`,
            transformOrigin: 'center',
          }}
        />
      </div>
      <div className="h-50" />
    </div>
  );
}
