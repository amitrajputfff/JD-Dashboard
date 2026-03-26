"use client";

import { motion } from "framer-motion";
import { ANIMATIONS, GRADIENTS, SHADOWS } from "@/lib/constants";

interface MetallicAvatarProps {
  type: 'user' | 'bot' | 'voice';
  size: 'small' | 'large';
  className?: string;
  voiceLabel?: string; // For voice-specific gradients
}

export function MetallicAvatar({ type, size, className = "", voiceLabel }: MetallicAvatarProps) {
  const isLarge = size === 'large';
  const sizeClass = isLarge ? 'w-40 h-40' : 'w-6 h-6';
  
  // Get gradient based on type and voice
  let gradient: string = GRADIENTS.BOT_AVATAR;
  if (type === 'user') {
    gradient = GRADIENTS.USER_AVATAR;
  } else if (type === 'voice' && voiceLabel) {
    const voiceGradients = [
      GRADIENTS.VOICE_SILVER,
      GRADIENTS.VOICE_GOLD,
      GRADIENTS.VOICE_ROSE_GOLD,
      GRADIENTS.VOICE_BLUE,
      GRADIENTS.VOICE_PURPLE,
      GRADIENTS.VOICE_GREEN,
    ];
    const index = voiceLabel.length % voiceGradients.length;
    gradient = voiceGradients[index];
  }
  
  const boxShadow = isLarge ? SHADOWS.LARGE_METALLIC : SHADOWS.SMALL_METALLIC;
  const duration = type === 'user' ? ANIMATIONS.USER_AVATAR_ROTATION_DURATION : ANIMATIONS.METALLIC_ROTATION_DURATION;

  return (
    <motion.div
      className={`${sizeClass} rounded-full shadow-2xl relative overflow-hidden ${className}`}
      style={{
        background: gradient,
        boxShadow: boxShadow,
      }}
      animate={{ rotate: [0, 360] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: GRADIENTS.HIGHLIGHT,
        }}
      />
    </motion.div>
  );
}
