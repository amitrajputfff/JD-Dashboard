"use client";
import { LogoCloud } from '@/components/logo-cloud'

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

export const TestimonialCardStack = ({
  items,
}: {
  items: Card[];
}) => {
  // Use the Metalbook testimonial (RP Singh - id: 6)
  const testimonial = items.find(item => item.id === 6) || items[0];

  return (
    <div className="flex flex-col items-center justify-center gap-12 px-2 py-8 w-full max-w-xl mx-auto">
      {/* Testimonial Card - Square with better styling */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-white/30 w-full max-w-sm aspect-square flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          {/* Quote Icon */}
          <div className="text-neutral-300">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M10 8c-3.3 0-6 2.7-6 6v8h8v-8h-4c0-2.2 1.8-4 4-4V8zm12 0c-3.3 0-6 2.7-6 6v8h8v-8h-4c0-2.2 1.8-4 4-4V8z"/>
            </svg>
          </div>
          
          {/* Testimonial Content */}
          <p className="text-neutral-800 text-sm md:text-base leading-relaxed font-medium flex-grow">
            {testimonial.content}
          </p>
        </div>
        
        {/* Author Info */}
        <div className="flex flex-col gap-1 pt-4 border-t-2 border-neutral-200/60">
          <p className="text-neutral-900 font-bold text-base">
            {testimonial.name}
          </p>
          <p className="text-neutral-600 text-sm font-medium">
            {testimonial.designation}
          </p>
        </div>
      </div>
      <div className="max-w-xl mx-auto flex flex-col justify-between gap-4">
      <p className="text-center text-md font-medium tracking-wider text-white">
          TRUSTED BY
        </p>
      {/* Trusted By Section */}
      <LogoCloud />
      </div>
    </div>
  );
};
