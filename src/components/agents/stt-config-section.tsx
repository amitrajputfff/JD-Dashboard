'use client';

import React, { useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mic, Users, Type, Zap, Shield } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loader';
import { FormSectionProps } from '@/types/assistant';

// Import context and API functions conditionally
import { useCreateAgentContext } from '@/contexts/create-agent-context';
import { providersApi, sttModelsApi, languagesApi } from '@/lib/api/providers';
import { Language } from '@/types/provider';


interface Provider {
  id: number;
  name: string;
  display_name: string;
  service_type: string;
  is_active: boolean;
}

interface STTModel {
  id: number;
  model_name: string;
  display_name?: string;
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

interface ContextLanguage {
  value: number;
  label: string;
  code?: string;
}

interface STTConfigSectionProps extends FormSectionProps {
  mode?: 'create' | 'edit';
  showHeader?: boolean;
}

export default function STTConfigSection({ 
  control, 
  watch, 
  setValue,
  mode = 'create',
  showHeader = true,
  errors
}: STTConfigSectionProps) {
  const watchedSTTProviderId = watch('stt_provider_id');
  const watchedSTTModelId = watch('stt_model_id');
  const watchedLanguageId = watch('language_id');
  
  // Context-based data (for create mode)
  const createContext = mode === 'create' ? useCreateAgentContext() : null;
  
  // Direct API state (for edit mode)
  const [sttProviders, setSttProviders] = useState<Provider[]>([]);
  const [sttProvidersLoading, setSttProvidersLoading] = useState(false);
  const [sttProvidersLoaded, setSttProvidersLoaded] = useState(false);
  
  const [sttModels, setSttModels] = useState<STTModel[]>([]);
  const [sttModelsLoading, setSttModelsLoading] = useState(false);
  const [sttModelsLoaded, setSttModelsLoaded] = useState(false);
  
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [languagesLoaded, setLanguagesLoaded] = useState(false);
  
  const [isPreloading, setIsPreloading] = useState(false);

  // Ref for tracking previous provider ID
  const prevSTTProviderIdRef = useRef(watchedSTTProviderId);

  // Get data based on mode
  const getProviders = (): (Provider | ContextProvider)[] => {
    if (mode === 'create' && createContext) {
      return createContext.sttProviders || [];
    }
    return sttProviders;
  };

  const getModels = (): (STTModel | ContextModel)[] => {
    if (mode === 'create' && createContext) {
      return createContext.sttModels || [];
    }
    return sttModels;
  };

  const getLanguages = (): (ContextLanguage | Language)[] => {
    if (mode === 'create' && createContext) {
      return createContext.languages || [];
    }
    return languages; // Use real API data in edit mode
  };

  const getProvidersLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.sttProvidersLoading || false;
    }
    return sttProvidersLoading;
  };

  const getModelsLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.sttModelsLoading || false;
    }
    return sttModelsLoading;
  };

  const getLanguagesLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.languagesLoading || false;
    }
    return languagesLoading;
  };

  // Lazy load providers only when dropdown is opened (edit mode only)
  const loadProviders = async () => {
    if (mode === 'create' || sttProvidersLoaded || sttProvidersLoading) return;
    
    setSttProvidersLoading(true);
    try {
      // Explicitly request only active providers
      const response = await providersApi.getSTTProviders({ is_active: true });
      
      // Additional client-side filtering as backup
      const activeProviders = response.providers.filter(provider => provider.is_active === true);
      setSttProviders(activeProviders);
      setSttProvidersLoaded(true);
    } catch (error) {
      console.error('Error fetching STT providers:', error);
    } finally {
      setSttProvidersLoading(false);
    }
  };

  // Lazy load models only when provider is selected and dropdown is opened (edit mode only)
  const loadModels = async () => {
    if (mode === 'create' || !watchedSTTProviderId || sttModelsLoaded || sttModelsLoading) return;
    
    setSttModelsLoading(true);
    try {
      const response = await sttModelsApi.getSTTModels({ provider_id: watchedSTTProviderId });
      setSttModels(response.stt_models);
      setSttModelsLoaded(true);
    } catch (error) {
      console.error('Error fetching STT models:', error);
    } finally {
      setSttModelsLoading(false);
    }
  };

  // Lazy load languages (edit mode only)
  const loadLanguages = async () => {
    if (mode === 'create' || languagesLoaded || languagesLoading) return;
    
    setLanguagesLoading(true);
    try {
      const response = await languagesApi.getLanguages();
      setLanguages(response.languages);
      setLanguagesLoaded(true);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLanguagesLoading(false);
    }
  };

  // Pre-load selected provider, model, and language data on mount (edit mode only)
  React.useEffect(() => {
    if (mode === 'create') return;
    
    const preloadData = async () => {
      // Only preload if we have selected values and haven't loaded yet
      if ((watchedSTTProviderId && !sttProvidersLoaded) || 
          (watchedSTTModelId && watchedSTTProviderId && !sttModelsLoaded) ||
          !languagesLoaded) {
        
        setIsPreloading(true);
        try {
          // Pre-load provider data if we have a selected provider ID
          if (watchedSTTProviderId && !sttProvidersLoaded) {
            await loadProviders();
          }
          
          // Pre-load model data if we have a selected model ID
          if (watchedSTTModelId && watchedSTTProviderId && !sttModelsLoaded) {
            await loadModels();
          }

          // Pre-load languages
          if (!languagesLoaded) {
            await loadLanguages();
          }
        } catch (error) {
          console.error('Failed to preload STT data:', error);
        } finally {
          setIsPreloading(false);
        }
      }
    };

    preloadData();
  }, [watchedSTTProviderId, watchedSTTModelId, mode]);

  // Reset model selection when provider changes
  React.useEffect(() => {
    const prevProviderId = prevSTTProviderIdRef.current;
    
    if (prevProviderId !== undefined && 
        prevProviderId !== watchedSTTProviderId) {
      setValue('stt_model_id', undefined, { shouldValidate: false });
      
      // Reset models when provider changes (edit mode only)
      if (mode === 'edit') {
        setSttModels([]);
        setSttModelsLoaded(false);
      }
    }
    
    prevSTTProviderIdRef.current = watchedSTTProviderId;
  }, [watchedSTTProviderId, setValue, mode]);

  // Auto-select first model when models are loaded (client-side only)
  React.useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return;
    
    const models = getModels();
    const modelsLoading = getModelsLoading();
    
    if (!modelsLoading && models.length > 0 && watchedSTTProviderId) {
      const firstModelId = mode === 'create' 
        ? (models[0] as any).value 
        : (models[0] as any).id;
      
      if (firstModelId && (!watchedSTTModelId || !models.find(m => (mode === 'create' ? (m as any).value : (m as any).id) === watchedSTTModelId))) {
        setValue('stt_model_id', firstModelId, { shouldValidate: false });
      }
    }
  }, [watchedSTTProviderId, watchedSTTModelId, mode, setValue]);

  // Auto-select first language when languages are loaded (client-side only)
  React.useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window === 'undefined') return;
    
    const languagesData = getLanguages();
    const languagesLoadingState = getLanguagesLoading();
    
    if (!languagesLoadingState && languagesData.length > 0) {
      if (!watchedLanguageId || !languagesData.find(l => (mode === 'create' ? (l as ContextLanguage).value : (l as Language).id) === watchedLanguageId)) {
        const firstLanguageId = mode === 'create' 
          ? (languagesData[0] as ContextLanguage).value 
          : (languagesData[0] as Language).id;
        
        if (firstLanguageId) {
          setValue('language_id', firstLanguageId, { shouldValidate: false });
        }
      }
    }
  }, [watchedLanguageId, mode, setValue]);

  // Get display name for selected provider (edit mode)
  const getSelectedProviderName = () => {
    if (mode === 'create') return 'Select Provider';
    if (!watchedSTTProviderId) return 'Select Provider';
    if (isPreloading) return 'Loading...';
    const provider = sttProviders.find(p => p.id === watchedSTTProviderId);
    return provider ? provider.display_name : `Provider ${watchedSTTProviderId}`;
  };

  // Get display name for selected model (edit mode)
  const getSelectedModelName = () => {
    if (mode === 'create') return 'Select Model';
    if (!watchedSTTModelId) return 'Select Model';
    if (isPreloading) return 'Loading...';
    const model = sttModels.find(m => m.id === watchedSTTModelId);
    if (!model) return `Model ${watchedSTTModelId}`;
    
    return model.display_name || model.model_name;
  };

  const providers = getProviders();
  const models = getModels();
  const languagesData = getLanguages();
  const providersLoading = getProvidersLoading();
  const modelsLoading = getModelsLoading();
  const languagesLoadingState = getLanguagesLoading();

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h3 className="text-lg font-medium">Speech-to-Text Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Voice recognition settings and parameters
          </p>
        </div>
      )}
      
      {/* STT Provider */}
      <FormField
        control={control}
        name="stt_provider_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">STT Provider</FormLabel>
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
                            ? ((providers.find(p => (p as ContextProvider).value === field.value) as ContextProvider)?.label || 'Unknown Provider')
                            : ((providers.find(p => (p as Provider).id === field.value) as Provider)?.display_name || 'Unknown Provider')
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
                      key={mode === 'create' ? (provider as ContextProvider).value : (provider as Provider).id} 
                      value={String(mode === 'create' ? (provider as ContextProvider).value : (provider as Provider).id)}
                    >
                      <div>
                        <div className="font-medium">
                          {mode === 'create' ? (provider as ContextProvider).label : (provider as Provider).display_name}
                        </div>
                        {mode === 'create' && (provider as ContextProvider).description && (
                          <div className="text-xs text-zinc-600">{(provider as ContextProvider).description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Speech-to-text provider
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* STT Model */}
        <FormField
          control={control}
          name="stt_model_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">STT Model</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))} 
                value={field.value ? field.value.toString() : ''} 
                disabled={modelsLoading || !watchedSTTProviderId}
                onOpenChange={(open) => open && mode === 'edit' && loadModels()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      mode === 'create' 
                        ? (!watchedSTTProviderId 
                            ? "Select provider first" 
                            : modelsLoading 
                              ? "Fetching models..." 
                              : "Select STT model")
                        : (!watchedSTTProviderId 
                            ? "Select provider first" 
                            : modelsLoading
                            ? "Fetching models..."
                            : "Select model")
                    }>
                      {field.value && !modelsLoading && models.length > 0 && (() => {
                        const selectedModel = mode === 'create' 
                          ? models.find(m => (m as ContextModel).value === field.value)
                          : models.find(m => (m as STTModel).id === field.value);
                        
                        if (!selectedModel) return null;
                        
                        return (
                          <span>
                            {mode === 'create' 
                              ? (selectedModel as ContextModel).label
                              : ((selectedModel as STTModel).display_name || (selectedModel as STTModel).model_name)
                            }
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!watchedSTTProviderId ? (
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
                        key={mode === 'create' ? (model as ContextModel).value : (model as STTModel).id} 
                        value={String(mode === 'create' ? (model as ContextModel).value : (model as STTModel).id)}
                      >
                        <div className="py-1">
                          <div className="font-medium text-sm">
                            {mode === 'create' ? (model as ContextModel).label : ((model as STTModel).display_name || (model as STTModel).model_name)}
                          </div>
                          {mode === 'create' && (model as ContextModel).description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {(model as ContextModel).description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {!watchedSTTProviderId 
                  ? "Select a provider first to see available models"
                  : "Speech recognition model variant"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language */}
        <FormField
          control={control}
          name="language_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Language</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  value={field.value ? field.value.toString() : ''} 
                  disabled={languagesLoadingState}
                  onOpenChange={(open) => open && mode === 'edit' && loadLanguages()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={languagesLoadingState ? "Fetching languages..." : "Select language"}>
                        {field.value && !languagesLoadingState && languagesData.length > 0 && (
                          <span>
                            {mode === 'create' 
                              ? (languagesData.find(l => (l as ContextLanguage).value === field.value) as ContextLanguage)?.label || 'Unknown Language'
                              : (languagesData.find(l => (l as Language).id === field.value) as Language)?.name || 'Unknown Language'
                            }
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languagesLoadingState ? (
                      <SelectItem value="loading" disabled>
                        <InlineLoader size="sm" className="mr-2" />
                        Loading languages...
                      </SelectItem>
                    ) : languagesData.length === 0 ? (
                      <SelectItem value="no-languages" disabled>
                        No languages available
                      </SelectItem>
                    ) : (
                      languagesData.map((language) => (
                        <SelectItem 
                          key={mode === 'create' ? (language as ContextLanguage).value : (language as Language).id} 
                          value={String(mode === 'create' ? (language as ContextLanguage).value : (language as Language).id)}
                        >
                          <div className="py-1">
                            <div className="font-medium text-sm">
                              {mode === 'create' 
                                ? (language as ContextLanguage).label 
                                : (language as Language).name
                              }
                            </div>
                            {(mode === 'create' 
                              ? (language as ContextLanguage).code 
                              : (language as Language).code
                            ) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {mode === 'create' 
                                  ? (language as ContextLanguage).code 
                                  : (language as Language).code
                                }
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              <FormDescription>
                Primary language for speech recognition
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* STT Features and Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-zinc-600" />
          <h4 className="text-sm font-medium text-zinc-900">Speech Recognition Features</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Voice Activity Detection */}
          <FormField
            control={control}
            name="voice_activity_detection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Voice Activity Detection</FormLabel>
                  <FormDescription>
                    Detect when user is speaking
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Barge-in */}
          <FormField
            control={control}
            name="barge_in"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Barge-in</FormLabel>
                  <FormDescription>
                    Allow user to interrupt agent
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Noise Suppression */}
          <FormField
            control={control}
            name="noise_suppression"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Noise Suppression</FormLabel>
                  <FormDescription>
                    Filter background noise
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

        </div>

        {/* STT Features Info - Only show in create mode */}
        {mode === 'create' && (
          <div className="rounded-lg border bg-zinc-50 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-zinc-500" />
                <Badge variant="secondary" className="text-xs">
                  Real-time
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-zinc-500" />
                <Badge variant="secondary" className="text-xs">
                  Noise Reduction
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-zinc-500" />
                <Badge variant="secondary" className="text-xs">
                  Multi-speaker
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Type className="h-3 w-3 text-zinc-500" />
                <Badge variant="secondary" className="text-xs">
                  Punctuation
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-zinc-600">
              Speech recognition provides high-accuracy transcription with automatic punctuation, 
              speaker diarization, and real-time transcription capabilities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
