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

import { AppSidebar } from '@/components/app-sidebar';
import { TutorialOverlay } from '@/components/tutorial';
import { CreateAgentProvider } from '@/contexts/create-agent-context';
import { TestAssistantDialog } from '@/components/test-assistant-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  FileText,
  Settings,
  CheckCircle2,
  Circle,
  ChevronRight,
  Bot,
  Phone,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

import { BasicInfoSection } from './sections/basic-info-section';
import LLMConfigSection from '@/components/agents/llm-config-section';
import AdvancedSettingsSection from './sections/advanced-settings-section';

const STEPS = [
  {
    id: 'basic-info',
    title: 'Basic Info',
    description: 'Name, purpose & opening/closing lines',
    icon: User,
    requiredFields: ['name', 'description'],
  },
  {
    id: 'llm-config',
    title: 'Prompt',
    description: 'System prompt & agent instructions',
    icon: FileText,
    requiredFields: [],
  },
  {
    id: 'advanced-settings',
    title: 'Advanced',
    description: 'API functions & call settings',
    icon: Settings,
    requiredFields: [],
  },
] as const;

type StepId = typeof STEPS[number]['id'];

function AgentPreviewPanel({
  initialMessage,
  agentName,
  onTestLive,
}: {
  initialMessage: string;
  agentName: string;
  onTestLive: () => void;
}) {
  const [messages, setMessages] = useState<{ role: 'agent' | 'user'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Update first message when initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setMessages([{ role: 'agent', text: initialMessage }]);
    }
  }, [initialMessage]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: "I'm a preview simulation — publish the agent to test live responses.",
        },
      ]);
    }, 1200);
  };

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Preview header */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">
              {agentName || 'Your Agent'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Preview mode</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'agent' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-background border rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-background border rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            className="text-xs h-8"
            placeholder="Simulate a user message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button size="sm" className="h-8 px-3 shrink-0" onClick={sendMessage}>
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Simulation only · Publish to test live
        </p>
      </div>
    </div>
  );
}

function CreateAssistantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiConfigParam = searchParams.get('ai-config');
  const templateParam = searchParams.get('template');

  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<StepId>('basic-info');
  const [aiGeneratedConfig] = useState(
    aiConfigParam ? JSON.parse(decodeURIComponent(aiConfigParam)) : null,
  );
  const [templateData, setTemplateData] = useState<AgentTemplateResponse | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showTestModeDialog, setShowTestModeDialog] = useState(false);
  const [showChatPreviewDialog, setShowChatPreviewDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const loadedTemplateIdRef = React.useRef<string | null>(null);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  const getDefaultValues = () => {
    if (templateData) return templateToFormDefaults(templateData);
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

  const form = useForm<any>({
    resolver: zodResolver(AssistantSchema),
    defaultValues: getDefaultValues(),
  });

  const { createAssistant, isLoading: isSubmitting } = useCreateAssistant();
  const { handleSubmit, control, watch, setValue, reset, formState: { errors } } = form;

  const watchedName = watch('name');
  const watchedInitialMessage = watch('initial_message');

  // Step completion based on filled required fields
  const getStepCompletion = useCallback(() => {
    const values = form.getValues();
    return STEPS.map((step) => ({
      id: step.id,
      completed:
        step.requiredFields.length === 0 ||
        step.requiredFields.every((f) => {
          const v = values[f];
          return v !== undefined && v !== null && v !== '';
        }),
    }));
  }, [form]);

  const completedCount = getStepCompletion().filter((s) => s.completed).length;
  const progressPercent = (completedCount / STEPS.length) * 100;

  useEffect(() => {
    if (templateParam && templateParam !== loadedTemplateIdRef.current) {
      setIsLoadingTemplate(true);
      templatesApi
        .getTemplateById(templateParam)
        .then((data) => {
          setTemplateData(data);
          loadedTemplateIdRef.current = templateParam;
          toast.success(`Loaded template: ${data.name}`);
        })
        .catch(() => toast.error('Failed to load template'))
        .finally(() => setIsLoadingTemplate(false));
    }
  }, [templateParam]);

  useEffect(() => {
    if (templateData) {
      const formDefaults = templateToFormDefaults(templateData);
      reset(formDefaults);
      fetchTemplateProviderIds(templateData).then((providerIds) => {
        if (providerIds.llm_provider_id) setValue('llm_provider_id', providerIds.llm_provider_id);
        if (providerIds.tts_provider_id) setValue('tts_provider_id', providerIds.tts_provider_id);
        if (providerIds.stt_provider_id) setValue('stt_provider_id', providerIds.stt_provider_id);
      });
    }
  }, [templateData, reset, setValue]);

  useEffect(() => {
    if (aiGeneratedConfig) {
      reset(getDefaultValues());
      toast.success('AI-generated configuration loaded!');
    }
  }, [aiGeneratedConfig, reset]);

  useEffect(() => {
    const subscription = watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validateRequiredFields = (data: any) => {
    const missing = [];
    if (!data.prompt || data.prompt.trim().length < 10) missing.push('System Prompt');
    return missing;
  };

  const onSubmit = async (data: any) => {
    try {
      const missing = validateRequiredFields(data);
      if (missing.length > 0) {
        toast.error('Missing Required Fields', {
          description: `Please configure: ${missing.join(', ')}`,
        });
        return;
      }
      let functionsData: any[] | null = null;
      if (data.function_calling && data.functions?.length > 0) {
        const valid = data.functions.filter((f: any) => f?.name || f?.url);
        if (valid.length > 0) {
          functionsData = valid.map((f: any) => ({
            name: f.name || '',
            description: f.description || '',
            url: f.url || '',
            method: f.method || 'POST',
            headers: f.headers || {},
            query_params: f.query_params || {},
            body_format: f.body_format || 'json',
            custom_body: f.custom_body || '',
            schema: f.schema || {},
          }));
        }
      }
      const { function_url, http_method, headers, query_params, body_format, custom_body, ...cleanData } = data;
      const assistantData = {
        ...cleanData,
        functions: functionsData,
        status: 'Active',
        transfer_number: cleanData.transfer_number || null,
        llm_model_id: cleanData.llm_model_id || null,
        stt_model_id: cleanData.stt_model_id || null,
        tts_model_id: cleanData.tts_model_id || null,
        voice_id: cleanData.voice_id || null,
      };
      const result = await createAssistant(assistantData);
      if (result.success) {
        toast.success('Agent created successfully!');
        setIsDirty(false);
        router.push('/agents');
      } else {
        toast.error(result.error || 'Failed to Create Agent');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const formData = form.getValues();
      if (!formData.name?.trim() || formData.name.trim().length < 2) {
        toast.error('Name is required (minimum 2 characters)');
        return;
      }
      if (!formData.description?.trim()) {
        toast.error('Description is required');
        return;
      }
      const result = await createAssistant({ ...formData, status: 'Draft', transfer_number: formData.transfer_number || null });
      if (result.success) {
        toast.success('Agent saved as draft!');
        setIsDirty(false);
        router.push('/agents');
      } else {
        toast.error(result.error || 'Failed to save draft');
      }
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const handleNavigationWithCheck = useCallback(
    (fn: () => void) => {
      if (isDirty) { setPendingNavigation(() => fn); setShowUnsavedChangesDialog(true); }
      else fn();
    },
    [isDirty],
  );

  const handleSaveChanges = useCallback(async () => {
    await handleSaveDraft();
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) { pendingNavigation(); setPendingNavigation(null); }
  }, [pendingNavigation]);

  const handleDiscardChanges = useCallback(() => {
    setIsDirty(false);
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) { pendingNavigation(); setPendingNavigation(null); }
  }, [pendingNavigation]);

  const activeStep = STEPS.find((s) => s.id === activeTab)!;
  const stepCompletion = getStepCompletion();
  const hasSectionError = (stepId: string) => {
    const fieldMap: Record<string, string[]> = {
      'basic-info': ['name', 'description'],
      'llm-config': ['prompt'],
      'advanced-settings': ['functions', 'max_call_duration'],
    };
    return (fieldMap[stepId] || []).some((f) => !!errors[f]);
  };

  // Mock assistant for the test dialog (live preview requires a real agent ID)
  const previewAssistant = {
    id: 'preview-draft',
    name: watchedName || 'Draft Agent',
    description: 'Preview mode – this agent has not been published yet.',
    status: 'active' as const,
  };

  return (
    <>
      <TutorialOverlay />
      <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-full">

            {/* ── Top bar ── */}
            <header className="flex min-h-[56px] shrink-0 items-center border-b bg-background px-6 py-3 transition-[width,height] ease-linear">
              {/* Left cluster */}
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-5 data-[orientation=vertical]:h-5" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleNavigationWithCheck(() => router.back())}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-5 data-[orientation=vertical]:h-5" />

                {/* Editable agent name */}
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    className="text-sm font-semibold bg-transparent border-b-2 border-primary outline-none py-0.5 min-w-[180px] max-w-[300px]"
                    value={watchedName || ''}
                    onChange={(e) => setValue('name', e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    placeholder="Untitled Agent"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 group rounded px-1 py-0.5 hover:bg-accent transition-colors max-w-[300px]"
                  >
                    <span className="text-sm font-semibold truncate">
                      {watchedName || 'Untitled Agent'}
                    </span>
                    <span className="text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity text-xs shrink-0">✏</span>
                  </button>
                )}

                {/* Status badges — tightly coupled to agent name */}
                {isDirty && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[11px] px-2 shrink-0">
                    Unsaved
                  </Badge>
                )}
                {isLoadingTemplate && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 text-[11px] px-2 shrink-0">
                    Loading template...
                  </Badge>
                )}
                {templateData && (
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 gap-1 text-[11px] px-2 shrink-0">
                    📋 {templateData.name}
                  </Badge>
                )}
                {aiGeneratedConfig && !templateData && (
                  <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 gap-1 text-[11px] px-2 shrink-0">
                    <Sparkles className="w-3 h-3" /> AI Generated
                  </Badge>
                )}
              </div>

              {/* Right cluster — action buttons */}
              <div className="ml-auto flex items-center gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-5 text-sm gap-2"
                  onClick={() => setShowTestModeDialog(true)}
                >
                  <Bot className="w-3.5 h-3.5" />
                  Test Agent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-5 text-sm"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  form="assistant-form"
                  disabled={isSubmitting}
                  className="h-9 px-5 text-sm gap-2"
                  data-tutorial="create-button"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Publishing...' : 'Publish Agent'}
                </Button>
              </div>
            </header>

            {/* ── Main 2-panel layout ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* ── Step sidebar ── */}
              <nav className="w-[232px] shrink-0 border-r flex flex-col pt-5 pb-6 px-4 bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 px-3 mb-4">
                  Configuration
                </p>

                <div className="flex flex-col gap-1">
                  {STEPS.map((step, index) => {
                    const completion = stepCompletion.find((s) => s.id === step.id);
                    const isActive = activeTab === step.id;
                    const isCompleted = completion?.completed ?? false;
                    const hasError = hasSectionError(step.id);
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveTab(step.id)}
                        className={[
                          'flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : hasError
                            ? 'hover:bg-red-50 text-red-700'
                            : 'hover:bg-accent/70 text-foreground',
                        ].join(' ')}
                      >
                        {/* Step icon container */}
                        <div className={[
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                          isActive
                            ? 'bg-white/20'
                            : isCompleted
                            ? 'bg-primary/10'
                            : 'bg-background border border-border/60',
                        ].join(' ')}>
                          {isCompleted && !isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : hasError ? (
                            <Circle className="w-4 h-4 text-red-500 fill-red-100" />
                          ) : (
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                          )}
                        </div>

                        {/* Labels */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold leading-snug ${isActive ? 'text-white' : ''}`}>
                            {step.title}
                          </p>
                          <p className={`text-[10px] leading-snug truncate mt-0.5 ${isActive ? 'text-white/65' : 'text-muted-foreground'}`}>
                            {step.description}
                          </p>
                        </div>

                        {/* Right indicator */}
                        {isActive ? (
                          <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />
                        ) : (
                          <span className={[
                            'shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
                            isCompleted ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground/60',
                          ].join(' ')}>
                            {index + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress footer */}
                <div className="mt-auto pt-5 border-t border-border/50 mx-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-muted-foreground font-medium">Completion</span>
                    <span className="text-[11px] font-bold text-primary">{completedCount}/{STEPS.length}</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground/70 mt-2">
                    {completedCount === STEPS.length
                      ? '✓ Ready to publish'
                      : `${STEPS.length - completedCount} section${STEPS.length - completedCount !== 1 ? 's' : ''} remaining`}
                  </p>
                </div>
              </nav>

              {/* ── Config panel ── */}
              <main className="flex-1 overflow-y-auto">
                  <Form {...form}>
                    <form id="assistant-form" onSubmit={handleSubmit(onSubmit)}>
                      <div className="p-8">

                        {/* Section heading */}
                        <div className="mb-8">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              {React.createElement(activeStep.icon, { className: 'w-4 h-4 text-primary' })}
                            </div>
                            <h2 className="text-xl font-semibold">{activeStep.title}</h2>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{activeStep.description}</p>
                        </div>

                        {activeTab === 'basic-info' && (
                          <BasicInfoSection
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            errors={errors}
                          />
                        )}
                        {activeTab === 'llm-config' && (
                          <LLMConfigSection
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            mode="create"
                            showHeader={false}
                            errors={errors}
                          />
                        )}
                        {activeTab === 'advanced-settings' && (
                          <AdvancedSettingsSection
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            errors={errors}
                          />
                        )}

                        {/* Step navigation footer */}
                        <div className="flex items-center justify-between pt-8 mt-8 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={STEPS.findIndex((s) => s.id === activeTab) === 0}
                            onClick={() => {
                              const i = STEPS.findIndex((s) => s.id === activeTab);
                              if (i > 0) setActiveTab(STEPS[i - 1].id);
                            }}
                          >
                            ← Previous
                          </Button>
                          {STEPS.findIndex((s) => s.id === activeTab) < STEPS.length - 1 ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const i = STEPS.findIndex((s) => s.id === activeTab);
                                if (i < STEPS.length - 1) setActiveTab(STEPS[i + 1].id);
                              }}
                            >
                              Next →
                            </Button>
                          ) : (
                            <Button type="submit" form="assistant-form" size="sm" disabled={isSubmitting} className="gap-1.5">
                              <Zap className="w-3.5 h-3.5" />
                              {isSubmitting ? 'Publishing...' : 'Publish Agent'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </Form>
              </main>

            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </TooltipProvider>

      {/* Test Mode Picker Dialog */}
      <Dialog open={showTestModeDialog} onOpenChange={setShowTestModeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Agent</DialogTitle>
            <DialogDescription>Choose how you want to test your agent</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <button
              onClick={() => { setShowTestModeDialog(false); setShowChatPreviewDialog(true); }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 p-5 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold">Chatbot</p>
                <p className="text-xs text-muted-foreground mt-0.5">Text-based chat preview</p>
              </div>
            </button>
            <button
              onClick={() => { setShowTestModeDialog(false); setShowTestDialog(true); }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 p-5 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Phone className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold">Voice Call</p>
                <p className="text-xs text-muted-foreground mt-0.5">Live voice agent test</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Preview Dialog */}
      <Dialog open={showChatPreviewDialog} onOpenChange={setShowChatPreviewDialog}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 h-[560px] flex flex-col">
          <AgentPreviewPanel
            initialMessage={watchedInitialMessage || DEMO_MESSAGES.initial}
            agentName={watchedName}
            onTestLive={() => { setShowChatPreviewDialog(false); setShowTestDialog(true); }}
          />
        </DialogContent>
      </Dialog>

      {/* Voice Test Dialog */}
      <TestAssistantDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        assistant={previewAssistant}
      />

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes that will be lost if you continue.
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
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Loading...</div>}>
      <CreateAssistantPageContent />
    </Suspense>
  );
}
