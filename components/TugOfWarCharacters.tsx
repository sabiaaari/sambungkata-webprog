import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * TugOfWarCharacters Component
 * 
 * A standalone, minimalist 2D block-style tug-of-war visual.
 * 
 * @param {number} ropePosition - Range 0 to 100, where 50 is center.
 */
const TugOfWarCharacters = ({ ropePosition = 50 }) => {
  // Calculate relative displacement from center (50)
  const displacement = (ropePosition - 50) * 4; 
  
  const controls = useAnimation();
  const prevRopePos = useRef(ropePosition);

  useEffect(() => {
    if (prevRopePos.current !== ropePosition) {
      // Trigger brief jolt/shake animation when position changes
      controls.start({
        x: [0, -10, 10, -5, 5, 0],
        transition: { duration: 0.4 }
      });
      prevRopePos.current = ropePosition;
    }
  }, [ropePosition, controls]);

  return (
    <div className="h-full w-full flex items-center justify-center p-4 overflow-hidden relative">
      {/* Main Arena Container */}
      <div className="w-full max-w-4xl h-80 md:h-96 flex items-center justify-between relative px-16">
        
        {/* Vertical Balance Line */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-32 bg-slate-300 z-0" />

        {/* ROPE SYSTEM - Moves based on ropePosition */}
        <motion.div 
          animate={{ x: displacement }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute inset-x-16 top-[54%] -translate-y-1/2 h-4 bg-orange-500 rounded-full flex items-center justify-center z-10"
        >
          {/* Yellow Center Block Indicator */}
          <div className="w-6 h-10 bg-yellow-400 rounded-md shadow-md border-2 border-yellow-500" />
        </motion.div>

        {/* CHARACTER LEFT: UNGU (Team Emerald) */}
        <motion.div 
          animate={{ x: displacement }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute left-16 top-1/2 flex flex-col items-center -translate-y-1/2"
        >
          <motion.div animate={controls} className="flex flex-col items-center origin-bottom rotate-[-10deg]">
            {/* Hair Blok */}
            <div className="w-12 h-4 bg-amber-900 rounded-t-md" />
            {/* Headband */}
            <div className="w-14 h-3 bg-white relative overflow-hidden border-x border-slate-200">
               <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600" />
            </div>
            {/* Head */}
            <div className="w-12 h-10 bg-orange-200" />
            {/* Body */}
            <div className="w-16 h-20 bg-purple-600 rounded-sm relative z-0">
              {/* Arms Reaching Rope */}
              <div className="absolute -right-8 top-10 w-12 h-5 bg-purple-700 rounded-full rotate-[5deg] z-20 border-2 border-purple-900/20" />
            </div>
            {/* Legs */}
            <div className="flex gap-4 -mt-1">
               <div className="w-6 h-8 bg-slate-400 rounded-b-md" />
               <div className="w-6 h-10 bg-slate-400 rounded-b-md" />
            </div>
          </motion.div>
        </motion.div>

        {/* CHARACTER RIGHT: MERAH (Team Amber) */}
        <motion.div 
          animate={{ x: displacement }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute right-16 top-1/2 flex flex-col items-center -translate-y-1/2"
        >
          <motion.div animate={controls} className="flex flex-col items-center origin-bottom scale-x-[-1] rotate-[-10deg]">
            {/* Hair Blok */}
            <div className="w-12 h-4 bg-amber-900 rounded-t-md" />
            {/* Headband */}
            <div className="w-14 h-3 bg-white relative overflow-hidden border-x border-slate-200">
               <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600" />
            </div>
            {/* Head */}
            <div className="w-12 h-10 bg-orange-200" />
            {/* Body */}
            <div className="w-16 h-20 bg-red-600 rounded-sm relative z-0">
              {/* Arms Reaching Rope */}
              <div className="absolute -right-8 top-10 w-12 h-5 bg-red-700 rounded-full rotate-[5deg] z-20 border-2 border-red-900/20" />
            </div>
            {/* Legs */}
            <div className="flex gap-4 -mt-1">
               <div className="w-6 h-10 bg-slate-400 rounded-b-md" />
               <div className="w-6 h-8 bg-slate-400 rounded-b-md" />
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};

export default TugOfWarCharacters;
