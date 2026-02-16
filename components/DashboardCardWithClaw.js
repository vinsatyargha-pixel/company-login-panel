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
    }, 500);
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
          scale: isScratched ? [1, 0.96, 0.98, 1] : 1,
          rotate: isScratched ? [0, -1, 1, 0] : 0,
          filter: isScratched 
            ? ["brightness(1)", "brightness(0.85)", "brightness(1)"] 
            : "brightness(1)"
        }}
        transition={{ duration: 0.4 }}
      >

        {/* 🔥 REALISTIC CLAW X */}
        {isScratched && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

            {/* Slash 1 (\) */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M70 20 L330 180"
                  stroke="#7f1d1d"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M80 20 L340 180"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M90 20 L350 180"
                  stroke="#fecaca"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </motion.div>

            {/* Slash 2 (/) */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M330 20 L70 180"
                  stroke="#7f1d1d"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M340 20 L80 180"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M350 20 L90 180"
                  stroke="#fecaca"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </motion.div>

            {/* Blood impact center */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-red-700 rounded-full"
                style={{
                  width: `${5 + Math.random() * 8}px`,
                  height: `${5 + Math.random() * 8}px`,
                  left: `${45 + Math.random() * 10}%`,
                  top: `${40 + Math.random() * 15}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.4, 0.8],
                  opacity: [0, 1, 0],
                  y: [0, 25 + Math.random() * 15],
                }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            ))}

            {/* Blood drips */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`drip-${i}`}
                className="absolute w-1 bg-red-800 rounded-full"
                style={{
                  left: `${47 + i * 2}%`,
                  top: `45%`,
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: [0, 30 + Math.random() * 25],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              />
            ))}

          </div>
        )}

        {/* Content */}
        <motion.div
          animate={{
            opacity: isScratched ? [1, 0.4, 1] : 1,
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
