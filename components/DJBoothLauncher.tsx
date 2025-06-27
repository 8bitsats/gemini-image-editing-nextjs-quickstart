"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Disc3, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DJBooth } from "./DJBooth";

export function DJBoothLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-2xl shadow-purple-500/50 border-2 border-white/20"
        >
          <div className="flex flex-col items-center">
            <Disc3 className="w-6 h-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
            <Music className="w-3 h-3 text-white/80 -mt-1" />
          </div>
        </Button>
      </motion.div>

      {/* DJ Booth Modal */}
      <DJBooth isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}