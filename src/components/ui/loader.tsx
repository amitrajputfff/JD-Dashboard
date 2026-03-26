import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function Loader({ 
  size = 'md', 
  className,
  text = 'Loading...',
  showText = true 
}: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className={cn(sizeMap[size], "flex items-center justify-center mx-auto")}>
        <DotLottieReact
          src="https://lottie.host/8a67cfb0-46de-40f5-85bf-d7fe42510f84/Muil2xxstb.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {showText && text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  );
}

// Compact inline loader for buttons and inline use
export function InlineLoader({ 
  size = 'sm',
  className 
}: Omit<LoaderProps, 'text' | 'showText'>) {
  return (
    <div className={cn(sizeMap[size], "flex items-center justify-center flex-shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/8a67cfb0-46de-40f5-85bf-d7fe42510f84/Muil2xxstb.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// Full page loader
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Loader size="lg" text={text || 'Loading...'} />
    </div>
  );
}

// Centered loader for sections
export function SectionLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Loader size="md" text={text || 'Loading...'} />
    </div>
  );
}
