"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import { InteractivePieChart } from "@/components/ui/interactive-pie-chart"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  UserCheck,
  Timer,
  RefreshCw,
  Bot,
  Plus
} from "lucide-react"
import { useCustomerServiceDashboard } from "@/hooks/use-dashboard-data"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

const TIME_RANGES = ['Today', '7D', '30D'] as const

export default function DashboardPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<string>('Today')
  const { data, loading, error } = useCustomerServiceDashboard('today', true, true)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-[80px] w-full" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Check if there's no data due to no agents/calls vs actual error
  const hasNoMetrics = data && (
    data.total_calls?.count === 0 ||
    data.call_volume_trend?.data_points?.length === 0
  )

  if (!data || error) {
    // No data at all - likely no agents created yet
    if (!data && !error) {
      return (
        <div className="flex-1 space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
            </div>
          </div>
          <Empty className="h-[500px] bg-muted/50">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bot className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No agents yet</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first AI agent to handle customer interactions. Once your agent starts taking calls, you'll see metrics and insights here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => router.push('/agents/create')}>
                <Plus className="size-4 mr-2" />
                Create Your First Agent
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )
    }

    // Actual error occurred
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
        </div>
        <Empty className="h-[500px] bg-muted/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Failed to load dashboard data</EmptyTitle>
            <EmptyDescription>
              We couldn't load your dashboard data. This might be due to a network issue or the data is currently unavailable.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4 mr-2" />
              Retry
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // Has data but no metrics yet (agents exist but no calls)
  if (hasNoMetrics) {
    return (
      <div className="flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
        </div>
        <Empty className="h-[500px] bg-muted/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Waiting for call activity</EmptyTitle>
            <EmptyDescription>
              Your agents are ready! Once they start handling customer calls, you'll see real-time metrics, insights, and performance data appear here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/agents')}>
                <Bot className="size-4 mr-2" />
                View Agents
              </Button>
              <Button onClick={() => router.push('/agents/create')}>
                <Plus className="size-4 mr-2" />
                Create New Agent
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // Transform call volume trend data for chart
  const callVolumeData = data.call_volume_trend.data_points.map(point => ({
    name: point.label,
    calls: point.value,
    resolved: Math.round(point.value * (data.resolution_rate.rate_percentage / 100)),
    pending: Math.round(point.value * (1 - data.resolution_rate.rate_percentage / 100))
  }))

  // Transform issue type distribution for pie chart
  const issueTypeData = data.issue_type_distribution.distributions.map((item, index) => ({
    name: item.issue_type,
    value: item.count,
    color: [
      'hsl(186 50% 40%)',
      'hsl(186 40% 55%)',
      'hsl(107 20% 50%)',
      'hsl(107 15% 65%)',
      'hsl(286 15% 60%)',
    ][index % 5]
  }))

  // Get top 5 agents
  const topAgents = data.agent_performance_overview.top_performers.slice(0, 5)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {TIME_RANGES.map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${
                  selectedRange === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {currentTime?.toLocaleTimeString() || '--:--:--'}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Calls</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.active_calls.count}</p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.agent_utilization.trend_direction === 'up' ? 'text-green-600' : 'text-orange-600'}`}>
              {data.agent_utilization.trend_direction === 'up'
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />
              }
              {data.agent_utilization.change_percentage > 0 ? '+' : ''}{data.agent_utilization.change_percentage.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Queue Length</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.queue_length.count}</p>
            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
              <Timer className="h-3 w-3" />
              Avg wait: {data.wait_time.average_wait_time.toFixed(2)} min
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agent Utilization</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.agent_utilization.utilization_percentage.toFixed(1)}%</p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.agent_utilization.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.agent_utilization.change_percentage >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />
              }
              {data.agent_utilization.change_percentage > 0 ? '+' : ''}{data.agent_utilization.change_percentage.toFixed(1)}% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satisfaction Score</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.satisfaction_score.score.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/5.0</span></p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.satisfaction_score.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.satisfaction_score.change_percentage >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />
              }
              {data.satisfaction_score.change_percentage > 0 ? '+' : ''}{data.satisfaction_score.change_percentage.toFixed(1)}% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini Sparkline Charts */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Call Volume Trend</p>
              {data.call_volume_trend.data_points.length > 1 && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={callVolumeData.slice(-5)}>
                <defs>
                  <linearGradient id="gradCallVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#gradCallVolume)" dot={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="inline-block w-2.5 h-2.5 rounded mr-1.5" style={{ backgroundColor: 'hsl(var(--primary))' }}></span>
                            {`Total Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Resolution Rate</p>
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={callVolumeData.slice(-5)}>
                <defs>
                  <linearGradient id="gradResolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="resolved" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#gradResolution)" dot={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="inline-block w-2.5 h-2.5 rounded mr-1.5" style={{ backgroundColor: 'hsl(var(--primary))' }}></span>
                            {`Resolved Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Agent Activity</p>
              <Activity className="h-3 w-3 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={callVolumeData.slice(-5)}>
                <defs>
                  <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#gradActivity)" dot={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="inline-block w-2.5 h-2.5 rounded mr-1.5" style={{ backgroundColor: 'hsl(var(--primary))' }}></span>
                            {`Agent Activity: ${payload[0].value}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Wait Time</p>
              <Timer className="h-3 w-3 text-orange-600" />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={callVolumeData.slice(-5)}>
                <defs>
                  <linearGradient id="gradWaitTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pending" stroke="hsl(var(--chart-2))" strokeWidth={1.5} fill="url(#gradWaitTime)" dot={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="inline-block w-2.5 h-2.5 rounded mr-1.5" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></span>
                            {`Pending Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Volume & Resolution</CardTitle>
            <CardDescription className="text-sm">Daily call volume and resolution tracking</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={callVolumeData} barCategoryGap="30%">
                <defs>
                  <linearGradient id="gradBarResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gradBarPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Bar dataKey="resolved" fill="url(#gradBarResolved)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="url(#gradBarPending)" radius={[4, 4, 0, 0]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Day: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded"
                                style={{ backgroundColor: entry.color }}
                              ></span>
                              {`${entry.dataKey === 'resolved' ? 'Resolved Calls' : 'Pending Calls'}: ${entry.value}`}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <InteractivePieChart
          data={issueTypeData}
          title="Issue Type Distribution"
          description="Breakdown of customer service issues by category"
          footerText={`Showing ${data.issue_type_distribution.total_issues} total issues`}
          trendPercentage={5.2}
        />
      </div>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Performance Overview</CardTitle>
          <CardDescription className="text-sm">Top performing agents and their metrics</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-1">
            {topAgents.map((agent, index) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{agent.agent_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.total_calls} calls today</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-muted-foreground mb-0.5">Satisfaction</p>
                    <p className="text-sm font-semibold">{agent.csat_score.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/5.0</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Resolution</p>
                    <p className="text-sm font-semibold">{agent.resolution_rate.toFixed(0)}%</p>
                  </div>
                  <div className="w-20 hidden md:block">
                    <Progress value={agent.resolution_rate} className="h-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">FCR Rate</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.first_call_resolution.rate_percentage.toFixed(0)}%</p>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Target: {data.first_call_resolution.target_rate}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Handle Time</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.average_handle_time.handle_time_minutes.toFixed(1)}<span className="text-base font-normal text-muted-foreground"> min</span></p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.average_handle_time.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.average_handle_time.change_percentage <= 0
                ? <TrendingDown className="h-3 w-3" />
                : <TrendingUp className="h-3 w-3" />
              }
              {data.average_handle_time.change_percentage > 0 ? '+' : ''}{data.average_handle_time.change_percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Time</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.response_time.average_response_time.toFixed(2)}<span className="text-base font-normal text-muted-foreground"> min</span></p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.response_time.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.response_time.change_percentage <= 0
                ? <TrendingDown className="h-3 w-3" />
                : <TrendingUp className="h-3 w-3" />
              }
              {data.response_time.change_percentage > 0 ? '+' : ''}{data.response_time.change_percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Escalation Rate</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.escalation_rate.rate_percentage.toFixed(1)}%</p>
            <p className={`text-xs flex items-center gap-1 mt-1 ${data.escalation_rate.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.escalation_rate.change_percentage <= 0
                ? <TrendingDown className="h-3 w-3" />
                : <TrendingUp className="h-3 w-3" />
              }
              {data.escalation_rate.change_percentage > 0 ? '+' : ''}{data.escalation_rate.change_percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call Volume Resolution Trend - Stacked Gradient Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Volume Resolution Trend</CardTitle>
          <CardDescription className="text-sm">Detailed analysis of call resolution over time</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.call_volume_resolution}>
              <defs>
                <linearGradient id="gradAreaVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAreaResolution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="call_volume"
                stackId="1"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradAreaVolume)"
                name="Total Calls"
              />
              <Area
                type="monotone"
                dataKey="resolution_count"
                stackId="2"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#gradAreaResolution)"
                name="Resolved"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium mb-2">{`Date: ${new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded"
                              style={{ backgroundColor: entry.color }}
                            ></span>
                            {`${entry.name}: ${entry.value}`}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
                cursor={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}
