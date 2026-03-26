"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TextareaWithSuggestionsProps extends React.ComponentProps<"textarea"> {
  onVariableSelect?: (variable: string) => void;
}

const VARIABLES = [
  { name: "{{today}}", description: "Current date" },
  { name: "{{caller_number}}", description: "Caller's phone number" }
];

function TextareaWithSuggestions({ className, onVariableSelect, ...props }: TextareaWithSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [suggestionTriggerPosition, setSuggestionTriggerPosition] = React.useState(0); // Position when {{ was typed
  const [suggestionPosition, setSuggestionPosition] = React.useState({ x: 0, y: 0 });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const popoverContentRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    
    // Update cursor position immediately
    setCursorPosition(position);
    
    // Check if user typed '{{' at current position or anywhere in the text
    const textBeforeCursor = value.substring(0, position);
    const lastTwoBraces = textBeforeCursor.slice(-2);
    
    if (lastTwoBraces === '{{') {
      // Store the position where {{ was typed
      setSuggestionTriggerPosition(position);
      
      // Simple positioning - just show below the textarea
      setSuggestionPosition({
        x: 0,
        y: 60 // Position below the textarea
      });
      
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    
    // Call original onChange if provided
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    const position = target.selectionStart || 0;
    
    // Update cursor position
    setCursorPosition(position);
    
    // Also handle input event for better real-time detection
    const textBeforeCursor = value.substring(0, position);
    const lastTwoBraces = textBeforeCursor.slice(-2);
    
    if (lastTwoBraces === '{{') {
      setSuggestionTriggerPosition(position);
      setSuggestionPosition({
        x: 0,
        y: 60
      });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Get current value fresh from the textarea
    const currentValue = textarea.value;
    
    // Find the last occurrence of {{ in the text
    const lastBraceIndex = currentValue.lastIndexOf('{{');
    if (lastBraceIndex === -1) return;
    
    const before = currentValue.substring(0, lastBraceIndex);
    const after = currentValue.substring(lastBraceIndex + 2); // Skip the {{
    const newValue = before + variable + after;
    
    // Update textarea directly
    textarea.value = newValue;
    
    // Create synthetic change event for React
    const changeEvent = {
      target: {
        ...textarea,
        value: newValue
      },
      currentTarget: textarea,
      type: 'change',
      preventDefault: () => {},
      stopPropagation: () => {}
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    if (props.onChange) {
      props.onChange(changeEvent);
    }
    
    // Set cursor position after the inserted variable
    const newCursorPosition = before.length + variable.length;
    
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 10);
    
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && (e.key === 'Escape')) {
      setShowSuggestions(false);
      e.preventDefault();
    }
    
    // Call original onKeyDown if provided
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Don't hide suggestions immediately to allow clicking on them
    setTimeout(() => {
      if (!popoverContentRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200); // Increased timeout to give more time for clicking
    
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        onChange={handleInputChange}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        {...props}
      />
      
      {showSuggestions && (
        <div 
          ref={popoverContentRef}
          className="absolute z-50 w-80 rounded-md border bg-white shadow-lg"
          style={{
            left: suggestionPosition.x,
            top: suggestionPosition.y,
          }}
        >
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">Variable Suggestions</div>
            {VARIABLES.map((variable) => (
              <div
                key={variable.name}
                className="flex flex-col p-2 hover:bg-gray-50 cursor-pointer rounded"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent losing focus
                  insertVariable(variable.name);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="font-mono text-sm text-blue-600">{variable.name}</div>
                <div className="text-xs text-gray-500">{variable.description}</div>
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-2 px-2 border-t pt-2">
              Type {"{{"} to see suggestions or press Esc to close
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
}

export { TextareaWithSuggestions }
