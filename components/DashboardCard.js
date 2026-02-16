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
  const [clawState, setClawState] = useState('idle');

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
    
    setClawState('left');
    
    setTimeout(() => {
      setClawState('right');
    }, 120);
    
    setTimeout(() => {
      setClawState('tear');
    }, 240);
    
    setTimeout(() => {
      setClawState('idle');
      
      if (href) {
        window.location.href = href;
      } else if (onClick) {
        onClick(e);
      }
    }, 400);
  };

  const CardContent = () => (
    <div className={`
      relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
      ${colorClasses[color]} border-l-4 
      hover:shadow-md transition-shadow 
      ${href || onClick ? 'cursor-pointer' : ''}
      overflow-hidden
      ${clawState !== 'idle' ? 'scale-[0.98]' : ''}
      transition-all duration-200
    `}>
      
      {/* Cakaran Kiri */}
      {clawState === 'left' && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <svg className="absolute left-1/3 top-1/4 w-32 h-32" viewBox="0 0 100 100">
            <path 
              d="M30 20 L45 80 M40 20 L55 80 M50 20 L65 80" 
              stroke="#b91c1c" 
              strokeWidth="4" 
              strokeLinecap="round"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 2px rgba(185, 28, 28, 0.5))',
                animation: 'clawLeft 0.15s ease-out forwards'
              }}
            />
          </svg>
        </div>
      )}

      {/* Cakaran Kanan */}
      {clawState === 'right' && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <svg className="absolute right-1/3 top-1/4 w-32 h-32" viewBox="0 0 100 100">
            <path 
              d="M70 20 L55 80 M80 20 L65 80 M90 20 L75 80" 
              stroke="#7f1d1d" 
              strokeWidth="4" 
              strokeLinecap="round"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(127, 29, 29, 0.6))',
                animation: 'clawRight 0.15s ease-out forwards'
              }}
            />
          </svg>
        </div>
      )}

      {/* Efek Robekan */}
      {clawState === 'tear' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent top-1/2 animate-tear" />
          <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-red-400 to-transparent left-1/2 animate-tear" />
        </div>
      )}

      {/* Konten Utama (TANPA PERSENTASE) */}
      <div className={`transition-all duration-200 ${
        clawState !== 'idle' ? 'opacity-40 blur-[1px]' : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
            <div className="text-2xl">{icon}</div>
          </div>
          {/* PERSENTASE DIHAPUS! */}
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

      <style jsx>{`
        @keyframes clawLeft {
          0% { transform: translate(-20px, -20px) scale(0.5) rotate(-10deg); opacity: 0; }
          50% { transform: translate(0, 0) scale(1.1) rotate(-5deg); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
        }
        @keyframes clawRight {
          0% { transform: translate(20px, 20px) scale(0.5) rotate(10deg); opacity: 0; }
          50% { transform: translate(0, 0) scale(1.1) rotate(5deg); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0; }
        }
        @keyframes tear {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1.2); opacity: 0.8; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
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