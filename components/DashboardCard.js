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
    
    // Animasi bertahap
    setTimeout(() => setClawState('torn'), 350);
    
    setTimeout(() => {
      setClawState('idle');
      if (href) window.location.href = href;
      else if (onClick) onClick(e);
    }, 600);
  };

  const XClawMarks = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
      
      {/* BLOOD EFFECT (background merah) */}
      {clawState !== 'idle' && (
        <>
          {/* Efek darah di sekitar cakaran */}
          <radialGradient id="bloodGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#991b1b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
          <circle cx="200" cy="100" r="80" fill="url(#bloodGradient)" className="animate-blood" />
        </>
      )}

      {/* LAYER 1 - X Kiri (slash kiri) - muncul pertama */}
      <g className={clawState === 'scratching' ? 'animate-claw-left' : 'opacity-0'}>
        {/* 3 garis sejajar membentuk \ (slash kiri) */}
        <path d="M80 30 L180 170" stroke="#dc2626" strokeWidth="8" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.9" />
        <path d="M100 30 L200 170" stroke="#b91c1c" strokeWidth="10" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.8" />
        <path d="M120 30 L220 170" stroke="#7f1d1d" strokeWidth="6" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.7" />
        
        {/* Tetesan darah kecil */}
        <circle cx="150" cy="100" r="5" fill="#dc2626" className="animate-blood-drop" />
        <circle cx="180" cy="130" r="3" fill="#b91c1c" className="animate-blood-drop" />
      </g>

      {/* LAYER 2 - X Kanan (slash kanan) - muncul kedua */}
      <g className={clawState === 'scratching' ? 'animate-claw-right' : 'opacity-0'}>
        {/* 3 garis sejajar membentuk / (slash kanan) */}
        <path d="M280 30 L180 170" stroke="#dc2626" strokeWidth="8" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.9" />
        <path d="M260 30 L160 170" stroke="#b91c1c" strokeWidth="10" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.8" />
        <path d="M240 30 L140 170" stroke="#7f1d1d" strokeWidth="6" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.7" />
        
        <circle cx="220" cy="100" r="4" fill="#dc2626" className="animate-blood-drop" />
        <circle cx="190" cy="140" r="6" fill="#b91c1c" className="animate-blood-drop" />
      </g>

      {/* LAYER 3 - X Kiri Lagi (tumpuk lebih tebal) - muncul ketiga */}
      <g className={clawState === 'torn' ? 'animate-claw-left-late' : 'opacity-0'}>
        {/* Tambahan cakaran lebih tebal di kiri */}
        <path d="M70 40 L160 160" stroke="#7f1d1d" strokeWidth="12" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.6" />
        <path d="M140 30 L230 170" stroke="#991b1b" strokeWidth="9" fill="none" 
          strokeLinecap="round" filter="url(#clawTexture)" opacity="0.7" />
        
        {/* Efek percikan darah */}
        <circle cx="130" cy="95" r="8" fill="#dc2626" className="animate-blood-splash" />
        <circle cx="200" cy="120" r="6" fill="#b91c1c" className="animate-blood-splash" />
      </g>

      {/* Efek sobekan X di background */}
      {clawState === 'torn' && (
        <g opacity="0.3">
          <path d="M0 0 L400 200" stroke="#7f1d1d" strokeWidth="3" strokeDasharray="10 10" />
          <path d="M400 0 L0 200" stroke="#7f1d1d" strokeWidth="3" strokeDasharray="10 10" />
        </g>
      )}

      {/* Filter untuk tekstur kasar */}
      <defs>
        <filter id="clawTexture" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence baseFrequency="0.03" numOctaves="3" result="turbulence" />
          <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="3" />
          <feGaussianBlur stdDeviation="0.8" />
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
      ${clawState !== 'idle' ? 'scale-[0.96]' : ''}
      transition-all duration-200
    `}>
      
      {/* X Claw Marks Container */}
      <div className="absolute inset-0 z-20">
        <XClawMarks />
      </div>

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
        .animate-blood-drop {
          animation: bloodDrop 0.4s ease-out forwards;
        }
        .animate-blood-splash {
          animation: bloodSplash 0.5s ease-out forwards;
        }
        .animate-blood {
          animation: bloodPulse 0.6s ease-out forwards;
        }

        @keyframes scratchLeft {
          0% { transform: translate(-30px, -20px) scale(0.2) rotate(-5deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(-2deg); opacity: 1; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.7; }
        }

        @keyframes scratchRight {
          0% { transform: translate(30px, 20px) scale(0.2) rotate(5deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.7; }
        }

        @keyframes scratchLeftLate {
          0% { transform: translate(-20px, 10px) scale(0.3) rotate(-3deg); opacity: 0; }
          40% { transform: translate(0, 0) scale(1.1) rotate(-1deg); opacity: 1; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.6; }
        }

        @keyframes bloodDrop {
          0% { transform: scale(1) translate(0, 0); opacity: 1; }
          100% { transform: scale(0.5) translate(10px, 20px); opacity: 0; }
        }

        @keyframes bloodSplash {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }

        @keyframes bloodPulse {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>

      {/* Konten Utama */}
      <div className={`relative z-10 transition-all duration-200 ${
        clawState !== 'idle' ? 'opacity-20 blur-[3px]' : 'opacity-100'
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