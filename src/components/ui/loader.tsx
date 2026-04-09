import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

function SpinnerCircle({ size, className }: { size: keyof typeof sizeMap; className?: string }) {
  return (
    <div
      className={cn(
        sizeMap[size],
        'rounded-full border-2 border-muted border-t-primary animate-spin',
        className,
      )}
    />
  );
}

export function Loader({
  size = 'md',
  className,
  text = 'Loading...',
  showText = true,
}: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <SpinnerCircle size={size} />
      {showText && text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  );
}

// Compact inline loader for buttons and inline use
export function InlineLoader({
  size = 'sm',
  className,
}: Omit<LoaderProps, 'text' | 'showText'>) {
  return <SpinnerCircle size={size} className={cn('flex-shrink-0', className)} />;
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
