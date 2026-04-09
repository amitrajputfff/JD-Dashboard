'use client';

import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, BookOpen } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface LLMConfigSectionProps {
  control: any;
  watch: any;
  setValue: any;
  mode?: 'create' | 'edit';
  showHeader?: boolean;
  errors?: any;
  trainingStatus?: 'pending' | 'ready' | 'training' | 'failed';
  ragProcessingStatus?: 'processing' | 'completed' | 'failed';
}

export default function LLMConfigSection({
  control,
  setValue,
}: LLMConfigSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const useExamplePrompt = () => {
    const examplePrompt = `You are Tanya, a product qualification agent calling on behalf of Justdial. The customer recently searched for a product on Justdial. Your only job is to ask them a fixed set of qualification questions — one at a time, in order — so Justdial can connect them with the right sellers.

You are not a salesperson. You do not recommend, compare, or evaluate products. You do not answer anything outside this qualification task.

TONE
Speak like a warm, professional call center agent — natural, brief, and efficient. Not robotic, not overly formal.
Every response: 1 acknowledgement + 1 question. Maximum 15 words total.
Always end with a question mark.`;
    setValue('prompt', examplePrompt);
  };

  const generatePrompt = async () => {
    if (!generateInput.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/openai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase: generateInput }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }
      const data = await response.json();
      setValue('prompt', data.prompt);
      setGenerateInput('');
      setIsPopoverOpen(false);
      toast.success('Prompt generated successfully!', {
        description: 'Review and customize the prompt for your specific use case.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      const fallbackPrompt = `You are an AI agent specialized in ${generateInput}. Provide expert assistance while maintaining professional standards.

Core responsibilities:
- Provide accurate and up-to-date information
- Ask clarifying questions when needed
- Stay focused on the task at hand
- Be concise and conversational`;
      setValue('prompt', fallbackPrompt);
      setGenerateInput('');
      setIsPopoverOpen(false);
      toast.success('Basic prompt generated!', {
        description: 'Review and customize the prompt for your specific use case.',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <FormField
        control={control}
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">System Prompt</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useExamplePrompt}
                  className="h-8"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Use Example
                </Button>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generate Prompt
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Generate Custom Prompt</h4>
                        <p className="text-sm text-zinc-600 mt-1">
                          Describe what your agent should specialize in
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Textarea
                          placeholder="e.g., product qualification for AC enquiries, customer support for e-commerce..."
                          value={generateInput}
                          onChange={(e) => setGenerateInput(e.target.value)}
                          className="min-h-20 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={generatePrompt}
                            disabled={!generateInput.trim() || isGenerating}
                            size="sm"
                            className="flex-1"
                          >
                            {isGenerating ? (
                              <Spinner className="mr-1 w-3 h-3" />
                            ) : (
                              <Sparkles className="w-3 h-3 mr-1" />
                            )}
                            {isGenerating ? 'Generating...' : 'Generate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPopoverOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <FormControl>
              <Textarea
                placeholder="You are Tanya, a product qualification agent calling on behalf of Justdial..."
                className="min-h-[400px] font-mono text-sm resize-y"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Core instructions that define the agent&apos;s role, behavior, and conversation rules.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
