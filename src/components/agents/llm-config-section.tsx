'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  BookOpen,
  History,
  ChevronDown,
  Clock,
  RotateCcw,
  GitCompare,
  Globe,
  Save,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Version history helpers
// ---------------------------------------------------------------------------

interface PromptVersion {
  content: string;
  timestamp: string;
  label: string;
}

const MAX_VERSIONS = 3;
const versionKey = (id: string) => `pv_${id}`;

function loadVersions(assistantId: string): PromptVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(versionKey(assistantId)) || '[]');
  } catch {
    return [];
  }
}

function saveVersion(assistantId: string, content: string, label: string) {
  if (typeof window === 'undefined' || !content.trim()) return;
  const versions = loadVersions(assistantId);
  // Avoid saving duplicate of the very last saved version
  if (versions.length > 0 && versions[0].content === content) return;
  versions.unshift({ content, timestamp: new Date().toISOString(), label });
  versions.splice(MAX_VERSIONS);
  localStorage.setItem(versionKey(assistantId), JSON.stringify(versions));
}

// ---------------------------------------------------------------------------
// Diff engine (LCS-based line diff, like git)
// ---------------------------------------------------------------------------

type DiffLine = { type: 'same' | 'removed' | 'added'; text: string };

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const m = a.length, n = b.length;

  // DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ type: 'same', text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'added', text: b[j - 1] });
      j--;
    } else {
      result.push({ type: 'removed', text: a[i - 1] });
      i--;
    }
  }
  return result.reverse();
}

// ---------------------------------------------------------------------------
// DiffViewer component
// ---------------------------------------------------------------------------

