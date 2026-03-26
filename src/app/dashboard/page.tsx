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

export default function DashboardPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
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
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
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
    color: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'][index % 5]
  }))

  // Get top 5 agents
  const topAgents = data.agent_performance_overview.top_performers.slice(0, 5)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Customer Service Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {currentTime?.toLocaleTimeString() || '--:--:--'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Calls</p>
              <p className="text-xl font-bold">{data.active_calls.count}</p>
              <p className={`text-xs ${data.agent_utilization.trend_direction === 'up' ? 'text-green-600' : 'text-orange-600'}`}>
                {data.agent_utilization.change_percentage > 0 ? '+' : ''}{data.agent_utilization.change_percentage.toFixed(1)}% from last period
              </p>
            </div>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Queue Length</p>
              <p className="text-xl font-bold">{data.queue_length.count}</p>
              <p className="text-xs text-orange-600">Avg wait: {data.wait_time.average_wait_time.toFixed(2)} min</p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Agent Utilization</p>
              <p className="text-xl font-bold">{data.agent_utilization.utilization_percentage.toFixed(1)}%</p>
              <p className={`text-xs ${data.agent_utilization.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.agent_utilization.change_percentage > 0 ? '+' : ''}{data.agent_utilization.change_percentage.toFixed(1)}% from yesterday
              </p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Satisfaction Score</p>
              <p className="text-xl font-bold">{data.satisfaction_score.score.toFixed(2)}/5.0</p>
              <p className={`text-xs ${data.satisfaction_score.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.satisfaction_score.change_percentage > 0 ? '+' : ''}{data.satisfaction_score.change_percentage.toFixed(1)}% from last week
              </p>
            </div>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Mini Charts */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Call Volume Trend</p>
              {data.call_volume_trend.data_points.length > 1 && (
                <TrendingUp className="h-3 w-3 text-green-600" />
              )}
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={callVolumeData.slice(-5)}>
                <Line type="monotone" dataKey="calls" stroke="#000000" strokeWidth={1.5} dot={false} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Total Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Resolution Rate</p>
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={callVolumeData.slice(-5)}>
                <Bar dataKey="resolved" fill="#000000" radius={[2, 2, 0, 0]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Resolved Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Agent Activity</p>
              <Activity className="h-3 w-3 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={callVolumeData.slice(-5)}>
                <Area type="monotone" dataKey="calls" fill="#000000" fillOpacity={0.1} stroke="#000000" strokeWidth={1} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Agent Activity: ${payload[0].value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Wait Time</p>
              <Timer className="h-3 w-3 text-orange-600" />
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={callVolumeData.slice(-5)}>
                <Line type="monotone" dataKey="pending" stroke="#666666" strokeWidth={1.5} dot={false} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Day: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-[#666666] rounded mr-2"></span>
                            {`Pending Calls: ${payload[0].value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Call Volume & Resolution</CardTitle>
            <CardDescription className="text-xs">Daily call volume and resolution tracking</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={callVolumeData}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <Bar dataKey="resolved" fill="#000000" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pending" fill="#666666" radius={[2, 2, 0, 0]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Day: ${label}`}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                              <span 
                                className="inline-block w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: entry.color }}
                              ></span>
                              {`${entry.dataKey === 'resolved' ? 'Resolved Calls' : 'Pending Calls'}: ${entry.value}`}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Agent Performance Overview</CardTitle>
          <CardDescription className="text-xs">Top performing agents and their metrics</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {topAgents.map((agent, index) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.agent_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.total_calls} calls today</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                    <p className="text-sm font-medium">{agent.csat_score.toFixed(1)}/5.0</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="text-sm font-medium">{agent.resolution_rate.toFixed(0)}%</p>
                  </div>
                  <div className="w-16">
                    <Progress value={agent.resolution_rate} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">FCR Rate</p>
              <p className="text-xl font-bold">{data.first_call_resolution.rate_percentage.toFixed(0)}%</p>
              <p className="text-xs text-green-600">Target: {data.first_call_resolution.target_rate}%</p>
            </div>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Handle Time</p>
              <p className="text-xl font-bold">{data.average_handle_time.handle_time_minutes.toFixed(1)} min</p>
              <p className={`text-xs ${data.average_handle_time.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.average_handle_time.change_percentage > 0 ? '+' : ''}{data.average_handle_time.change_percentage.toFixed(1)}%
              </p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Response Time</p>
              <p className="text-xl font-bold">{data.response_time.average_response_time.toFixed(2)} min</p>
              <p className={`text-xs ${data.response_time.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.response_time.change_percentage > 0 ? '+' : ''}{data.response_time.change_percentage.toFixed(1)}%
              </p>
            </div>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Escalation Rate</p>
              <p className="text-xl font-bold">{data.escalation_rate.rate_percentage.toFixed(1)}%</p>
              <p className={`text-xs ${data.escalation_rate.change_percentage <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.escalation_rate.change_percentage > 0 ? '+' : ''}{data.escalation_rate.change_percentage.toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Customer Journey Analytics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Call Volume Resolution Trend</CardTitle>
          <CardDescription className="text-xs">Detailed analysis of call resolution over time</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.call_volume_resolution}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#666666' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#666666' }}
              />
              <Area 
                type="monotone" 
                dataKey="call_volume" 
                stackId="1" 
                stroke="#000000" 
                fill="#000000" 
                fillOpacity={0.1}
                name="Total Calls"
              />
              <Area 
                type="monotone" 
                dataKey="resolution_count" 
                stackId="2" 
                stroke="#666666" 
                fill="#666666" 
                fillOpacity={0.1}
                name="Resolved"
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium mb-2">{`Date: ${new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm text-muted-foreground">
                            <span 
                              className="inline-block w-3 h-3 rounded mr-2" 
                              style={{ backgroundColor: entry.color }}
                            ></span>
                            {`${entry.name}: ${entry.value}`}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
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
