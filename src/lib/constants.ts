// Configuration constants
// Commented out unused function
// function getRuntimeServerUrl(): string | undefined {
//   if (typeof window === 'undefined') return undefined;
//   try {
//     const urlParams = new URLSearchParams(window.location.search);
//     const fromQuery = urlParams.get('serverUrl') || urlParams.get('server_url');
//     if (fromQuery && fromQuery.trim()) return fromQuery.trim();
//   } catch {
//     // ignore
//   }
//   try {
//     const fromGlobal = (window as Record<string, unknown>).PipecatWidgetConfig?.serverUrl;
//     if (typeof fromGlobal === 'string' && fromGlobal.trim()) return fromGlobal.trim();
//   } catch {
//     // ignore
//   }
//   return undefined;
// }

// Get client parameter from URL
function getRuntimeClient(): string {
  if (typeof window === 'undefined') return 'justdial';

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromQuery = urlParams.get('client');
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    // ignore
  }

  return 'justdial'; // Default fallback
}

export const WIDGET_CONFIG = {
  SERVER_URL: "",
  CLIENT: getRuntimeClient(),
  BOT_MESSAGE_TIMEOUT: 1500, // Reduced for more responsive feel
  SIMILARITY_THRESHOLD: 0.8,
  HIGH_SIMILARITY_THRESHOLD: 0.7,
  MIN_SUBSTANTIAL_LENGTH: 20, // Reduced for faster message finalization
} as const;

// Animation durations
export const ANIMATIONS = {
  METALLIC_ROTATION_DURATION: 15,
  USER_AVATAR_ROTATION_DURATION: 20,
  LOADING_ROTATION_DURATION: 1,
  PULSE_DURATION: 1.5,
  SCALE_TRANSITION_DURATION: 0.2,
} as const;

// Gradients for metallic avatars
export const GRADIENTS = {
  BOT_AVATAR: "conic-gradient(from 180deg at 50% 50%, #e6d0ff, #6a0dad, #d9b3ff, #4b0082, #e6d0ff)",
  USER_AVATAR: "conic-gradient(from 180deg at 50% 50%, #a7d8f0, #0056b3, #e0f7fa, #0056b3, #a7d8f0)",
  HIGHLIGHT: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)",
  // Voice-specific gradients for variety
  VOICE_SILVER: "conic-gradient(from 180deg at 50% 50%, #c0c0c0, #e8e8e8, #a8a8a8, #d4d4d4, #c0c0c0)",
  VOICE_GOLD: "conic-gradient(from 180deg at 50% 50%, #ffd700, #ffed4e, #ffb300, #ffe135, #ffd700)",
  VOICE_ROSE_GOLD: "conic-gradient(from 180deg at 50% 50%, #e91e63, #f48fb1, #c2185b, #f06292, #e91e63)",
  VOICE_BLUE: "conic-gradient(from 180deg at 50% 50%, #2196f3, #64b5f6, #1976d2, #42a5f5, #2196f3)",
  VOICE_PURPLE: "conic-gradient(from 180deg at 50% 50%, #9c27b0, #ce93d8, #7b1fa2, #ba68c8, #9c27b0)",
  VOICE_GREEN: "conic-gradient(from 180deg at 50% 50%, #4caf50, #a5d6a7, #388e3c, #81c784, #4caf50)",
} as const;

// Box shadows for metallic effect
export const SHADOWS = {
  LARGE_METALLIC: "inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)",
  SMALL_METALLIC: "inset -1px -1px 3px rgba(255,255,255,0.3), inset 1px 1px 3px rgba(0,0,0,0.3)",
} as const;