function DiffViewer({ oldVersion, currentPrompt }: { oldVersion: PromptVersion; currentPrompt: string }) {
  const diff = computeLineDiff(oldVersion.content, currentPrompt);
  const added = diff.filter((l) => l.type === 'added').length;
  const removed = diff.filter((l) => l.type === 'removed').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Comparing: <span className="font-medium text-foreground">{oldVersion.label}</span></span>
        <span className="text-green-600 font-medium">+{added} added</span>
        <span className="text-red-600 font-medium">−{removed} removed</span>
      </div>
      <div className="rounded-md border overflow-auto max-h-96 font-mono text-xs">
        {diff.map((line, i) => (
          <div
            key={i}
            className={
              line.type === 'added'
                ? 'bg-green-50 text-green-800 px-3 py-0.5'
                : line.type === 'removed'
                ? 'bg-red-50 text-red-800 px-3 py-0.5 line-through opacity-70'
                : 'px-3 py-0.5 text-muted-foreground'
            }
          >
            <span className="select-none mr-2 opacity-50">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
            </span>
            {line.text || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LANGUAGE options
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { value: 'hindi', label: 'Hindi (हिंदी)' },
  { value: 'english', label: 'English' },
  { value: 'tamil', label: 'Tamil (தமிழ்)' },
  { value: 'telugu', label: 'Telugu (తెలుగు)' },
  { value: 'kannada', label: 'Kannada (ಕನ್ನಡ)' },
  { value: 'malayalam', label: 'Malayalam (മലയാളം)' },
  { value: 'bengali', label: 'Bengali (বাংলা)' },
  { value: 'gujarati', label: 'Gujarati (ગુજરાતી)' },
  { value: 'marathi', label: 'Marathi (मराठी)' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LLMConfigSectionProps {
  control: any;
  watch: any;
  setValue: any;
  mode?: 'create' | 'edit';
  showHeader?: boolean;
  errors?: any;
  trainingStatus?: 'pending' | 'ready' | 'training' | 'failed';
  ragProcessingStatus?: 'processing' | 'completed' | 'failed';
  assistantId?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LLMConfigSection({
  control,
  watch,
  setValue,
  assistantId,
}: LLMConfigSectionProps) {
  const currentPrompt: string = watch('prompt') || '';

  // ── Generate prompt state ────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // ── Version history state ────────────────────────────────────────────────
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [diffVersion, setDiffVersion] = useState<PromptVersion | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);

  // Load versions from localStorage when assistantId changes
  useEffect(() => {
    if (assistantId) {
      setVersions(loadVersions(assistantId));
    }
  }, [assistantId]);

  const refreshVersions = useCallback(() => {
    if (assistantId) setVersions(loadVersions(assistantId));
  }, [assistantId]);

  // ── Example prompt ───────────────────────────────────────────────────────
  const useExamplePrompt = () => {
    const example = `You are Tanya, a product qualification agent calling on behalf of Justdial. The customer recently searched for a product on Justdial. Your only job is to ask them a fixed set of qualification questions — one at a time, in order — so Justdial can connect them with the right sellers.

You are not a salesperson. You do not recommend, compare, or evaluate products. You do not answer anything outside this qualification task.

TONE
Speak like a warm, professional call center agent — natural, brief, and efficient. Not robotic, not overly formal.
Every response: 1 acknowledgement + 1 question. Maximum 15 words total.
Always end with a question mark.`;
    setValue('prompt', example);
  };

  // ── Save current as version ──────────────────────────────────────────────
  const handleSaveVersion = () => {
    if (!assistantId) return;
    if (!currentPrompt.trim()) {
      toast.error('Nothing to save — prompt is empty.');
      return;
    }
    saveVersion(assistantId, currentPrompt, 'Manual save');
    refreshVersions();
    toast.success('Version saved.');
  };

  // ── Restore a version ────────────────────────────────────────────────────
  const handleRestore = (version: PromptVersion) => {
    if (assistantId && currentPrompt.trim()) {
      saveVersion(assistantId, currentPrompt, 'Before restore');
    }
    setValue('prompt', version.content);
    refreshVersions();
    toast.success('Version restored.');
  };

  // ── Cerebras generate / update ───────────────────────────────────────────
  const generatePrompt = async () => {
    if (!generateInput.trim()) return;
    setIsGenerating(true);

    // Auto-save current prompt as a version before overwriting
    if (assistantId && currentPrompt.trim()) {
      saveVersion(assistantId, currentPrompt, 'Before AI update');
      refreshVersions();
    }

    try {
      const response = await fetch('/api/cerebras/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: generateInput,
          currentPrompt: currentPrompt || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const { prompt } = await response.json();
      setValue('prompt', prompt);
      setGenerateInput('');
      setIsPopoverOpen(false);

      toast.success(currentPrompt ? 'Prompt updated!' : 'Prompt generated!', {
        description: 'Review and customise the prompt for your use case.',
      });
    } catch (error: any) {
      toast.error('Failed to generate prompt', {
        description: error?.message || 'Check CEREBRAS_API_KEY in your server environment.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Format timestamp ─────────────────────────────────────────────────────
  const fmtTs = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── System Prompt ─────────────────────────────────────────────── */}
      <FormField
        control={control}
        name="prompt"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between mb-1">
              <FormLabel className="text-sm font-medium">System Prompt</FormLabel>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={useExamplePrompt} className="h-8">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Example
                </Button>

                {/* ── Save Version button (edit mode only) ── */}
                {assistantId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveVersion}
                    className="h-8"
                    title="Save current prompt as a version"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save Version
                  </Button>
                )}

                {/* ── Cerebras Generate popover ── */}
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {currentPrompt ? 'Update Prompt' : 'Generate Prompt'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm">
                          {currentPrompt ? 'Update Prompt with AI' : 'Generate Prompt with AI'}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {currentPrompt
                            ? 'Describe what to change — AI will update the existing prompt using Cerebras Qwen3-235B.'
                            : 'Describe what your agent should do — AI will write the prompt using Cerebras Qwen3-235B.'}
                        </p>
                      </div>
                      {currentPrompt && (
                        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                          Current prompt will be auto-saved as a version before updating.
                        </div>
                      )}
                      <Textarea
                        placeholder={
                          currentPrompt
                            ? 'e.g., "Make it shorter", "Add more Hindi examples", "Focus on billing queries only"'
                            : 'e.g., "Product qualification agent for AC enquiries in Hindi"'
                        }
                        value={generateInput}
                        onChange={(e) => setGenerateInput(e.target.value)}
                        className="min-h-20 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generatePrompt();
                        }}
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
                          {isGenerating ? 'Working...' : currentPrompt ? 'Update' : 'Generate'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsPopoverOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">⌘/Ctrl + Enter to submit</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <FormControl>
              <Textarea
                placeholder="You are Tanya, a product qualification agent calling on behalf of Justdial..."
                className="min-h-[400px] font-mono text-sm resize-y"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Core instructions that define the agent&apos;s role, behaviour, and conversation rules.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* ── Version History (edit mode only) ─────────────────────────── */}
      {assistantId && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-0"
              onClick={refreshVersions}
            >
              <History className="w-3.5 h-3.5" />
              Version History
              {versions.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {versions.length}
                </Badge>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${historyOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {versions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 pl-1">
                No saved versions yet. Click &quot;Save Version&quot; or generate with AI to create one.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {versions.map((v, i) => (
                  <Card key={i} className="shadow-none border-dashed">
                    <CardContent className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{v.label}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtTs(v.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setDiffVersion(v);
                            setDiffDialogOpen(true);
                          }}
                          title="Compare with current"
                        >
                          <GitCompare className="w-3 h-3 mr-1" />
                          Diff
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleRestore(v)}
                          title="Restore this version"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Diff dialog ───────────────────────────────────────────────── */}
      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="!max-w-80vw">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Prompt Diff — Saved vs Current
            </DialogTitle>
          </DialogHeader>
          {diffVersion && (
            <DiffViewer oldVersion={diffVersion} currentPrompt={currentPrompt} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Prompt Config (Language + Script Config) ─────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-1 border-b">
          <Globe className="h-4 w-4 text-zinc-600" />
          <h4 className="text-sm font-medium text-zinc-900">Language &amp; Script Configuration</h4>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          These settings are sent to the bot as <code className="font-mono bg-muted px-1 rounded">prompt_config</code> at call start.
        </p>

        {/* Language */}
        <FormField
          control={control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Language</FormLabel>
              <Select value={field.value || 'hindi'} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Primary language the agent speaks with callers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Script Rule */}
        <FormField
          control={control}
          name="script_rule"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Script Rules</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Always speak in Hindi-English mix. Never recommend specific brands. Ask one question at a time."
                  className="min-h-[100px] text-sm resize-y"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Language rules and conversation constraints injected into <code className="font-mono bg-muted px-1 rounded">prompt_config.script_rule</code>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Opening Instruction */}
        <FormField
          control={control}
          name="opening_instruction"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Opening Instruction</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Greet the customer by name and confirm their product interest before starting questions."
                  className="min-h-[80px] text-sm resize-y"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>How the agent should open the call.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Closing Instruction */}
        <FormField
          control={control}
          name="closing_instruction"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Closing Instruction</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Warmly thank the customer and let them know sellers will contact them shortly."
                  className="min-h-[80px] text-sm resize-y"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>How the agent should close and wrap up the call.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Timeout Message */}
        <FormField
          control={control}
          name="timeout_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Timeout Message</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Thank you for your time. Our team will get back to you shortly."
                  className="text-sm"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Spoken by the bot when <code className="font-mono bg-muted px-1 rounded">max_call_duration</code> is reached.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
