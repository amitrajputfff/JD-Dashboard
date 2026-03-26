'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle,  
  ChevronDown,
  Phone,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Send
} from 'lucide-react';
import { WebRTCConnection, WebRTCEventHandlers, WebRTCConfig } from '@/lib/webrtc-connection';
import { toast } from 'sonner';

interface FloatingWidgetPreviewProps {
  agent: Agent;
  widgetConfig: {
    mode: string;
    theme: string;
    baseBgColor: string;
    accentColor: string;
    ctaButtonColor: string;
    ctaButtonTextColor: string;
    borderRadius: string;
    size: string;
    position: string;
    title: string;
    startButtonText: string;
    endButtonText: string;
    chatFirstMessage: string;
    chatPlaceholder: string;
    voiceShowTranscript: boolean;
    consentRequired: boolean;
    consentTitle: string;
    consentContent: string;
    consentStorageKey: string;
    customImageUrl: string;
    helpTexts: string[];
    agentDisplayName: string;
    languageSelectorEnabled: boolean;
    languages: Array<{ name: string; assistantId: string }>;
  };
}

// Default theme avatar component (metallic rotating blob)
function MetallicAvatar({ size = 'large' }: { size?: 'small' | 'large' }) {
  const sizeClass = size === 'large' ? 'w-40 h-40' : 'w-6 h-6';
  
  return (
    <div
      className={`${sizeClass} rounded-full shadow-2xl relative overflow-hidden`}
      style={{
        background: "conic-gradient(from 180deg at 50% 50%, #e6d0ff, #6a0dad, #d9b3ff, #4b0082, #e6d0ff)",
        boxShadow: "inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)",
        animation: 'spin 15s linear infinite'
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)",
        }}
      />
    </div>
  );
}

// Volume slider popover component
function VolumeSliderPopover({ 
  volume, 
  onVolumeChange, 
  themeStyles, 
  isVisible, 
  onClose 
}: { 
  volume: number; 
  onVolumeChange: (volume: number) => void; 
  themeStyles: any; 
  isVisible: boolean; 
  onClose: () => void; 
}) {
  if (!isVisible) return null;

  return (
    <div 
      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 min-w-32 animate-in fade-in-0 slide-in-from-bottom-2"
      style={{
        background: themeStyles.messageBg,
        borderColor: themeStyles.borderColor,
        boxShadow: `0 10px 25px -5px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.borderColor}20`
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div 
          className="text-xs font-medium"
          style={{ color: themeStyles.textColor }}
        >
          Volume
        </div>
        <div className="flex items-center gap-2 w-full">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: themeStyles.textColor }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: themeStyles.borderColor,
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: themeStyles.textColor }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </div>
        <div 
          className="text-xs font-medium"
          style={{ color: themeStyles.textColor }}
        >
          {volume}%
        </div>
      </div>
    </div>
  );
}

// Collapsed widget component
function CollapsedWidget({ onExpand, config, position, themeStyles, sizeClasses, borderRadiusClasses }: { onExpand: () => void; config: any; position: any; themeStyles: any; sizeClasses: any; borderRadiusClasses: any }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [customImageError, setCustomImageError] = useState(false);
  
  // Reset image error state when config changes
  React.useEffect(() => {
    setCustomImageError(false);
  }, [config.customImageUrl]);
  
  const helpTexts = config.helpTexts || [
    "Ask Lia",
    "Talk to Lia",
    "Chat with Lia",
    "Need Help?",
    "Ask Anything",
    "Get Answers",
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % helpTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card 
      className={`relative ${borderRadiusClasses.collapsed} border-0 px-6 py-4 flex flex-col items-center gap-4 ${sizeClasses.collapsed}`}
      style={{ 
        background: `linear-gradient(135deg, ${themeStyles.gradientStart} 0%, ${themeStyles.gradientEnd} 100%)`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 25px 50px -12px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.borderColor}20, inset 0 1px 0 ${themeStyles.borderColor}30`,
        border: `1px solid ${themeStyles.borderColor}40`
      }}
    >
      {/* Icon + Rotating Text */}
      <div className="flex gap-3 w-full items-center">
        {config.customImageUrl ? (
          <div className="w-11 h-11 rounded-full shadow-2xl relative overflow-hidden flex-shrink-0">
            {!customImageError ? (
              <img
                src={config.customImageUrl}
                alt="Custom logo"
                className="w-full h-full object-cover"
                onError={() => setCustomImageError(true)}
                onLoad={() => setCustomImageError(false)}
              />
            ) : (
              <div 
                className="w-full h-full rounded-full" 
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, ${config.accentColor}33, ${config.accentColor}, ${config.accentColor}66, ${config.accentColor}99, ${config.accentColor}33)`,
                  boxShadow: 'inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)',
                  animation: 'spin 15s linear infinite'
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-11 h-11 rounded-full shadow-2xl relative overflow-hidden flex-shrink-0"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, ${config.accentColor}33, ${config.accentColor}, ${config.accentColor}66, ${config.accentColor}99, ${config.accentColor}33)`,
              boxShadow: "inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)",
              animation: 'spin 15s linear infinite'
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 60%)",
              }}
            />
          </div>
        )}
        <div className="font-semibold text-sm flex-1 leading-tight" style={{ color: themeStyles.textColor }}>
          <div className="overflow-hidden py-1">
            <div className="animate-fade-in">
              {helpTexts[currentTextIndex]}
            </div>
          </div>
        </div>
      </div>

      {/* Button */}
      <Button
        type="button"
        className="rounded-full px-6 py-2.5 h-auto text-xs font-medium w-full border-0 hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onExpand();
        }}
        style={{
          backgroundColor: config.ctaButtonColor || '#000000',
          color: config.ctaButtonTextColor || '#ffffff'
        }}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        {config.title}
      </Button>
    </Card>
  );
}

