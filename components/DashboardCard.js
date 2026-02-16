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
    }, 400);
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
          scale: isScratched ? [1, 0.97, 0.98, 1] : 1,
          rotate: isScratched ? [0, -0.5, 0.5, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* X Claw Marks */}
        {isScratched && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Slash kiri (\) */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M80 30 L320 170"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M100 30 L340 170"
                  stroke="#b91c1c"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </motion.div>

            {/* Slash kanan (/) */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <svg className="w-full h-full" viewBox="0 0 400 200">
                <path
                  d="M320 30 L80 170"
                  stroke="#dc2626"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M340 30 L100 170"
                  stroke="#b91c1c"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </motion.div>

            {/* Darah */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-red-600 rounded-full"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${40 + Math.random() * 30}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 0.8, 0],
                  y: [0, 15],
                }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}

        {/* Konten Card */}
        <motion.div
          animate={{
            opacity: isScratched ? [1, 0.5, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
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