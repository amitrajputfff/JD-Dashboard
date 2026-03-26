'use client';

import React, { useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MetallicAvatar } from '@/components/ui/metallic-avatar';
import { Play, Volume2, Check, ChevronsUpDown } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loader';
import { FormSectionProps } from '@/types/assistant';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

// Language code to name mapping
const LANGUAGE_MAP: Record<string, string> = {
  'af-ZA': 'Afrikaans (South Africa)',
  'am-ET': 'Amharic (Ethiopia)',
  'ar-AE': 'Arabic (UAE)',
  'ar-BH': 'Arabic (Bahrain)',
  'ar-DZ': 'Arabic (Algeria)',
  'ar-EG': 'Arabic (Egypt)',
  'ar-IQ': 'Arabic (Iraq)',
  'ar-JO': 'Arabic (Jordan)',
  'ar-KW': 'Arabic (Kuwait)',
  'ar-LB': 'Arabic (Lebanon)',
  'ar-LY': 'Arabic (Libya)',
  'ar-MA': 'Arabic (Morocco)',
  'ar-OM': 'Arabic (Oman)',
  'ar-QA': 'Arabic (Qatar)',
  'ar-SA': 'Arabic (Saudi Arabia)',
  'ar-SY': 'Arabic (Syria)',
  'ar-TN': 'Arabic (Tunisia)',
  'ar-YE': 'Arabic (Yemen)',
  'as-IN': 'Assamese (India)',
  'az-AZ': 'Azerbaijani (Azerbaijan)',
  'bg-BG': 'Bulgarian (Bulgaria)',
  'bn-BD': 'Bengali (Bangladesh)',
  'bn-IN': 'Bengali (India)',
  'bs-BA': 'Bosnian (Bosnia & Herzegovina)',
  'ca-ES': 'Catalan (Spain)',
  'cs-CZ': 'Czech (Czechia)',
  'cy-GB': 'Welsh (United Kingdom)',
  'da-DK': 'Danish (Denmark)',
  'de-AT': 'German (Austria)',
  'de-CH': 'German (Switzerland)',
  'de-DE': 'German (Germany)',
  'el-GR': 'Greek (Greece)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-GB': 'English (United Kingdom)',
  'en-HK': 'English (Hong Kong)',
  'en-IE': 'English (Ireland)',
  'en-IN': 'English (India)',
  'en-KE': 'English (Kenya)',
  'en-NG': 'English (Nigeria)',
  'en-NZ': 'English (New Zealand)',
  'en-PH': 'English (Philippines)',
  'en-SG': 'English (Singapore)',
  'en-TZ': 'English (Tanzania)',
  'en-US': 'English (United States)',
  'en-ZA': 'English (South Africa)',
  'es-AR': 'Spanish (Argentina)',
  'es-BO': 'Spanish (Bolivia)',
  'es-CL': 'Spanish (Chile)',
  'es-CO': 'Spanish (Colombia)',
  'es-CR': 'Spanish (Costa Rica)',
  'es-CU': 'Spanish (Cuba)',
  'es-DO': 'Spanish (Dominican Republic)',
  'es-EC': 'Spanish (Ecuador)',
  'es-ES': 'Spanish (Spain)',
  'es-GQ': 'Spanish (Equatorial Guinea)',
  'es-GT': 'Spanish (Guatemala)',
  'es-HN': 'Spanish (Honduras)',
  'es-MX': 'Spanish (Mexico)',
  'es-NI': 'Spanish (Nicaragua)',
  'es-PA': 'Spanish (Panama)',
  'es-PE': 'Spanish (Peru)',
  'es-PR': 'Spanish (Puerto Rico)',
  'es-PY': 'Spanish (Paraguay)',
  'es-SV': 'Spanish (El Salvador)',
  'es-US': 'Spanish (United States)',
  'es-UY': 'Spanish (Uruguay)',
  'es-VE': 'Spanish (Venezuela)',
  'et-EE': 'Estonian (Estonia)',
  'eu-ES': 'Basque (Spain)',
  'fa-IR': 'Persian (Iran)',
  'fi-FI': 'Finnish (Finland)',
  'fil-PH': 'Filipino (Philippines)',
  'fr-BE': 'French (Belgium)',
  'fr-CA': 'French (Canada)',
  'fr-CH': 'French (Switzerland)',
  'fr-FR': 'French (France)',
  'gl-ES': 'Galician (Spain)',
  'gu-IN': 'Gujarati (India)',
  'he-IL': 'Hebrew (Israel)',
  'hi-IN': 'Hindi (India)',
  'hr-HR': 'Croatian (Croatia)',
  'hu-HU': 'Hungarian (Hungary)',
  'hy-AM': 'Armenian (Armenia)',
  'id-ID': 'Indonesian (Indonesia)',
  'is-IS': 'Icelandic (Iceland)',
  'it-IT': 'Italian (Italy)',
  'ja-JP': 'Japanese (Japan)',
  'jv-ID': 'Javanese (Indonesia)',
  'ka-GE': 'Georgian (Georgia)',
  'kk-KZ': 'Kazakh (Kazakhstan)',
  'km-KH': 'Khmer (Cambodia)',
  'kn-IN': 'Kannada (India)',
  'ko-KR': 'Korean (South Korea)',
  'lo-LA': 'Lao (Laos)',
  'lt-LT': 'Lithuanian (Lithuania)',
  'lv-LV': 'Latvian (Latvia)',
  'mk-MK': 'Macedonian (North Macedonia)',
  'ml-IN': 'Malayalam (India)',
  'mn-MN': 'Mongolian (Mongolia)',
  'mr-IN': 'Marathi (India)',
  'ms-MY': 'Malay (Malaysia)',
  'mt-MT': 'Maltese (Malta)',
  'my-MM': 'Burmese (Myanmar)',
  'nb-NO': 'Norwegian Bokmål (Norway)',
  'ne-NP': 'Nepali (Nepal)',
  'nl-BE': 'Dutch (Belgium)',
  'nl-NL': 'Dutch (Netherlands)',
  'pl-PL': 'Polish (Poland)',
  'ps-AF': 'Pashto (Afghanistan)',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ro-RO': 'Romanian (Romania)',
  'ru-RU': 'Russian (Russia)',
  'si-LK': 'Sinhala (Sri Lanka)',
  'sk-SK': 'Slovak (Slovakia)',
  'sl-SI': 'Slovenian (Slovenia)',
  'so-SO': 'Somali (Somalia)',
  'sq-AL': 'Albanian (Albania)',
  'sr-RS': 'Serbian (Serbia)',
  'su-ID': 'Sundanese (Indonesia)',
  'sv-SE': 'Swedish (Sweden)',
  'sw-KE': 'Swahili (Kenya)',
  'sw-TZ': 'Swahili (Tanzania)',
  'ta-IN': 'Tamil (India)',
  'ta-LK': 'Tamil (Sri Lanka)',
  'ta-MY': 'Tamil (Malaysia)',
  'ta-SG': 'Tamil (Singapore)',
  'te-IN': 'Telugu (India)',
  'th-TH': 'Thai (Thailand)',
  'tr-TR': 'Turkish (Turkey)',
  'uk-UA': 'Ukrainian (Ukraine)',
  'ur-IN': 'Urdu (India)',
  'ur-PK': 'Urdu (Pakistan)',
  'uz-UZ': 'Uzbek (Uzbekistan)',
  'vi-VN': 'Vietnamese (Vietnam)',
  'zh-CN': 'Chinese (Mandarin, Simplified)',
  'zh-HK': 'Chinese (Cantonese, Traditional)',
  'zh-TW': 'Chinese (Mandarin, Traditional)',
  'zu-ZA': 'Zulu (South Africa)'
};



