'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DashboardCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  href = null,
  onClick = null
}) {
  const [clawState, setClawState] = useState('idle'); // idle, scratching, torn

  const colorClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500'
  };

  const iconBgClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  const handleClick = (e) => {
    e.preventDefault();
    
    setClawState('scratching');
    
    // Animasi 3 tahap: kiri, kanan, kiri lagi
    setTimeout(() => setClawState('torn'), 350);
    
    setTimeout(() => {
      setClawState('idle');
      if (href) window.location.href = href;
      else if (onClick) onClick(e);
    }, 600);
  };

  const ClawMarks = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
      
      {/* Layer 1 - Cakaran kiri (muncul pertama) */}
      <g className={clawState === 'scratching' ? 'animate-claw-left' : 'opacity-0'}>
        {/* 3 garis cakaran kiri dengan variasi */}
        <path d="M120 40 Q 100 80, 130 120" stroke="#991b1b" strokeWidth="5" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        <path d="M140 30 Q 115 85, 145 125" stroke="#b91c1c" strokeWidth="6" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        <path d="M160 45 Q 130 95, 155 135" stroke="#7f1d1d" strokeWidth="4" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        
        {/* Serpihan kecil */}
        <circle cx="135" cy="95" r="3" fill="#b91c1c" className="animate-particle" />
        <circle cx="145" cy="105" r="2" fill="#991b1b" className="animate-particle" />
      </g>

      {/* Layer 2 - Cakaran kanan (muncul kedua) */}
      <g className={clawState === 'scratching' ? 'animate-claw-right' : 'opacity-0'}>
        <path d="M260 40 Q 290 70, 270 120" stroke="#991b1b" strokeWidth="6" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        <path d="M280 35 Q 310 80, 285 125" stroke="#b91c1c" strokeWidth="5" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        <path d="M240 50 Q 275 90, 250 130" stroke="#7f1d1d" strokeWidth="7" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        
        <circle cx="275" cy="90" r="4" fill="#b91c1c" className="animate-particle" />
        <circle cx="255" cy="110" r="2.5" fill="#991b1b" className="animate-particle" />
      </g>

      {/* Layer 3 - Cakaran kiri lagi (numpuk) */}
      <g className={clawState === 'torn' ? 'animate-claw-left-late' : 'opacity-0'}>
        <path d="M100 50 Q 70 100, 110 140" stroke="#7f1d1d" strokeWidth="5" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
        <path d="M180 60 Q 150 105, 190 145" stroke="#991b1b" strokeWidth="6" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" />
      </g>

      {/* Efek sobekan di background */}
      {clawState === 'torn' && (
        <g>
          <path d="M0 100 L400 100" stroke="#ef4444" strokeWidth="2" strokeDasharray="10 10" opacity="0.4" />
          <path d="M200 0 L200 200" stroke="#ef4444" strokeWidth="2" strokeDasharray="10 10" opacity="0.4" />
        </g>
      )}

      {/* Filter untuk tekstur kasar */}
      <defs>
        <filter id="clawTexture" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence baseFrequency="0.05" numOctaves="2" result="turbulence" />
          <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="2" />
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
    </svg>
  );

  const CardContent = () => (
    <div className={`
      relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
      ${colorClasses[color]} border-l-4 
      hover:shadow-md transition-shadow 
      ${href || onClick ? 'cursor-pointer' : ''}
      overflow-hidden
      ${clawState !== 'idle' ? 'scale-[0.97]' : ''}
      transition-all duration-200
    `}>
      
      {/* Claw Marks Container */}
      <div className="absolute inset-0 z-20">
        <ClawMarks />
      </div>

      {/* Efek getaran saat dicakar */}
      <style jsx>{`
        .animate-claw-left {
          animation: scratchLeft 0.2s ease-out forwards;
        }
        .animate-claw-right {
          animation: scratchRight 0.2s ease-out 0.15s forwards;
        }
        .animate-claw-left-late {
          animation: scratchLeftLate 0.2s ease-out 0.35s forwards;
        }
        .animate-particle {
          animation: particle 0.4s ease-out forwards;
        }

        @keyframes scratchLeft {
          0% { transform: translate(-30px, -20px) scale(0.3) rotate(-15deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(-5deg); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.6; }
        }

        @keyframes scratchRight {
          0% { transform: translate(30px, 20px) scale(0.3) rotate(15deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(5deg); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.6; }
        }

        @keyframes scratchLeftLate {
          0% { transform: translate(-20px, 10px) scale(0.4) rotate(-10deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(-3deg); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.5; }
        }

        @keyframes particle {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px); opacity: 0; }
        }
      `}</style>

      {/* Konten Utama */}
      <div className={`relative z-10 transition-all duration-200 ${
        clawState !== 'idle' ? 'opacity-30 blur-[2px]' : 'opacity-100'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
            <div className="text-2xl">{icon}</div>
          </div>
        </div>
        
        <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-gray-500 text-sm mt-2">Updated just now</p>
        
        {(href || onClick) && (
          <div className="absolute bottom-4 right-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className="block">
        <CardContent />
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={handleClick} className="block">
        <CardContent />
      </div>
    );
  }

  return <CardContent />;
}