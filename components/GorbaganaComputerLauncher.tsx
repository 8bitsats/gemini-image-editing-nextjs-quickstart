"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GorbaganaComputer } from "./GorbaganaComputer";

export function GorbaganaComputerLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 left-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/50 border-2 border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex flex-col items-center relative z-10">
            <Monitor className="w-6 h-6 text-white mb-1" />
            <Sparkles className="w-3 h-3 text-white/80 -mt-1" />
          </div>
        </Button>
      </motion.div>

      {/* Gorbagana Computer Modal */}
      <GorbaganaComputer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}