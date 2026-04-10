'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Pause,
  FileText,
  Mic,
  Calendar,
  User,
  ChevronRight,
  RefreshCw,
  Headphones,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CallRecord {
  key: string;
  slug: string;
  timestamp: string;
  recording?: string;
  transcript?: string;
}

interface TranscriptEntry {
  role: 'user' | 'agent';
  text: string;
  ts?: string;
}

// ---------------------------------------------------------------------------
// AudioPlayer
// ---------------------------------------------------------------------------

function AudioPlayer({ filename }: { filename: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play().catch(() => toast.error('Could not play audio'));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-3">
      <audio
        ref={audioRef}
        src={`/api/call-records/audio/${filename}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        preload="metadata"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full flex-shrink-0"
        onClick={toggle}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <div className="flex-1 min-w-0">
        <div
          className="h-1.5 bg-border rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const el = audioRef.current;
            if (!el || !el.duration) return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            el.currentTime = ((e.clientX - rect.left) / rect.width) * el.duration;
          }}
        >
          <div
            className="h-full bg-foreground rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
        {duration > 0 ? fmt(duration) : '--:--'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TranscriptViewer
// ---------------------------------------------------------------------------

function TranscriptViewer({ filename }: { filename: string }) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/call-records/transcript/${filename}`)
      .then((r) => r.json())
      .then((data) => setTranscript(Array.isArray(data) ? data : []))
      .catch(() => setTranscript([]))
      .finally(() => setLoading(false));
  }, [filename]);

  if (loading)
    return <div className="py-4 text-center text-sm text-muted-foreground">Loading transcript…</div>;
  if (transcript.length === 0)
    return <div className="py-4 text-center text-sm text-muted-foreground">No transcript data.</div>;

  return (
    <ScrollArea className="h-72 pr-2">
      <div className="space-y-3">
        {transcript.map((entry, i) => (
          <div
            key={i}
            className={`flex gap-3 ${entry.role === 'agent' ? '' : 'flex-row-reverse'}`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                entry.role === 'agent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground border'
              }`}
            >
              {entry.role === 'agent' ? 'A' : 'U'}
            </div>
            <div
              className={`max-w-[78%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                entry.role === 'agent' ? 'bg-muted' : 'bg-primary/10'
              }`}
            >
              <p>{entry.text}</p>
              {entry.ts && (
                <p className="text-[10px] text-muted-foreground mt-1">{entry.ts}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecordingsPage() {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/call-records');
      const data = await res.json();
      setRecords(data.recordings || []);
    } catch {
      toast.error('Could not reach bot server for recordings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const fmtDate = (iso: string) => {
    if (!iso) return 'Unknown time';
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Recordings</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Headphones className="h-5 w-5" /> Call Recordings
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Audio and transcripts saved by the WebRTC bot server.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader text="Loading recordings…" />
            </div>
          ) : records.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Mic className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No recordings yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Recordings appear here after WebRTC calls complete. Make sure the bot server is running.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {records.map((rec) => (
                <Card
                  key={rec.key}
                  className="cursor-pointer hover:bg-muted/30 transition-colors border"
                  onClick={() => { setSelected(rec); setDialogOpen(true); }}
                >
                  <CardContent className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize truncate">
                        {rec.slug.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(rec.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {rec.recording && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Mic className="h-2.5 w-2.5" /> Audio
                        </Badge>
                      )}
                      {rec.transcript && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <FileText className="h-2.5 w-2.5" /> Transcript
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-medium capitalize">
                <Headphones className="h-4 w-4" />
                {selected?.slug.replace(/_/g, ' ')}
              </DialogTitle>
              {selected?.timestamp && (
                <p className="text-xs text-muted-foreground">{fmtDate(selected.timestamp)}</p>
              )}
            </DialogHeader>

            <div className="space-y-5 mt-1">
              {selected?.recording && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Mic className="h-3 w-3" /> Recording
                  </h4>
                  <AudioPlayer filename={selected.recording} />
                </div>
              )}

              {selected?.transcript && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Transcript
                  </h4>
                  <TranscriptViewer filename={selected.transcript} />
                </div>
              )}

              {selected && !selected.recording && !selected.transcript && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No media files found for this session.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
