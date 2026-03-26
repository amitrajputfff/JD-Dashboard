'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

import { AssistantSchema } from '@/types/assistant';
import { useCreateAssistant } from '@/lib/hooks/use-assistant-api';
import { DEMO_MESSAGES } from '@/lib/constants/demo-messages';
import { templatesApi, AgentTemplateResponse } from '@/lib/api/templates';
import { templateToFormDefaults, fetchTemplateProviderIds } from '@/lib/utils/template-to-form';

import { AppSidebar } from "@/components/app-sidebar"
import { TutorialOverlay } from "@/components/tutorial"
import { CreateAgentProvider } from "@/contexts/create-agent-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Bot, Volume2, Mic, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Form sections components
import { BasicInfoSection } from './sections/basic-info-section';
import LLMConfigSection from '@/components/agents/llm-config-section';
import TTSConfigSection from '@/components/agents/tts-config-section';
import STTConfigSection from '@/components/agents/stt-config-section';
import AdvancedSettingsSection from './sections/advanced-settings-section';

function CreateAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiConfigParam = searchParams.get('ai-config');
  const templateParam = searchParams.get('template');
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('basic-info');
  const [aiGeneratedConfig] = useState(aiConfigParam ? JSON.parse(decodeURIComponent(aiConfigParam)) : null);
  const [templateData, setTemplateData] = useState<AgentTemplateResponse | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const loadedTemplateIdRef = React.useRef<string | null>(null);

  // Get default values from template, AI config, or use defaults
  const getDefaultValues = () => {
    // Priority: template > AI config > defaults
    if (templateData) {
      return templateToFormDefaults(templateData);
    }
    if (aiGeneratedConfig) {
      return {
        name: aiGeneratedConfig.name,
        description: aiGeneratedConfig.description || '',
        category: 'Customer Service',
        tags: aiGeneratedConfig.tags || [],
        llm_provider_id: undefined,
        llm_model_id: undefined,
        prompt: aiGeneratedConfig.systemPrompt || 'You are a helpful AI assistant.',
        temperature: aiGeneratedConfig.temperature || 0.7,
        max_token: aiGeneratedConfig.maxTokens || 250,
        memory_enabled: aiGeneratedConfig.memoryEnabled ?? false,
        max_memory_retrieval: aiGeneratedConfig.maxMemoryRetrieval || 5,
        tts_provider_id: undefined,
        tts_model_id: undefined,
        voice_id: undefined,
        speech_speed: aiGeneratedConfig.speakingRate || 1.0,
        pitch: '0%',
        stt_provider_id: undefined,
        stt_model_id: undefined,
        language_id: 11,
        call_recording: aiGeneratedConfig.callRecording !== false,
        voice_activity_detection: aiGeneratedConfig.vadEnabled !== false,
        barge_in: aiGeneratedConfig.bargeInEnabled !== false,
        noise_suppression: aiGeneratedConfig.backgroundNoiseSuppression !== false,
        function_calling: aiGeneratedConfig.functionCalling || false,
        functions: aiGeneratedConfig.functionSchema ? [aiGeneratedConfig.functionSchema] : [],
        function_url: '',
        http_method: 'POST',
        body_format: 'json',
        headers: {},
        query_params: {},
        custom_body: '',
        max_call_duration: (aiGeneratedConfig.maxCallDuration || 30) * 60,
        silence_timeout: aiGeneratedConfig.silenceTimeout || 15,
        cutoff_seconds: 5,
        ideal_time_seconds: 30,
        is_transferable: false,
        transfer_number: '',
        initial_message: DEMO_MESSAGES.initial,
        call_end_text: DEMO_MESSAGES.callEnd,
        filler_message: DEMO_MESSAGES.filler,
        function_filler_message: [],
        has_knowledge_base: false,
        documents_ids: null,
      };
    }

    return {
      name: '',
      description: '',
      category: 'Customer Service',
      tags: [],
      llm_provider_id: undefined,
      llm_model_id: undefined,
      prompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      max_token: 250,
      memory_enabled: false,
      max_memory_retrieval: 5,
      tts_provider_id: undefined,
      tts_model_id: undefined,
      voice_id: undefined,
      speech_speed: 1.0,
      pitch: '0%',
      stt_provider_id: undefined,
      stt_model_id: undefined,
      language_id: 11,
      call_recording: true,
      voice_activity_detection: true,
      barge_in: true,
      noise_suppression: true,
      function_calling: false,
      functions: [],
      max_call_duration: 1800,
      silence_timeout: 15,
      cutoff_seconds: 5,
      ideal_time_seconds: 30,
      is_transferable: false,
      transfer_number: '',
      initial_message: DEMO_MESSAGES.initial,
      call_end_text: DEMO_MESSAGES.callEnd,
      filler_message: DEMO_MESSAGES.filler,
      function_filler_message: [],
      has_knowledge_base: false,
      documents_ids: null,
    };
  };

  // Initialize form
  const form = useForm<any>({
    resolver: zodResolver(AssistantSchema),
    defaultValues: getDefaultValues(),
  });

  // Get AI assistant creator hook
  const { createAssistant, isLoading: isSubmitting } = useCreateAssistant();

  const { handleSubmit, control, watch, setValue, reset, formState: { errors } } = form;

  // Fetch template data if template parameter exists
  useEffect(() => {
    if (templateParam && templateParam !== loadedTemplateIdRef.current) {
      setIsLoadingTemplate(true);
      templatesApi.getTemplateById(templateParam)
        .then((data) => {
          setTemplateData(data);
          loadedTemplateIdRef.current = templateParam;
          toast.success(`Loaded template: ${data.name}`);
        })
        .catch((error) => {
          console.error('Error loading template:', error);
          toast.error('Failed to load template');
        })
        .finally(() => {
          setIsLoadingTemplate(false);
        });
    }
  }, [templateParam]);

  // Reset form when template data is loaded
  useEffect(() => {
    if (templateData) {
      const formDefaults = templateToFormDefaults(templateData);
      reset(formDefaults);
      
      // Fetch and set provider IDs asynchronously
      fetchTemplateProviderIds(templateData).then((providerIds) => {
        if (providerIds.llm_provider_id) {
          setValue('llm_provider_id', providerIds.llm_provider_id);
        }
        if (providerIds.tts_provider_id) {
          setValue('tts_provider_id', providerIds.tts_provider_id);
        }
        if (providerIds.stt_provider_id) {
          setValue('stt_provider_id', providerIds.stt_provider_id);
        }
      });
    }
  }, [templateData, reset, setValue]);

  // Function to determine which sections have errors
  const getSectionErrors = useCallback(() => {
    const sectionErrors: Record<string, boolean> = {
      'basic-info': false,
      'llm-config': false,
      'tts-config': false,
      'stt-config': false,
      'knowledge-base': false,
      'advanced-settings': false,
    };

    if (!errors || Object.keys(errors).length === 0) {
      return sectionErrors;
    }

    // Map form fields to their respective sections
    const fieldToSection: Record<string, string> = {
      // Basic Info fields
      'name': 'basic-info',
      'description': 'basic-info',
      'category': 'basic-info',
      'tags': 'basic-info',
      
      // LLM Config fields
      'llm_provider_id': 'llm-config',
      'llm_model_id': 'llm-config',
      'prompt': 'llm-config',
      'temperature': 'llm-config',
      'max_token': 'llm-config',
      
      // TTS Config fields
      'tts_provider_id': 'tts-config',
      'tts_model_id': 'tts-config',
      'voice_id': 'tts-config',
      'speech_speed': 'tts-config',
      'pitch': 'tts-config',
      
      // STT Config fields
      'stt_provider_id': 'stt-config',
      'stt_model_id': 'stt-config',
      'language_id': 'stt-config',
      
      // Knowledge Base fields
      'has_knowledge_base': 'knowledge-base',
      'documents_ids': 'knowledge-base',
      
      // Advanced Settings fields
      'call_recording': 'advanced-settings',
      'voice_activity_detection': 'advanced-settings',
      'barge_in': 'advanced-settings',
      'noise_suppression': 'advanced-settings',
      'function_calling': 'advanced-settings',
      'functions': 'advanced-settings',
      'max_call_duration': 'advanced-settings',
      'silence_timeout': 'advanced-settings',
    };

    // Check which sections have errors
    Object.keys(errors).forEach(field => {
      const section = fieldToSection[field];
      if (section) {
        sectionErrors[section] = true;
      }
    });

    return sectionErrors;
  }, [errors]);

  // Watch for provider IDs to pass to context
  const watchedLLMProviderId = watch('llm_provider_id');
  const watchedTTSProviderId = watch('tts_provider_id');
  const watchedTTSModelId = watch('tts_model_id');
  const watchedSTTProviderId = watch('stt_provider_id');

  // Reset form when AI config changes
  useEffect(() => {
    if (aiGeneratedConfig) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
      toast.success(`AI-generated configuration loaded successfully!`, {
        description: `Your agent has been configured based on your business requirements.`
      });
    }
  }, [aiGeneratedConfig, reset]);

  // Watch for form changes to show dirty state warning
  React.useEffect(() => {
    const subscription = watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Validation function for required fields (only when not saving as draft)
  const validateRequiredFields = (data: any) => {
    const missingFields = [];
    
    if (!data.llm_model_id) missingFields.push('LLM Model');
    if (!data.language_id) missingFields.push('Language');
    if (!data.stt_model_id) missingFields.push('STT Model');
    if (!data.tts_model_id) missingFields.push('TTS Model');
    if (!data.voice_id) missingFields.push('Voice');
    
    return missingFields;
  };

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      // Validate required fields for active assistants
      const missingFields = validateRequiredFields(data);
      if (missingFields.length > 0) {
        toast.error('Missing Required Fields', {
          description: `Please configure: ${missingFields.join(', ')}. Or save as draft to continue later.`,
        });
        return;
      }

      // Process multiple functions data
      let functionsData: any[] | null = null;
      
      if (data.function_calling && data.functions && Array.isArray(data.functions) && data.functions.length > 0) {
        const validFunctions = data.functions.filter((func: any) => {
          // Only include functions that have at least a name or URL
          return func && (func.name || func.url);
        });
        
        if (validFunctions.length > 0) {
          functionsData = validFunctions.map((func: any) => ({
            name: func.name || '',
            description: func.description || '',
            url: func.url || '',
            method: func.method || 'POST',
            headers: func.headers || {},
            query_params: func.query_params || {},
            body_format: func.body_format || 'json',
            custom_body: func.custom_body || '',
            schema: func.schema || {}
          }));
        }
      }
      
      // Clean up old function fields and set new data
      const { 
        function_url, 
        http_method, 
        headers, 
        query_params, 
        body_format, 
        custom_body, 
        ...cleanData 
      } = data;
      
      // Set status to Active when publishing and handle transfer number logic
      const assistantData = {
        ...cleanData,
        functions: functionsData,
        status: 'Active',
        // Always send transfer_number as null if not set
        transfer_number: cleanData.transfer_number || null,
        // Ensure NULL values for missing IDs
        llm_model_id: cleanData.llm_model_id || null,
        stt_model_id: cleanData.stt_model_id || null,
        tts_model_id: cleanData.tts_model_id || null,
        voice_id: cleanData.voice_id || null
      };
      
      const result = await createAssistant(assistantData);
      
      if (result.success) {
        toast.success('Agent created successfully!');
        setIsDirty(false);
        router.push('/agents');
      } else {
        toast.error(result.error || 'Failed to Create Agent', {
          description: 'Please check your inputs and try again.'
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred while creating agent', {
        description: 'Please try again or contact support if the issue persists.'
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Validate at least the required fields (name and description)
      const formData = form.getValues();
      
      // Check required fields
      if (!formData.name || formData.name.trim().length < 2) {
        toast.error('Name is required (minimum 2 characters)');
        return;
      }
      
      if (!formData.description || formData.description.trim().length < 1) {
        toast.error('Description is required');
        return;
      }
      
      // Combine function configuration into a single object (same as onSubmit)
      let functionsData: any[] = [];
      
      if (formData.function_calling && formData.functions && formData.functions[0]) {
        try {
          // Parse the function schema
          const functionSchema = JSON.parse(formData.functions[0]);
          
          // Create the complete function configuration object
          const functionConfig = {
            url: formData.function_url || '',
            method: formData.http_method || 'POST',
            headers: formData.headers || {},
            query_params: formData.query_params || {},
            body_format: formData.body_format || 'json',
            custom_body: formData.custom_body || '',
            schema: functionSchema
          };
          
          functionsData = [functionConfig];
        } catch (error) {
          console.warn('Invalid function schema JSON:', error);
          // If JSON is invalid, still include the configuration without schema
          const functionConfig = {
            url: formData.function_url || '',
            method: formData.http_method || 'POST',
            headers: formData.headers || {},
            query_params: formData.query_params || {},
            body_format: formData.body_format || 'json',
            custom_body: formData.custom_body || '',
            schema: {}
          };
          
          functionsData = [functionConfig];
        }
      }
      
      // Set status to draft when saving as draft and handle transfer number logic
      const assistantData = {
        ...formData,
        functions: functionsData,
        status: 'Draft',
        // Always send transfer_number as null if not set
        transfer_number: formData.transfer_number || null
      };
      
      const result = await createAssistant(assistantData);
      
      if (result.success) {
        toast.success('Agent saved as draft successfully!');
        setIsDirty(false);
        router.push('/agents');
      } else {
        toast.error(result.error || 'Failed to save draft');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while saving draft');
    }
  };

  // Handle navigation with unsaved changes check
  const handleNavigationWithCheck = useCallback((navigationFn: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => navigationFn);
      setShowUnsavedChangesDialog(true);
    } else {
      navigationFn();
    }
  }, [isDirty]);

  // Handle saving changes from unsaved changes dialog
  const handleSaveChanges = useCallback(async () => {
    try {
      await handleSaveDraft();
      setShowUnsavedChangesDialog(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  }, [pendingNavigation]);

  // Handle discarding changes from unsaved changes dialog
  const handleDiscardChanges = useCallback(() => {
    setIsDirty(false);
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Handle navigation warning
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <>
      <TutorialOverlay />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-8">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      JustDial
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/agents">
                      AI Agents
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Agent</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {isDirty && (
              <div className="ml-auto mr-8">
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  Unsaved changes
                </Badge>
              </div>
            )}
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigationWithCheck(() => router.back())}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold tracking-tight">
                      {templateData 
                        ? `Create Agent from Template`
                        : aiGeneratedConfig 
                        ? 'Create AI-Generated Agent' 
                        : 'Create Agent'
                      }
                    </h1>
                    {isLoadingTemplate && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Loading template...
                      </Badge>
                    )}
                    {templateData && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-sm">
                          📋
                        </div>
                        <span className="text-sm font-medium">{templateData.name}</span>
                      </div>
                    )}
                    {aiGeneratedConfig && !templateData && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-sm">
                          🤖
                        </div>
                        <span className="text-sm font-medium">AI Generated</span>
                      </div>
                    )}

                  </div>
                  <p className="text-sm text-muted-foreground">
                    {templateData
                      ? `Using template: ${templateData.description}`
                      : aiGeneratedConfig 
                      ? 'Configuration automatically generated based on your business requirements'
                      : 'Configure your AI agent with advanced settings and integrations'
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
                <Button 
                  type="submit" 
                  form="assistant-form"
                  disabled={isSubmitting}
                  className="min-w-32"
                  data-tutorial="create-button"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Agent'}
                </Button>
              </div>
            </div>

            <CreateAgentProvider
              llmProviderId={watchedLLMProviderId}
              ttsProviderId={watchedTTSProviderId}
              ttsModelId={watchedTTSModelId}
              sttProviderId={watchedSTTProviderId}
            >
              <Form {...form}>
                <form id="assistant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Simple Tab Navigation */}
                <div className="w-full text-sm">
                  {/* Tab Headers */}
                  <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
                  {[
                    { title: "Basic Info", value: "basic-info", icon: User, tutorial: "basic-info-tab" },
                    { title: "LLM Config", value: "llm-config", icon: Bot, tutorial: "llm-tab" },
                    { title: "Text-to-Speech", value: "tts-config", icon: Volume2, tutorial: "tts-tab" },
                    { title: "Speech-to-Text", value: "stt-config", icon: Mic, tutorial: "stt-tab" },
                    { title: "Advanced", value: "advanced-settings", icon: Settings, tutorial: "advanced-tab" },
                  ].map((tab: any) => {
                      const sectionErrors = getSectionErrors();
                      const hasError = sectionErrors[tab.value] || false;
                      
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setActiveTab(tab.value)}
                          data-tutorial={tab.tutorial}
                          className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                            activeTab === tab.value
                              ? 'bg-zinc-900 text-white'
                              : hasError
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          <tab.icon className="h-4 w-4" />
                          {tab.title}
                          {hasError && (
                            <div className="h-2 w-2 rounded-full bg-red-500 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  <div className="w-full">
                    {activeTab === 'basic-info' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Basic Information</CardTitle>
                          <CardDescription>
                            Essential details about your agent
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6" data-tutorial="basic-info-section">
                          <BasicInfoSection 
                            control={control} 
                            watch={watch} 
                            setValue={setValue} 
                            errors={errors}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {activeTab === 'llm-config' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>LLM Configuration</CardTitle>
                          <CardDescription>
                            Language model settings and behavior
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <LLMConfigSection 
                            control={control} 
                            watch={watch} 
                            setValue={setValue} 
                            mode="create"
                            showHeader={false}
                            errors={errors}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {activeTab === 'tts-config' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Text-to-Speech</CardTitle>
                          <CardDescription>
                            Voice synthesis and speech settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <TTSConfigSection 
                            control={control} 
                            watch={watch} 
                            setValue={setValue} 
                            mode="create"
                            showHeader={false}
                            errors={errors}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {activeTab === 'stt-config' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Speech-to-Text</CardTitle>
                          <CardDescription>
                            Speech recognition and language settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <STTConfigSection 
                            control={control} 
                            watch={watch} 
                            setValue={setValue} 
                            mode="create"
                            showHeader={false}
                            errors={errors}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {activeTab === 'advanced-settings' && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Advanced Settings</CardTitle>
                          <CardDescription>
                            Function calling and call transfer settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <AdvancedSettingsSection 
                            control={control} 
                            watch={watch} 
                            setValue={setValue} 
                            errors={errors}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>


                </form>
              </Form>
            </CreateAgentProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>

    {/* Unsaved Changes Confirmation Dialog */}
    <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes that will be lost if you continue. What would you like to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowUnsavedChangesDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDiscardChanges}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            Discard Changes
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default function CreateAssistantPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAssistantPageContent />
    </Suspense>
  );
}
