'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InlineLoader } from '@/components/ui/loader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Wand2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { assistantsApi } from '@/lib/api/assistants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const aiCreatorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language_id: z.number().min(1, 'Please select a language'),
  prompt: z.string().min(20, 'Prompt must be at least 20 characters'),
});

type AICreatorFormData = z.infer<typeof aiCreatorSchema>;

interface AIAssistantCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Language {
  id: number;
  name: string;
  code: string;
}

export function AIAssistantCreatorDialog({ open, onOpenChange }: AIAssistantCreatorDialogProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdAssistantId, setCreatedAssistantId] = useState<string>('');
  const [createdAssistantName, setCreatedAssistantName] = useState<string>('');

  const form = useForm<AICreatorFormData>({
    resolver: zodResolver(aiCreatorSchema),
    defaultValues: {
      name: '',
      description: '',
      language_id: 0,
      prompt: 'You are a helpful AI assistant.',
    },
  });

  const { handleSubmit, formState: { errors, isValid }, watch } = form;
  
  // Watch field values for character counts
  const nameValue = watch('name') || '';
  const descriptionValue = watch('description') || '';
  const promptValue = watch('prompt') || '';

  // Fetch languages when dialog opens
  useEffect(() => {
    if (open) {
      const fetchLanguages = async () => {
        setIsLoadingLanguages(true);
        try {
          const response = await assistantsApi.getLanguages();
          setLanguages(response.languages);
          
          // Set default language to English if available, otherwise first language
          const englishLang = response.languages.find(lang => lang.code === 'en');
          const defaultLang = englishLang || response.languages[0];
          
          if (defaultLang) {
            form.setValue('language_id', defaultLang.id, { shouldValidate: true });
          }
        } catch (error) {
          console.error('Failed to fetch languages:', error);
          toast.error('Failed to load languages');
        } finally {
          setIsLoadingLanguages(false);
        }
      };
      
      fetchLanguages();
      
      // Reset form when dialog opens
      form.reset({
        name: '',
        description: '',
        language_id: 0,
        prompt: 'You are a helpful AI assistant.',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: AICreatorFormData) => {
    setIsCreating(true);
    
    try {
      const response = await assistantsApi.createAIAssistant({
        name: data.name,
        description: data.description,
        language_id: data.language_id,
        prompt: data.prompt,
      });

      if (response.success) {
        // Store created assistant details
        setCreatedAssistantId(response.assistant.assistant_id);
        setCreatedAssistantName(response.assistant.name);
        
        // Close the creation dialog
        onOpenChange(false);
        
        // Show success dialog
        setShowSuccessDialog(true);
      } else {
        toast.error('Failed to create assistant', {
          description: response.message || 'Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Error creating AI assistant:', error);
      toast.error('Failed to create assistant', {
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGoToAgent = () => {
    setShowSuccessDialog(false);
    router.push(`/agents/${createdAssistantId}`);
  };

  const handleViewAllAgents = () => {
    setShowSuccessDialog(false);
    router.push('/agents');
  };


        return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[600px] lg:!max-w-[700px] max-h-[90vh] flex flex-col">
          <div className="p-6 pb-4 border-b bg-muted/20 flex-shrink-0">
            <DialogHeader className="space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Create Assistant with AI</DialogTitle>
                  <DialogDescription className="mt-1">
                    Provide basic information and let AI configure the rest
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
                  name="name"
              render={({ field }) => (
                <FormItem>
                      <FormLabel>Assistant Name</FormLabel>
                  <FormControl>
                        <Input 
                          placeholder="e.g., Customer Support Assistant" 
                          {...field} 
                        />
                    </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Give your assistant a descriptive name</span>
                        <span className={`text-xs ${nameValue.length >= 2 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {nameValue.length}/2
                        </span>
                      </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what your assistant does (e.g., Handles customer inquiries, provides product information, and assists with support questions)"
                          className="min-h-[80px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Brief description of the assistant's purpose</span>
                        <span className={`text-xs ${descriptionValue.length >= 10 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {descriptionValue.length}/10
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value > 0 ? field.value.toString() : ""}
                        disabled={isLoadingLanguages}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingLanguages ? "Loading languages..." : "Select Language"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.id} value={lang.id.toString()}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Primary language for the assistant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="You are a helpful customer support assistant. You help customers with their inquiries and provide accurate information..."
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Instructions that define the assistant's behavior and personality</span>
                        <span className={`text-xs ${promptValue.length >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {promptValue.length}/20
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </form>
              </Form>
          </div>

          <div className="flex justify-end items-center p-6 pt-4 border-t flex-shrink-0 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid || isCreating || isLoadingLanguages}
            >
              {isCreating ? (
                <>
                  <InlineLoader size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  Create with AI
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="!max-w-[90vw] w-full sm:!max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              AI Assistant Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {createdAssistantName} has been created and saved as a draft.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">Action Required</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Your assistant is currently in <strong>Draft</strong> status. You need to complete the configuration and publish it before it can be used:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Configure voice and speech settings</li>
                  <li>Review and adjust LLM parameters</li>
                  <li>Set up advanced features if needed</li>
                  <li>Publish the assistant to make it active</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleViewAllAgents}
              className="flex-1"
            >
              View All Agents
              </Button>
            <Button 
              onClick={handleGoToAgent}
              className="flex-1"
            >
              Go to Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
