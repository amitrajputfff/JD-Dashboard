"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  onComplete?: (value: string) => void
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className,
  onComplete,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return // Only allow digits

    const newValue = value.split('')
    newValue[index] = digit
    const updatedValue = newValue.join('')
    
    onChange(updatedValue)

    // Auto-focus next input if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (updatedValue.length === length && onComplete) {
      onComplete(updatedValue)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasteData)
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pasteData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleFocus = (index: number) => {
    // Select all text when focusing
    inputRefs.current[index]?.select()
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold rounded-md border border-input bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors",
            value[index] && "border-primary"
          )}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}
