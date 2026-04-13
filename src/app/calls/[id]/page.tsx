'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { callsApi } from '@/lib/api/calls';
import { agentsApi } from '@/lib/api/agents';
import { useAuth } from '@/hooks/use-auth';
import { usePreviousPage } from '@/hooks/use-previous-page';
import type { CallLog } from '@/types/call';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Phone,
  User,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  Copy,
  Globe,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Bot,
  Users,
  Activity,
  FileText,
} from 'lucide-react';

export default function CallDetailsPage() {
  const params = useParams();
  const callId = params.id as string;
  const { user } = useAuth();
  const { goBack } = usePreviousPage();
  
  const [activeTab, setActiveTab] = useState('transcript');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  
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
      <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
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
      <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
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

  const handleCopyTranscript = () => {
    const transcriptText = callData?.transcripts
      .map(entry => `[${entry.timestamp}] ${entry.speaker === 'assistant' ? 'Agent' : 'Customer'}: ${entry.text}`)
      .join('\n') || '';
    navigator.clipboard.writeText(transcriptText);
    toast.success('Transcript copied to clipboard');
  };

  const filteredTranscript = (callData?.transcripts || []).filter(entry =>
    entry.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const renderTabContent = () => {
    switch (activeTab) {
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
                <div className="space-y-4 max-h-[600px] overflow-y-auto px-4">
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

      case 'disposition':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Disposition Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">From</p>
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
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">To</p>
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
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm font-medium capitalize">{displayValue(callData?.status)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Outcome</p>
                        <p className="text-sm font-medium capitalize">{displayValue(callData?.outcome)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Call Type</p>
                        <p className="text-sm font-medium capitalize">{displayValue(callData?.call_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Transferred</p>
                        <p className="text-sm font-medium">{callData?.is_transfered ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    {hasData(callData?.transfer_number) && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Transfer Number</p>
                          <p className="text-sm font-medium">{callData!.transfer_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {hasData(callData?.tags) && callData!.tags!.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {callData!.tags!.map((tag, index) => (
                          <Badge key={index} variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                            {tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    JustDial
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
                { title: "Transcript", value: "transcript", icon: FileText },
                { title: "Disposition", value: "disposition", icon: CheckCircle },
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