// Import context and API functions conditionally
import { useCreateAgentContext } from '@/contexts/create-agent-context';
import { providersApi, ttsModelsApi, voicesApi } from '@/lib/api/providers';
import { Provider, TTSModel, Voice } from '@/types/provider';

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

interface ContextVoice {
  value: number;
  label: string;
  description?: string;
}

interface TTSConfigSectionProps extends FormSectionProps {
  mode?: 'create' | 'edit';
  showHeader?: boolean;
}

export default function TTSConfigSection({ 
  control, 
  watch, 
  setValue,
  mode = 'create',
  showHeader = true
}: TTSConfigSectionProps) {
  const watchedSpeechSpeed = watch('speech_speed') || 1.0;
  const watchedPitch = watch('pitch') || (mode === 'create' ? '0%' : '0%');
  const watchedTTSProviderId = watch('tts_provider_id');
  const watchedTTSModelId = watch('tts_model_id');
  const watchedVoiceId = watch('voice_id');
  
  // Context-based data (for create mode)
  const createContext = mode === 'create' ? useCreateAgentContext() : null;
  
  // Direct API state (for edit mode)
  const [ttsProviders, setTtsProviders] = useState<Provider[]>([]);
  const [ttsProvidersLoading, setTtsProvidersLoading] = useState(false);
  const [ttsProvidersLoaded, setTtsProvidersLoaded] = useState(false);
  
  const [ttsModels, setTtsModels] = useState<TTSModel[]>([]);
  const [ttsModelsLoading, setTtsModelsLoading] = useState(false);
  const [ttsModelsLoaded, setTtsModelsLoaded] = useState(false);
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  const [isPreloading, setIsPreloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Voice combobox state
  const [openVoiceSelector, setOpenVoiceSelector] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');

  // Refs for tracking previous values and preventing race conditions
  const prevTTSProviderIdRef = useRef(watchedTTSProviderId);
  const prevTTSModelIdRef = useRef(watchedTTSModelId);
  const loadingPromisesRef = useRef<{
    providers?: Promise<void>;
    models?: Promise<void>;
    voices?: Promise<void>;
  }>({});

  // Set mounted state to prevent hydration mismatches
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get data based on mode
  const getProviders = (): (Provider | ContextProvider)[] => {
    if (mode === 'create' && createContext) {
      return createContext.ttsProviders || [];
    }
    return ttsProviders;
  };

  const getModels = (): (TTSModel | ContextModel)[] => {
    if (mode === 'create' && createContext) {
      return createContext.ttsModels || [];
    }
    return ttsModels;
  };

  const getVoices = (): (Voice | ContextVoice)[] => {
    if (mode === 'create' && createContext) {
      return createContext.voices || [];
    }
    return voices;
  };

  const getProvidersLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.ttsProvidersLoading || false;
    }
    return ttsProvidersLoading;
  };

  const getModelsLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.ttsModelsLoading || false;
    }
    return ttsModelsLoading;
  };

  const getVoicesLoading = (): boolean => {
    if (mode === 'create' && createContext) {
      return createContext.voicesLoading || false;
    }
    return voicesLoading;
  };

  // Structured dependency tracking for efficient data loading
  const dataDependencies = {
    providers: {
      required: !!watchedTTSProviderId, // Required if we have a selected provider ID
      loaded: ttsProvidersLoaded,
      loading: ttsProvidersLoading,
      load: async () => {
        if (mode === 'create' || ttsProvidersLoaded || ttsProvidersLoading) return;
        
        // Prevent duplicate requests
        if (loadingPromisesRef.current.providers) {
          return loadingPromisesRef.current.providers;
        }
        
        setTtsProvidersLoading(true);
        const promise = (async () => {
          try {
            // Explicitly request only active providers
            const response = await providersApi.getTTSProviders({ is_active: true });
            
            // Additional client-side filtering as backup
            const activeProviders = response.providers.filter(provider => provider.is_active === true);
            setTtsProviders(activeProviders);
            setTtsProvidersLoaded(true);
          } catch (error) {
            console.error('Error fetching TTS providers:', error);
          } finally {
            setTtsProvidersLoading(false);
            loadingPromisesRef.current.providers = undefined;
          }
        })();
        
        loadingPromisesRef.current.providers = promise;
        return promise;
      }
    },
    models: {
      required: !!watchedTTSProviderId,
      loaded: ttsModelsLoaded,
      loading: ttsModelsLoading,
      load: async () => {
        if (mode === 'create' || !watchedTTSProviderId || ttsModelsLoaded || ttsModelsLoading) return;
        
        // Prevent duplicate requests
        if (loadingPromisesRef.current.models) {
          return loadingPromisesRef.current.models;
        }
        
        setTtsModelsLoading(true);
        const promise = (async () => {
          try {
            const response = await ttsModelsApi.getTTSModels({ provider_id: watchedTTSProviderId });
            setTtsModels(response.tts_models);
            setTtsModelsLoaded(true);
          } catch (error) {
            console.error('Error fetching TTS models:', error);
          } finally {
            setTtsModelsLoading(false);
            loadingPromisesRef.current.models = undefined;
          }
        })();
        
        loadingPromisesRef.current.models = promise;
        return promise;
      }
    },
    voices: {
      required: !!watchedTTSModelId,
      loaded: voicesLoaded,
      loading: voicesLoading,
      load: async () => {
        if (mode === 'create' || !watchedTTSModelId || voicesLoaded || voicesLoading) return;
        
        // Prevent duplicate requests
        if (loadingPromisesRef.current.voices) {
          return loadingPromisesRef.current.voices;
        }
        
        setVoicesLoading(true);
        const promise = (async () => {
          try {
            const response = await voicesApi.getVoices({ tts_model_id: watchedTTSModelId, limit: 1000 });
            setVoices(response.voices);
            setVoicesLoaded(true);
          } catch (error) {
            console.error('Error fetching voices:', error);
          } finally {
            setVoicesLoading(false);
            loadingPromisesRef.current.voices = undefined;
          }
        })();
        
        loadingPromisesRef.current.voices = promise;
        return promise;
      }
    }
  };

  // Lazy load providers only when dropdown is opened (edit mode only)
  const loadProviders = () => dataDependencies.providers.load();

  // Lazy load models only when provider is selected and dropdown is opened (edit mode only)
  const loadModels = () => dataDependencies.models.load();

  // Load voices when combobox opens (edit mode only)
  const loadVoices = () => dataDependencies.voices.load();
  
  // Load voices when combobox opens
  React.useEffect(() => {
    if (openVoiceSelector && !voicesLoaded && !voicesLoading && watchedTTSModelId) {
      loadVoices();
    }
  }, [openVoiceSelector, voicesLoaded, voicesLoading, watchedTTSModelId]);

  // Structured preloading with dependency tracking (edit mode only)
  React.useEffect(() => {
    if (mode === 'create') return;
    
    const preloadData = async () => {
      const needsPreloading = Object.values(dataDependencies).some(
        dep => dep.required && !dep.loaded && !dep.loading
      );
      
      if (!needsPreloading) return;
      
      setIsPreloading(true);
      try {
        // Load data in dependency order: providers -> models -> voices
        const loadPromises: Promise<void>[] = [];
        
        if (dataDependencies.providers.required && !dataDependencies.providers.loaded) {
          loadPromises.push(dataDependencies.providers.load());
        }
        
        if (dataDependencies.models.required && !dataDependencies.models.loaded) {
          loadPromises.push(dataDependencies.models.load());
        }
        
        if (dataDependencies.voices.required && !dataDependencies.voices.loaded) {
          loadPromises.push(dataDependencies.voices.load());
        }
        
        // Wait for all required data to load
        await Promise.all(loadPromises);
      } catch (error) {
        console.error('Failed to preload TTS data:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadData();
  }, [watchedTTSProviderId, watchedTTSModelId, watchedVoiceId, mode]);

  // Additional effect to ensure providers are loaded when we have a selected provider ID
  React.useEffect(() => {
    if (mode === 'create') return;
    
    // If we have a selected provider ID but no providers loaded, load them
    if (watchedTTSProviderId && !ttsProvidersLoaded && !ttsProvidersLoading) {
      loadProviders();
    }
  }, [watchedTTSProviderId, ttsProvidersLoaded, ttsProvidersLoading, mode]);

  // Reset dependent data when provider changes
  React.useEffect(() => {
    const prevProviderId = prevTTSProviderIdRef.current;
    
    if (prevProviderId !== undefined && 
        prevProviderId !== watchedTTSProviderId) {
      setValue('tts_model_id', undefined, { shouldValidate: false });
      setValue('voice_id', undefined, { shouldValidate: false });
      
      // Reset dependent data when provider changes (edit mode only)
      if (mode === 'edit') {
        setTtsModels([]);
        setTtsModelsLoaded(false);
        setVoices([]);
        setVoicesLoaded(false);
        
        // Clear any pending model/voice loading promises
        loadingPromisesRef.current.models = undefined;
        loadingPromisesRef.current.voices = undefined;
      }
    }
    
    prevTTSProviderIdRef.current = watchedTTSProviderId;
  }, [watchedTTSProviderId, setValue, mode]);

  // Auto-select first model when models are loaded
  React.useEffect(() => {
    if (!isMounted) return;
    
    const models = getModels();
    const modelsLoading = getModelsLoading();
    
    if (!modelsLoading && models.length > 0 && watchedTTSProviderId) {
      const firstModelId = mode === 'create' 
        ? (models[0] as any).value 
        : (models[0] as any).id;
      
      if (firstModelId && (!watchedTTSModelId || !models.find(m => (mode === 'create' ? (m as any).value : (m as any).id) === watchedTTSModelId))) {
        setValue('tts_model_id', firstModelId, { shouldValidate: false });
      }
    }
  }, [isMounted, watchedTTSProviderId, watchedTTSModelId, mode, setValue, getModels, getModelsLoading]);

  // Auto-select first voice when voices are loaded
  React.useEffect(() => {
    if (!isMounted) return;
    
    const voicesData = getVoices();
    const voicesLoadingState = getVoicesLoading();
    
    if (!voicesLoadingState && voicesData.length > 0 && watchedTTSModelId) {
      if (!watchedVoiceId || !voicesData.find(v => {
        const voiceId = mode === 'create' ? (v as ContextVoice).value : (v as Voice).id;
        return voiceId === watchedVoiceId;
      })) {
        const firstVoiceId = mode === 'create' ? (voicesData[0] as ContextVoice).value : (voicesData[0] as Voice).id;
        if (firstVoiceId) {
          setValue('voice_id', firstVoiceId, { shouldValidate: false });
        }
      }
    }
  }, [isMounted, watchedTTSModelId, watchedVoiceId, setValue, getVoices, getVoicesLoading, mode]);

  // Reset dependent data when model changes
  React.useEffect(() => {
    const prevModelId = prevTTSModelIdRef.current;
    
    if (watchedTTSModelId && 
        prevModelId && 
        prevModelId !== watchedTTSModelId) {
      setValue('voice_id', undefined);
      
      // Reset dependent data when model changes (edit mode only)
      if (mode === 'edit') {
        setVoices([]);
        setVoicesLoaded(false);
        
        // Clear any pending voice loading promises
        loadingPromisesRef.current.voices = undefined;
      }
    }
    
    prevTTSModelIdRef.current = watchedTTSModelId;
  }, [watchedTTSModelId, setValue, mode]);

  const handleTestVoice = () => {
    // Mock voice test - in real app this would play a sample
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is how I will sound.');
      utterance.rate = watchedSpeechSpeed;
      utterance.pitch = mode === 'create' 
        ? 1 + (parseInt(watchedPitch) / 100) // Convert percentage to speech synthesis range
        : watchedPitch;
      speechSynthesis.speak(utterance);
    }
  };

  // Get display name for selected provider (edit mode)
  const getSelectedProviderName = () => {
    if (mode === 'create') return 'Select Provider';
    if (!watchedTTSProviderId) return 'Select Provider';
    if (isPreloading) return 'Loading...';
    const provider = ttsProviders.find(p => p.id === watchedTTSProviderId);
    return provider ? provider.display_name : `Provider ${watchedTTSProviderId}`;
  };


  const providers = getProviders();
  const models = getModels();
  const providersLoading = getProvidersLoading();
  const modelsLoading = getModelsLoading();
  const voicesLoadingState = getVoicesLoading();

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="space-y-6">
        {showHeader && (
          <div>
            <h3 className="text-lg font-medium">Text-to-Speech Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Voice synthesis settings and parameters
            </p>
          </div>
        )}
        <div className="flex items-center justify-center p-8">
          <InlineLoader size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h3 className="text-lg font-medium">Text-to-Speech Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Voice synthesis settings and parameters
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TTS Provider */}
        <FormField
          control={control}
          name="tts_provider_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">TTS Provider</FormLabel>
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
                Text-to-speech provider
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TTS Model */}
        <FormField
          control={control}
          name="tts_model_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">TTS Model</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))} 
                value={field.value ? field.value.toString() : ''} 
                disabled={modelsLoading || !watchedTTSProviderId}
                onOpenChange={(open) => open && mode === 'edit' && loadModels()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      mode === 'create' 
                        ? (!watchedTTSProviderId 
                            ? "Select provider first" 
                            : modelsLoading 
                              ? "Fetching models..." 
                              : "Select model")
                        : (!watchedTTSProviderId 
                            ? "Select provider first" 
                            : modelsLoading
                            ? "Fetching models..."
                            : "Select model")
                    }>
                      {field.value && !modelsLoading && models.length > 0 && (() => {
                        const selectedModel = mode === 'create' 
                          ? models.find(m => m.value === field.value)
                          : models.find(m => m.id === field.value);
                        
                        if (!selectedModel) return null;
                        
                        return (
                          <span>
                            {mode === 'create' 
                              ? selectedModel.label
                              : (selectedModel.display_name || selectedModel.model_name)
                            }
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!watchedTTSProviderId ? (
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
                        key={mode === 'create' ? model.value : model.id} 
                        value={String(mode === 'create' ? model.value : model.id)}
                      >
                        <div>
                          <div className="font-medium">
                            {mode === 'create' ? model.label : (model.display_name || model.model_name)}
                          </div>
                          {mode === 'create' && model.description && (
                            <div className="text-xs text-zinc-600">{model.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {!watchedTTSProviderId 
                  ? "Select a provider first to see available models"
                  : "Text-to-speech model variant"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* TTS Voice */}
      <FormField
        control={control}
        name="voice_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Voice</FormLabel>
            <div className="flex gap-2">
              <Popover open={openVoiceSelector} onOpenChange={setOpenVoiceSelector}>
                <PopoverTrigger asChild>
                <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openVoiceSelector}
                      className="flex-1 justify-between hover:bg-accent hover:text-accent-foreground"
                      disabled={getVoicesLoading() || !watchedTTSModelId}
                    >
                      <span className="truncate">
                        {!watchedTTSModelId 
                          ? "Select model first"
                          : getVoicesLoading()
                            ? "Loading voices..."
                            : field.value && getVoices().length > 0
                              ? (() => {
                                  const selectedVoice = getVoices().find(v => {
                                    const hasFullApiData = (v as any).display_name !== undefined && (v as any).gender !== undefined;
                                    const voiceId = hasFullApiData ? (v as Voice).id : (v as ContextVoice).value;
                                    return voiceId === field.value;
                                  });
                                  if (!selectedVoice) return 'Select voice...';
                                  
                                  // Check if we have full API data structure
                                  const hasFullApiData = (selectedVoice as any).display_name !== undefined && (selectedVoice as any).gender !== undefined;
                                  
                                  const displayName = hasFullApiData 
                                    ? (selectedVoice as Voice).display_name || (selectedVoice as Voice).voice_name
                                    : (selectedVoice as ContextVoice).label;
                                  const language = hasFullApiData 
                                    ? ((selectedVoice as Voice).tts_model?.supported_languages?.[0] || 'Default Language')
                                    : 'Default Language';
                                  const description = hasFullApiData 
                                    ? (selectedVoice as Voice).description
                                    : (selectedVoice as ContextVoice).description;
                                  const gender = hasFullApiData 
                                    ? (selectedVoice as Voice).gender
                                    : 'Unknown';
                                  return `${displayName} (${description || 'No description'}, ${gender})`;
                                })()
                              : "Select voice..."
                        }
                        </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 overflow-hidden" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command className="[&_[cmdk-item]]:opacity-100 [&_[cmdk-item]]:text-foreground [&_[cmdk-item]]:cursor-pointer">
                    <CommandInput
                      placeholder="Search voices..."
                      value={voiceSearchQuery}
                      onValueChange={setVoiceSearchQuery}
                    />
                    <CommandList className="max-h-[300px]">
                      <div className="h-full overflow-auto">
                  {!watchedTTSModelId ? (
                          <CommandEmpty>
                      Please select a model first
                          </CommandEmpty>
                        ) : getVoicesLoading() ? (
                          <div className="py-6 text-center text-sm flex items-center justify-center gap-2">
                            <InlineLoader size="sm" />
                      Loading voices...
                          </div>
                        ) : getVoices().length === 0 ? (
                          <CommandEmpty>
                      No voices available for selected model
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {getVoices()
                              .filter(voice => {
                                if (!voiceSearchQuery) return true;
                                const searchLower = voiceSearchQuery.toLowerCase();
                                
                                // Check if we have full API data structure
                                const hasFullApiData = (voice as any).display_name !== undefined && (voice as any).gender !== undefined;
                                
                                const voiceName = hasFullApiData ? (voice as Voice).voice_name : (voice as ContextVoice).label;
                                const displayName = hasFullApiData 
                                  ? (voice as Voice).display_name || (voice as Voice).voice_name
                                  : (voice as ContextVoice).label;
                                const language = hasFullApiData 
                                  ? ((voice as Voice).tts_model?.supported_languages?.[0] || 'Default Language')
                                  : 'Default Language';
                                const gender = hasFullApiData 
                                  ? (voice as Voice).gender
                                  : 'Unknown';
                                const description = hasFullApiData 
                                  ? (voice as Voice).description
                                  : (voice as ContextVoice).description;
                                return (
                                  displayName.toLowerCase().includes(searchLower) ||
                                  language.toLowerCase().includes(searchLower) ||
                                  (gender && gender.toLowerCase().includes(searchLower)) ||
                                  (description && description.toLowerCase().includes(searchLower))
                                );
                              })
                              .map((voice) => {
                                // Check if we have full API data structure (has display_name, gender, etc.)
                                const hasFullApiData = (voice as any).display_name !== undefined && (voice as any).gender !== undefined;
                                
                                const voiceId = hasFullApiData ? (voice as Voice).id : (voice as ContextVoice).value;
                                const isSelected = field.value === voiceId;
                                const displayName = hasFullApiData 
                                  ? (voice as Voice).display_name || (voice as Voice).voice_name
                                  : (voice as ContextVoice).label;
                                const language = hasFullApiData 
                                  ? ((voice as Voice).tts_model?.supported_languages?.[0] || 'Default Language')
                                  : 'Default Language';
                                const gender = hasFullApiData 
                                  ? (voice as Voice).gender
                                  : 'Unknown';
                                const description = hasFullApiData 
                                  ? (voice as Voice).description
                                  : (voice as ContextVoice).description;
                                
                                return (
                                  <CommandItem
                                    key={voiceId}
                                    value={`${displayName} ${language} ${gender}`.toLowerCase()}
                                    style={{ opacity: 1, pointerEvents: 'auto', cursor: 'pointer' }}
                                    className="cursor-pointer opacity-100 text-foreground hover:bg-accent"
                                    onSelect={() => {
                                      field.onChange(voiceId);
                                      setOpenVoiceSelector(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                            <MetallicAvatar 
                              type="voice" 
                              size="small" 
                                        voiceLabel={displayName}
                              className="h-8 w-8"
                            />
                                      <div className="flex-1">
                                        <div className="font-medium text-foreground" style={{ opacity: 1 }}>
                                          {displayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {description || 'No description'} • {gender}
                                        </div>
                            </div>
                          </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                        )}
                      </div>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {mode === 'create' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestVoice}
                  disabled={!watchedVoiceId || getVoicesLoading() || !watchedTTSModelId}
                  className="px-3"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormDescription>
              {!watchedTTSModelId 
                ? "Select a model first to see available voices"
                : "Neural voice for speech synthesis"
              }
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Speech Speed */}
        <FormField
          control={control}
          name="speech_speed"
          render={({ field }) => {
            // Ensure speech_speed has a valid numeric value
            const speechSpeedValue = typeof field.value === 'number' && !isNaN(field.value) 
              ? field.value 
              : 1.0;
            
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Speech Speed</FormLabel>
                  <span className="text-sm text-zinc-600">{speechSpeedValue.toFixed(1)}x</span>
                </div>
                <FormControl>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={[speechSpeedValue]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Speech rate multiplier (0.5x = slow, 2.0x = fast)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Pitch */}
        <FormField
          control={control}
          name="pitch"
          render={({ field }) => {
            // Parse pitch value consistently for both modes
            const parsePitchValue = (pitchValue: string | number | undefined | null) => {
              if (pitchValue === undefined || pitchValue === null) {
                return 0;
              }
              if (typeof pitchValue === 'string') {
                // Handle percentage format like "0%", "5%", "-10%"
                const match = pitchValue.match(/^(-?\d+)%?$/);
                return match ? parseInt(match[1]) : 0;
              }
              return typeof pitchValue === 'number' ? pitchValue : 0;
            };

            const currentPitchValue = parsePitchValue(field.value);
            
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Pitch</FormLabel>
                  <span className="text-sm text-zinc-600">
                    {currentPitchValue}%
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={-50}
                    max={50}
                    step={1}
                    value={[currentPitchValue]}
                    onValueChange={(value) => field.onChange(`${value[0]}%`)}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Voice pitch adjustment (-50% = lower, +50% = higher)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

      </div>

      {/* TTS Features and Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-zinc-600" />
          <h4 className="text-sm font-medium text-zinc-900">Speech Synthesis Features</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Call Recording */}
          <FormField
            control={control}
            name="call_recording"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Call Recording</FormLabel>
                  <FormDescription>
                    Record calls for quality and training
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

        {/* Voice Preview - Only show in create mode */}
        {mode === 'create' && (
          <div className="rounded-lg border bg-zinc-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-zinc-600" />
              <h4 className="text-sm font-medium text-zinc-900">Voice Preview</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-zinc-600">
                {!watchedTTSModelId 
                  ? "Select a model first to configure voice settings"
                  : (() => {
                      const selectedVoice = getVoices().find(v => {
                        const hasFullApiData = (v as any).display_name !== undefined && (v as any).gender !== undefined;
                        const voiceId = hasFullApiData ? (v as Voice).id : (v as ContextVoice).value;
                        return voiceId === watchedVoiceId;
                      });
                      const displayName = selectedVoice 
                        ? (() => {
                            const hasFullApiData = (selectedVoice as any).display_name !== undefined && (selectedVoice as any).gender !== undefined;
                            const voiceName = hasFullApiData ? (selectedVoice as Voice).voice_name : (selectedVoice as ContextVoice).label;
                            return hasFullApiData 
                              ? (selectedVoice as Voice).display_name || (selectedVoice as Voice).voice_name
                              : (selectedVoice as ContextVoice).label;
                          })()
                        : 'No voice selected';
                      return `Current settings: ${displayName} at ${watchedSpeechSpeed}x speed with ${watchedPitch} pitch`;
                    })()
                }
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestVoice}
                disabled={!watchedVoiceId || voicesLoadingState || !watchedTTSModelId}
                className="gap-2"
              >
                <Play className="h-3 w-3" />
                Test Voice
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
