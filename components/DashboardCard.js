'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
    }, 700);
  };

  // Path untuk cakaran yang lebih realistis (organic)
  const clawPaths = [
    // Cakaran kiri atas (tajam)
    "M60,40 Q80,60 70,100 Q60,140 90,160",
    "M80,30 Q100,50 95,90 Q90,130 120,150",
    "M40,50 Q65,70 55,110 Q45,150 75,170",
    
    // Cakaran kanan bawah (menyilang)
    "M300,40 Q280,80 310,120 Q330,150 290,170",
    "M320,30 Q300,70 330,110 Q350,140 310,160",
    "M280,50 Q260,90 290,130 Q310,160 270,180",
    
    // Cakaran tengah (X)
    "M150,30 Q170,80 130,130 Q110,160 160,180",
    "M230,30 Q210,80 250,130 Q270,160 220,180",
  ];

  return (
    <Link href={href} onClick={handleClick} className="block relative">
      <motion.div
        className={`
          relative bg-white p-6 rounded-xl shadow-sm border border-gray-200 
          ${colorClasses[color]} border-l-4 overflow-hidden
          hover:shadow-md transition-shadow cursor-pointer
        `}
        animate={{
          scale: isScratched ? [1, 0.98, 0.97, 0.98, 1] : 1,
          rotate: isScratched ? [0, -0.5, 0.5, -0.3, 0.3, 0] : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Efek darah blur background */}
        <AnimatePresence>
          {isScratched && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Blood splatter background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-600/10 to-transparent"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0, 0.5, 0],
                }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SVG Container untuk cakaran */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
        >
          <AnimatePresence>
            {isScratched && clawPaths.map((path, index) => (
              <motion.path
                key={index}
                d={path}
                stroke={index < 3 ? "#dc2626" : index < 6 ? "#b91c1c" : "#7f1d1d"}
                strokeWidth={[4, 5, 3, 6, 4, 5, 7, 5][index]}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0, 0.9, 0.6, 0.3, 0],
                  x: [0, -2, 2, -1, 1, 0],
                  y: [0, -1, 1, -2, 2, 0],
                }}
                transition={{
                  pathLength: { duration: 0.3, delay: index * 0.03 },
                  opacity: { duration: 0.6, delay: index * 0.03 },
                  x: { duration: 0.4, repeat: 2 },
                  y: { duration: 0.4, repeat: 2 },
                }}
                style={{
                  filter: "drop-shadow(0 0 2px rgba(185, 28, 28, 0.5))",
                }}
              />
            ))}
          </AnimatePresence>

          {/* Efek tetesan darah */}
          <AnimatePresence>
            {isScratched && [...Array(12)].map((_, i) => (
              <motion.circle
                key={`blood-${i}`}
                cx={50 + Math.random() * 300}
                cy={30 + Math.random() * 140}
                r={2 + Math.random() * 4}
                fill="#dc2626"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1, 0.5, 0],
                  opacity: [0, 0.8, 0.6, 0.3, 0],
                  y: [0, 10, 20, 30, 40],
                  x: [0, (Math.random() - 0.5) * 10],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.02,
                  ease: "easeOut"
                }}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* Efek robekan (tear lines) */}
        <AnimatePresence>
          {isScratched && (
            <>
              <motion.div
                className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-400/30 to-transparent top-1/2"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1.2, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
              <motion.div
                className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-red-400/30 to-transparent left-1/2"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: [0, 1.2, 1], opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.4, delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Konten Card (dengan efek tergores) */}
        <motion.div
          className="relative z-10"
          animate={{
            opacity: isScratched ? [1, 0.6, 0.8, 0.5, 1] : 1,
            filter: isScratched ? [
              "blur(0px)",
              "blur(2px)",
              "blur(1px)",
              "blur(3px)",
              "blur(0px)"
            ] : "blur(0px)",
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
          
          {(href || onClick) && (
            <div className="absolute bottom-4 right-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </motion.div>

        {/* Efek getaran tambahan */}
        <AnimatePresence>
          {isScratched && (
            <motion.div
              className="absolute inset-0 bg-red-500/5"
              animate={{
                opacity: [0, 0.2, 0.1, 0.3, 0],
              }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}