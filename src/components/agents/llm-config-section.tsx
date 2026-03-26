'use client';

import React, { useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormSectionProps } from '@/types/assistant';
import { Sparkles, BookOpen, Brain, FileText, ChevronsUpDown } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loader';
import { Spinner } from '@/components/ui/spinner';

// Import context and API functions conditionally
import { useCreateAgentContext } from '@/contexts/create-agent-context';
import { providersApi, llmModelsApi } from '@/lib/api/providers';
import { KnowledgeBaseAPI, type FileInfo } from '@/lib/api/knowledge-base';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface Provider {
  id: number;
  name: string;
  service_type: string;
  is_active: boolean;
}

interface LLMModel {
  id: number;
  model_name: string;
  provider_id: number;
  is_active: boolean;
}

interface ContextProvider {
  value: number;
  label: string;
  description?: string;
}

interface ContextModel {
  value: number;
  label: string;
  description?: string;
}

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
  watch, 
  setValue, 
  mode = 'create',
  showHeader = true,
  errors,
  trainingStatus,
  ragProcessingStatus
}: LLMConfigSectionProps) {
  const watchedLLMProviderId = watch('llm_provider_id');
  const watchedLLMModelId = watch('llm_model_id');
  const watchedTemperature = watch('temperature') || 0.7;

  // Knowledge Base state
  const knowledgeBaseEnabled = watch('has_knowledge_base') ?? false;
  const selectedDocumentIds = watch('documents_ids') || [];
  const [documents, setDocuments] = useState<FileInfo[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [openDocumentSelector, setOpenDocumentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for managing selections without triggering form updates
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>([]);
  
  // Ref to prevent infinite loops when syncing state
  const isUpdatingFromFormRef = useRef(false);
  
  // Context-based data (for create mode)
  const createContext = mode === 'create' ? useCreateAgentContext() : null;
  
  // Direct API state (for edit mode)
  const [llmProviders, setLlmProviders] = useState<Provider[]>([]);
  const [llmProvidersLoading, setLlmProvidersLoading] = useState(false);
  const [llmProvidersLoaded, setLlmProvidersLoaded] = useState(false);
  
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [llmModelsLoading, setLlmModelsLoading] = useState(false);
  const [llmModelsLoaded, setLlmModelsLoaded] = useState(false);
  
  const [isPreloading, setIsPreloading] = useState(false);

  // Refs for tracking previous values
  const prevLLMProviderIdRef = useRef(watchedLLMProviderId);

  // Knowledge Base functions
  const fetchDocuments = React.useCallback(async (search?: string) => {
    setIsLoadingDocuments(true);
    try {
      const response = await KnowledgeBaseAPI.getAllFiles({
        skip: 0,
        limit: 100,
        is_active: true,
        search: search || undefined,
      });
      setDocuments(response.files);
    } catch (error) {
      console.error('Failed to fetch knowledge base documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const toggleDocument = React.useCallback((documentId: number) => {
    const currentIds = selectedDocumentIds || [];
    const isSelected = currentIds.includes(documentId);

    if (isSelected) {
      setValue('documents_ids', currentIds.filter((id: number) => id !== documentId), { shouldValidate: false });
    } else {
      // Check if limit is reached (max 10 documents)
      if (currentIds.length >= 10) {
        toast.error('Maximum 10 documents can be attached to one assistant');
        return;
      }
      setValue('documents_ids', [...currentIds, documentId], { shouldValidate: false });
    }
  }, [selectedDocumentIds, setValue]);

  // Local toggle function that doesn't trigger form updates
  const toggleLocalDocument = React.useCallback((documentId: number) => {
    setLocalSelectedIds(prev => {
      const isSelected = prev.includes(documentId);
      if (isSelected) {
        return prev.filter(id => id !== documentId);
      } else {
        // Check if limit is reached (max 10 documents)
        if (prev.length >= 10) {
          toast.error('Maximum 10 documents can be attached to one assistant');
          return prev;
        }
        return [...prev, documentId];
      }
    });
  }, []);

  // Sync local selections to form when popover closes
  const handlePopoverClose = React.useCallback((open: boolean) => {
    setOpenDocumentSelector(open);
    if (!open) {
      // Popover is closing, sync local state to form
      isUpdatingFromFormRef.current = true;
      setValue('documents_ids', localSelectedIds, { shouldValidate: false });
    }
  }, [localSelectedIds, setValue]);

  const removeDocument = React.useCallback((documentId: number) => {
    const currentIds = selectedDocumentIds || [];
    setValue('documents_ids', currentIds.filter((id: number) => id !== documentId), { shouldValidate: false });
  }, [selectedDocumentIds, setValue]);

  const getDocumentById = React.useCallback((id: number): FileInfo | undefined =>
    documents.find(doc => doc.id === id), [documents]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Training status helper functions
  // Supports: 'pending', 'ready', 'training', 'failed'
  const getTrainingStatusConfig = (status?: string) => {
    switch (status) {
      case 'ready':
        return {
          icon: CheckCircle,
          label: 'Ready',
          description: 'Knowledge base is ready and trained',
          className: 'text-green-600 bg-green-50 border-green-200',
          iconClassName: 'text-green-600'
        };
      case 'training':
        return {
          icon: Loader2,
          label: 'Training',
          description: 'Knowledge base is being trained',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'text-blue-600 animate-spin'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          description: 'Training failed - please try again',
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: 'text-red-600'
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          label: 'Pending',
          description: 'Training is pending',
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          iconClassName: 'text-yellow-600'
        };
    }
  };

  // RAG processing status helper functions  
  // Supports: 'processing', 'completed', 'failed'
  const getRAGStatusConfig = (status?: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          description: 'RAG processing completed',
          className: 'text-green-600 bg-green-50 border-green-200',
          iconClassName: 'text-green-600'
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Processing',
          description: 'RAG processing in progress',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'text-blue-600 animate-spin'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          description: 'RAG processing failed',
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: 'text-red-600'
        };
      default:
        return null;
    }
  };

  // Sync local state with form state only on initial load
  React.useEffect(() => {
    if (!isUpdatingFromFormRef.current) {
      setLocalSelectedIds(selectedDocumentIds);
    }
  }, []); // Only run on mount


  // Load documents when knowledge base is enabled
  React.useEffect(() => {
    if (knowledgeBaseEnabled) {
      fetchDocuments();
    } else {
      setDocuments([]);
      // Clear selected documents when knowledge base is disabled
      if (selectedDocumentIds.length > 0) {
        setValue('documents_ids', null);
      }
    }
  }, [knowledgeBaseEnabled, fetchDocuments, selectedDocumentIds.length, setValue]);

  // Handle search with debounce
  React.useEffect(() => {
    if (!knowledgeBaseEnabled) return;

    const timer = setTimeout(() => {
      fetchDocuments(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, knowledgeBaseEnabled, fetchDocuments]);

  // Get data based on mode
  const getProviders = (): (Provider | ContextProvider)[] => {
    if (mode === 'create' && createContext) {
      return createContext.llmProviders || [];
    }
    return llmProviders;
  };

  const getModels = (): (LLMModel | ContextModel)[] => {
    if (mode === 'create' && createContext) {
      return createContext.llmModels || [];
    }
    return llmModels;
  };

  const getProvidersLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.llmProvidersLoading || false;
    }
    return llmProvidersLoading;
  };

  const getModelsLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.llmModelsLoading || false;
    }
    return llmModelsLoading;
  };

  // Lazy load providers only when dropdown is opened (edit mode only)
  const loadProviders = async () => {
    if (mode === 'create' || llmProvidersLoaded || llmProvidersLoading) return;
    
    setLlmProvidersLoading(true);
    try {
      // Explicitly request only active providers
      const response = await providersApi.getLLMProviders({ is_active: true });
      
      // Additional client-side filtering as backup
      const activeProviders = response.providers.filter(provider => provider.is_active === true);
      setLlmProviders(activeProviders);
      setLlmProvidersLoaded(true);
    } catch (error) {
      console.error('Error fetching LLM providers:', error);
    } finally {
      setLlmProvidersLoading(false);
    }
  };

  // Lazy load models only when provider is selected and dropdown is opened (edit mode only)
  const loadModels = async () => {
    if (mode === 'create' || !watchedLLMProviderId || llmModelsLoaded || llmModelsLoading) return;
    
    setLlmModelsLoading(true);
    try {
      const response = await llmModelsApi.getLLMModels({ provider_id: watchedLLMProviderId });
      setLlmModels(response.llm_models);
      setLlmModelsLoaded(true);
    } catch (error) {
      console.error('Error fetching LLM models:', error);
    } finally {
      setLlmModelsLoading(false);
    }
  };

  // Pre-load selected provider and model data on mount (edit mode only)
  React.useEffect(() => {
    if (mode === 'create') return;
    
    const preloadData = async () => {
      // Only preload if we have selected values and haven't loaded yet
      if ((watchedLLMProviderId && !llmProvidersLoaded) || 
          (watchedLLMModelId && watchedLLMProviderId && !llmModelsLoaded)) {
        
        setIsPreloading(true);
        try {
          // Pre-load provider data if we have a selected provider ID
          if (watchedLLMProviderId && !llmProvidersLoaded) {
            await loadProviders();
          }
          
          // Pre-load model data if we have a selected model ID
          if (watchedLLMModelId && watchedLLMProviderId && !llmModelsLoaded) {
            await loadModels();
          }
        } catch (error) {
          console.error('Failed to preload LLM data:', error);
        } finally {
          setIsPreloading(false);
        }
      }
    };

    preloadData();
  }, [watchedLLMProviderId, watchedLLMModelId, mode]);

  // Reset model selection when provider changes
  React.useEffect(() => {
    const prevProviderId = prevLLMProviderIdRef.current;
    
    if (prevProviderId !== undefined && 
        prevProviderId !== watchedLLMProviderId) {
      // Clear the model selection
      setValue('llm_model_id', undefined, { shouldValidate: false });
      
      // Reset models when provider changes (edit mode only)
      if (mode === 'edit') {
        setLlmModels([]);
        setLlmModelsLoaded(false);
      }
    }
    
    prevLLMProviderIdRef.current = watchedLLMProviderId;
  }, [watchedLLMProviderId, setValue, mode]);

  // Auto-select first model when models are loaded (client-side only)
  React.useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return;
    
    const models = getModels();
    const modelsLoading = getModelsLoading();
    
    if (!modelsLoading && models.length > 0 && watchedLLMProviderId) {
      const firstModelId = mode === 'create' 
        ? (models[0] as any).value 
        : (models[0] as any).id;
      
      if (firstModelId && (!watchedLLMModelId || !models.find(m => (mode === 'create' ? (m as any).value : (m as any).id) === watchedLLMModelId))) {
        setValue('llm_model_id', firstModelId, { shouldValidate: false });
      }
    }
  }, [watchedLLMProviderId, watchedLLMModelId, mode, setValue]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const useExamplePrompt = () => {
    const examplePrompt = `You are a professional AI agent for customer support. Your primary role is to help customers with their inquiries in a friendly, helpful, and efficient manner.

Key responsibilities:
- Provide accurate information about products and services
- Help resolve customer issues and complaints
- Guide customers through troubleshooting steps
- Escalate complex issues to human agents when necessary

Communication style:
- Be polite, empathetic, and professional
- Use clear, simple language
- Ask clarifying questions when needed
- Acknowledge customer concerns and frustrations

Important guidelines:
- Always verify customer information before providing account details
- Never make promises you cannot keep
- If unsure about something, escalate to a human agent
- Follow company policies and procedures at all times
- End conversations by asking if there's anything else you can help with

Remember: Your goal is to provide excellent customer service while maintaining a positive and helpful attitude.`;
    
    setValue('prompt', examplePrompt);
  };

  const generatePrompt = async () => {
    if (!generateInput.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/openai/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useCase: generateInput,
        }),
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
        description: 'You may need to review and customize specific details as AI cannot generate everything accurately for your specific use case.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Fallback to a basic prompt if API fails
      const fallbackPrompt = `You are an AI agent specialized in ${generateInput}. You have been designed to provide expert assistance in this domain while maintaining professional standards.

Core competencies:
- Deep understanding of ${generateInput} principles and best practices
- Ability to provide clear, actionable guidance
- Problem-solving capabilities specific to ${generateInput}
- Knowledge of industry standards and regulations

Interaction guidelines:
- Always provide accurate and up-to-date information
- Use domain-specific terminology appropriately
- Offer step-by-step guidance when applicable
- Suggest resources for further learning when relevant
- Acknowledge limitations and escalate when necessary

Your responses should be:
- Informative and educational
- Tailored to the user's level of expertise
- Structured and easy to follow
- Professional yet approachable

Remember to stay focused on ${generateInput} while being helpful and responsive to user needs.`;
      
      setValue('prompt', fallbackPrompt);
      setGenerateInput('');
      setIsPopoverOpen(false);
      
      toast.success('Basic prompt generated!', {
        description: 'You may need to review and customize specific details as AI cannot generate everything accurately for your specific use case.',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get display name for selected provider (edit mode)
  const getSelectedProviderName = () => {
    if (mode === 'create') return 'Select Provider';
    if (!watchedLLMProviderId) return 'Select Provider';
    if (isPreloading) return 'Loading...';
    const provider = llmProviders.find(p => (p as any).id === watchedLLMProviderId);
    return provider ? (provider as any).display_name : `Provider ${watchedLLMProviderId}`;
  };

  // Get display name for selected model (edit mode)
  const getSelectedModelName = () => {
    if (mode === 'create') return 'Select Model';
    if (!watchedLLMModelId) return 'Select Model';
    if (isPreloading) return 'Loading...';
    const model = llmModels.find(m => m.id === watchedLLMModelId);
    return model ? model.model_name : `Model ${watchedLLMModelId}`;
  };

  const providers = getProviders();
  const models = getModels();
  const providersLoading = getProvidersLoading();
  const modelsLoading = getModelsLoading();

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h3 className="text-lg font-medium">LLM Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Language model settings and behavior
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LLM Provider */}
        <FormField
          control={control}
          name="llm_provider_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">LLM Provider</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))} 
                value={field.value ? field.value.toString() : ''} 
                disabled={providersLoading}
                onOpenChange={(open) => open && mode === 'edit' && loadProviders()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      mode === 'create'
                        ? (providersLoading ? "Fetching providers..." : "Select provider")
                        : getSelectedProviderName()
                    }>
                      {field.value && !providersLoading && providers.length > 0 && (
                        <span>
                          {mode === 'create'
                            ? ((providers.find(p => (p as any).value === field.value) as any)?.label || 'Unknown Provider')
                            : ((providers.find(p => (p as any).id === field.value) as any)?.display_name || 'Unknown Provider')
                          }
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {providersLoading ? (
                    <SelectItem value="loading" disabled>
                      <InlineLoader size="sm" className="mr-2" />
                      Loading providers...
                    </SelectItem>
                  ) : providers.length === 0 ? (
                    <SelectItem value="no-providers" disabled>
                      No providers available
                    </SelectItem>
                  ) : (
                    providers.map((provider) => (
                      <SelectItem
                        key={mode === 'create' ? (provider as any).value : (provider as any).id}
                        value={String(mode === 'create' ? (provider as any).value : (provider as any).id)}
                      >
                        <div>
                          <div className="font-medium">
                            {mode === 'create' ? (provider as any).label : (provider as any).display_name}
                          </div>
                          {mode === 'create' && (provider as any).description && (
                            <div className="text-xs text-zinc-600">{(provider as any).description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Language model provider
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LLM Model */}
        <FormField
          control={control}
          name="llm_model_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">LLM Model</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))} 
                value={field.value ? field.value.toString() : ''} 
                disabled={modelsLoading || !watchedLLMProviderId}
                onOpenChange={(open) => open && mode === 'edit' && loadModels()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      mode === 'create' 
                        ? (!watchedLLMProviderId || providers.length === 0 
                            ? "Select a provider first" 
                            : modelsLoading 
                            ? "Fetching models..." 
                            : "Select model")
                        : (!watchedLLMProviderId 
                            ? "Select provider first" 
                            : modelsLoading
                            ? "Fetching models..."
                            : "Select model")
                    }>
                      {field.value && !modelsLoading && models.length > 0 && (() => {
                        const selectedModel = mode === 'create'
                          ? models.find(m => (m as any).value === field.value)
                          : models.find(m => (m as any).id === field.value);

                        if (!selectedModel) return null;

                        return (
                          <span>
                            {mode === 'create'
                              ? (selectedModel as any).label
                              : ((selectedModel as any).display_name || (selectedModel as any).model_name)
                            }
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!watchedLLMProviderId ? (
                    <SelectItem value="no-provider" disabled>
                      Please select a provider first
                    </SelectItem>
                  ) : modelsLoading ? (
                    <SelectItem value="loading" disabled>
                      <InlineLoader size="sm" className="mr-2" />
                      Loading models...
                    </SelectItem>
                  ) : models.length === 0 ? (
                    <SelectItem value="no-models" disabled>
                      No models available for selected provider
                    </SelectItem>
                  ) : (
                    models.map((model) => (
                      <SelectItem
                        key={mode === 'create' ? (model as any).value : (model as any).id}
                        value={String(mode === 'create' ? (model as any).value : (model as any).id)}
                      >
                        <div>
                          <div className="font-medium">
                            {mode === 'create' ? (model as any).label : ((model as any).display_name || (model as any).model_name)}
                          </div>
                          {mode === 'create' && (model as any).description && (
                            <div className="text-xs text-zinc-600">{(model as any).description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Specific model version to use
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* System Prompt */}
      <FormField
        control={control}
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">System Prompt</FormLabel>
              {mode === 'create' && (
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
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
                            placeholder="e.g., customer support for e-commerce, technical documentation help, sales inquiries for SaaS products..."
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
              )}
            </div>
            <FormControl>
              <Textarea
                placeholder="You are a helpful AI agent for customer support. You should be professional, empathetic, and provide clear, accurate information. Always ask clarifying questions when needed and escalate complex issues to human agents."
                className="min-h-32 font-mono text-sm"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Core instructions that define the agent&apos;s behavior and personality
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Temperature */}
        <FormField
          control={control}
          name="temperature"
          render={({ field }) => {
            // Ensure temperature has a valid numeric value
            const temperatureValue = typeof field.value === 'number' && !isNaN(field.value) 
              ? field.value 
              : 0.7;
            
            return (
              <FormItem>
                <FormLabel className="text-sm font-medium">Temperature</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Slider
                      min={0.1}
                      max={2}
                      step={0.1}
                      value={[temperatureValue]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-end">
                      <span className="text-sm text-zinc-600">{temperatureValue.toFixed(1)}</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Response creativity (0.1 = deterministic, 0.7 = ideal, 2 = very creative)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Max Tokens */}
        <FormField
          control={control}
          name="max_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Max Tokens</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="50"
                  max="32000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Maximum tokens in model response (minimum 50)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* Memory Configuration Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Memory Configuration</CardTitle>
            </div>
            <FormField
              control={control}
              name="memory_enabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          setValue('max_memory_retrieval', 5);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <CardDescription>
            {watch('memory_enabled')
              ? 'Memory is enabled. The assistant will remember context from previous interactions.'
              : 'Enable memory to allow the assistant to retain context across conversations.'
            }
          </CardDescription>
        </CardHeader>

        {watch('memory_enabled') && (
          <CardContent>
            <FormField
              control={control}
              name="max_memory_retrieval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Max Memory Retrieval</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of previous interactions to retrieve (1-10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        )}
      </Card>

      {/* Knowledge Base Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Knowledge Base</CardTitle>
            </div>
            <FormField
              control={control}
              name="has_knowledge_base"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          setValue('documents_ids', null);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <CardDescription>
            {knowledgeBaseEnabled
              ? 'Connect your assistant to documents to provide accurate, context-aware responses.'
              : 'Enable to connect your assistant to documents for enhanced responses.'
            }
          </CardDescription>
        </CardHeader>

        {knowledgeBaseEnabled && (
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>When knowledge base is enabled, your assistant will use the selected documents to provide more accurate responses.</p>
            </div>

            {/* Training Status Display */}
            {knowledgeBaseEnabled && selectedDocumentIds && selectedDocumentIds.length > 0 && (trainingStatus || ragProcessingStatus) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Processing Status</h4>
                <div className={cn(
                  "gap-3",
                  trainingStatus && ragProcessingStatus 
                    ? "grid grid-cols-1 md:grid-cols-2" 
                    : "grid grid-cols-1"
                )}>
                  {/* Training Status */}
                  {trainingStatus && (() => {
                    const config = getTrainingStatusConfig(trainingStatus);
                    const IconComponent = config.icon;
                    return (
                      <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border w-full",
                        config.className
                      )}>
                        <IconComponent className={cn("h-5 w-5 flex-shrink-0", config.iconClassName)} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs opacity-75 mt-0.5">{config.description}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* RAG Processing Status */}
                  {ragProcessingStatus && (() => {
                    const config = getRAGStatusConfig(ragProcessingStatus);
                    if (!config) return null;
                    const IconComponent = config.icon;
                    return (
                      <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border w-full",
                        config.className
                      )}>
                        <IconComponent className={cn("h-5 w-5 flex-shrink-0", config.iconClassName)} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs opacity-75 mt-0.5">{config.description}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            {/* Document Selector with Checkboxes */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Select Documents
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {localSelectedIds.length}/10
                    </Badge>
                  </div>
                  {localSelectedIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLocalSelectedIds([]);
                        isUpdatingFromFormRef.current = true;
                        setValue('documents_ids', null, { shouldValidate: false });
                      }}  
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <Popover open={openDocumentSelector} onOpenChange={handlePopoverClose}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDocumentSelector}
                      className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">
                        {localSelectedIds.length === 0
                          ? (isLoadingDocuments ? 'Loading documents...' : 'Select documents...')
                          : `${localSelectedIds.length} document${localSelectedIds.length > 1 ? 's' : ''} selected`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 overflow-hidden" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <div className="p-2">
                      {/* Search Input */}
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 mb-2"
                      />
                      
                      {/* Documents List with Checkboxes */}
                      <div className="border rounded-lg max-h-[250px] overflow-auto">
                        {isLoadingDocuments ? (
                          <div className="py-4 text-center text-sm flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading documents...
                          </div>
                        ) : documents.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            {searchQuery ? 'No documents found.' : 'No documents available. Upload documents in the Knowledge Base section.'}
                          </div>
                        ) : (
                          <div className="p-1 space-y-0.5">
                            {documents.map((doc) => {
                              const isSelected = localSelectedIds.includes(doc.id);
                              const isLimitReached = localSelectedIds.length >= 10 && !isSelected;
                              return (
                                <div
                                  key={doc.id}
                                  className={cn(
                                    "flex items-center space-x-2 p-1.5 rounded",
                                    isLimitReached 
                                      ? "opacity-50 cursor-not-allowed" 
                                      : "hover:bg-accent cursor-pointer"
                                  )}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!isLimitReached) {
                                      toggleLocalDocument(doc.id);
                                    }
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isLimitReached}
                                    onCheckedChange={(checked) => {
                                      if (!isLimitReached) {
                                        toggleLocalDocument(doc.id);
                                      }
                                    }}
                                    className="flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {doc.file_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {doc.file_type} • {formatFileSize(doc.file_size || 0)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Select up to 10 documents from your knowledge base. Click outside to close.
                  </p>
                  {localSelectedIds.length >= 10 && (
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠️ Maximum limit reached. Deselect a document to add a different one.
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Documents Display */}
              {selectedDocumentIds.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Selected Documents ({selectedDocumentIds.length})</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocumentIds.map((docId: number) => {
                      const doc = getDocumentById(docId);
                      if (!doc) return null;
                      return (
                        <Badge
                          key={docId}
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 gap-2"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="max-w-[200px] truncate">{doc.file_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeDocument(docId)}
                          >
                            ×
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Prompt Example - Only show in create mode */}
      {mode === 'create' && (
        <div className="rounded-lg border bg-zinc-50 p-4">
          <h4 className="text-sm font-medium text-zinc-900 mb-2">Prompt Writing Tips</h4>
          <ul className="text-sm text-zinc-600 space-y-1">
            <li>• Be specific about the agent&apos;s role and capabilities</li>
            <li>• Include examples of desired responses and behavior</li>
            <li>• Specify when to escalate to humans</li>
            <li>• Use clear, concise language</li>
            <li>• Test with different scenarios to refine</li>
          </ul>
        </div>
      )}

    </div>
  );
}
