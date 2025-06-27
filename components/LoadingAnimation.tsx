"use client";

import { motion } from "framer-motion";

export function LoadingAnimation() {
  return (
    <div className="relative w-full h-40 sm:h-56 flex items-center justify-center">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 rounded-lg overflow-hidden"
        animate={{
          background: [
            "linear-gradient(45deg, #3b82f6, #8b5cf6)",
            "linear-gradient(45deg, #8b5cf6, #ec4899)",
            "linear-gradient(45deg, #ec4899, #3b82f6)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-background/80 rounded-lg" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full"
              animate={{
                y: [-10, 0, -10],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        
        {/* Text */}
        <motion.p
          className="text-sm sm:text-base font-medium text-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Creating magic...
        </motion.p>
      </div>
    </div>
  );
}

export function MobileLoadingAnimation() {
  return (
    <div className="relative w-full p-8 flex items-center justify-center">
      {/* Spinning gradient ring */}
      <motion.div
        className="absolute w-24 h-24 sm:w-32 sm:h-32"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 blur-md opacity-75" />
        <div className="absolute inset-2 rounded-full bg-background" />
      </motion.div>
      
      {/* Center icon */}
      <motion.div
        className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-8 h-8 sm:w-10 sm:h-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          ✨
        </motion.div>
      </motion.div>
    </div>
  );
}