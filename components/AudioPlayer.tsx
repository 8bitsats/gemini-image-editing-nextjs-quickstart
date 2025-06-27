"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  audioUrl: string;
  onDownload?: () => void;
  className?: string;
}

export function AudioPlayer({ audioUrl, onDownload, className = "" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `gorbagana-audio-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-secondary/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 ${className}`}
    >
      <audio ref={audioRef} src={audioUrl} />
      
      <div className="space-y-4">
        {/* Waveform visualization (decorative) */}
        <div className="flex items-center justify-center h-16 sm:h-20 gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-primary/60 rounded-full w-1 sm:w-1.5"
              animate={{
                height: isPlaying ? [8, 32, 8] : 16,
              }}
              transition={{
                duration: 1.5,
                repeat: isPlaying ? Infinity : 0,
                delay: i * 0.1,
              }}
              style={{ height: 16 }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePlayPause}
              className="h-10 w-10 sm:h-12 sm:w-12"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
              )}
            </Button>

            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowVolume(!showVolume)}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {showVolume && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded-lg p-3 shadow-lg"
                >
                  <div className="h-24 w-8 flex flex-col items-center">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      orientation="vertical"
                      className="h-full"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}