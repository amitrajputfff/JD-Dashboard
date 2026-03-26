/**
 * Demo messages for agent conversation flow
 * These are used as default values when fields are empty
 */

export const DEMO_MESSAGES = {
  initial: "Hello! Thank you for calling. I'm here to help you today. How can I assist you?",
  
  callEnd: "Thank you for calling! I hope I was able to help you today. Have a wonderful day and don't hesitate to reach out if you need anything else!",
  
  filler: [
    "Please hold on a moment",
    "Just a moment please", 
    "Let me think about that",
    "Give me a second",
    "I'm processing your request",
    "Hang on for a moment",
    "Let me work on that",
    "One moment while I process this",
    "I'm looking into that for you",
    "Just give me a moment to think"
  ]
} as const;

export type DemoMessageType = keyof typeof DEMO_MESSAGES;
