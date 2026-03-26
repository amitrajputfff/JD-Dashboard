'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { mockDashboardData } from '@/lib/mock-data/dashboard';
import { mockAgents } from '@/lib/mock-data/agents';

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; direction: 'up' | 'down'; positive?: 'up' | 'down' };
  live?: boolean;
}

function KpiCard({ label, value, sub, trend, live }: KpiCardProps) {
  const isGood = trend
    ? trend.positive === 'down'
      ? trend.direction === 'down'
      : trend.direction === 'up'
    : true;

  return (
    <Card className="shadow-none">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center gap-1.5 mb-3">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          {live && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-0.5 mt-2 text-xs font-medium ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {trend.direction === 'up'
              ? <ArrowUpRight className="w-3.5 h-3.5" />
              : <ArrowDownRight className="w-3.5 h-3.5" />
            }
            <span>{Math.abs(trend.value).toFixed(1)}% vs yesterday</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Chart configs ─────────────────────────────────────────────────────────────

const volumeConfig: ChartConfig = {
  call_volume: { label: 'Total Calls', color: 'var(--primary)' },
  resolution_count: { label: 'Resolved', color: 'oklch(0.7 0.15 160)' },
};

const issueConfig: ChartConfig = {
  count: { label: 'Calls', color: 'var(--primary)' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const d = mockDashboardData;

  const weeklyData = d.call_volume_resolution.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en', { weekday: 'short' }),
    call_volume: item.call_volume,
    resolution_count: item.resolution_count,
  }));

  const issueData = d.issue_type_distribution.distributions.map((item) => ({
    name: item.issue_type.replace(' Management', ' Mgmt.'),
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Active Calls"
          value={d.active_calls.count}
          sub={`${d.queue_length.count} in queue · avg wait ${d.queue_length.average_wait_time}m`}
          live
        />
        <KpiCard
          label="Calls Today"
          value={d.call_volume_trend.total_calls}
          sub={`~${d.call_volume_trend.average_calls_per_period.toFixed(0)} per hour`}
          trend={{ value: 3.2, direction: 'up', positive: 'up' }}
        />
        <KpiCard
          label="Resolution Rate"
          value={`${d.resolution_rate.rate_percentage}%`}
          sub={`${d.resolution_rate.resolved_cases} of ${d.resolution_rate.total_cases} resolved`}
          trend={{ value: d.resolution_rate.change_percentage, direction: d.resolution_rate.trend_direction as 'up' | 'down', positive: 'up' }}
        />
        <KpiCard
          label="Avg Handle Time"
          value={`${d.average_handle_time.handle_time_minutes}m`}
          sub={`${d.average_handle_time.talk_time_minutes}m talk · ${d.average_handle_time.after_call_work_minutes}m wrap`}
          trend={{ value: Math.abs(d.average_handle_time.change_percentage), direction: d.average_handle_time.trend_direction as 'up' | 'down', positive: 'down' }}
        />
        <KpiCard
          label="CSAT Score"
          value={`${d.satisfaction_score.score} / 5`}
          sub={`${d.satisfaction_score.total_ratings} ratings`}
          trend={{ value: d.satisfaction_score.change_percentage, direction: d.satisfaction_score.trend_direction as 'up' | 'down', positive: 'up' }}
        />
        <KpiCard
          label="First Call Resolution"
          value={`${d.first_call_resolution.rate_percentage}%`}
          sub={`Target ${d.first_call_resolution.target_rate}%`}
          trend={{ value: d.first_call_resolution.change_percentage, direction: d.first_call_resolution.trend_direction as 'up' | 'down', positive: 'up' }}
        />
        <KpiCard
          label="Agent Utilization"
          value={`${d.agent_utilization.utilization_percentage}%`}
          sub={`${d.agent_utilization.active_agents} / ${d.agent_utilization.total_agents} agents active`}
          trend={{ value: d.agent_utilization.change_percentage, direction: d.agent_utilization.trend_direction as 'up' | 'down', positive: 'up' }}
        />
        <KpiCard
          label="Escalation Rate"
          value={`${d.escalation_rate.rate_percentage}%`}
          sub={`${d.escalation_rate.transferred_calls} transferred today`}
          trend={{ value: Math.abs(d.escalation_rate.change_percentage), direction: d.escalation_rate.trend_direction as 'up' | 'down', positive: 'down' }}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card className="shadow-none lg:col-span-2">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Call Volume & Resolution</CardTitle>
                <CardDescription className="text-xs mt-0.5">Last 7 days</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full bg-primary inline-block" />
                  Total
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full bg-emerald-500 inline-block" />
                  Resolved
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ChartContainer config={volumeConfig} className="h-[200px] w-full">
              <AreaChart data={weeklyData} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="call_volume" type="monotone" stroke="var(--primary)" strokeWidth={1.5} fill="url(#gV)" />
                <Area dataKey="resolution_count" type="monotone" stroke="oklch(0.7 0.15 160)" strokeWidth={1.5} fill="url(#gR)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Call Breakdown</CardTitle>
            <CardDescription className="text-xs mt-0.5">By issue category</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ChartContainer config={issueConfig} className="h-[200px] w-full">
              <BarChart data={issueData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -8 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow">
                        <p className="font-medium">{payload[0]?.payload?.name}</p>
                        <p className="text-muted-foreground">{payload[0]?.value} calls · {payload[0]?.payload?.percentage}%</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--primary)" opacity={0.8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agent performers */}
        <Card className="shadow-none lg:col-span-2">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold">Top Agent Performers</CardTitle>
            <CardDescription className="text-xs mt-0.5">Ranked by CSAT · today</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-0.5">
              <div className="grid grid-cols-12 text-[10px] text-muted-foreground font-medium px-2 pb-2 border-b">
                <span className="col-span-4">Agent</span>
                <span className="col-span-2 text-right">CSAT</span>
                <span className="col-span-3 text-right">Resolution</span>
                <span className="col-span-2 text-right">AHT</span>
                <span className="col-span-1 text-right">Calls</span>
              </div>
              {d.agent_performance_overview.top_performers.map((p, i) => (
                <div key={p.agent_id} className="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-muted/50 transition-colors text-xs">
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-muted-foreground w-3 shrink-0">{i + 1}</span>
                    <span className="truncate font-medium">{p.agent_name}</span>
                  </div>
                  <div className="col-span-2 text-right font-semibold">{p.csat_score}<span className="text-muted-foreground font-normal">/5</span></div>
                  <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{p.resolution_rate}%</div>
                  <div className="col-span-2 text-right text-muted-foreground">{p.average_handle_time}m</div>
                  <div className="col-span-1 text-right font-medium">{p.total_calls}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agents overview */}
        <Card className="shadow-none">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">AI Agents</CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {mockAgents.filter(a => a.status?.toLowerCase() === 'active').length} active
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">Status · calls today</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-1">
              {mockAgents.map((agent) => {
                const isActive = agent.status?.toLowerCase() === 'active';
                return (
                  <div key={agent.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                      <span className="text-xs font-medium truncate">{agent.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{agent.calls_today} calls</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
