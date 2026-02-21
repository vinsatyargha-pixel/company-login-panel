'use client';

export default function SpinningX({ size = 16, color = 'text-[#FFD700]', className = '' }) {
  return (
    <div className={`inline-block ${className}`}>
      <style jsx>{`
        @keyframes spinThreeTimes {
          0% {
            transform: rotate(0deg);
          }
          60% {
            transform: rotate(1080deg); /* 3 putaran dalam 60% waktu */
          }
          100% {
            transform: rotate(1080deg); /* diam di 3 putaran */
          }
        }
        .spin-custom {
          animation: spinThreeTimes 3s ease-in-out infinite;
        }
      `}</style>
      
      <svg 
        className={`w-${size} h-${size} ${color} spin-custom`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        strokeWidth="3" /* <-- DIBIKIN BOLD (sebelumnya 2) */
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M6 18L18 6M6 6l12 12" 
        />
      </svg>
    </div>
  );
}