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
    }, 600);
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
        transition={{ duration: 0.5 }}
      >

        {/* REALISTIC CLAW X */}
        {isScratched && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">

            <svg className="w-full h-full" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">

              {/* TEXTURE FILTER */}
              <defs>
                <filter id="rough">
                  <feTurbulence type="fractalNoise" baseFrequency="0.18" numOctaves="2" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
                </filter>
              </defs>

              {/* SLASH 1 (\) with layered rough paths */}
              {[...Array(5)].map((_, i) => {
                const offset = i * 5;
                return (
                  <path
                    key={`slash-left-${i}`}
                    d={`M${60 + offset} 10 Q 200 120 ${340 + offset} 190`}
                    stroke="#7b1a1a"
                    strokeWidth={18 - i * 3}
                    strokeLinecap="round"
                    strokeDasharray={i % 2 === 0 ? "12 6" : "6 4"}
                    filter="url(#rough)"
                    opacity={0.7 - i * 0.1}
                    fill="none"
                  />
                );
              })}

              {/* SLASH 2 (/) with layered rough paths */}
              {[...Array(5)].map((_, i) => {
                const offset = i * 5;
                return (
                  <path
                    key={`slash-right-${i}`}
                    d={`M${340 - offset} 10 Q 200 120 ${60 - offset} 190`}
                    stroke="#7b1a1a"
                    strokeWidth={18 - i * 3}
                    strokeLinecap="round"
                    strokeDasharray={i % 2 === 0 ? "12 6" : "6 4"}
                    filter="url(#rough)"
                    opacity={0.7 - i * 0.1}
                    fill="none"
                  />
                );
              })}

            </svg>

            {/* BLOOD SPLASH CENTER */}
            {[...Array(14)].map((_, i) => (
              <motion.div
                key={`blood-drop-${i}`}
                className="absolute bg-red-900 rounded-full"
                style={{
                  width: `${6 + Math.random() * 9}px`,
                  height: `${6 + Math.random() * 9}px`,
                  left: `${43 + Math.random() * 14}%`,
                  top: `${37 + Math.random() * 14}%`,
                  filter: `drop-shadow(0 0 5px rgba(220,20,60,0.8))`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.3, 1, 0],
                  opacity: [0, 1, 0.6, 0],
                  y: [0, 15 + Math.random() * 20]
                }}
                transition={{ duration: 0.7, delay: i * 0.05 }}
              />
            ))}

            {/* BLOOD DRIP */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`blood-drip-${i}`}
                className="absolute w-[2.5px] bg-red-800 rounded-full"
                style={{
                  left: `${44 + i * 2}%`,
                  top: `42%`,
                  filter: `drop-shadow(0 0 4px rgba(139,0,0,0.7))`,
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: [0, 30 + Math.random() * 25],
                  opacity: [0, 1, 0]
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
