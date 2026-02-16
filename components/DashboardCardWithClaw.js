'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DashboardCardWithClaw({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  href = null,
  onClick = null
}) {
  const [isScratched, setIsScratched] = useState(false);

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
    setIsScratched(true);
    
    setTimeout(() => {
      setIsScratched(false);
      if (href) window.location.href = href;
      else if (onClick) onClick(e);
    }, 550);
  };

  return (
    <Link href={href || '#'} onClick={handleClick} className="block relative">
      <motion.div
        className={`
          relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
          ${colorClasses[color]} border-l-4 overflow-hidden
          hover:shadow-md transition-shadow cursor-pointer
        `}
        animate={{
          scale: isScratched ? [1, 0.94, 0.98, 1] : 1,
          rotate: isScratched ? [0, -1.2, 1.2, 0] : 0,
          filter: isScratched 
            ? ["brightness(1)", "brightness(0.75)", "brightness(1)"] 
            : "brightness(1)"
        }}
        transition={{ duration: 0.45 }}
      >

        {/* REALISTIC CLAW X */}
        {isScratched && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">

            <svg className="w-full h-full" viewBox="0 0 400 200">

              {/* TEXTURE FILTER */}
              <defs>
                <filter id="rough">
                  <feTurbulence type="turbulence" baseFrequency="0.9" numOctaves="2" result="noise"/>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="8"/>
                </filter>
              </defs>

              {/* ===== SLASH 1 (\) ===== */}
              {/* Deep shadow cut */}
              <path
                d="M60 10 Q200 120 340 190"
                stroke="#3f0d0d"
                strokeWidth="26"
                strokeLinecap="round"
                fill="none"
                filter="url(#rough)"
              />

              {/* Main torn flesh */}
              <path
                d="M70 10 Q210 120 350 190"
                stroke="#7f1d1d"
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              {/* Inner raw cut */}
              <path
                d="M80 10 Q220 120 360 190"
                stroke="#dc2626"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />

              {/* ===== SLASH 2 (/) ===== */}
              <path
                d="M340 10 Q200 120 60 190"
                stroke="#3f0d0d"
                strokeWidth="26"
                strokeLinecap="round"
                fill="none"
                filter="url(#rough)"
              />

              <path
                d="M350 10 Q210 120 70 190"
                stroke="#7f1d1d"
                strokeWidth="18"
                strokeLinecap="round"
                fill="none"
              />

              <path
                d="M360 10 Q220 120 80 190"
                stroke="#dc2626"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />

            </svg>

            {/* BLOOD SPLASH CENTER */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-red-800 rounded-full"
                style={{
                  width: `${6 + Math.random() * 10}px`,
                  height: `${6 + Math.random() * 10}px`,
                  left: `${46 + Math.random() * 8}%`,
                  top: `${38 + Math.random() * 12}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0.9],
                  opacity: [0, 1, 0],
                  y: [0, 35 + Math.random() * 20],
                }}
                transition={{ duration: 0.7, delay: i * 0.04 }}
              />
            ))}

            {/* BLOOD DRIP */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`drip-${i}`}
                className="absolute w-[3px] bg-red-900 rounded-full"
                style={{
                  left: `${48 + i * 2}%`,
                  top: `45%`,
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: [0, 40 + Math.random() * 30],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.08 }}
              />
            ))}

          </div>
        )}

        {/* CONTENT */}
        <motion.div
          animate={{
            opacity: isScratched ? [1, 0.3, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
          className="relative z-0"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
              <div className="text-2xl">{icon}</div>
            </div>
          </div>
          
          <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <p className="text-gray-500 text-sm mt-2">Updated just now</p>
        </motion.div>

      </motion.div>
    </Link>
  );
}
