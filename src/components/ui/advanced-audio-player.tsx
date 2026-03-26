'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyEvent {
  timestamp: number;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AdvancedAudioPlayerProps {
  src: string;
  duration?: number;
  keyEvents?: KeyEvent[];
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export function AdvancedAudioPlayer({
  src,
  duration: providedDuration,
  keyEvents = [],
  onTimeUpdate,
  className,
}: AdvancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(providedDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Format time helper
  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [isDragging, onTimeUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipBackward();
          break;
        case 'arrowright':
          e.preventDefault();
          skipForward();
          break;
        case 'j':
          e.preventDefault();
          skipBackward(10);
          break;
        case 'l':
          e.preventDefault();
          skipForward(10);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isMuted]);

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

  const skipForward = (seconds: number = 5) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + seconds, duration);
  };

  const skipBackward = (seconds: number = 5) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - seconds, 0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleProgressClick(e);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `recording-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventMarkerColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 border-red-600 hover:bg-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600 hover:bg-orange-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 border-green-600 hover:bg-green-600';
      default:
        return 'bg-blue-500 border-blue-600 hover:bg-blue-600';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('w-full', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Compact Player Layout */}
      <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
        {/* Play/Pause Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                disabled={isLoading}
                className="h-10 w-10 rounded-full shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Play/Pause (Space)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Skip backward */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipBackward()}
                disabled={isLoading}
                className="h-8 w-8 shrink-0"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back 5s (←)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Skip forward */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skipForward()}
                disabled={isLoading}
                className="h-8 w-8 shrink-0"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Forward 5s (→)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Time display - Start */}
        <span className="text-sm font-mono text-muted-foreground shrink-0 min-w-[45px]">
          {formatTime(currentTime)}
        </span>

        {/* Progress Bar with Key Events - Takes remaining space */}
        <div className="flex-1 min-w-0">
          <div
            ref={progressRef}
            className="relative w-full bg-muted rounded-full h-2 cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={handleProgressDrag}
            onMouseLeave={() => setIsDragging(false)}
          >
            {/* Background progress bar */}
            <div className="absolute inset-0 bg-muted rounded-full" />
            
            {/* Filled progress */}
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
            
            {/* Progress handle - shows on hover */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-background rounded-full shadow-md transition-all duration-150 ease-out opacity-0 group-hover:opacity-100"
              style={{ left: `calc(${progress}% - 6px)` }}
            />

            {/* Key event markers */}
            {keyEvents.map((event, index) => {
              const markerPosition = (event.timestamp / duration) * 100;
              return (
                <HoverCard key={index} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background cursor-pointer transform -translate-x-1/2 z-10 hover:scale-150 transition-all duration-200 shadow-sm',
                        getEventMarkerColor(event.severity)
                      )}
                      style={{ left: `${markerPosition}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const audio = audioRef.current;
                        if (audio) {
                          audio.currentTime = event.timestamp;
                        }
                      }}
                      aria-label={`Jump to ${event.title}`}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full capitalize font-medium shrink-0',
                          getSeverityBadgeColor(event.severity)
                        )}>
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{event.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Time:</span>
                          <Kbd>{formatTime(event.timestamp)}</Kbd>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                        💡 Click the marker to jump to this moment
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>

        {/* Time display - End */}
        <span className="text-sm font-mono text-muted-foreground shrink-0 min-w-[45px]">
          {formatTime(duration)}
        </span>

        {/* Volume control with Popover */}
        <Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : volume < 0.5 ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Volume (M to mute)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8 shrink-0"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.01}
                  className="w-32"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Press <Kbd>M</Kbd> to mute/unmute
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Playback speed */}
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0">
                    <span className="font-mono text-xs">{playbackRate}x</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Playback Speed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
              <DropdownMenuItem
                key={rate}
                onClick={() => handlePlaybackRateChange(rate)}
                className={cn(
                  'font-mono text-sm',
                  playbackRate === rate && 'bg-accent'
                )}
              >
                {rate}x {rate === 1 && '(Normal)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Download */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Key Events List */}
      {keyEvents.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Key Events</h4>
          <div className="flex flex-wrap gap-2">
            {keyEvents.map((event, index) => (
              <button
                key={index}
                onClick={() => {
                  const audio = audioRef.current;
                  if (audio) {
                    audio.currentTime = event.timestamp;
                  }
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:scale-105 cursor-pointer',
                  getSeverityBadgeColor(event.severity)
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  getEventMarkerColor(event.severity).split(' ')[0]
                )} />
                <span className="font-semibold">{event.title}</span>
                <Kbd>{formatTime(event.timestamp)}</Kbd>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts - Always visible */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>💡 Keyboard shortcuts:</span>
        <KbdGroup>
          <Kbd>Space</Kbd>
          <span className="text-muted-foreground">Play/Pause</span>
        </KbdGroup>
        <span className="text-muted-foreground">•</span>
        <KbdGroup>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          <span className="text-muted-foreground">Skip</span>
        </KbdGroup>
        <span className="text-muted-foreground">•</span>
        <KbdGroup>
          <Kbd>M</Kbd>
          <span className="text-muted-foreground">Mute</span>
        </KbdGroup>
      </div>
    </div>
  );
}

