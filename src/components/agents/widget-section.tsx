'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Copy, 
  CheckCircle,
  Settings,
  Palette,
  MessageSquare,
  Mic,
  Shield,
  Image,
  Upload,
  X,
  Plus,
  Trash2,
  Globe,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { FloatingWidgetPreview } from './floating-widget-preview';
import { agentsApi } from '@/lib/api/agents';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WidgetConfig } from '@/types/widget';

interface WidgetSectionProps {
  agent: Agent;
}

export function WidgetSection({ agent }: WidgetSectionProps) {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    mode: 'chat',
    theme: 'light',
    baseBgColor: '#ffffff',
    accentColor: '#9333ea',
    ctaButtonColor: '#000000',
    ctaButtonTextColor: '#ffffff',
    borderRadius: 'large',
    size: 'full',
    position: 'bottom-right',
    title: 'TALK WITH AI',
    startButtonText: 'Start',
    endButtonText: 'End Call',
    chatFirstMessage: 'Hey, How can I help you today?',
    chatPlaceholder: 'Type your message...',
    voiceShowTranscript: true,
    consentRequired: true,
    consentTitle: 'Terms and conditions',
    consentContent: 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service.',
    consentStorageKey: 'lia_widget_consent',
    customImageUrl: '',
    helpTexts: ['Ask Lia', 'Talk to Lia', 'Chat with Lia', 'Need Help?', 'Ask Anything', 'Get Answers'],
    agentDisplayName: 'Lia',
    languageSelectorEnabled: false,
    languages: []
  });

  // Load saved widget configuration
  const loadWidgetConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await agentsApi.getWidgetConfig(agent.assistant_id);
      if (response.config) {
        setWidgetConfig(response.config);
      }
    } catch (error) {
      console.error('Failed to load widget configuration:', error);
      // Don't show error toast - just use defaults
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Load saved widget configuration on mount
  useEffect(() => {
    loadWidgetConfig();
  }, [agent.assistant_id]);

  // Fetch available agents for language mapping
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await agentsApi.getAgents({
          is_deleted: false,
          status: 'Active'
        });
        setAvailableAgents(response.assistants || []);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        toast.error('Failed to load available agents');
      }
    };

    fetchAgents();
  }, []);

  // Widget defaults - must match widget-sdk.js
  const WIDGET_DEFAULTS = {
    mode: 'chat',
    theme: 'light',
    baseBgColor: '#ffffff',
    accentColor: '#9333ea',
    ctaButtonColor: '#000000',
    ctaButtonTextColor: '#ffffff',
    borderRadius: 'large',
    size: 'full',
    position: 'bottom-right',
    title: 'TALK WITH AI',
    startButtonText: 'Start',
    endButtonText: 'End Call',
    chatFirstMessage: 'Hey, How can I help you today?',
    chatPlaceholder: 'Type your message...',
    voiceShowTranscript: true,
    consentRequired: true,
    consentTitle: 'Terms and conditions',
    consentContent: 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service.',
    consentStorageKey: 'lia_widget_consent',
    customImageUrl: ''
  };

  // Generate optimized widget script for embed.js
  const generateWidgetScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.liaplus.com';
    
    // Build data attributes array with only non-default values
    const attributes: string[] = [];
    
    // Always required
    attributes.push(`data-assistant-id="${agent.assistant_id}"`);
    
    // Mapping for attribute names
    const attrMap: Record<string, string> = {
      mode: 'data-mode',
      theme: 'data-theme',
      position: 'data-position',
      size: 'data-size',
      borderRadius: 'data-border-radius',
      baseBgColor: 'data-base-bg-color',
      accentColor: 'data-accent-color',
      ctaButtonColor: 'data-cta-button-color',
      ctaButtonTextColor: 'data-cta-button-text-color',
      title: 'data-title',
      startButtonText: 'data-start-button-text',
      endButtonText: 'data-end-button-text',
      chatFirstMessage: 'data-chat-first-message',
      chatPlaceholder: 'data-chat-placeholder',
      voiceShowTranscript: 'data-voice-show-transcript',
      consentRequired: 'data-consent-required',
      consentTitle: 'data-consent-title',
      consentContent: 'data-consent-content',
      consentStorageKey: 'data-consent-storage-key',
      customImageUrl: 'data-custom-image-url',
      helpTexts: 'data-help-texts',
      agentDisplayName: 'data-agent-display-name',
      languageSelectorEnabled: 'data-language-selector-enabled',
      languages: 'data-languages'
    };

    // Add only changed values (comparing to defaults)
    Object.entries(widgetConfig).forEach(([key, value]) => {
      if (key === 'helpTexts' && Array.isArray(value)) {
        // Convert help texts array to comma-separated string
        const defaultHelpTexts = ['Ask Lia', 'Talk to Lia', 'Chat with Lia', 'Need Help?', 'Ask Anything', 'Get Answers'];
        if (JSON.stringify(value) !== JSON.stringify(defaultHelpTexts)) {
          attributes.push(`${attrMap[key]}="${value.join(',')}"`);
        }
      } else if (key === 'languages' && Array.isArray(value)) {
        // Convert languages array to JSON string
        if (value.length > 0) {
          // Escape single quotes in JSON for attribute value
          const jsonStr = JSON.stringify(value).replace(/'/g, "\\'");
          attributes.push(`${attrMap[key]}='${jsonStr}'`);
        }
      } else if (value !== WIDGET_DEFAULTS[key as keyof typeof WIDGET_DEFAULTS]) {
        const attrName = attrMap[key];
        if (attrName) {
          attributes.push(`${attrName}="${value}"`);
        }
      }
    });

    return `<script 
    src="${baseUrl}/embed.js"
    ${attributes.join('\n    ')}
></script>`;
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [type]: true }));
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setWidgetConfig(prev => ({ ...prev, customImageUrl: result.url }));
        setImageError(false); // Reset error state on successful upload
        toast.success('Logo uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove custom image
  const removeCustomImage = () => {
    setWidgetConfig(prev => ({ ...prev, customImageUrl: '' }));
    setImageError(false); // Reset image error state
    toast.success('Custom logo removed');
  };

  // Helper functions for new configuration fields
  const addHelpText = () => {
    if (widgetConfig.helpTexts.length < 10) {
      setWidgetConfig(prev => ({ 
        ...prev, 
        helpTexts: [...prev.helpTexts, 'New help text'] 
      }));
    }
  };

  const removeHelpText = (index: number) => {
    if (widgetConfig.helpTexts.length > 1) {
      setWidgetConfig(prev => ({ 
        ...prev, 
        helpTexts: prev.helpTexts.filter((_, i) => i !== index) 
      }));
    }
  };

  const updateHelpText = (index: number, value: string) => {
    setWidgetConfig(prev => ({ 
      ...prev, 
      helpTexts: prev.helpTexts.map((text, i) => i === index ? value : text) 
    }));
  };

  const addLanguage = () => {
    setWidgetConfig(prev => ({ 
      ...prev, 
      languages: [...prev.languages, { name: '', assistantId: '' }] 
    }));
  };

  const removeLanguage = (index: number) => {
    setWidgetConfig(prev => ({ 
      ...prev, 
      languages: prev.languages.filter((_, i) => i !== index) 
    }));
  };

  const updateLanguage = (index: number, field: 'name' | 'assistantId', value: string) => {
    setWidgetConfig(prev => ({ 
      ...prev, 
      languages: prev.languages.map((lang, i) => 
        i === index ? { ...lang, [field]: value } : lang
      ) 
    }));
  };

  // Save widget configuration
  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      await agentsApi.saveWidgetConfig(agent.assistant_id, widgetConfig);
      toast.success('Widget configuration saved successfully!');
      // Refresh configuration after saving to ensure we have the latest data
      await loadWidgetConfig();
    } catch (error) {
      console.error('Failed to save widget configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save widget configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview the widget
  const previewWidget = () => {
    const widgetUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/widget/${agent.id}`;
    window.open(widgetUrl, '_blank', 'width=400,height=600');
  };

  return (
    <div className="space-y-6">
      {/* Main Widget Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Widget</CardTitle>
          <CardDescription className="text-base mt-2">
            Add this conversational widget to your website. Visitors can talk or chat with your AI assistant directly from any page.
          </CardDescription>
        </CardHeader>
        <CardContent>
                  {/* Embed Code Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Embed Code</h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Refresh configuration before opening customize drawer
                            await loadWidgetConfig();
                            setIsCustomizeOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Customize
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyToClipboard(generateWidgetScript(), 'Widget code');
                          }}
                          className="gap-2"
                        >
                          {copiedStates['Widget code'] ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copiedStates['Widget code'] ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <ScrollArea className="h-[150px] w-full rounded-md border">
                        <Textarea
                          value={generateWidgetScript()}
                          readOnly
                          className="font-mono text-sm bg-muted/50 resize-none border-0 min-h-[150px] focus-visible:ring-0"
                        />
                      </ScrollArea>
                    </div>
                  </div>

        </CardContent>
      </Card>

      {/* Live Widget Preview - Floating */}
      <FloatingWidgetPreview agent={agent} widgetConfig={widgetConfig} />

      {/* Customize Drawer */}
              <Sheet open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] p-4">
                  <SheetHeader className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <SheetTitle>Customize Widget</SheetTitle>
                        <SheetDescription>
                          Configure your widget appearance and behavior
                        </SheetDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadWidgetConfig}
                        disabled={isLoadingConfig}
                        className="gap-2"
                      >
                        {isLoadingConfig ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Settings className="h-4 w-4" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>
                  </SheetHeader>
                  
                  {/* Save Configuration Button */}
                  <div className="mb-4">
                    <Button 
                      onClick={handleSaveConfiguration}
                      disabled={isSaving || isLoadingConfig}
                      className="w-full"
                      size="lg"
                    >
                      {isSaving ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-220px)] pr-3">
            <div className="space-y-8 pb-6">
              {/* Basic Settings */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Basic Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mode" className="text-sm font-medium">Mode</Label>
                    <Select value={widgetConfig.mode} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, mode: value }))}>
                      <SelectTrigger id="mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="voice">Voice</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                    <Select value={widgetConfig.theme} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-sm font-medium">Size</Label>
                    <Select value={widgetConfig.size} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, size: value }))}>
                      <SelectTrigger id="size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium">Position</Label>
                    <Select value={widgetConfig.position} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, position: value }))}>
                      <SelectTrigger id="position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" />
                  Appearance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="baseBgColor" className="text-sm font-medium">Base Background Color</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                        <Input
                          id="baseBgColor"
                          type="color"
                          value={widgetConfig.baseBgColor}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, baseBgColor: e.target.value }))}
                          className="relative w-11 h-11 p-0.5 cursor-pointer rounded-md border-2 border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <Input
                        value={widgetConfig.baseBgColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, baseBgColor: e.target.value }))}
                        className="flex-1 font-mono text-xs uppercase tracking-wide"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor" className="text-sm font-medium">Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                        <Input
                          id="accentColor"
                          type="color"
                          value={widgetConfig.accentColor}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="relative w-11 h-11 p-0.5 cursor-pointer rounded-md border-2 border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <Input
                        value={widgetConfig.accentColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 font-mono text-xs uppercase tracking-wide"
                        placeholder="#14B8A6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaButtonColor" className="text-sm font-medium">CTA Button Color</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                        <Input
                          id="ctaButtonColor"
                          type="color"
                          value={widgetConfig.ctaButtonColor}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, ctaButtonColor: e.target.value }))}
                          className="relative w-11 h-11 p-0.5 cursor-pointer rounded-md border-2 border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <Input
                        value={widgetConfig.ctaButtonColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, ctaButtonColor: e.target.value }))}
                        className="flex-1 font-mono text-xs uppercase tracking-wide"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaButtonTextColor" className="text-sm font-medium">CTA Button Text Color</Label>
                    <div className="flex gap-2 items-center">
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                        <Input
                          id="ctaButtonTextColor"
                          type="color"
                          value={widgetConfig.ctaButtonTextColor}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, ctaButtonTextColor: e.target.value }))}
                          className="relative w-11 h-11 p-0.5 cursor-pointer rounded-md border-2 border-gray-200 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <Input
                        value={widgetConfig.ctaButtonTextColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, ctaButtonTextColor: e.target.value }))}
                        className="flex-1 font-mono text-xs uppercase tracking-wide"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="borderRadius" className="text-sm font-medium">Border Radius</Label>
                    <Select value={widgetConfig.borderRadius} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, borderRadius: value }))}>
                      <SelectTrigger id="borderRadius">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Custom Image/Logo Section */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <Label htmlFor="customImageUrl" className="text-sm font-medium flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Custom Logo/Image
                    </Label>
                    <div className="space-y-3">
                      {/* File Upload Section */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                Upload Logo
                              </>
                            )}
                          </Button>
                          {widgetConfig.customImageUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeCustomImage}
                              className="gap-2 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* URL Input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Or enter image URL:</Label>
                        <Input
                          id="customImageUrl"
                          value={widgetConfig.customImageUrl}
                          onChange={(e) => {
                            setWidgetConfig(prev => ({ ...prev, customImageUrl: e.target.value }));
                            setImageError(false); // Reset error state when URL changes
                          }}
                          placeholder="https://example.com/your-logo.png"
                          className="font-mono text-xs"
                        />
                      </div>

                      {/* Preview */}
                      {widgetConfig.customImageUrl && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Preview:</Label>
                          <div className="relative w-16 h-16 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            {!imageError ? (
                              <img
                                src={widgetConfig.customImageUrl}
                                alt="Custom logo preview"
                                className="w-full h-full object-contain"
                                onError={() => setImageError(true)}
                                onLoad={() => setImageError(false)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                Invalid URL
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Upload a logo file or enter a URL to your custom image. This will replace the default widget icon. 
                        Supported formats: JPEG, PNG, GIF, WebP (max 5MB).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Settings */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Text Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                    <Input
                      id="title"
                      value={widgetConfig.title}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Chat with Lia!"
                    />
                  </div>
                  {(widgetConfig.mode === 'voice' || widgetConfig.mode === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="startButtonText" className="text-sm font-medium">Start Button Text</Label>
                      <Input
                        id="startButtonText"
                        value={widgetConfig.startButtonText}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, startButtonText: e.target.value }))}
                        placeholder="Start Call"
                      />
                    </div>
                  )}
                  {(widgetConfig.mode === 'voice' || widgetConfig.mode === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="endButtonText" className="text-sm font-medium">End Button Text</Label>
                      <Input
                        id="endButtonText"
                        value={widgetConfig.endButtonText}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, endButtonText: e.target.value }))}
                        placeholder="End Call"
                      />
                    </div>
                  )}
                  {(widgetConfig.mode === 'chat' || widgetConfig.mode === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="chatFirstMessage" className="text-sm font-medium">Chat First Message</Label>
                      <Input
                        id="chatFirstMessage"
                        value={widgetConfig.chatFirstMessage}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, chatFirstMessage: e.target.value }))}
                        placeholder="Hey, How can I help you today?"
                      />
                    </div>
                  )}
                  {(widgetConfig.mode === 'chat' || widgetConfig.mode === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="chatPlaceholder" className="text-sm font-medium">Chat Placeholder</Label>
                      <Input
                        id="chatPlaceholder"
                        value={widgetConfig.chatPlaceholder}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, chatPlaceholder: e.target.value }))}
                        placeholder="Type your message..."
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="agentDisplayName" className="text-sm font-medium">Agent Display Name</Label>
                    <Input
                      id="agentDisplayName"
                      value={widgetConfig.agentDisplayName}
                      onChange={(e) => setWidgetConfig(prev => ({ ...prev, agentDisplayName: e.target.value }))}
                      placeholder="Lia"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in "{widgetConfig.agentDisplayName} is thinking..." message
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Texts Settings */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Rotating Help Texts
                </h4>
                <div className="space-y-3">
                  {widgetConfig.helpTexts.map((text, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={text}
                        onChange={(e) => updateHelpText(index, e.target.value)}
                        placeholder="Enter help text"
                        className="flex-1"
                      />
                      {widgetConfig.helpTexts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeHelpText(index)}
                          className="h-10 w-10 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {widgetConfig.helpTexts.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addHelpText}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Help Text
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    These texts will rotate in the collapsed widget. Minimum 1, maximum 10 texts.
                  </p>
                </div>
              </div>

              {/* Voice Settings - Only show if voice or both mode */}
              {(widgetConfig.mode === 'voice' || widgetConfig.mode === 'both') && (
                <div className="space-y-5">
                  <h4 className="font-semibold flex items-center gap-2 text-base">
                    <Mic className="h-4 w-4" />
                    Voice Settings
                  </h4>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="voiceShowTranscript"
                      checked={widgetConfig.voiceShowTranscript}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, voiceShowTranscript: checked }))}
                    />
                    <Label htmlFor="voiceShowTranscript" className="text-sm font-medium cursor-pointer">Show Transcript</Label>
                  </div>
                </div>
              )}

              {/* Multi-Language Support */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Multi-Language Support
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="languageSelectorEnabled"
                      checked={widgetConfig.languageSelectorEnabled}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, languageSelectorEnabled: checked }))}
                    />
                    <Label htmlFor="languageSelectorEnabled" className="text-sm font-medium">
                      Enable Language Selector
                    </Label>
                  </div>
                  
                  {widgetConfig.languageSelectorEnabled && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Configure language mappings. Users will see a language dropdown in the widget.
                      </p>
                      {widgetConfig.languages.map((language, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={language.name}
                              onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                              placeholder="Language name (e.g., English, Spanish)"
                              className="w-full"
                            />
                            <Select
                              value={language.assistantId}
                              onValueChange={(value) => updateLanguage(index, 'assistantId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select assistant" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAgents.map((agent) => (
                                  <SelectItem key={agent.id} value={agent.assistant_id}>
                                    {agent.name} (ID: {agent.assistant_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeLanguage(index)}
                            className="h-10 w-10 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLanguage}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Language
                      </Button>
                      {widgetConfig.languageSelectorEnabled && widgetConfig.languages.length < 2 && (
                        <p className="text-xs text-amber-600">
                          At least 2 languages are required when language selector is enabled.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Consent Settings */}
              <div className="space-y-5">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Consent Settings
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="consentRequired"
                      checked={widgetConfig.consentRequired}
                      onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, consentRequired: checked }))}
                    />
                    <Label htmlFor="consentRequired" className="text-sm font-medium cursor-pointer">Require Consent</Label>
                  </div>
                  {widgetConfig.consentRequired && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="consentTitle" className="text-sm font-medium">Consent Title</Label>
                        <Input
                          id="consentTitle"
                          value={widgetConfig.consentTitle}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, consentTitle: e.target.value }))}
                          placeholder="Terms and conditions"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consentContent" className="text-sm font-medium">Consent Content</Label>
                        <Textarea
                          id="consentContent"
                          value={widgetConfig.consentContent}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, consentContent: e.target.value }))}
                          rows={4}
                          placeholder="Enter consent message..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consentStorageKey" className="text-sm font-medium">Consent Storage Key</Label>
                        <Input
                          id="consentStorageKey"
                          value={widgetConfig.consentStorageKey}
                          onChange={(e) => setWidgetConfig(prev => ({ ...prev, consentStorageKey: e.target.value }))}
                          placeholder="lia_widget_consent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
