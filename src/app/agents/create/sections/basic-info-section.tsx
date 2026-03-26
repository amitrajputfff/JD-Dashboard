'use client';

import React from 'react';
import { FormSectionProps } from '@/types/assistant';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Tag, User, Wand2, Phone, MessageSquare, Info } from 'lucide-react';

const CATEGORIES = [
  { value: 'Customer Service', emoji: '🎧', recommended: true },
  { value: 'Sales', emoji: '📈', recommended: false },
  { value: 'Technical Support', emoji: '🔧', recommended: false },
  { value: 'Appointment Booking', emoji: '📅', recommended: false },
  { value: 'Information', emoji: 'ℹ️', recommended: false },
  { value: 'Other', emoji: '🤖', recommended: false },
];

const GREETING_TEMPLATES = [
  "Hello! Thank you for calling. How can I assist you today?",
  "Hi there! I'm your virtual assistant. What can I help you with?",
  "Welcome! I'm here to help. What brings you in today?",
];

const CALL_END_TEMPLATES = [
  "Thank you for calling! Have a wonderful day.",
  "It was a pleasure assisting you. Goodbye!",
  "Thanks for reaching out. Don't hesitate to call again!",
];

function FieldLabel({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium leading-none">{children}</span>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function BasicInfoSection({ control, watch, setValue }: FormSectionProps) {
  const watchedTags = watch('tags') || [];
  const [tagInput, setTagInput] = React.useState('');

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !watchedTags.includes(trimmed)) {
      setValue('tags', [...watchedTags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter((t: string) => t !== tagToRemove));
  };

  return (
    <div className="space-y-5">

      {/* ── Card 1: Identity ── */}
      <Card className="shadow-none">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            Identity
          </CardTitle>
          <CardDescription className="text-xs">Name, purpose, and category</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">

          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <FieldLabel tooltip="A short, descriptive name for your agent">
                    Agent Name <span className="text-red-500">*</span>
                  </FieldLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Priya – Customer Support"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <FieldLabel tooltip="Explain what this agent does and when it should be used">
                    Description <span className="text-red-500">*</span>
                  </FieldLabel>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Handles inbound customer support calls, resolves billing issues, and escalates complex queries..."
                    className="min-h-[100px] resize-none text-sm leading-relaxed"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category + Tags in a grid */}
          <div className="grid grid-cols-2 gap-5">
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <FieldLabel>Category</FieldLabel>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.emoji}</span>
                            <span>{cat.value}</span>
                            {cat.recommended && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                                Popular
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>
                    <FieldLabel tooltip="Add tags to organise and search agents">Tags</FieldLabel>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        className="pl-7 h-9 text-sm"
                        placeholder="Add tag + Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(tagInput);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tag chips */}
          {watchedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {watchedTags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 text-xs pl-2 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Card 2: Conversation Flow ── */}
      <Card className="shadow-none">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-primary" />
            </div>
            Conversation Flow
          </CardTitle>
          <CardDescription className="text-xs">
            What your agent says at the start and end of each call
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">

          {/* Greeting Message */}
          <FormField
            control={control}
            name="initial_message"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel className="mb-0">
                    <FieldLabel tooltip="The first thing your agent says when a call connects">
                      Greeting Message <span className="text-red-500">*</span>
                    </FieldLabel>
                  </FormLabel>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Templates:</span>
                    {GREETING_TEMPLATES.map((t, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => field.onChange(t)}
                            className="text-[10px] bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded transition-colors"
                          >
                            {i + 1}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-xs">
                          {t}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <FormControl>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
                    <Textarea
                      placeholder="Hello! Thank you for calling. How can I assist you today?"
                      className="min-h-[80px] resize-none text-sm pl-9"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Call End Message */}
          <FormField
            control={control}
            name="call_end_text"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel className="mb-0">
                    <FieldLabel tooltip="What your agent says before disconnecting the call">
                      Call End Message <span className="text-red-500">*</span>
                    </FieldLabel>
                  </FormLabel>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Templates:</span>
                    {CALL_END_TEMPLATES.map((t, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => field.onChange(t)}
                            className="text-[10px] bg-muted hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 rounded transition-colors"
                          >
                            {i + 1}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-xs">
                          {t}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
                    <Textarea
                      placeholder="Thank you for calling! Have a wonderful day."
                      className="min-h-[70px] resize-none text-sm pl-9"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
