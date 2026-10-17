import React from 'react';

type ThemeTetProps = {
  enabled: boolean;
  tetBadgeSrc?: string | null;
  decorations?: React.ReactNode;
  children: React.ReactNode;
};

export default function ThemeTet({ enabled, tetBadgeSrc, decorations, children }: ThemeTetProps) {
  return (
    <div className="relative mb-4">
      {decorations}
      {/* Ảnh Mai trang trí (Chỉ hiện khi bật Theme Tết) */}
      {enabled && (
        <>
          {/* Cành mai bên phải (gốc) */}
          <img 
            src="/Mai.png" 
            className="absolute -top-5 -right-4 w-50 h-auto object-contain drop-shadow-sm z-0 opacity-95 pointer-events-none" 
            alt="Hoa Mai"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('Mai.png')) target.src = '/mai.png';
            }}
          />

          {/* Lồng đèn treo trên Mai (Mít chỉnh vị trí ở đây) */}
          <div 
            className="absolute z-10 w-10"
            style={{
              top: '40px',    // Mít tăng giảm số này để Lên/Xuống
              right: '99px',  // Mít tăng giảm số này để Qua Trái/Phải
              perspective: '800px' // Tạo chiều sâu 3D
            }}
          >
            <div className="relative w-full h-auto animate-spin-3d">
              {[0, 36, 72, 108, 144].map((deg, i) => (
                <img 
                  key={deg}
                  src="/lamp.png" 
                  alt="Lồng đèn"
                  className={`${i === 0 ? 'relative' : 'absolute top-0 left-0'} w-full h-auto object-contain drop-shadow-md`}
                  style={{ transform: `rotateY(${deg}deg)` }}
                />
              ))}
            </div>
          </div>

          {/* Lồng đèn thứ 2 (Bên trái) */}
          <div 
            className="absolute z-10 w-10"
            style={{
              top: '40px',
              left: '99px',
              perspective: '800px'
            }}
          >
            <div className="relative w-full h-auto animate-spin-3d">
              {[0, 36, 72, 108, 144].map((deg, i) => (
                <img 
                  key={deg}
                  src="/lamp.png" 
                  alt="Lồng đèn trái"
                  className={`${i === 0 ? 'relative' : 'absolute top-0 left-0'} w-full h-auto object-contain drop-shadow-md`}
                  style={{ transform: `rotateY(${deg}deg)` }}
                />
              ))}
            </div>
          </div>

          {/* Vòng tròn trang trí (Mít chỉnh vị trí ở đây) */}
          <div
            className="absolute z-0"
            style={{
              top: '60px',   // Mít tăng giảm số này để Lên/Xuống
              left: '50%',    // Giữ giữa
              transform: 'translateX(-50%)',
              width: '130px',
              height: '130px'
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(254, 202, 202, 0.95), rgba(253, 230, 138, 0.85) 55%, rgba(244, 114, 182, 0.55) 100%)',
                border: '2px solid rgba(244, 114, 182, 0.6)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.18), inset 0 8px 16px rgba(255,255,255,0.45), inset 0 -10px 20px rgba(244,114,182,0.25)'
              }}
            />
            <div
              className="absolute -inset-0.75 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, rgba(253, 230, 138, 0.0), rgba(253, 230, 138, 0.9), rgba(244, 114, 182, 0.0))',
                animation: 'tet-ring-rotate 6s linear infinite',
                filter: 'blur(2px)'
              }}
            />
            {tetBadgeSrc && (
              <img
                src={tetBadgeSrc}
                alt="Mùng Tết"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ transform: 'scale(0.7)' }} // Mít chỉnh scale ở đây
              />
            )}
          </div>

          {/* Cành mai bên trái (đối xứng) */}
          <img 
            src="/Mai.png" 
            className="absolute -top-5 -left-4 w-50 h-auto object-contain drop-shadow-sm z-0 opacity-95 pointer-events-none -scale-x-100" 
            alt="Hoa Mai đối xứng"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.includes('Mai.png')) target.src = '/mai.png';
            }}
          />
        </>
      )}

      <div className={`relative z-10 text-center ${enabled ? 'pt-47' : ''}`}>
        {children}
      </div>
    </div>
  );
}
