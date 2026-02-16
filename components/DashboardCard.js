'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DashboardCard({ 
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
    <Link href={href} onClick={handleClick} className="block relative">
      <motion.div
        className={`
          relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
          ${colorClasses[color]} border-l-4 overflow-hidden
          hover:shadow-md transition-shadow cursor-pointer
        `}
        animate={{
          scale: isScratched ? [1, 0.97, 0.98, 0.96, 1] : 1,
          rotate: isScratched ? [0, -0.8, 0.8, -0.5, 0.5, 0] : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* X Claw Marks Animation */}
        {isScratched && (
          <div className="absolute inset-0 pointer-events-none">
            {/* First slash (kiri atas ke kanan bawah) */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.4 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M50 30 L350 170"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <path
                  d="M70 30 L370 170"
                  stroke="#b91c1c"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M30 30 L330 170"
                  stroke="#7f1d1d"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Second slash (kanan atas ke kiri bawah) - muncul sedikit lebih lambat */}
            <motion.div
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M350 30 L50 170"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <path
                  d="M370 30 L70 170"
                  stroke="#b91c1c"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M330 30 L30 170"
                  stroke="#7f1d1d"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Blood drops */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-red-600 rounded-full"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${40 + Math.random() * 40}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1, 0.5, 0],
                  opacity: [0, 0.8, 0.6, 0.3, 0],
                  y: [0, 20, 40],
                }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}

        {/* Konten Card */}
        <motion.div
          animate={{
            opacity: isScratched ? [1, 0.5, 0.7, 0.4, 1] : 1,
          }}
          transition={{ duration: 0.6 }}
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

        {/* Filter untuk efek glow */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
      </motion.div>
    </Link>
  );
}