export function FloatingWidgetPreview({ agent, widgetConfig }: FloatingWidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot', text: string, isThinking?: boolean, isSpeaking?: boolean, timestamp?: number }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState(
    widgetConfig.languageSelectorEnabled && widgetConfig.languages.length > 0 
      ? widgetConfig.languages[0].assistantId 
      : agent.id.toString()
  );
  const [expandedImageError, setExpandedImageError] = useState(false);
  const [messageImageError, setMessageImageError] = useState(false);
  
  const webrtcRef = useRef<WebRTCConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const wasConnectedRef = useRef<boolean>(false);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesRef.current) {
      const element = messagesRef.current;
      
      // Debug logging (can be removed in production)
      console.log('Scrolling to bottom:', {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        messagesCount: messages.length,
        canScroll: element.scrollHeight > element.clientHeight
      });
      
      // Only scroll if there's actually scrollable content
      if (element.scrollHeight > element.clientHeight) {
        // Force immediate scroll
        element.scrollTop = element.scrollHeight;
        
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        });
        
        // Additional scroll attempts for reliability
        setTimeout(() => {
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, 10);
        
        // Another attempt after a longer delay
        setTimeout(() => {
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, 100);
        
        // Smooth scroll for better UX
        setTimeout(() => {
          if (element) {
            element.scrollTo({
              top: element.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 150);
      } else {
        console.log('No scrollable content - scrollHeight equals clientHeight');
      }
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    // Immediate scroll for better responsiveness
    scrollToBottom();
    
    // Additional scroll after DOM updates
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Also scroll when messages container is resized and when DOM changes
  useEffect(() => {
    const messagesContainer = messagesRef.current;
    if (messagesContainer) {
      const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
      });
      resizeObserver.observe(messagesContainer);
      
      // Use MutationObserver to detect when new messages are added
      const mutationObserver = new MutationObserver(() => {
        scrollToBottom();
      });
      mutationObserver.observe(messagesContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, []);

  // Force scroll to bottom when widget opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // Multiple scroll attempts when widget opens
      scrollToBottom();
      setTimeout(() => scrollToBottom(), 50);
      setTimeout(() => scrollToBottom(), 200);
    }
  }, [isOpen]);

  // Reset image error states when widget config changes
  useEffect(() => {
    setExpandedImageError(false);
    setMessageImageError(false);
  }, [widgetConfig.customImageUrl]);

  // Get actual widget dimensions based on configuration
  const getWidgetDimensions = () => {
    const sizeMap = {
      'small': {
        width: '18rem',
        height: '28rem',
        collapsedWidth: '14rem',
        collapsedHeight: '11rem'
      },
      'medium': {
        width: '20rem',
        height: '32rem',
        collapsedWidth: '15rem',
        collapsedHeight: '11rem'
      },
      'large': {
        width: '22rem',
        height: '34rem',
        collapsedWidth: '17rem',
        collapsedHeight: '12rem'
      },
      'full': {
        width: '26rem',
        height: '38rem',  // Increased for more space
        collapsedWidth: '20rem',
        collapsedHeight: '13rem'
      }
    };
    return sizeMap[widgetConfig.size as keyof typeof sizeMap] || sizeMap['full'];
  };

  // Notify parent iframe about widget state
  const notifyParent = (isOpen: boolean) => {
    if (window.parent && window.parent !== window) {
      const dims = getWidgetDimensions();
      window.parent.postMessage({
        type: 'lia-widget-state',
        isOpen,
        position: widgetConfig.position,
        borderRadius: widgetConfig.borderRadius,
        dimensions: {
          width: isOpen ? dims.width : dims.collapsedWidth,
          height: isOpen ? dims.height : dims.collapsedHeight,
          maxHeight: isOpen ? '80vh' : 'none',
          collapsedWidth: dims.collapsedWidth,
          collapsedHeight: dims.collapsedHeight,
        },
      }, '*');
    }
  };

  // Handle opening the widget
  const handleOpenWidget = () => {
    if (widgetConfig.consentRequired && !consentGiven) {
      setShowConsent(true);
      setIsOpen(true);
      notifyParent(true);
    } else {
      setIsOpen(true);
      notifyParent(true);
      // Add initial bot message for chat mode
      if (widgetConfig.mode === 'chat' && messages.length === 0) {
        setMessages([{ 
          type: 'bot', 
          text: widgetConfig.chatFirstMessage,
          timestamp: Date.now()
        }]);
        // Ensure scroll happens after initial message
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  };

  // Handle consent
  const handleConsent = (accepted: boolean) => {
    if (accepted) {
      setConsentGiven(true);
      setShowConsent(false);
      // Add initial bot message for chat mode
      if (widgetConfig.mode === 'chat' && messages.length === 0) {
        setMessages([{ 
          type: 'bot', 
          text: widgetConfig.chatFirstMessage,
          timestamp: Date.now()
        }]);
        // Ensure scroll happens after initial message
        setTimeout(() => scrollToBottom(), 100);
      }
    } else {
      setShowConsent(false);
      setIsOpen(false);
    }
  };

  // WebRTC event handlers
  const webrtcEventHandlers = React.useMemo<WebRTCEventHandlers>(() => ({
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        wasConnectedRef.current = true;
        setIsConnected(true);
        setIsConnecting(false);
        setIsDisconnected(false);
        // Only add connection message if no messages exist yet
        setMessages(prev => {
          if (prev.length === 0) {
            const newMessages = [{ 
              type: 'bot' as const, 
              text: 'Connected! Start speaking to interact with the AI agent.',
              timestamp: Date.now()
            }];
            // Trigger scroll after state update
            setTimeout(() => scrollToBottom(), 50);
            return newMessages;
          }
          return prev;
        });
      } else if (state === 'failed' || state === 'disconnected') {
        setIsConnected(false);
        setIsConnecting(false);
        
        // Only show disconnection message if we were previously connected
        if (wasConnectedRef.current) {
          setIsDisconnected(true);
          setMessages(prev => [...prev, { 
            type: 'bot' as const, 
            text: 'Call disconnected.',
            timestamp: Date.now()
          }]);
          setTimeout(() => scrollToBottom(), 50);
          wasConnectedRef.current = false;
        }
      }
    },
    onTrack: (stream) => {
      if (!audioRef.current) {
        audioRef.current = document.createElement('audio');
        audioRef.current.autoplay = true;
        // Let React handle the DOM insertion instead of direct manipulation
        // document.body.appendChild(audioRef.current);
      }
      audioRef.current.srcObject = stream;
    },
    onTranscript: (transcript) => {
      // If it's an assistant transcript, stop the speaking indicator and remove speaking message
      if (transcript.role === 'assistant') {
        setIsAssistantSpeaking(false);
        setMessages(prev => {
          // Remove any existing speaking indicator messages
          const filteredMessages = prev.filter(msg => !msg.isSpeaking);
          
          // Create a unique ID based on content and timestamp to prevent duplicates
          const messageId = `${transcript.role}-${transcript.text}-${Date.now()}`;
          
          // Check if this exact message already exists within the last 2 seconds
          const isDuplicate = filteredMessages.some(msg => 
            msg.type === 'bot' && 
            msg.text === transcript.text &&
            Math.abs(Date.now() - (msg as any).timestamp) < 2000 // Within 2 seconds
          );
          
          if (isDuplicate) {
            return filteredMessages; // Don't add duplicate
          }
          
          const newMessages = [...filteredMessages, { 
            type: 'bot' as const, 
            text: transcript.text,
            timestamp: Date.now() // Add timestamp for deduplication
          }];
          
          // Trigger scroll after state update
          setTimeout(() => scrollToBottom(), 100);
          
          return newMessages;
        });
      } else {
        // Handle user transcripts normally
        setMessages(prev => {
          // Create a unique ID based on content and timestamp to prevent duplicates
          const messageId = `${transcript.role}-${transcript.text}-${Date.now()}`;
          
          // Check if this exact message already exists within the last 2 seconds
          const isDuplicate = prev.some(msg => 
            msg.type === 'user' && 
            msg.text === transcript.text &&
            Math.abs(Date.now() - (msg as any).timestamp) < 2000 // Within 2 seconds
          );
          
          if (isDuplicate) {
            return prev; // Don't add duplicate
          }
          
          const newMessages = [...prev, { 
            type: 'user' as const, 
            text: transcript.text,
            timestamp: Date.now() // Add timestamp for deduplication
          }];
          
          // Trigger scroll after state update
          setTimeout(() => scrollToBottom(), 100);
          
          return newMessages;
        });
      }
    },
    onUserSpeaking: (speaking) => {
      // When user stops speaking, start assistant speaking indicator
      if (!speaking && isConnected) {
        setIsAssistantSpeaking(true);
        // Add a speaking indicator message
        setMessages(prev => {
          // Remove any existing speaking indicator
          const filteredMessages = prev.filter(msg => !msg.isSpeaking);
          const newMessages = [...filteredMessages, {
            type: 'bot' as const,
            text: `${widgetConfig.agentDisplayName || agent.name || 'Lia'} is speaking...`,
            isSpeaking: true,
            timestamp: Date.now()
          }];
          
          // Trigger scroll after state update
          setTimeout(() => scrollToBottom(), 100);
          
          return newMessages;
        });
        
        // Set a timeout to remove speaking indicator if no response comes
        const timeoutId = setTimeout(() => {
          setIsAssistantSpeaking(false);
          setMessages(prev => prev.filter(msg => !msg.isSpeaking));
        }, 10000); // 10 second timeout
        
        // Store timeout ID for cleanup
        return () => clearTimeout(timeoutId);
      }
    },
    onError: (error) => {
      console.error('WebRTC Error:', error);
      setMessages(prev => [...prev, { type: 'bot', text: `Error: ${error.message}` }]);
      handleEndCall();
    }
  }), []);

  // Initialize WebRTC connection
  const initializeWebRTC = React.useCallback(() => {
    if (!selectedAssistantId) {
      console.error('No assistant ID provided');
      return;
    }

    const config: WebRTCConfig = {
      serverUrl: '',
      assistantId: selectedAssistantId,
      turnHost: '13.204.190.15',
      turnUsername: 'botuser',
      turnPassword: 'supersecret'
    };

    webrtcRef.current = new WebRTCConnection(config, webrtcEventHandlers);
  }, [selectedAssistantId, webrtcEventHandlers]);

  // Listen for messages from parent window (embed.js)
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'lia-widget-close') {
        // Close the widget when parent sends message
        handleCloseWidget();
      }
    };

    window.addEventListener('message', handleParentMessage);

    return () => {
      window.removeEventListener('message', handleParentMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click outside to close widget and volume popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        handleCloseWidget();
      }
      if (showVolumePopover) {
        setShowVolumePopover(false);
      }
    };

    if (isOpen || showVolumePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showVolumePopover]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.endCall();
      }
      
      if (audioRef.current) {
        audioRef.current.srcObject = null;
        // Let React handle the DOM cleanup instead of direct manipulation
        audioRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    
    // Add user message with timestamp
    setMessages(prev => [...prev, { 
      type: 'user', 
      text: userMessage,
      timestamp: Date.now()
    }]);
    
    // Add thinking message with proper agent name
    const thinkingMessage = { 
      type: 'bot' as const, 
      text: `${widgetConfig.agentDisplayName || agent.name || 'Lia'} is thinking...`, 
      isThinking: true,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, thinkingMessage]);
    
    // Ensure scroll happens after user message
    setTimeout(() => scrollToBottom(), 10);
    
    // Convert messages to chat history format for core service
    // Filter out thinking and speaking messages, only include actual conversation
    const chatHistory = messages
      .filter(msg => !msg.isThinking && !msg.isSpeaking)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        message: msg.text,
        timestamp: new Date(msg.timestamp || Date.now()).toISOString()
      }));
    
    // Debug: Log what we're sending
    console.log('Sending to widget chat API:', {
      message: userMessage,
      chatHistory: chatHistory,
      chatHistoryLength: chatHistory.length
    });

    // Send message to chat endpoint
    try {
      const response = await fetch(`/api/widget/${selectedAssistantId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: chatHistory // Send properly formatted chat history
        })
      });
      
      // Remove thinking message and add bot response
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isThinking);
          return [...filteredMessages, { 
            type: 'bot', 
            text: data.response || data.message || 'Sorry, I could not process your message.',
            timestamp: Date.now()
          }];
        });
        // Ensure scroll happens after bot response
        setTimeout(() => scrollToBottom(), 10);
      } else {
        setMessages(prev => {
          const filteredMessages = prev.filter(msg => !msg.isThinking);
          return [...filteredMessages, { 
            type: 'bot', 
            text: 'Sorry, there was an error processing your message. Please try again.',
            timestamp: Date.now()
          }];
        });
        // Ensure scroll happens after error message
        setTimeout(() => scrollToBottom(), 10);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove thinking message and add error message
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => !msg.isThinking);
        return [...filteredMessages, { 
          type: 'bot', 
          text: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: Date.now()
        }];
      });
      // Ensure scroll happens after error message
      setTimeout(() => scrollToBottom(), 10);
    }
  };

  const handleStartCall = async () => {
    if (!webrtcRef.current) {
      initializeWebRTC();
    }

    if (webrtcRef.current) {
      try {
        setIsConnecting(true);
        setIsDisconnected(false);
        await webrtcRef.current.startCall();
      } catch (error) {
        console.error('Failed to start call:', error);
        setIsConnecting(false);
      }
    }
  };

  const handleEndCall = async () => {
    if (webrtcRef.current) {
      await webrtcRef.current.endCall();
      webrtcRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      // Let React handle the DOM cleanup instead of direct manipulation
      audioRef.current = null;
    }
    wasConnectedRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setIsDisconnected(false);
    setIsMuted(false);
    setIsAssistantSpeaking(false);
    setVolume(100);
    setMessages([]);
  };

  const handleCloseWidget = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Cleanup WebRTC
    if (webrtcRef.current) {
      await webrtcRef.current.endCall();
      webrtcRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      // Let React handle the DOM cleanup instead of direct manipulation
      audioRef.current = null;
    }
    
    wasConnectedRef.current = false;
    setIsOpen(false);
    setIsConnected(false);
    setIsConnecting(false);
    setIsDisconnected(false);
    setIsMuted(false);
    setIsAssistantSpeaking(false);
    setVolume(100);
    setMessages([]);
    setShowConsent(false);
    
    // Notify parent
    notifyParent(false);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (webrtcRef.current) {
      webrtcRef.current.setMuted(newMutedState);
    }
  };

  const toggleVolumePopover = () => {
    setShowVolumePopover(!showVolumePopover);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    
    // Update audio element volume
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume / 100;
      audioRef.current.muted = clampedVolume === 0;
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) {
      // Muted icon
      return (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="1" x2="1" y2="23"/>
        </svg>
      );
    } else if (volume < 50) {
      // Low volume icon
      return (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        </svg>
      );
    } else {
      // High volume icon
      return (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      );
    }
  };

  const getPosition = () => {
    // Check if we're in an iframe - if so, no padding needed (iframe handles it)
    const isInIframe = window.self !== window.top;
    
    // Detect mobile screen size
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // Adjust padding based on device type
    let padding = '1rem';
    if (isInIframe) {
      padding = '0';
    } else if (isSmallMobile) {
      padding = '0.5rem';
    } else if (isMobile) {
      padding = '0.75rem';
    }
    
    const positionMap = {
      'bottom-right': { bottom: padding, right: padding },
      'bottom-left': { bottom: padding, left: padding },
      'top-right': { top: padding, right: padding },
      'top-left': { top: padding, left: padding }
    };
    return positionMap[widgetConfig.position as keyof typeof positionMap] || positionMap['bottom-right'];
  };

  const getSizeClasses = () => {
    const sizeMap = {
      'small': {
        main: 'w-[18rem] h-[28rem] max-sm:w-[calc(100vw-1rem)] max-sm:h-60vh',
        collapsed: 'w-[14rem] max-sm:w-[16rem]'
      },
      'medium': {
        main: 'w-[20rem] h-[32rem] max-sm:w-[calc(100vw-1rem)] max-sm:h-60vh',
        collapsed: 'w-[15rem] max-sm:w-[18rem]'
      },
      'large': {
        main: 'w-[22rem] h-[34rem] max-sm:w-[calc(100vw-1rem)] max-sm:h-60vh',
        collapsed: 'w-[17rem] max-sm:w-[20rem]'
      },
      'full': {
        main: 'w-[26rem] h-[36rem] max-sm:w-[calc(100vw-1rem)] max-sm:h-60vh',
        collapsed: 'w-[20rem] max-sm:w-[21rem]'
      }
    };
    return sizeMap[widgetConfig.size as keyof typeof sizeMap] || sizeMap['large'];
  };

  const getBorderRadiusClasses = () => {
    const borderRadiusMap = {
      'none': {
        main: 'rounded-none',
        collapsed: 'rounded-none'
      },
      'small': {
        main: 'rounded-lg',
        collapsed: 'rounded-lg'
      },
      'medium': {
        main: 'rounded-xl',
        collapsed: 'rounded-xl'
      },
      'large': {
        main: 'rounded-2xl',
        collapsed: 'rounded-2xl'
      }
    };
    return borderRadiusMap[widgetConfig.borderRadius as keyof typeof borderRadiusMap] || borderRadiusMap['large'];
  };

  const getThemeStyles = () => {
    const isDark = widgetConfig.theme === 'dark' || 
      (widgetConfig.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      return {
        backgroundColor: '#0f172a', // Deeper, richer dark background
        textColor: '#f8fafc', // Brighter text for better contrast
        borderColor: '#334155', // Softer border color
        inputBg: '#1e293b', // Slightly lighter input background
        inputBorder: '#475569', // Better contrast for input borders
        messageBg: '#1e293b', // Consistent message background
        userMessageBg: '#334155', // Distinct user message color
        botMessageBg: '#0f172a', // Bot messages match main background
        closeButtonBg: '#1e293b', // Consistent with input background
        closeButtonBorder: '#475569', // Better border contrast
        shadowColor: 'rgba(0, 0, 0, 0.4)', // Enhanced shadow for depth
        accentGlow: `${widgetConfig.accentColor}20`, // Subtle accent glow
        gradientStart: '#0f172a',
        gradientEnd: '#1e293b'
      };
    } else {
      return {
        backgroundColor: widgetConfig.baseBgColor || '#ffffff',
        textColor: '#111827',
        borderColor: '#e5e7eb',
        inputBg: '#f9fafb',
        inputBorder: '#e5e7eb',
        messageBg: '#ffffff',
        userMessageBg: '#e5e7eb',
        botMessageBg: '#ffffff',
        closeButtonBg: '#ffffff',
        closeButtonBorder: '#e5e7eb',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        accentGlow: `${widgetConfig.accentColor}10`,
        gradientStart: '#ffffff',
        gradientEnd: '#f9fafb'
      };
    }
  };

  const position = getPosition();
  const sizeClasses = getSizeClasses();
  const borderRadiusClasses = getBorderRadiusClasses();
  const themeStyles = getThemeStyles();
  const isVoiceMode = widgetConfig.mode === 'voice';
  const isChatMode = widgetConfig.mode === 'chat';
  const isBothMode = widgetConfig.mode === 'both';
  

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
        
        /* Volume slider styling */
        .slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        .slider::-webkit-slider-track {
          background: #e5e7eb;
          height: 0.25rem;
          border-radius: 0.125rem;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: #9333ea;
          height: 1rem;
          width: 1rem;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-track {
          background: #e5e7eb;
          height: 0.25rem;
          border-radius: 0.125rem;
          border: none;
        }

        .slider::-moz-range-thumb {
          background: #9333ea;
          height: 1rem;
          width: 1rem;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      <div className="fixed z-50" style={position}>
        {isOpen ? (
          <div className="relative" ref={widgetRef}>
            {/* Chevron button for top positions - appears above the card */}
            {(widgetConfig.position === 'top-left' || widgetConfig.position === 'top-right') && (
              <div 
                className="flex mb-2"
                style={{
                  justifyContent: widgetConfig.position === 'top-left' 
                    ? 'flex-start' 
                    : 'flex-end'
                }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseWidget}
                  className="h-12 w-12 rounded-full hover:scale-105 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${themeStyles.closeButtonBg} 0%, ${themeStyles.gradientEnd} 100%)`,
                    border: `1px solid ${themeStyles.closeButtonBorder}`,
                    boxShadow: `0 10px 25px -5px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.borderColor}20, inset 0 1px 0 ${themeStyles.borderColor}30`,
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: widgetConfig.ctaButtonColor,
                      color: widgetConfig.ctaButtonTextColor
                    }}
                  >
                    <ChevronDown className="h-4 w-4 stroke-[2.5] rotate-180" />
                  </div>
                </Button>
              </div>
            )}

            <Card 
              className={`${sizeClasses.main} ${borderRadiusClasses.main} border-0 overflow-hidden flex flex-col relative`}
              style={{ 
                background: `linear-gradient(135deg, ${themeStyles.gradientStart} 0%, ${themeStyles.gradientEnd} 100%)`,
                boxShadow: `0 25px 50px -12px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.borderColor}20, inset 0 1px 0 ${themeStyles.borderColor}30`,
                border: `1px solid ${themeStyles.borderColor}40`
              }}
            >
              {/* Language Selector - Top Right */}
              {widgetConfig.languageSelectorEnabled && widgetConfig.languages.length > 0 && !isConnected && messages.length === 0 && (
                <div 
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <select
                    value={selectedAssistantId}
                    onChange={(e) => {
                      e.stopPropagation();
                      const value = e.target.value;
                      // Find the language for this assistant ID
                      const selectedLanguage = widgetConfig.languages.find(lang => lang.assistantId === value);
                      if (selectedLanguage) {
                        setSelectedAssistantId(value);
                        toast.success(`Switched to ${selectedLanguage.name}`);
                        // Reset messages
                        setMessages([]);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    className="w-32 h-8 text-xs bg-white/90 border border-gray-200 rounded px-2 py-1 cursor-pointer"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {widgetConfig.languages.map((language) => (
                      <option key={language.assistantId} value={language.assistantId}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {showConsent ? (
                /* Consent Screen */
                <div className="flex-1 flex flex-col p-6 justify-center">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: themeStyles.textColor }}>
                      {widgetConfig.consentTitle}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: themeStyles.textColor, opacity: 0.8 }}>
                      {widgetConfig.consentContent}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="flex-1"
                      style={{ 
                        borderColor: themeStyles.borderColor,
                        color: themeStyles.textColor,
                        backgroundColor: 'transparent'
                      }}
                      onClick={() => handleConsent(false)}
                    >
                      Decline
                    </Button>
                    <Button
                      type="button"
                      size="default"
                      className="flex-1"
                      style={{
                        backgroundColor: widgetConfig.ctaButtonColor,
                        color: widgetConfig.ctaButtonTextColor
                      }}
                      onClick={() => handleConsent(true)}
                    >
                      Agree
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Call Interface */}
                  <CardContent className="flex-1 overflow-y-auto px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 flex flex-col">
                    {!isConnected && messages.length === 0 ? (
                      /* Initial State with Avatar */
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                        {/* Custom Image or Metallic Blob */}
                        <div className="relative flex flex-col items-center">
                          {widgetConfig.customImageUrl ? (
                            <div className="w-32 h-32 rounded-full shadow-2xl relative overflow-hidden">
                              {!expandedImageError ? (
                                <img
                                  src={widgetConfig.customImageUrl}
                                  alt="Custom logo"
                                  className="w-full h-full object-cover"
                                  onError={() => setExpandedImageError(true)}
                                  onLoad={() => setExpandedImageError(false)}
                                />
                              ) : (
                                <div 
                                  className="w-full h-full rounded-full" 
                                  style={{
                                    background: `conic-gradient(from 180deg at 50% 50%, ${widgetConfig.accentColor}33, ${widgetConfig.accentColor}, ${widgetConfig.accentColor}66, ${widgetConfig.accentColor}99, ${widgetConfig.accentColor}33)`,
                                    boxShadow: 'inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)',
                                    animation: 'spin 15s linear infinite'
                                  }}
                                >
                                  <div 
                                    className="absolute inset-0 rounded-full" 
                                    style={{
                                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className="w-32 h-32 rounded-full shadow-2xl relative overflow-hidden"
                              style={{
                                background: `conic-gradient(from 180deg at 50% 50%, ${widgetConfig.accentColor}33, ${widgetConfig.accentColor}, ${widgetConfig.accentColor}66, ${widgetConfig.accentColor}99, ${widgetConfig.accentColor}33)`,
                                boxShadow: "inset -8px -8px 20px rgba(255,255,255,0.3), inset 8px 8px 20px rgba(0,0,0,0.3)",
                                animation: 'spin 15s linear infinite'
                              }}
                            >
                              <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)",
                                }}
                              />
                            </div>
                          )}

                          {/* Call icon for voice mode or both mode */}
                          {(isVoiceMode || isBothMode) && (
                            <button
                              type="button"
                              onClick={handleStartCall}
                              disabled={isConnecting}
                              className="absolute bottom-0 translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                              style={{
                                backgroundColor: widgetConfig.ctaButtonColor,
                                color: widgetConfig.ctaButtonTextColor
                              }}
                            >
                              {isConnecting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Phone className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Conversation View */
                      <div className="flex-1 flex flex-col">
                        {/* Messages */}
                        <div 
                          ref={messagesRef} 
                          className="overflow-y-auto space-y-2 mb-4 scroll-smooth"
                          style={{ 
                            scrollBehavior: 'smooth',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
                            overscrollBehavior: 'contain',
                            WebkitOverflowScrolling: 'touch',
                            height: '360px',
                            maxHeight: '360px',
                            minHeight: '200px'
                          }}
                        >
                          {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className="flex-shrink-0 mt-1">
                                {msg.type === 'bot' && widgetConfig.customImageUrl ? (
                                  <div className="w-6 h-6 rounded-full shadow-2xl relative overflow-hidden">
                                    {!messageImageError ? (
                                      <img
                                        src={widgetConfig.customImageUrl}
                                        alt="Custom logo"
                                        className="w-full h-full object-cover"
                                        onError={() => setMessageImageError(true)}
                                        onLoad={() => setMessageImageError(false)}
                                      />
                                    ) : (
                                      <div 
                                        className="w-full h-full rounded-full" 
                                        style={{
                                          background: `conic-gradient(from 180deg at 50% 50%, ${widgetConfig.accentColor}33, ${widgetConfig.accentColor}, ${widgetConfig.accentColor}66, ${widgetConfig.accentColor}99, ${widgetConfig.accentColor}33)`,
                                          boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.3), inset 1px 1px 3px rgba(0,0,0,0.3)'
                                        }}
                                      >
                                        <div 
                                          className="absolute inset-0 rounded-full" 
                                          style={{
                                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full shadow-2xl relative overflow-hidden"
                                    style={{
                                      background: msg.type === 'user' 
                                        ? "conic-gradient(from 180deg at 50% 50%, #a7d8f0, #0056b3, #e0f7fa, #0056b3, #a7d8f0)"
                                        : `conic-gradient(from 180deg at 50% 50%, ${widgetConfig.accentColor}33, ${widgetConfig.accentColor}, ${widgetConfig.accentColor}66, ${widgetConfig.accentColor}99, ${widgetConfig.accentColor}33)`,
                                      boxShadow: "inset -1px -1px 3px rgba(255,255,255,0.3), inset 1px 1px 3px rgba(0,0,0,0.3)",
                                    }}
                                  >
                                    <div
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Message Content */}
                              <div className={`max-w-[75%] p-3 rounded-lg text-sm ${
                                msg.type === 'user' 
                                  ? 'rounded-tr-none' 
                                  : 'border rounded-tl-none'
                              }`}
                              style={{
                                backgroundColor: msg.type === 'user' ? themeStyles.userMessageBg : themeStyles.botMessageBg,
                                borderColor: themeStyles.borderColor,
                                color: themeStyles.textColor
                              }}>
                                <div className="text-xs mb-1" style={{ color: themeStyles.textColor, opacity: 0.6 }}>
                                  {msg.type === 'user' ? 'You' : 'Assistant'}
                                </div>
                                <div className="whitespace-pre-wrap break-words">
                                  {msg.text}
                                  {msg.isThinking && (
                                    <div className="inline-flex items-center gap-1 ml-2">
                                      <div className="w-2 h-2 rounded-full bg-current animate-bounce opacity-60" style={{ animationDelay: '0ms' }}></div>
                                      <div className="w-2 h-2 rounded-full bg-current animate-bounce opacity-60" style={{ animationDelay: '150ms' }}></div>
                                      <div className="w-2 h-2 rounded-full bg-current animate-bounce opacity-60" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                  )}
                                  {msg.isSpeaking && (
                                    <div className="inline-flex items-center gap-1 ml-2">
                                      <div className="w-2 h-2 rounded-full bg-current animate-pulse opacity-80" style={{ animationDelay: '0ms' }}></div>
                                      <div className="w-2 h-2 rounded-full bg-current animate-pulse opacity-80" style={{ animationDelay: '200ms' }}></div>
                                      <div className="w-2 h-2 rounded-full bg-current animate-pulse opacity-80" style={{ animationDelay: '400ms' }}></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Footer area */}
                  <CardFooter className="px-2 py-1 sm:px-3 sm:py-2 border-t border-gray-100">
                    {isConnected ? (
                      /* Call Controls */
                      <div className="w-full space-y-2">
                        <div className="flex gap-4 w-full justify-center">
                          {/* Mute */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-full"
                            onClick={toggleMute}
                          >
                            {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                          </Button>

                          {/* End Call */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full"
                            onClick={handleEndCall}
                          >
                            <PhoneOff className="h-8 w-8" />
                          </Button>

                          {/* Volume */}
                          <div className="relative">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-full"
                              onClick={toggleVolumePopover}
                            >
                              {getVolumeIcon()}
                            </Button>
                            <VolumeSliderPopover
                              volume={volume}
                              onVolumeChange={handleVolumeChange}
                              themeStyles={themeStyles}
                              isVisible={showVolumePopover}
                              onClose={() => setShowVolumePopover(false)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (isChatMode || isBothMode) ? (
                      /* Message Input for chat mode or both mode */
                      <div className="w-full">
                        <div className="relative flex w-full gap-2">
                          <Input
                            type="text"
                            placeholder={widgetConfig.chatPlaceholder}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendMessage();
                              }
                            }}
                            className="w-full pr-10 text-sm"
                            style={{
                              backgroundColor: themeStyles.inputBg,
                              borderColor: themeStyles.inputBorder,
                              color: themeStyles.textColor,
                              boxShadow: `inset 0 1px 3px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.inputBorder}`,
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          {message.trim() && (
                            <Button
                              type="button"
                              size="icon"
                              onClick={handleSendMessage}
                              style={{
                                backgroundColor: widgetConfig.ctaButtonColor,
                                color: widgetConfig.ctaButtonTextColor
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {isBothMode && !isConnected && messages.length > 0 && !isDisconnected && (
                          <div className="flex justify-center mt-2">
                            <button
                              type="button"
                              onClick={handleStartCall}
                              disabled={isConnecting}
                              className="text-xs text-gray-500 hover:text-black transition-colors"
                            >
                              {isConnecting ? 'Connecting...' : 'Switch to voice call'}
                            </button>
                          </div>
                        )}
                        {isDisconnected && (
                          <div className="flex justify-center mt-2">
                            <span className="text-xs text-red-500">
                              Call disconnected
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </CardFooter>
                </>
              )}
            </Card>

            {/* Chevron button for bottom positions - appears below the card */}
            {(widgetConfig.position === 'bottom-left' || widgetConfig.position === 'bottom-right') && (
              <div 
                className="flex mt-2"
                style={{
                  justifyContent: widgetConfig.position === 'bottom-left' 
                    ? 'flex-start' 
                    : 'flex-end'
                }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseWidget}
                  className="h-12 w-12 rounded-full hover:scale-105 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${themeStyles.closeButtonBg} 0%, ${themeStyles.gradientEnd} 100%)`,
                    border: `1px solid ${themeStyles.closeButtonBorder}`,
                    boxShadow: `0 10px 25px -5px ${themeStyles.shadowColor}, 0 0 0 1px ${themeStyles.borderColor}20, inset 0 1px 0 ${themeStyles.borderColor}30`,
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: widgetConfig.ctaButtonColor,
                      color: widgetConfig.ctaButtonTextColor
                    }}
                  >
                    <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                  </div>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <CollapsedWidget onExpand={handleOpenWidget} config={widgetConfig} position={position} themeStyles={themeStyles} sizeClasses={sizeClasses} borderRadiusClasses={borderRadiusClasses} />
        )}
      </div>
    </>
  );
}
