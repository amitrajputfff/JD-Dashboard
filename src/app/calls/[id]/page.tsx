'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { callsApi } from '@/lib/api/calls';
import { agentsApi } from '@/lib/api/agents';
import { useAuth } from '@/hooks/use-auth';
import { usePreviousPage } from '@/hooks/use-previous-page';
import type { CallLog } from '@/types/call';
import type { Agent } from '@/types/agent';
import { AdvancedAudioPlayer } from '@/components/ui/advanced-audio-player';
import { PieChart, Pie, Label, Tooltip as RechartsTooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  ArrowLeft,
  Clock,
  Phone,
  User,
  Calendar,
  TrendingUp,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  BarChart3,
  Mic,
  Volume2,
  SkipBack,
  SkipForward,
  Sparkles,
  Copy,
  Globe,
  PhoneIncoming,
  PhoneOutgoing,
  Headphones,
  Search,
  Send,
  Bot,
  Users,
  Activity,
  ThumbsUp,
  AlertCircle,
  FileText,
  Award,
  Brain,
  Eye,
  Star,
  Timer,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function CallDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;
  const { user } = useAuth();
  const { goBack } = usePreviousPage();
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isAskingLia, setIsAskingLia] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', message: string}>>([]);
  const [generatePopoverOpen, setGeneratePopoverOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // API state
  const [callData, setCallData] = useState<CallLog | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if we've already fetched data for this callId
  const hasFetchedRef = React.useRef<string | null>(null);

  // Fetch call data
  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!callId) return;
      
      // Prevent duplicate calls for the same callId
      if (hasFetchedRef.current === callId) return;
      
      hasFetchedRef.current = callId;
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await callsApi.getCallLogById(callId);
        setCallData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch call details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallDetails();
  }, [callId]);

  // Fetch assistant name separately when we have callData and user
  useEffect(() => {
    const fetchAssistantName = async () => {
      if (!callData?.assistant_id || !user?.organization_id) return;
      
          try {
            const assistantsResponse = await agentsApi.getAgents({
              organization_id: user.organization_id,
          limit: 1000,
              skip: 0,
            });
            
            // Find the matching assistant by assistant_id field
            const matchingAssistant = assistantsResponse.assistants?.find(
          (assistant: any) => assistant.assistant_id === callData.assistant_id
            );
            
            if (matchingAssistant?.name) {
              setAgentName(matchingAssistant.name);
            }
          } catch (agentErr) {
            console.error('Failed to fetch assistants:', agentErr);
      }
    };

    fetchAssistantName();
  }, [callData?.assistant_id, user?.organization_id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Show loading state
  if (isLoading) {
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
                      Liaplus AI
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/calls">
                      Call Logs
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Loading...</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading call details...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show error state
  if (error || !callData) {
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
                      Liaplus AI
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/calls">
                      Call Logs
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Error</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-red-600">{error || 'Call not found'}</p>
            <Button onClick={goBack}>Back to Call Logs</Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Helper function to check if data is available
  const hasData = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    // Note: We allow 0 for numbers as it's valid metric data
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
    return true;
  };

  const displayValue = (value: any, fallback: string = 'No data available'): string => {
    if (!hasData(value)) return fallback;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    // Capitalize first letter of string values
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      positive: 'bg-green-50 text-green-700 border-green-200',
      negative: 'bg-red-50 text-red-700 border-red-200',
      neutral: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return (
      <Badge variant="outline" className={colors[sentiment as keyof typeof colors]}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </Badge>
    );
  };

  const handleDownloadTranscript = () => {
    if (!callData?.transcripts || callData.transcripts.length === 0) {
      toast.error('No transcript available for this call');
      return;
    }

    try {
      // Create transcript content
      const transcriptContent = callData.transcripts
        .map(entry => `[${new Date(entry.timestamp).toLocaleString()}] ${entry.speaker === 'assistant' ? 'Agent' : 'Customer'}: ${entry.text}`)
        .join('\n');

      // Add call metadata
      const fullContent = `Call Transcript - ${callData.call_id}
Date: ${formatTimestamp(callData.start_time)}
Duration: ${formatDuration(callData.duration_seconds || 0)}
Status: ${callData.status}
Assistant: ${agentName || 'Unknown'}

--- TRANSCRIPT ---

${transcriptContent}`;

      // Create and download file
      const blob = new Blob([fullContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `call-transcript-${callData.call_id}-${new Date(callData.start_time).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Transcript downloaded successfully');
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error('Failed to download transcript');
    }
  };

  const handleShareCall = async () => {
    try {
      // Create shareable URL
      const shareUrl = `${window.location.origin}/calls/${callId}`;
      
      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: `Call Details - ${callData?.call_id}`,
          text: `View call details for call ${callData?.call_id}`,
          url: shareUrl,
        });
        toast.success('Call shared successfully');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Call link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing call:', error);
      // Fallback to clipboard if Web Share API fails
      try {
        const shareUrl = `${window.location.origin}/calls/${callId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Call link copied to clipboard');
      } catch (clipboardError) {
        toast.error('Failed to share call');
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI summary generation');
      return;
    }
    
    if (!callData?.transcripts || callData.transcripts.length === 0) {
      toast.error('No transcript available for this call');
      return;
    }
    
    setIsGeneratingSummary(true);
    setGeneratePopoverOpen(false);
    
    try {
      // Convert transcript array to text
      const transcriptText = callData.transcripts
        .map(entry => `[${entry.timestamp}] ${entry.speaker === 'assistant' ? 'Agent' : 'Customer'}: ${entry.text}`)
        .join('\n');

      const response = await fetch('/api/openai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          contextPrompt: aiPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      
      // Update call data with generated summary
      setCallData(prev => prev ? { ...prev, summary: data.summary } : null);
      
      toast.success('AI summary generated successfully!');
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (callData?.summary && callData.summary.trim() !== '') {
      navigator.clipboard.writeText(callData.summary);
      toast.success('Summary copied to clipboard');
    } else {
      toast.error('No summary available to copy');
    }
  };

  const handleMarkerClick = (timestamp: number) => {
    // In a real app, this would seek the audio to the timestamp
    toast.success(`Jumped to ${formatDuration(timestamp)}`);
  };

  const handleCopyTranscript = () => {
    const transcriptText = callData?.transcripts
      .map(entry => `[${entry.timestamp}] ${entry.speaker === 'assistant' ? 'Agent' : 'Customer'}: ${entry.text}`)
      .join('\n') || '';
    navigator.clipboard.writeText(transcriptText);
    toast.success('Transcript copied to clipboard');
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    if (!callData?.transcripts || callData.transcripts.length === 0) {
      toast.error('No transcript available for this call');
      return;
    }
    
    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
    setIsAskingLia(true);
    
    try {
      // Convert transcript array to text
      const transcriptText = callData.transcripts
        .map(entry => `[${entry.timestamp}] ${entry.speaker === 'assistant' ? 'Agent' : 'Customer'}: ${entry.text}`)
        .join('\n');

      const response = await fetch('/api/openai/ask-lia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          userQuestion: userMessage,
          chatHistory: chatHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Lia');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', message: data.response }]);
    } catch (error) {
      console.error('Error asking Lia:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response from Lia');
      // Remove the user message if there was an error
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsAskingLia(false);
    }
  };

  const filteredTranscript = (callData?.transcripts || []).filter(entry =>
    entry.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const getEventMarkerColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-500 border-green-600';
      case 'pain_point':
        return 'bg-red-500 border-red-600';
      case 'success':
        return 'bg-blue-500 border-blue-600';
      case 'highlight':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Call Recording Player */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Call Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasData(callData?.recording_link) ? (
                  <>
                    <AdvancedAudioPlayer
                      src={callData!.recording_link!}
                      duration={callData?.duration_seconds}
                      keyEvents={callData?.key_events || []}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 mb-2">
                      No Recording Available
                    </Badge>
                    <p className="text-sm text-muted-foreground">The recording for this call is not available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {hasData(callData?.metrics?.callQualityScore) 
                      ? `${callData?.metrics?.callQualityScore}/10` 
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData(callData?.metrics?.callQualityScore) ? 'Call quality' : 'No data available'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {displayValue(callData?.sentiment)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData(callData?.sentiment) ? 'Overall sentiment' : 'No data available'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {hasData(callData?.metrics?.confidenceScore) 
                      ? `${(callData!.metrics!.confidenceScore! * 100).toFixed(0)}%` 
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData(callData?.metrics?.confidenceScore) ? 'Confidence score' : 'No data available'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Talk Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {hasData(callData?.metrics?.talkTime) 
                      ? formatDuration(callData!.metrics!.talkTime!) 
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData(callData?.metrics?.talkTime) ? 'Total talk time' : 'No data available'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Summary */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Call Summary</CardTitle>
                    <div className="flex items-center gap-2">
                      <Popover open={generatePopoverOpen} onOpenChange={setGeneratePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isGeneratingSummary}
                          >
                            {isGeneratingSummary ? (
                              <Spinner className="h-4 w-4 mr-2" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {isGeneratingSummary ? 'Generating...' : 'Generate'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-900">Generate AI Summary</h4>
                              <p className="text-xs text-gray-600">
                                Enter a custom prompt to generate a specific type of summary
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Generate summary with AI (e.g., focus on key decisions, highlight customer concerns, etc.)"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="min-h-[80px] resize-none"
                                rows={3}
                              />
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setAiPrompt('Focus on key decisions and action items')}
                                >
                                  Key Decisions
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setAiPrompt('Highlight customer pain points and concerns')}
                                >
                                  Pain Points
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setAiPrompt('Summarize sales opportunities and next steps')}
                                >
                                  Sales Focus
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGeneratePopoverOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleGenerateSummary}
                                disabled={!aiPrompt.trim() || isGeneratingSummary}
                              >
                                {isGeneratingSummary ? (
                                  <Spinner className="h-4 w-4 mr-2" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Generate
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {callData?.summary && callData.summary.trim() !== '' && (
                        <Button variant="ghost" size="sm" onClick={handleCopySummary}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hasData(callData?.summary) ? (
                    <p className="text-sm leading-relaxed">
                      {callData!.summary}
                    </p>
                  ) : (
                    <div className="text-center py-4">
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        No Data Available
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">No summary available for this call</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Call Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Call Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                      {(() => {
                        const isWebCall = callData?.meta_data?.source === 'web' || 
                                        callData?.meta_data?.source === 'widget' ||
                                        callData?.from_number?.toLowerCase().includes('web') ||
                                        callData?.from_number?.toLowerCase().includes('widget') ||
                                        callData?.call_type === 'webcall' ||
                                        (!callData?.from_number && !callData?.to_number);
                        return isWebCall ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Phone className="h-4 w-4 text-muted-foreground" />;
                      })()}
                    <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="text-sm font-medium">
                          {(() => {
                            const isWebCall = callData?.meta_data?.source === 'web' || 
                                            callData?.meta_data?.source === 'widget' ||
                                            callData?.from_number?.toLowerCase().includes('web') ||
                                            callData?.from_number?.toLowerCase().includes('widget') ||
                                            callData?.call_type === 'webcall' ||
                                            (!callData?.from_number && !callData?.to_number);
                            return isWebCall ? 'Web' : displayValue(callData?.from_number);
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const isWebCall = callData?.meta_data?.source === 'web' || 
                                        callData?.meta_data?.source === 'widget' ||
                                        callData?.to_number?.toLowerCase().includes('web') ||
                                        callData?.to_number?.toLowerCase().includes('widget') ||
                                        callData?.call_type === 'webcall' ||
                                        (!callData?.from_number && !callData?.to_number);
                        return isWebCall ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Phone className="h-4 w-4 text-muted-foreground" />;
                      })()}
                      <div>
                        <p className="text-sm text-muted-foreground">To</p>
                        <p className="text-sm font-medium">
                          {(() => {
                            const isWebCall = callData?.meta_data?.source === 'web' || 
                                            callData?.meta_data?.source === 'widget' ||
                                            callData?.to_number?.toLowerCase().includes('web') ||
                                            callData?.to_number?.toLowerCase().includes('widget') ||
                                            callData?.call_type === 'webcall' ||
                                            (!callData?.from_number && !callData?.to_number);
                            return isWebCall ? 'Web' : displayValue(callData?.to_number);
                          })()}
                        </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assistant</p>
                        <p className="text-sm font-medium">{agentName || 'Loading...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Start time</p>
                        <p className="text-sm font-medium">{formatTimestamp(callData!.start_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">End time</p>
                      <p className="text-sm font-medium">
                        {hasData(callData?.end_time) ? formatTimestamp(callData!.end_time!) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-sm font-medium capitalize">{displayValue(callData?.status)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Call Type</p>
                        <p className="text-sm font-medium capitalize">{displayValue(callData?.call_type)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        );

      case 'transcript':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Call Transcript
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search in transcript..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Transcript
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto px-4">
                  {filteredTranscript.length > 0 ? (
                    filteredTranscript.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          entry.speaker === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {entry.speaker === 'assistant' && (
                          <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-3 ${
                            entry.speaker === 'user'
                              ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground'
                              : 'bg-gradient-to-r from-muted to-muted/80 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium capitalize">
                              {entry.speaker === 'assistant' ? 'Assistant' : 'User'}
                            </span>
                            {getSentimentBadge(entry.sentiment)}
                            <span className="text-xs opacity-70">
                              {hasData(entry.confidence) ? `${(entry.confidence * 100).toFixed(0)}% confidence` : 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{entry.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        {entry.speaker === 'user' && (
                          <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-secondary/10 to-secondary/5 text-secondary-foreground">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  ) : transcriptSearch ? (
                    <p className="text-center text-muted-foreground py-8">
                      No transcript entries found for &quot;{transcriptSearch}&quot;
                    </p>
                  ) : (
                    <div className="text-center py-8">
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        No Data Available
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">No transcript available for this call</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'ask-lia':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Ask Lia - AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 min-h-64 max-h-96 overflow-y-auto">
                  {chatHistory.length === 0 && !isAskingLia ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Ask Lia anything about this call</p>
                      <p className="text-xs mt-1">Try asking about sentiment, key insights, or next steps</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((chat, index) => (
                        <div key={index} className={`flex gap-3 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            chat.role === 'user' 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted text-foreground'
                          }`}>
                            <p className="text-sm">{chat.message}</p>
                          </div>
                        </div>
                      ))}
                      {isAskingLia && (
                        <div className="flex gap-3 justify-start">
                          <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg bg-muted text-foreground">
                            <div className="flex items-center gap-2">
                              <Spinner className="w-4 h-4" />
                              <p className="text-sm text-muted-foreground">Lia is thinking...</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask Lia about this call..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="min-h-0 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!chatMessage.trim() || isAskingLia}>
                    {isAskingLia ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setChatMessage("What were the key insights from this call?")}>
                    Key Insights
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatMessage("What should be the next steps?")}>
                    Next Steps
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatMessage("How was the customer sentiment?")}>
                    Sentiment Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

             case 'metrics':
         return (
           <div className="space-y-6">
             {/* Performance Overview - Top Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium">Call Quality Score</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {hasData(callData?.metrics?.callQualityScore) 
                       ? `${callData!.metrics!.callQualityScore}/10` 
                       : 'N/A'}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {hasData(callData?.metrics?.callQualityScore) ? 'Overall quality' : 'No data available'}
                   </p>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {hasData(callData?.customer_satisfaction) 
                       ? `${(callData!.customer_satisfaction! * 100).toFixed(0)}%` 
                       : hasData(callData?.metrics?.customerSatisfaction)
                       ? `${(callData!.metrics!.customerSatisfaction! * 100).toFixed(0)}%`
                       : 'N/A'}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {hasData(callData?.customer_satisfaction) || hasData(callData?.metrics?.customerSatisfaction) 
                       ? 'CSAT score' 
                       : 'No data available'}
                   </p>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {hasData(callData?.metrics?.confidenceScore) 
                       ? `${(callData!.metrics!.confidenceScore! * 100).toFixed(0)}%` 
                       : 'N/A'}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {hasData(callData?.metrics?.confidenceScore) ? 'Speech confidence' : 'No data available'}
                   </p>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium">Clarity Score</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {hasData(callData?.metrics?.clarity) 
                       ? `${(callData!.metrics!.clarity! * 100).toFixed(0)}%` 
                       : 'N/A'}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {hasData(callData?.metrics?.clarity) ? 'Audio clarity' : 'No data available'}
                   </p>
                 </CardContent>
               </Card>
             </div>

             {/* Talk Time & Duration Analysis + Talk Time Ratios - Pie Charts */}
             <div className="grid gap-4 md:grid-cols-2">
               <Card>
                 <CardHeader className="items-center pb-0">
                   <CardTitle>Talk Time & Duration Analysis</CardTitle>
                   <CardDescription>Breakdown of call time by speaker and activity</CardDescription>
                 </CardHeader>
                 <CardContent className="flex-1 pb-0">
                   <ChartContainer
                     config={{
                       userTalkTime: { label: "User Talk Time", color: "#000000" },
                       assistantTalkTime: { label: "Assistant Talk Time", color: "#333333" },
                       silenceTime: { label: "Silence Time", color: "#666666" },
                     }}
                     className="mx-auto aspect-square max-h-[250px]"
                   >
                     <PieChart>
                       <RechartsTooltip
                         cursor={false}
                         content={
                           <ChartTooltipContent
                             hideLabel
                             className="w-[200px]"
                             formatter={(value, name, item, index) => {
                               const dataLength = [
                                 hasData(callData?.metrics?.userTalkTime) ? 1 : 0,
                                 hasData(callData?.metrics?.assistantTalkTime) ? 1 : 0,
                                 hasData(callData?.metrics?.silenceTime) ? 1 : 0,
                               ].reduce((a, b) => a + b, 0);
                               
                               const total = 
                                 (hasData(callData?.metrics?.userTalkTime) ? callData!.metrics!.userTalkTime! : 0) +
                                 (hasData(callData?.metrics?.assistantTalkTime) ? callData!.metrics!.assistantTalkTime! : 0) +
                                 (hasData(callData?.metrics?.silenceTime) ? callData!.metrics!.silenceTime! : 0);

                               const labels: Record<string, string> = {
                                 userTalkTime: "User Talk Time",
                                 assistantTalkTime: "Assistant Talk Time",
                                 silenceTime: "Silence Time",
                               };

                               return (
                                 <>
                                   <div
                                     className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                     style={
                                       {
                                         "--color-bg": `var(--color-${name})`,
                                       } as React.CSSProperties
                                     }
                                   />
                                   {labels[String(name)] || String(name)}
                                   <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                     {formatDuration(Number(value))}
                                     <span className="font-normal text-muted-foreground">
                                       s
                                     </span>
                       </div>
                                   {index === dataLength - 1 && total > 0 && (
                                     <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                       Total
                                       <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                         {formatDuration(total)}
                                         <span className="font-normal text-muted-foreground">
                                           s
                         </span>
                                       </div>
                           </div>
                         )}
                                 </>
                               );
                             }}
                           />
                         }
                       />
                       <Pie
                         data={[
                           { 
                             name: 'userTalkTime', 
                             value: hasData(callData?.metrics?.userTalkTime) ? callData!.metrics!.userTalkTime! : 0, 
                             fill: '#000000'
                           },
                           { 
                             name: 'assistantTalkTime', 
                             value: hasData(callData?.metrics?.assistantTalkTime) ? callData!.metrics!.assistantTalkTime! : 0, 
                             fill: '#333333'
                           },
                           { 
                             name: 'silenceTime', 
                             value: hasData(callData?.metrics?.silenceTime) ? callData!.metrics!.silenceTime! : 0, 
                             fill: '#666666'
                           },
                         ]}
                         dataKey="value"
                         nameKey="name"
                         innerRadius={60}
                         outerRadius={100}
                         strokeWidth={5}
                       >
                         <Label
                           content={({ viewBox }) => {
                             if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                               const total = 
                                 (hasData(callData?.metrics?.userTalkTime) ? callData!.metrics!.userTalkTime! : 0) +
                                 (hasData(callData?.metrics?.assistantTalkTime) ? callData!.metrics!.assistantTalkTime! : 0) +
                                 (hasData(callData?.metrics?.silenceTime) ? callData!.metrics!.silenceTime! : 0);
                               
                               return (
                                 <text
                                   x={viewBox.cx}
                                   y={viewBox.cy}
                                   textAnchor="middle"
                                   dominantBaseline="middle"
                                 >
                                   <tspan
                                     x={viewBox.cx}
                                     y={viewBox.cy}
                                     className="fill-foreground text-3xl font-bold"
                                   >
                                     {formatDuration(total)}
                                   </tspan>
                                   <tspan
                                     x={viewBox.cx}
                                     y={(viewBox.cy || 0) + 24}
                                     className="fill-muted-foreground"
                                   >
                                     Total
                                   </tspan>
                                 </text>
                               );
                             }
                           }}
                         />
                       </Pie>
                     </PieChart>
                   </ChartContainer>
                 </CardContent>
                 <CardFooter className="flex-col gap-2 text-sm">
                   <div className="text-muted-foreground leading-none">
                     Total Duration: {hasData(callData?.metrics?.totalDuration) ? formatDuration(callData!.metrics!.totalDuration!) : 'N/A'}
                       </div>
                 </CardFooter>
               </Card>

               <Card>
                 <CardHeader className="items-center pb-0">
                   <CardTitle>Talk Time Ratios</CardTitle>
                   <CardDescription>Percentage distribution of talk time across participants</CardDescription>
                 </CardHeader>
                 <CardContent className="flex-1 pb-0">
                   <ChartContainer
                     config={{
                       userTalkRatio: { label: "User Talk Ratio", color: "#000000" },
                       assistantTalkRatio: { label: "Assistant Talk Ratio", color: "#333333" },
                     }}
                     className="mx-auto aspect-square max-h-[250px]"
                   >
                    <PieChart>
                      <RechartsTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            className="w-[200px]"
                            formatter={(value, name, item, index) => {
                              const dataLength = [
                                hasData(callData?.metrics?.userTalkRatio) ? 1 : 0,
                                hasData(callData?.metrics?.assistantTalkRatio) ? 1 : 0,
                              ].reduce((a, b) => a + b, 0);
                               
                               const total = 
                                 (hasData(callData?.metrics?.userTalkRatio) ? callData!.metrics!.userTalkRatio! : 0) +
                                 (hasData(callData?.metrics?.assistantTalkRatio) ? callData!.metrics!.assistantTalkRatio! : 0);

                               const labels: Record<string, string> = {
                                 userTalkRatio: "User Talk Ratio",
                                 assistantTalkRatio: "Assistant Talk Ratio"
                               };

                               return (
                                 <>
                                   <div
                                     className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                     style={
                                       {
                                         "--color-bg": `var(--color-${name})`,
                                       } as React.CSSProperties
                                     }
                                   />
                                   {labels[String(name)] || String(name)}
                                   <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                     {Number(value).toFixed(1)}
                                     <span className="font-normal text-muted-foreground">
                                       %
                         </span>
                           </div>
                                   {index === dataLength - 1 && total > 0 && (
                                     <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                       Total
                                       <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                         {total.toFixed(1)}
                                         <span className="font-normal text-muted-foreground">
                                           %
                         </span>
                           </div>
                       </div>
                                   )}
                                 </>
                               );
                             }}
                           />
                         }
                       />
                       <Pie
                         data={[
                           { 
                             name: 'userTalkRatio', 
                             value: hasData(callData?.metrics?.userTalkRatio) ? callData!.metrics!.userTalkRatio! : 0, 
                             fill: '#000000'
                           },
                           { 
                             name: 'assistantTalkRatio', 
                             value: hasData(callData?.metrics?.assistantTalkRatio) ? callData!.metrics!.assistantTalkRatio! : 0, 
                             fill: '#333333'
                           },
                         ]}
                         dataKey="value"
                         nameKey="name"
                         innerRadius={60}
                         outerRadius={100}
                         strokeWidth={5}
                       >
                         <Label
                           content={({ viewBox }) => {
                             if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                               const total = 
                                 (hasData(callData?.metrics?.userTalkRatio) ? callData!.metrics!.userTalkRatio! : 0) +
                                 (hasData(callData?.metrics?.assistantTalkRatio) ? callData!.metrics!.assistantTalkRatio! : 0);
                               
                               return (
                                 <text
                                   x={viewBox.cx}
                                   y={viewBox.cy}
                                   textAnchor="middle"
                                   dominantBaseline="middle"
                                 >
                                   <tspan
                                     x={viewBox.cx}
                                     y={viewBox.cy}
                                     className="fill-foreground text-3xl font-bold"
                                   >
                                     {total.toFixed(0)}%
                                   </tspan>
                                   <tspan
                                     x={viewBox.cx}
                                     y={(viewBox.cy || 0) + 24}
                                     className="fill-muted-foreground"
                                   >
                                     Total
                                   </tspan>
                                 </text>
                               );
                             }
                           }}
                         />
                       </Pie>
                     </PieChart>
                   </ChartContainer>
                 </CardContent>
                 <CardFooter className="flex-col gap-2 text-sm">
                   <div className="text-muted-foreground leading-none">
                     Ratios show percentage of time spent by each participant
                   </div>
                 </CardFooter>
               </Card>
             </div>

             {/* Response Time & Interaction Metrics */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card>
                 <CardHeader className="pb-4">
                   <CardTitle className="flex items-center gap-2">
                     <Clock className="h-5 w-5" />
                     Response Time Analysis
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Avg Response Time</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.responseTime) 
                           ? `${callData!.metrics!.responseTime!.toFixed(3)}s` 
                             : 'N/A'}
                       </p>
                       </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Response Count</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.responseTimeCount) 
                           ? callData!.metrics!.responseTimeCount 
                           : 'N/A'}
                       </p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Min Response Time</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.responseTimeMin) 
                           ? `${callData!.metrics!.responseTimeMin!.toFixed(3)}s` 
                           : 'N/A'}
                       </p>
                         </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Max Response Time</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.responseTimeMax) 
                           ? `${callData!.metrics!.responseTimeMax!.toFixed(3)}s` 
                           : 'N/A'}
                       </p>
                             </div>
                   </div>
                 </CardContent>
                               </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                     <Users className="h-5 w-5" />
                     Interaction Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Turn Count</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.turnCount) 
                           ? callData!.metrics!.turnCount 
                            : 'N/A'}
                       </p>
                      </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Interruptions</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.interruptionCount) 
                           ? callData!.metrics!.interruptionCount 
                            : 'N/A'}
                       </p>
                      </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Keyword Matches</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.keywordMatches) 
                           ? callData!.metrics!.keywordMatches 
                            : 'N/A'}
                       </p>
                      </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Avg Turns/Min</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.turnCount) && hasData(callData?.metrics?.totalDuration)
                           ? `${(callData!.metrics!.turnCount! / (callData!.metrics!.totalDuration! / 60)).toFixed(1)}` 
                              : 'N/A'}
                       </p>
                      </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Silence Time</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.silenceTime) 
                           ? formatDuration(callData!.metrics!.silenceTime!) 
                            : 'N/A'}
                       </p>
                      </div>
                     <div className="space-y-1">
                       <p className="text-xs text-muted-foreground">Silence Ratio</p>
                       <p className="text-xl font-semibold">
                         {hasData(callData?.metrics?.silenceTime) && hasData(callData?.metrics?.totalDuration)
                           ? `${((callData!.metrics!.silenceTime! / callData!.metrics!.totalDuration!) * 100).toFixed(1)}%` 
                              : 'N/A'}
                       </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

             {/* Quality & Comprehension Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                   <CardTitle className="flex items-center gap-2">
                     <Brain className="h-5 w-5" />
                     Intelligence & Comprehension
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                     <div>
                       <div className="flex justify-between mb-1">
                         <span className="text-sm">Confidence Score</span>
                      <span className="text-sm font-medium">
                           {hasData(callData?.metrics?.confidenceScore) 
                             ? `${(callData!.metrics!.confidenceScore! * 100).toFixed(0)}%` 
                             : 'N/A'}
                      </span>
                    </div>
                       {hasData(callData?.metrics?.confidenceScore) && (
                         <div className="w-full bg-muted rounded-full h-2">
                           <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${callData!.metrics!.confidenceScore! * 100}%` }}></div>
                    </div>
                       )}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                         <span className="text-sm">Comprehension Score</span>
                        <span className="text-sm font-medium">
                           {hasData(callData?.metrics?.comprehensionScore) 
                             ? `${(callData!.metrics!.comprehensionScore! * 100).toFixed(0)}%` 
                            : 'N/A'}
                        </span>
                      </div>
                       {hasData(callData?.metrics?.comprehensionScore) && (
                        <div className="w-full bg-muted rounded-full h-2">
                           <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${callData!.metrics!.comprehensionScore! * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Sentiment Score</span>
                        <span className="text-sm font-medium">
                          {hasData(callData?.metrics?.sentimentScore) 
                            ? `${(callData!.metrics!.sentimentScore! * 100).toFixed(0)}%` 
                            : 'N/A'}
                        </span>
                      </div>
                      {hasData(callData?.metrics?.sentimentScore) && (
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${callData!.metrics!.sentimentScore! * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                         <span className="text-sm">Clarity Score</span>
                        <span className="text-sm font-medium">
                           {hasData(callData?.metrics?.clarity) 
                             ? `${(callData!.metrics!.clarity! * 100).toFixed(0)}%` 
                            : 'N/A'}
                        </span>
                      </div>
                       {hasData(callData?.metrics?.clarity) && (
                        <div className="w-full bg-muted rounded-full h-2">
                           <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${callData!.metrics!.clarity! * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                   </div>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="pb-4">
                   <CardTitle className="flex items-center gap-2">
                     <Award className="h-5 w-5" />
                     Quality Assessment
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-sm">Overall Quality</span>
                       <div className="flex items-center gap-2">
                         <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                           {hasData(callData?.metrics?.callQualityScore) 
                             ? `${callData!.metrics!.callQualityScore}/10` 
                            : 'N/A'}
                        </span>
                      </div>
                     </div>
                     {hasData(callData?.metrics?.callQualityScore) ? (
                       <>
                        <div className="w-full bg-muted rounded-full h-2">
                           <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full" style={{ width: `${(callData!.metrics!.callQualityScore! * 10)}%` }}></div>
                        </div>
                         <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                           <div className="text-center p-2 bg-green-50 rounded">
                             <div className="font-medium text-green-700">
                               {hasData(callData?.quality?.audioQuality) ? callData!.quality!.audioQuality : 'N/A'}
                    </div>
                             <div className="text-green-600">Audio Quality</div>
                           </div>
                           <div className="text-center p-2 bg-blue-50 rounded">
                             <div className="font-medium text-blue-700">
                               {hasData(callData?.quality?.connectionQuality) ? callData!.quality!.connectionQuality : 'N/A'}
                             </div>
                             <div className="text-blue-600">Connection</div>
                           </div>
                         </div>
                       </>
                     ) : (
                       <div className="text-center py-4">
                         <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                           No Data Available
                         </Badge>
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            {/* Insights Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Opportunities Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(callData?.insights || []).filter(i => i.type === 'opportunity').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Sales opportunities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pain Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(callData?.insights || []).filter(i => i.type === 'pain_point').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Issues identified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Successes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(callData?.insights || []).filter(i => i.type === 'success').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Positive outcomes</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasData(callData?.insights) && callData!.insights!.length > 0 ? (
                    <div className="space-y-3">
                      {callData!.insights!.map((insight, index) => {
                      const getInsightIcon = (type: string) => {
                        switch (type) {
                          case 'opportunity':
                            return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
                          case 'pain_point':
                            return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
                          case 'success':
                            return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
                          default:
                            return <Lightbulb className="h-4 w-4 text-muted-foreground" />;
                        }
                      };

                      const getInsightColor = () => {
                        return 'bg-muted border-border';
                      };

                      return (
                        <div key={index} className={`p-3 rounded-lg border ${getInsightColor()}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">{insight.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {insight.type.replace('_', ' ').split(' ').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Confidence: {(insight.confidence * 100).toFixed(0)}%
                              </span>
                              <div className="flex-1 max-w-[100px] bg-muted rounded-full h-1.5">
                                <div 
                                  className="bg-foreground h-1.5 rounded-full" 
                                  style={{ width: `${insight.confidence * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        No Data Available
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">No insights available for this call</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Call Tags & Classification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Auto-Generated Tags</h4>
                      {hasData(callData?.tags) && callData!.tags!.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {callData!.tags!.map((tag, index) => (
                            <Badge key={index} variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                              {tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                          No tags available
                        </Badge>
                      )}
                    </div>
                    
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">Call Classification</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">Call Type</span>
                          <Badge variant="outline" className="bg-muted text-muted-foreground capitalize">
                            {displayValue(callData?.call_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">Status</span>
                          <Badge variant="outline" className="bg-muted text-muted-foreground capitalize">
                            {displayValue(callData?.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">Outcome</span>
                          <Badge variant="outline" className="bg-muted text-muted-foreground capitalize">
                            {displayValue(callData?.outcome)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">Transferred</span>
                          <Badge variant="outline" className="bg-muted text-muted-foreground capitalize">
                            {displayValue(callData?.is_transfered)}
                          </Badge>
                        </div>
                        {hasData(callData?.transfer_number) && (
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm">Transfer Number</span>
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              {callData!.transfer_number}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

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
                    Liaplus AI
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/calls">
                    Call Logs
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Call Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight">Call Details</h1>
                  {getSentimentBadge(callData?.sentiment || 'neutral')}
                  {getStatusIcon(callData?.status || 'unknown')}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(() => {
                    const isWebCall = callData?.meta_data?.source === 'web' || 
                                    callData?.meta_data?.source === 'widget' ||
                                    callData?.from_number?.toLowerCase().includes('web') ||
                                    callData?.from_number?.toLowerCase().includes('widget') ||
                                    callData?.call_type === 'webcall' ||
                                    (!callData?.from_number && !callData?.to_number);
                    
                    if (isWebCall) {
                      return <Globe className="h-3 w-3" />;
                    }
                    
                    return callData?.call_type === 'inbound' ? (
                    <PhoneIncoming className="h-3 w-3" />
                  ) : (
                    <PhoneOutgoing className="h-3 w-3" />
                    );
                  })()}
                  <span>
                    {(() => {
                      const isWebCall = callData?.meta_data?.source === 'web' || 
                                      callData?.meta_data?.source === 'widget' ||
                                      callData?.from_number?.toLowerCase().includes('web') ||
                                      callData?.from_number?.toLowerCase().includes('widget') ||
                                      callData?.call_type === 'webcall' ||
                                      (!callData?.from_number && !callData?.to_number);
                      return isWebCall ? 'Web' : displayValue(callData?.from_number);
                    })()}
                  </span>
                  <span>•</span>
                  <span>{formatTimestamp(callData!.start_time)}</span>
                  <span>•</span>
                  <span>{formatDuration(callData?.duration_seconds || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareCall}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full">
            <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
              {[
                { title: "Overview", value: "overview", icon: BarChart3 },
                { title: "Transcript", value: "transcript", icon: FileText },
                { title: "Ask Lia", value: "ask-lia", icon: Bot },
                { title: "Metrics", value: "metrics", icon: Activity },
                { title: "Insights", value: "insights", icon: Lightbulb },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm ${
                    activeTab === tab.value
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

