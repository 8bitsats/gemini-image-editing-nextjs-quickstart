"use client";

import { useState, useEffect, ReactNode, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

interface AnimatedRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  type?: "blur" | "slide" | "scale" | "rotate" | "fade";
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

export function AnimatedReveal({ 
  children, 
  delay = 0, 
  duration = 0.8,
  type = "blur",
  direction = "up",
  className = ""
}: AnimatedRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, delay, hasAnimated]);

  const getInitialState = () => {
    const baseState = { opacity: 0 };
    
    switch (type) {
      case "blur":
        return { ...baseState, filter: "blur(20px)", scale: 0.95 };
      case "slide":
        switch (direction) {
          case "up": return { ...baseState, y: 40 };
          case "down": return { ...baseState, y: -40 };
          case "left": return { ...baseState, x: 40 };
          case "right": return { ...baseState, x: -40 };
        }
      case "scale":
        return { ...baseState, scale: 0.8 };
      case "rotate":
        return { ...baseState, rotate: -10, scale: 0.9 };
      case "fade":
      default:
        return baseState;
    }
  };

  const getAnimateState = () => {
    const baseState = { opacity: 1 };
    
    switch (type) {
      case "blur":
        return { ...baseState, filter: "blur(0px)", scale: 1 };
      case "slide":
        return { ...baseState, x: 0, y: 0 };
      case "scale":
        return { ...baseState, scale: 1 };
      case "rotate":
        return { ...baseState, rotate: 0, scale: 1 };
      case "fade":
      default:
        return baseState;
    }
  };

  return (
    <div ref={ref} className={className}>
      <AnimatePresence>
        <motion.div
          initial={getInitialState()}
          animate={hasAnimated ? getAnimateState() : getInitialState()}
          transition={{ 
            duration,
            ease: [0.16, 1, 0.3, 1],
            filter: { duration: duration * 1.2 }
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Stagger children animations
interface StaggerRevealProps {
  children: ReactNode[];
  delay?: number;
  staggerDelay?: number;
  type?: "blur" | "slide" | "scale" | "rotate" | "fade";
  className?: string;
}

export function StaggerReveal({ 
  children, 
  delay = 0, 
  staggerDelay = 0.1,
  type = "blur",
  className = ""
}: StaggerRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedReveal
          key={index}
          delay={delay + (index * staggerDelay)}
          type={type}
        >
          {child}
        </AnimatedReveal>
      ))}
    </div>
  );
}