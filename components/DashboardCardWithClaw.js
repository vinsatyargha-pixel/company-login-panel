'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DashboardCardWithClaw({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  href = null
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
    }, 400);
  };

  return (
    <div onClick={handleClick} className="block relative cursor-pointer">
      <motion.div
        className={`
          relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
          ${colorClasses[color]} border-l-4 overflow-hidden
          hover:shadow-md transition-shadow
        `}
        animate={{
          scale: isScratched ? 0.97 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* X Merah Besar */}
        {isScratched && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-8xl font-bold text-red-600 rotate-45">X</div>
          </motion.div>
        )}

        {/* Konten */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
              <div className="text-2xl">{icon}</div>
            </div>
          </div>
          
          <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <p className="text-gray-500 text-sm mt-2">Updated just now</p>
        </div>
      </motion.div>
    </div>
  );
}