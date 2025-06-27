"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedBlurRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  blurAmount?: number;
}

export function AnimatedBlurReveal({ 
  children, 
  delay = 0, 
  duration = 0.8,
  blurAmount = 20 
}: AnimatedBlurRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ 
          opacity: 0, 
          filter: `blur(${blurAmount}px)`,
          scale: 0.95,
          y: 20
        }}
        animate={isRevealed ? { 
          opacity: 1, 
          filter: "blur(0px)",
          scale: 1,
          y: 0
        } : {}}
        transition={{ 
          duration,
          ease: [0.16, 1, 0.3, 1], // Custom easing for smooth animation
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}