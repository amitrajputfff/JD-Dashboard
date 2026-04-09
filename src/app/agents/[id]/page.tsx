'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';

import { AssistantSchema } from '@/types/assistant';
import { Agent } from '@/types/agent';
import { assistantsApi, mapApiAssistantToAgent, ApiAssistant } from '@/lib/api/assistants';
import { agentsApi } from '@/lib/api/agents';
import { DEMO_MESSAGES } from '@/lib/constants/demo-messages';
import { useAssistantMetrics } from '@/hooks/use-assistant-metrics';
import { TimeRangeSelector } from '@/components/ui/time-range-selector';
import { Loader } from '@/components/ui/loader';
import { TestAssistantDialog } from '@/components/test-assistant-dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { AppSidebar } from "@/components/app-sidebar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Copy,
  ArrowLeft,
  BarChart3,
  Save,
  MoreHorizontal,
  Trash2,
  Activity,
  User,
  FileText,
  Settings,
  RotateCcw,
  Play,
  Code,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"

// Form sections components
import { BasicInfoSection } from '../create/sections/basic-info-section';
import LLMConfigSection from '@/components/agents/llm-config-section';
import AdvancedSettingsSection from '../create/sections/advanced-settings-section';

// Enhanced metrics component with real API integration
const MetricsSection = ({ agent, timeRange, onTimeRangeChange }: { 
  agent: Agent; 
  timeRange: string; 
  onTimeRangeChange: (value: string) => void; 
}) => {
  const { data: metricsData, loading, error } = useAssistantMetrics(agent.id, timeRange);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTrendValue = (value: number, suffix: string = '') => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}${suffix}`;
  };

  const getTrendColor = (value: number) => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';
  };

  // Prepare chart data
  const chartData = metricsData?.data?.callTrends?.map(trend => ({
    date: new Date(trend.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    totalCalls: trend.totalCalls,
    successfulCalls: trend.successfulCalls,
    failedCalls: trend.failedCalls,
    avgDuration: trend.avgDuration,
    successRate: trend.totalCalls > 0 ? (trend.successfulCalls / trend.totalCalls) * 100 : 0
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8 w-full">
          <Loader text="Loading metrics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">!</div>
            <p className="text-sm text-red-600">Error loading metrics: {error instanceof Error ? error.message : String(error)}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.data?.overview?.totalCalls?.toLocaleString() || '0'}</div>
            <p className={`text-xs ${getTrendColor(metricsData?.data?.comparison?.totalCallsChange || 0)}`}>
              {formatTrendValue(metricsData?.data?.comparison?.totalCallsChange || 0, '%')} {metricsData?.data?.comparison?.periodLabel || ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsData?.data?.overview?.successRate?.toFixed(2) || '0.00'}%</div>
            <p className={`text-xs ${getTrendColor(metricsData?.data?.comparison?.successRateChange || 0)}`}>
              {formatTrendValue(metricsData?.data?.comparison?.successRateChange || 0, '%')} {metricsData?.data?.comparison?.periodLabel || ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metricsData?.data?.overview?.avgCallDuration || 0)}</div>
            <p className={`text-xs ${getTrendColor(metricsData?.data?.comparison?.avgDurationChange || 0)}`}>
              {formatTrendValue(metricsData?.data?.comparison?.avgDurationChange || 0, 's')} {metricsData?.data?.comparison?.periodLabel || ''}
            </p>
          </CardContent>
        </Card>
        

      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metricsData?.data?.overview?.callsToday || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calls This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metricsData?.data?.overview?.callsThisWeek || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calls This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metricsData?.data?.overview?.callsThisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Call Volume Trends</CardTitle>
            <CardDescription className="text-xs">Daily call volume and success rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Date: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              <span 
                                className="inline-block w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: entry.color }}
                              ></span>
                              {`${entry.dataKey === 'totalCalls' ? 'Total Calls' : 'Successful Calls'}: ${entry.value}`}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="totalCalls" stroke="#000000" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="successfulCalls" stroke="#666666" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Call Duration Trends</CardTitle>
            <CardDescription className="text-xs">Average call duration over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Date: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Avg Duration: ${formatDuration(payload[0].value as number)}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#000000" 
                  fill="#000000" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Success vs Failed Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Call Success Analysis</CardTitle>
          <CardDescription className="text-xs">Successful vs failed calls breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#666666' }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#666666' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium mb-2">{`Date: ${label}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            <span 
                              className="inline-block w-3 h-3 rounded mr-2" 
                              style={{ backgroundColor: entry.color }}
                            ></span>
                            {`${entry.dataKey === 'successfulCalls' ? 'Successful' : 'Failed'} Calls: ${entry.value}`}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="successfulCalls" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="failedCalls" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AgentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  
  // State for agent data
  const [agent, setAgent] = useState<Agent | null>(null);
  const [assistantData, setAssistantData] = useState<ApiAssistant | null>(null); // Store assistant response data
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Track if we're in update flow
  const [isResetting, setIsResetting] = useState(false); // Track if we're resetting form state
  const [activeTab, setActiveTab] = useState('metrics');
  const [timeRange, setTimeRange] = useState('7d');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);

  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Fetch agent data from API
  const fetchAgent = React.useCallback(async () => {
    try {
      setIsLoadingAgent(true);
      setAgentError(null);
      
      // First check if the assistant is deleted by searching in deleted list
      const orgId = await assistantsApi.getOrganizationId();
      const { assistants: deletedAssistants } = await assistantsApi.getAssistants(orgId, 0, 100, true);
      const deletedAgent = deletedAssistants.find(a => a.id === agentId);
      
      if (deletedAgent) {
        // If assistant is deleted, redirect to main agents page
        router.push('/agents');
        return;
      }
      
      // If not deleted, try to get detailed configuration for this specific assistant
      try {
        const assistantResponse = await assistantsApi.getAssistantDetailed(agentId);
        const mappedAgent = mapApiAssistantToAgent(assistantResponse);
        setAgent(mappedAgent);
        setAssistantData(assistantResponse); // Store the assistant response for form population
        return;
      } catch (detailError) {
        console.warn('Failed to fetch detailed assistant, falling back to list:', detailError);
      }
      
      // Fallback to searching in the general list
      const { assistants } = await assistantsApi.getAssistants(orgId, 0, 100, false);
      
      // Find the agent by ID
      const foundAgent = assistants.find(a => a.id === agentId);
      
      if (!foundAgent) {
        setAgentError('Agent not found');
      } else {
        setAgent(foundAgent);
      }
    } catch (err) {
      console.error('Error fetching agent:', err);
      setAgentError(err instanceof Error ? err.message : 'Failed to fetch agent');
    } finally {
      setIsLoadingAgent(false);
    }
  }, [agentId, router]);

  // Fetch agent on component mount
  React.useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  // If agent not found after loading, redirect back
  React.useEffect(() => {
    if (!isLoadingAgent && agentError === 'Agent not found') {
      toast.error('Agent not found');
      router.push('/agents');
    }
  }, [isLoadingAgent, agentError, router]);

  const form = useForm({
    resolver: zodResolver(AssistantSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Generic',
    },
    mode: 'onChange',
  });

  // Update form values when assistant data is loaded
  React.useEffect(() => {
    if (assistantData && !isResetting) {
      
      // Basic info
      form.setValue('name', assistantData.name);
      form.setValue('description', assistantData.description || '');
      form.setValue('tags', assistantData.tags || []);
      form.setValue('category', assistantData.category || 'Customer Service');
      
      // Voice settings  
      form.setValue('speech_speed', parseFloat(assistantData.speech_speed) || 1.0);
      form.setValue('pitch', assistantData.pitch || '0%');
      
      // Model IDs from assistant response - handle null values for drafts
      form.setValue('llm_model_id', assistantData.llm_model_id || undefined);
      form.setValue('prompt', assistantData.prompt || '');
      form.setValue('temperature', parseFloat(assistantData.temperature) || 0.7);
      form.setValue('max_token', assistantData.max_token || 250);
      
      // Memory configuration
      form.setValue('memory_enabled', assistantData.memory_enabled ?? false);
      form.setValue('max_memory_retrieval', assistantData.max_memory_retrieval || 5);
      
      form.setValue('tts_model_id', assistantData.tts_model_id || undefined);
      form.setValue('voice_id', assistantData.voice_id || undefined);
      
      form.setValue('stt_model_id', assistantData.stt_model_id || undefined);
      form.setValue('language_id', assistantData.language_id || 11); // Default language if null
      
      // Message fields - use demo messages if empty
      form.setValue('initial_message', assistantData.initial_message || DEMO_MESSAGES.initial);
      form.setValue('call_end_text', assistantData.call_end_text || DEMO_MESSAGES.callEnd);
      form.setValue('filler_message', Array.isArray(assistantData.filler_message) ? assistantData.filler_message : (assistantData.filler_message ? [assistantData.filler_message] : DEMO_MESSAGES.filler));
      form.setValue('function_filler_message', Array.isArray(assistantData.function_filler_message) ? assistantData.function_filler_message : (assistantData.function_filler_message ? [assistantData.function_filler_message] : []));
      
      // Advanced settings
      form.setValue('call_recording', assistantData.call_recording);
      form.setValue('voice_activity_detection', assistantData.voice_activity_detection);
      form.setValue('barge_in', assistantData.barge_in);
      form.setValue('noise_suppression', assistantData.noise_suppression);
      form.setValue('max_call_duration', assistantData.max_call_duration || 1800);
      form.setValue('silence_timeout', assistantData.silence_timeout || 15);
      form.setValue('cutoff_seconds', assistantData.cutoff_seconds || 5);
      form.setValue('ideal_time_seconds', assistantData.ideal_time_seconds || 30);
      form.setValue('is_transferable', assistantData.is_transferable || false);
      form.setValue('transfer_number', assistantData.transfer_number || '');
      
      // Function calling settings
      form.setValue('function_calling', assistantData.function_calling || false);
      
      // Knowledge base settings
      form.setValue('has_knowledge_base', assistantData.has_knowledge_base || false);
      form.setValue('documents_ids', assistantData.documents_ids || null);
      
      // Extract and set multiple functions configuration
      if (assistantData.functions && assistantData.functions.length > 0) {
        const functionsArray = assistantData.functions.map((functionConfig: any) => {
          // Handle both new multiple function format and legacy single function format
          if (typeof functionConfig === 'object') {
            return {
              id: functionConfig.id || `func_${Date.now()}_${Math.random()}`,
              name: functionConfig.name || '',
              description: functionConfig.description || '',
              url: functionConfig.url || '',
              method: functionConfig.method || 'POST',
              headers: functionConfig.headers || {},
              query_params: functionConfig.query_params || {},
              body_format: functionConfig.body_format || 'json',
              custom_body: functionConfig.custom_body || '',
              schema: functionConfig.schema || {}
            };
          } else {
            // Legacy format - create a default function object
            return {
              id: `func_${Date.now()}_${Math.random()}`,
              name: '',
              description: '',
              url: '',
              method: 'POST',
              headers: {},
              query_params: {},
              body_format: 'json',
              custom_body: '',
              schema: typeof functionConfig === 'string' ? JSON.parse(functionConfig || '{}') : functionConfig
            };
          }
        });
        form.setValue('functions', functionsArray);
      } else {
        // No functions configured
        form.setValue('functions', []);
      }
      
      // Form values have been set - react-hook-form will handle isDirty state
    } else if (agent) {
      // Fallback: populate basic fields if we only have agent data
      form.setValue('name', agent.name || '');
      form.setValue('description', agent.description || '');
      form.setValue('tags', agent.tags || []);
      form.setValue('speech_speed', agent.speech_speed || '1.00');
      form.setValue('pitch', agent.pitch || '0%');
    }
  }, [agent, assistantData, form, isResetting]);

  // Fetch provider IDs for selected models when assistant data is loaded
  React.useEffect(() => {
    if (assistantData && !isUpdating && !isSubmitting && !isResetting) {
      const fetchProviderIds = async () => {
        try {
          // Fetch provider IDs for all selected models in parallel
          const promises = [];
          
          if (assistantData.llm_model_id) {
            promises.push(
              assistantsApi.getLLMModelById(assistantData.llm_model_id)
                .then(model => ({ type: 'llm', providerId: model?.provider_id }))
                .catch(() => ({ type: 'llm', providerId: null }))
            );
          }
          
          if (assistantData.tts_model_id) {
            promises.push(
              assistantsApi.getTTSModelById(assistantData.tts_model_id)
                .then(model => ({ type: 'tts', providerId: model?.provider_id }))
                .catch(() => ({ type: 'tts', providerId: null }))
            );
          }
          
          if (assistantData.stt_model_id) {
            promises.push(
              assistantsApi.getSTTModelById(assistantData.stt_model_id)
                .then(model => ({ type: 'stt', providerId: model?.provider_id }))
                .catch(() => ({ type: 'stt', providerId: null }))
            );
          }
          
          const results = await Promise.all(promises);
          
          // Set provider IDs in form
          results.forEach(result => {
            if (result.providerId) {
              if (result.type === 'llm') {
                form.setValue('llm_provider_id', result.providerId);
              } else if (result.type === 'tts') {
                form.setValue('tts_provider_id', result.providerId);
              } else if (result.type === 'stt') {
                form.setValue('stt_provider_id', result.providerId);
              }
            }
          });
          
        } catch (error) {
          console.error('Failed to fetch provider IDs:', error);
        }
      };
      
      fetchProviderIds();
    }
  }, [assistantData, form, isUpdating, isSubmitting, isResetting]);

  const { handleSubmit, control, watch, setValue, formState: { errors, isValid, isDirty: formIsDirty } } = form;
  


  // Define isDraft early to use in callbacks
  const isDraft = agent?.status === 'Draft';

  // Form's built-in isDirty state will handle change detection

  // Handle navigation warning for unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show warning if we're in the middle of an update flow or submitting
      if (formIsDirty && !isUpdating && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formIsDirty, isUpdating, isSubmitting]);

  // Validation function for required fields — only name is truly required.
  // Model IDs (llm/stt/tts/voice) are optional: GeminiLive handles all-in-one.
  const validateRequiredFields = (data: any) => {
    const missingFields: string[] = [];
    if (!data.name?.trim()) missingFields.push('Name');
    return missingFields;
  };

  // Check if all required fields are filled
  const hasAllRequiredFields = () => {
    const formData = form.getValues();
    const missingFields = validateRequiredFields(formData);
    return missingFields.length === 0;
  };

  // Handle form submission
  const onSubmit = useCallback(async (data?: any) => {
    if (!agent) return;
    
    setIsSubmitting(true);
    // Form will handle isDirty state during update
    
    try {
      // Get form data for validation
      const formData = data || form.getValues();
      
      // Validate required fields when activating a draft or updating an active assistant
      if (isDraft || agent.status === 'Active') {
        const missingFields = validateRequiredFields(formData);
        if (missingFields.length > 0) {
          toast.error('Missing Required Fields', {
            description: `Please configure: ${missingFields.join(', ')}. Or save as draft to continue later.`,
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Process multiple functions data (same as create page)
      let functionsData: any[] = [];
      
      if (formData.function_calling && formData.functions && Array.isArray(formData.functions) && formData.functions.length > 0) {
        functionsData = formData.functions.filter((func: any) => {
          // Only include functions that have at least a name or URL
          return func && (func.name || func.url);
        }).map((func: any) => ({
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
      
      // Clean up old function fields
      const { 
        function_url, 
        http_method, 
        headers, 
        query_params, 
        body_format, 
        custom_body, 
        ...cleanFormData 
      } = formData;
      
      // Prepare update data based on form values
      const updateData = {
        name: cleanFormData.name,
        description: cleanFormData.description,
        tags: cleanFormData.tags || [],
        speech_speed: cleanFormData.speech_speed || 1.0,
        pitch: cleanFormData.pitch || '0%',
        call_recording: cleanFormData.call_recording ?? true,
        voice_activity_detection: cleanFormData.voice_activity_detection ?? true,
        barge_in: cleanFormData.barge_in ?? true,
        noise_suppression: cleanFormData.noise_suppression ?? true,
        max_call_duration: cleanFormData.max_call_duration || 1800,
        silence_timeout: cleanFormData.silence_timeout || 15,
        cutoff_seconds: cleanFormData.cutoff_seconds || 5,
        ideal_time_seconds: cleanFormData.ideal_time_seconds || 30,
        is_transferable: cleanFormData.is_transferable ?? false,
        // Always send transfer_number as null if not set
        transfer_number: cleanFormData.transfer_number || null,
        // Call Messages - ensure demo messages are used if empty
        initial_message: cleanFormData.initial_message || DEMO_MESSAGES.initial,
        call_end_text: cleanFormData.call_end_text || DEMO_MESSAGES.callEnd,
        filler_message: (cleanFormData.filler_message && cleanFormData.filler_message.length > 0) ? cleanFormData.filler_message : DEMO_MESSAGES.filler,
        function_filler_message: (cleanFormData.function_filler_message && cleanFormData.function_filler_message.length > 0) ? cleanFormData.function_filler_message : [],
        // Function calling settings
        function_calling: cleanFormData.function_calling ?? false,
        functions: functionsData,
        // Knowledge base settings
        has_knowledge_base: cleanFormData.has_knowledge_base ?? false,
        documents_ids: cleanFormData.documents_ids || null,
        // LLM settings - required when activating or updating active assistant
        llm_model_id: formData.llm_model_id,
        prompt: formData.prompt,
        temperature: formData.temperature,
        max_token: formData.max_token,
        // Memory settings
        memory_enabled: cleanFormData.memory_enabled ?? false,
        max_memory_retrieval: cleanFormData.max_memory_retrieval || 5,
        // TTS settings - required when activating or updating active assistant
        voice_id: formData.voice_id,
        tts_model_id: formData.tts_model_id,
        // STT settings - required when activating or updating active assistant
        stt_model_id: formData.stt_model_id,
        language_id: formData.language_id,
        // Set status to Active when activating a draft, otherwise preserve current status
        status: isDraft ? 'Active' : agent.status,
      };
      
      // Call update API
      const updatedAssistant = await assistantsApi.updateAssistant(agent.id, updateData);
      
      // Update local state with the returned data
      if (updatedAssistant && updatedAssistant.assistant_id) {
        const mappedAgent = mapApiAssistantToAgent(updatedAssistant);
        setAgent(mappedAgent);
        setAssistantData(updatedAssistant);
      } else {
        throw new Error('Invalid response from server: missing agent data');
      }
      
      toast.success(isDraft ? 'Agent activated successfully!' : 'Agent updated successfully!');
      // Temporarily disable dirty tracking during reset
      setIsResetting(true);
      const currentValues = form.getValues();
      form.reset(currentValues, { keepDirty: false, keepErrors: false, keepTouched: false });
      setShowUpdateDialog(false);
      setIsUpdating(false);
      // Re-enable form state tracking after a short delay
      setTimeout(() => {
        setIsResetting(false);
      }, 100);
      
      // Redirect to agents page after successful activation
      if (isDraft) {
        router.push('/agents');
      }
      
    } catch (error) {
      console.error('Failed to update assistant:', error);
      toast.error(isDraft ? 'Failed to activate assistant' : 'Failed to update assistant', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
      setIsUpdating(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [agent, form, isDraft]);

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    setShowSaveDraftDialog(true);
  }, []);

  const confirmSaveDraft = useCallback(async () => {
    if (!agent) return;
    
    try {
      // Get form data
      const formData = form.getValues();
      
      // Process multiple functions data (same as main submit)
      let functionsData: any[] = [];
      
      if (formData.function_calling && formData.functions && Array.isArray(formData.functions) && formData.functions.length > 0) {
        functionsData = formData.functions.filter((func: any) => {
          // Only include functions that have at least a name or URL
          return func && (func.name || func.url);
        }).map((func: any) => ({
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
      
      // Clean up old function fields
      const { 
        function_url, 
        http_method, 
        headers, 
        query_params, 
        body_format, 
        custom_body, 
        ...cleanFormData 
      } = formData;
      
      // Prepare update data with draft status
      const updateData = {
        name: cleanFormData.name,
        description: cleanFormData.description,
        tags: cleanFormData.tags || [],
        speech_speed: cleanFormData.speech_speed || 1.0,
        pitch: cleanFormData.pitch || '0%',
        call_recording: cleanFormData.call_recording ?? true,
        voice_activity_detection: cleanFormData.voice_activity_detection ?? true,
        barge_in: cleanFormData.barge_in ?? true,
        noise_suppression: cleanFormData.noise_suppression ?? true,
        max_call_duration: cleanFormData.max_call_duration || 1800,
        silence_timeout: cleanFormData.silence_timeout || 15,
        cutoff_seconds: cleanFormData.cutoff_seconds || 5,
        ideal_time_seconds: cleanFormData.ideal_time_seconds || 30,
        is_transferable: cleanFormData.is_transferable ?? false,
        // Always send transfer_number as null if not set
        transfer_number: cleanFormData.transfer_number || null,
        // Call Messages
        initial_message: cleanFormData.initial_message || null,
        call_end_text: cleanFormData.call_end_text || null,
        filler_message: (cleanFormData.filler_message && cleanFormData.filler_message.length > 0) ? cleanFormData.filler_message : [],
        // Function calling settings
        function_calling: cleanFormData.function_calling ?? false,
        functions: functionsData,
        // Knowledge base settings
        has_knowledge_base: cleanFormData.has_knowledge_base ?? false,
        documents_ids: cleanFormData.documents_ids || null,
        // Include LLM settings if available
        ...(formData.llm_model_id && { llm_model_id: formData.llm_model_id }),
        ...(formData.prompt && { prompt: formData.prompt }),
        ...(formData.temperature && { temperature: formData.temperature }),
        ...(formData.max_token && { max_token: formData.max_token }),
        // Include TTS settings if available
        ...(formData.voice_id && { voice_id: formData.voice_id }),
        ...(formData.tts_model_id && { tts_model_id: formData.tts_model_id }),
        // Include STT settings if available
        ...(formData.stt_model_id && { stt_model_id: formData.stt_model_id }),
        ...(formData.language_id && { language_id: formData.language_id }),
        // Set status to draft
        status: 'Draft'
      };
      
      // Call update API with draft status
      const updatedAssistant = await assistantsApi.updateAssistant(agent.id, updateData);
      
      // Update local state with the returned data
      if (updatedAssistant && updatedAssistant.assistant_id) {
        const mappedAgent = mapApiAssistantToAgent(updatedAssistant);
        setAgent(mappedAgent);
        setAssistantData(updatedAssistant);
      }
      
      toast.success('Draft saved successfully');
      setShowSaveDraftDialog(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    }
  }, [agent, form]);



  const handleClone = () => {
    setShowCloneDialog(true);
  };

  const confirmClone = async () => {
    if (!agent) return;
    
    try {
      // Validate agent ID
      if (!agent.id) {
        throw new Error('Agent ID is missing');
      }
      
      // Check if agent.id looks like a UUID (basic validation)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(agent.id)) {
        console.warn('Agent ID does not look like a UUID:', agent.id);
      }
      
      // Generate a unique name for the cloned agent with version
      const baseNewName = `${agent.name} v2`;
      let newName = baseNewName;
      let version = 2;
      
      // Note: We can't check existing names here since we don't have the full agents list
      // The API will handle uniqueness validation
      
      // Call the clone API
      await assistantsApi.cloneAssistant(agent.id, { 
        new_name: newName 
      });
      
      toast.success(`${agent.name} cloned successfully as "${newName}"`);
      setShowCloneDialog(false);
      
      // Stay on the current page, don't redirect
      
    } catch (error) {
      console.error('Error cloning agent:', error);
      toast.error(`Failed to clone ${agent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowCloneDialog(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleTest = () => {
    setShowTestDialog(true);
  };

  const handleShowCode = () => {
    setShowCodeDrawer(true);
  };

  const confirmDelete = async () => {
    if (!agent) return;
    
    try {
      // Call the delete API
      await assistantsApi.deleteAssistant(agent.id);
      
      toast.success(`${agent.name} deleted successfully`);
      setShowDeleteDialog(false);
      
      // Navigate back to agents list after successful deletion
      router.push('/agents');
      
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error(`Failed to delete ${agent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDeleteDialog(false);
    }
  };

  const handleRestore = async () => {
    if (!agent) return;
    
    try {
      // Call the restore API
      await agentsApi.restoreAgent(agent.assistant_id);
      
      toast.success(`${agent.name} restored successfully`);
      
      // Navigate back to agents list after successful restoration
      router.push('/agents');
      
    } catch (error) {
      console.error('Error restoring agent:', error);
      toast.error(`Failed to restore ${agent.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  // Handle navigation with unsaved changes check
  const handleNavigationWithCheck = useCallback((navigationFn: () => void) => {
    // Don't show unsaved changes dialog if we're in the middle of an update flow or submitting
    if (formIsDirty && !isUpdating && !isSubmitting) {
      setPendingNavigation(() => navigationFn);
      setShowUnsavedChangesDialog(true);
    } else {
      navigationFn();
    }
  }, [formIsDirty, isUpdating, isSubmitting]);

  // Handle tab switching without unsaved changes check
  const handleTabSwitch = useCallback((tabValue: string) => {
    setActiveTab(tabValue);
  }, []);

  // Handle time range change for metrics
  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value);
  }, []);

  // Function to determine which sections have errors
  const getSectionErrors = useCallback(() => {
    const sectionErrors: Record<string, boolean> = {
      'basic-info': false,
      'llm-config': false,
      'advanced-settings': false,
    };

    if (!errors || Object.keys(errors).length === 0) {
      return sectionErrors;
    }

    const fieldToSection: Record<string, string> = {
      'name': 'basic-info',
      'description': 'basic-info',
      'category': 'basic-info',
      'tags': 'basic-info',
      'prompt': 'llm-config',
      'function_calling': 'advanced-settings',
      'functions': 'advanced-settings',
      'max_call_duration': 'advanced-settings',
    };

    Object.keys(errors).forEach(field => {
      const section = fieldToSection[field];
      if (section) {
        sectionErrors[section] = true;
      }
    });

    return sectionErrors;
  }, [errors]);

  // Handle saving changes from unsaved changes dialog
  const handleSaveChanges = useCallback(async () => {
    if (!agent) return;
    
    try {
      setIsSubmitting(true);
      
      // Get form data
      const formData = form.getValues();
      
      // Validate required fields for active assistants
      if (agent.status === 'Active') {
        const missingFields = validateRequiredFields(formData);
        if (missingFields.length > 0) {
          toast.error('Missing Required Fields', {
            description: `Please configure: ${missingFields.join(', ')}. Or save as draft to continue later.`,
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Process multiple functions data (same as main submit)
      let functionsData: any[] = [];
      
      if (formData.function_calling && formData.functions && Array.isArray(formData.functions) && formData.functions.length > 0) {
        functionsData = formData.functions.filter((func: any) => {
          // Only include functions that have at least a name or URL
          return func && (func.name || func.url);
        }).map((func: any) => ({
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
      
      // Clean up old function fields
      const { 
        function_url, 
        http_method, 
        headers, 
        query_params, 
        body_format, 
        custom_body, 
        ...cleanFormData 
      } = formData;
      
      // Prepare update data - preserve current status unless it's a draft
      const updateData = {
        name: cleanFormData.name,
        description: cleanFormData.description,
        tags: cleanFormData.tags || [],
        speech_speed: cleanFormData.speech_speed || 1.0,
        pitch: cleanFormData.pitch || '0%',
        call_recording: cleanFormData.call_recording ?? true,
        voice_activity_detection: cleanFormData.voice_activity_detection ?? true,
        barge_in: cleanFormData.barge_in ?? true,
        noise_suppression: cleanFormData.noise_suppression ?? true,
        max_call_duration: cleanFormData.max_call_duration || 1800,
        silence_timeout: cleanFormData.silence_timeout || 15,
        cutoff_seconds: cleanFormData.cutoff_seconds || 5,
        ideal_time_seconds: cleanFormData.ideal_time_seconds || 30,
        is_transferable: cleanFormData.is_transferable ?? false,
        // Always send transfer_number as null if not set
        transfer_number: cleanFormData.transfer_number || null,
        // Call Messages
        initial_message: cleanFormData.initial_message || null,
        call_end_text: cleanFormData.call_end_text || null,
        filler_message: (cleanFormData.filler_message && cleanFormData.filler_message.length > 0) ? cleanFormData.filler_message : [],
        // Function calling settings
        function_calling: cleanFormData.function_calling ?? false,
        functions: functionsData,
        // Knowledge base settings
        has_knowledge_base: cleanFormData.has_knowledge_base ?? false,
        documents_ids: cleanFormData.documents_ids || null,
        // LLM settings - include for active assistants, conditional for drafts
        ...(agent.status === 'Active' ? {
          llm_model_id: formData.llm_model_id,
          prompt: formData.prompt,
          temperature: formData.temperature,
          max_token: formData.max_token,
          voice_id: formData.voice_id,
          tts_model_id: formData.tts_model_id,
          stt_model_id: formData.stt_model_id,
          language_id: formData.language_id,
        } : {
          ...(formData.llm_model_id && { llm_model_id: formData.llm_model_id }),
          ...(formData.prompt && { prompt: formData.prompt }),
          ...(formData.temperature && { temperature: formData.temperature }),
          ...(formData.max_token && { max_token: formData.max_token }),
          ...(formData.voice_id && { voice_id: formData.voice_id }),
          ...(formData.tts_model_id && { tts_model_id: formData.tts_model_id }),
          ...(formData.stt_model_id && { stt_model_id: formData.stt_model_id }),
          ...(formData.language_id && { language_id: formData.language_id }),
        }),
        // Preserve current status (keep draft as draft, active as active)
        status: agent.status
      };
      
      // Call update API
      const updatedAssistant = await assistantsApi.updateAssistant(agent.id, updateData);
      
      // Update local state with the returned data
      if (updatedAssistant && updatedAssistant.assistant_id) {
        const mappedAgent = mapApiAssistantToAgent(updatedAssistant);
        setAgent(mappedAgent);
        setAssistantData(updatedAssistant);
      }
      
        toast.success(isDraft ? 'Draft saved successfully!' : 'Changes saved successfully!');
        setShowUnsavedChangesDialog(false);
        if (pendingNavigation) {
          pendingNavigation();
          setPendingNavigation(null);
        }
    } catch (error) {
      console.error('Failed to save changes:', error);
        toast.error('Failed to save changes', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [agent, form, isDraft, pendingNavigation]);

  // Handle discarding changes from unsaved changes dialog
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Loading state
  if (isLoadingAgent) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen w-full">
            <Loader text="Loading Agent..." />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (agentError && agentError !== 'Assistant not found') {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Failed to load agent</h3>
              <p className="text-muted-foreground mb-4">{agentError instanceof Error ? agentError.message : String(agentError)}</p>
              <Button onClick={fetchAgent}>Try Again</Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Agent not found case is handled by redirect in useEffect
  if (!agent) {
    return null;
  }

  return (
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
                  <BreadcrumbPage>{agent.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {formIsDirty && (
            <div className="ml-auto mr-8">
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Unsaved changes
              </Badge>
            </div>
          )}
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {/* Deleted Agent Notice */}
          {agent.is_deleted && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Agent Deleted</h3>
                    <p className="text-sm text-red-700">
                      This agent has been deleted. Restore the agent to make changes.
                    </p>
                  </div>
                </div>
                <Button 
                  type="button"
                  onClick={handleRestore}
                  disabled={isSubmitting}
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Restoring...' : 'Restore Agent'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigationWithCheck(() => router.back())}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">{agent.name}</h1>
                  <Badge 
                    variant={agent.status === 'Active' ? 'default' : 'secondary'}
                  >
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm max-w-5xl text-muted-foreground">
                  {isDraft ? 'Configure your agent settings and activate when ready' : agent.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!agent.is_deleted && (
              <div className="flex items-center space-x-2">

                {isDraft && (
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                )}

                {/* Test Agent Button - only show for active agents */}
                {agent.status === 'Active' && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    size="sm"
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Test Agent
                  </Button>
                )}

                {/* Code Button - show for all agents */}
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleShowCode}
                  size="sm"
                  className="gap-2"
                >
                  <Code className="h-4 w-4" />
                  Code
                </Button>

                <Button 
                  type="button"
                  onClick={() => {
                    setIsUpdating(true);
                    setShowUpdateDialog(true);
                  }}
                  disabled={
                    isSubmitting || 
                    !isValid || 
                    (isDraft ? !hasAllRequiredFields() : !formIsDirty)
                  }
                  size="sm"
                >
                  {isSubmitting ? 'Updating...' : isDraft ? 'Activate agent' : 'Update agent'}
                </Button>
              
                {/* More Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {agent.status === 'Active' && (
                      <>
                        <DropdownMenuItem onClick={handleClone}>
                          <Copy className="mr-2 h-4 w-4" />
                          Clone Agent
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <Form {...form}>
            <form id="assistant-form" onSubmit={handleSubmit(onSubmit)} className={`space-y-8 ${agent.is_deleted ? 'pointer-events-none opacity-60' : ''}`}>
              
              {/* Tab Navigation */}
              <div className="w-full text-sm">
                <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
                  {[
                    { title: "Metrics", value: "metrics", icon: Activity },
                    { title: "Basic Info", value: "basic-info", icon: User },
                    { title: "Prompt", value: "llm-config", icon: FileText },
                    { title: "Advanced", value: "advanced-settings", icon: Settings },
                  ].map((tab) => {
                    const sectionErrors = getSectionErrors();
                    const hasError = sectionErrors[tab.value] || false;
                    
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => {
                          if (activeTab !== tab.value) {
                            handleTabSwitch(tab.value);
                          }
                        }}
                        className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                          activeTab === tab.value
                            ? 'bg-primary text-primary-foreground'
                            : hasError
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
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
                    <Card className={getSectionErrors()['basic-info'] ? 'border-red-200 bg-red-50/30' : ''}>
                      <CardHeader>
                        <CardTitle className={getSectionErrors()['basic-info'] ? 'text-red-700' : ''}>
                          Basic Information
                          {getSectionErrors()['basic-info'] && (
                            <span className="ml-2 text-sm font-normal text-red-600">(Has errors)</span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Essential details about your agent
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <BasicInfoSection control={control} watch={watch} setValue={setValue} errors={errors} />
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'llm-config' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Prompt Configuration</CardTitle>
                        <CardDescription>
                          System prompt and agent instructions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <LLMConfigSection
                          control={control}
                          setValue={setValue}
                          watch={watch}
                          mode="edit"
                          showHeader={false}
                          errors={errors}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'advanced-settings' && (
                    <Card className={getSectionErrors()['advanced-settings'] ? 'border-red-200 bg-red-50/30' : ''}>
                      <CardHeader>
                        <CardTitle className={getSectionErrors()['advanced-settings'] ? 'text-red-700' : ''}>
                          Advanced Settings
                          {getSectionErrors()['advanced-settings'] && (
                            <span className="ml-2 text-sm font-normal text-red-600">(Has errors)</span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Function calling and call transfer settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <AdvancedSettingsSection control={control} errors={errors} setValue={setValue} watch={watch} />
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'metrics' && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>
                              Analytics and performance data for your agent
                            </CardDescription>
                          </div>
                          <TimeRangeSelector 
                            value={timeRange} 
                            onValueChange={handleTimeRangeChange}
                            className="w-[140px]"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <MetricsSection 
                          agent={agent} 
                          timeRange={timeRange}
                          onTimeRangeChange={handleTimeRangeChange}
                        />
                      </CardContent>
                    </Card>
                  )}

                </div>
              </div>

              {/* Error Display */}
              {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">!</div>
                    <p className="text-sm font-medium text-red-600">
                      {Object.keys(errors).length} validation error(s) found:
                    </p>
                  </div>
                  
                  {/* Section Error Summary */}
                  <div className="mb-4 p-3 bg-red-100 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700 mb-2">Sections with errors:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(getSectionErrors()).map(([section, hasError]) => {
                        if (!hasError) return null;
                        const sectionNames: Record<string, string> = {
                          'basic-info': 'Basic Info',
                          'llm-config': 'LLM Config',
                          'tts-config': 'Text-to-Speech',
                          'stt-config': 'Speech-to-Text',
                          'advanced-settings': 'Advanced Settings',
                        };
                        return (
                          <span
                            key={section}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full cursor-pointer hover:bg-red-300"
                            onClick={() => setActiveTab(section)}
                          >
                            {sectionNames[section]}
                            <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Click on a section name above to navigate to it, or check the highlighted tabs.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(errors).map(([field, error]: [string, any]) => (
                      <div key={field} className="text-sm text-red-600">
                        <span className="font-medium">{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>{' '}
                        {typeof error === 'object' && error?.message ? error.message : 'Invalid value'}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-500 mt-3">
                    Please fix the above errors before submitting the form.
                  </p>
                </div>
              )}

            </form>
          </Form>

        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;<strong>{agent.name}</strong>&quot;? This action cannot be undone and will permanently remove the agent and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Confirmation Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Agent</DialogTitle>
            <DialogDescription>
              This will create a copy of &quot;<strong>{agent.name}</strong>&quot; with all its configurations. The cloned agent will be saved as a draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloneDialog(false)}>Cancel</Button>
            <Button onClick={confirmClone}>
              Clone Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Draft Confirmation Dialog */}
      <Dialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
            <DialogDescription>
              Save your current configurations as a draft. You can continue editing and activate the agent when ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDraftDialog(false)}>Cancel</Button>
            <Button onClick={confirmSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update/Activate Confirmation Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDraft ? 'Activate Agent' : 'Update Agent'}
            </DialogTitle>
            <DialogDescription>
              {isDraft 
                ? <>Activate &quot;<strong>{agent.name}</strong>&quot; and make it available for use. Make sure all configurations are correct.</>
                : <>Update the configurations for &quot;<strong>{agent.name}</strong>&quot;. This will apply all changes immediately.</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUpdateDialog(false);
              setIsUpdating(false);
            }}>Cancel</Button>
            <Button onClick={async () => {
              setShowUpdateDialog(false);
              await onSubmit();
              setIsUpdating(false);
            }} disabled={isSubmitting}>
              {isSubmitting ? (isDraft ? 'Activating...' : 'Updating...') : (isDraft ? 'Activate Agent' : 'Update Agent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {isSubmitting 
                ? 'Saving...' 
                : isDraft 
                  ? 'Save to Draft' 
                  : 'Save Changes'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Assistant Dialog */}
      {agent && (
        <TestAssistantDialog
          open={showTestDialog}
          onOpenChange={setShowTestDialog}
          assistant={agent}
          functions={agent.functions}
        />
      )}

      {/* Code Drawer */}
      <Drawer open={showCodeDrawer} onOpenChange={setShowCodeDrawer} direction="right">
        <DrawerContent className="h-full w-[600px] ml-auto">
          <DrawerHeader>
            <DrawerTitle>Agent Configuration</DrawerTitle>
            <DrawerDescription>
              Complete JSON configuration for {agent?.name || 'this agent'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 p-4 overflow-auto">
            {agent && (
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto h-full">
                <code>{JSON.stringify(agent, null, 2)}</code>
              </pre>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    </SidebarProvider>
  );
}
