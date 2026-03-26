"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  AreaChart,
  Area
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Clock,
  AlertTriangle,
  Activity,
  Shield,
  CreditCard,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react"
import { useRealTimeMonitoring } from "@/hooks/use-dashboard-data"

export default function RealTimePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { data, loading, error, isLive, toggleLive } = useRealTimeMonitoring(30000)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active': return 'text-green-600'
      case 'break': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading && !data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Real-Time Monitoring</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
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

  if (error && !data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load real-time data</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Transform hourly call data for chart
  const realTimeCallData = data.call_volume_trends_live.hourly_data.map(item => ({
    time: item.hour,
    calls: item.call_count,
    active: item.is_peak ? item.call_count : Math.floor(item.call_count * 0.7),
    queue: item.is_peak ? Math.floor(item.call_count * 0.3) : Math.floor(item.call_count * 0.1)
  }))

  // Get top 10 agents
  const agentStatusData = data.agent_status.agents.slice(0, 10)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Monitoring</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isLive ? "default" : "secondary"} className="text-sm">
            {isLive ? "LIVE" : "PAUSED"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {currentTime?.toLocaleTimeString() || '--:--:--'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLive}
          >
            {isLive ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Real-time Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.active_calls_and_queue.active_calls}</div>
              <p className="text-xs text-muted-foreground">
                Queue: {data.active_calls_and_queue.queued_calls} • {data.active_calls_and_queue.demand_pressure} pressure
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.average_wait_time.current_wait_time_minutes.toFixed(1)} min</div>
              <p className="text-xs text-muted-foreground">
                Target: {data.average_wait_time.target_wait_time_minutes.toFixed(1)} min • {data.average_wait_time.capacity_status}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agent Utilization</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.agent_utilization.utilization_percentage.toFixed(1)}%</div>
              <Progress value={data.agent_utilization.utilization_percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {data.agent_utilization.active_agents} / {data.agent_utilization.total_agents} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.transactions_and_success.total_transactions}</div>
              <p className="text-xs text-muted-foreground">
                Success: {data.transactions_and_success.success_rate_percentage.toFixed(1)}% • {data.transactions_and_success.reliability_status}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.system_uptime_and_response.uptime_percentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Response: {data.system_uptime_and_response.average_response_time_seconds.toFixed(2)}s • {data.system_uptime_and_response.performance_status}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Call Volume Trends</CardTitle>
              <CardDescription>
                Real-time call volume monitoring • Peak: {data.call_volume_trends_live.peak_hour} ({data.call_volume_trends_live.peak_volume} calls)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realTimeCallData}>
                  <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                  <XAxis 
                    dataKey="time" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#666666' }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#666666' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#000000" 
                    fill="#000000" 
                    fillOpacity={0.1}
                    name="Total Calls"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#666666" 
                    fill="#666666" 
                    fillOpacity={0.1}
                    name="Active"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm font-medium mb-2">{`Time: ${label}`}</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Transaction Success Rate</CardTitle>
              <CardDescription>
                Real-time transaction monitoring • Trend: {data.transaction_success_rate_live.trend}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { time: 'Last Hour', success: data.transaction_success_rate_live.last_hour_success_rate, failed: 100 - data.transaction_success_rate_live.last_hour_success_rate },
                  { time: 'Current', success: data.transaction_success_rate_live.current_hour_success_rate, failed: 100 - data.transaction_success_rate_live.current_hour_success_rate }
                ]}>
                  <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                  <XAxis 
                    dataKey="time" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#666666' }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#666666' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#000000" 
                    strokeWidth={2} 
                    name="Success Rate"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm font-medium mb-2">{`Period: ${label}`}</p>
                            <p className="text-sm text-muted-foreground">
                              <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                              {`Success Rate: ${payload[0].value?.toFixed(2)}%`}
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
            </CardContent>
          </Card>
        </div>

        {/* Agent Status and System Info */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agent Status</CardTitle>
              <CardDescription className="text-xs">
                Current agent availability • {data.agent_status.active_agents} active, {data.agent_status.on_break_agents} on break, {data.agent_status.offline_agents} offline
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {agentStatusData.map((agent) => (
                  <div key={agent.agent_id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status.toLowerCase() === 'online' || agent.status.toLowerCase() === 'active' ? 'bg-green-500' :
                        agent.status.toLowerCase() === 'break' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-xs">{agent.agent_name}</p>
                        <p className={`text-xs ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{agent.total_calls_today} calls</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.avg_call_duration_minutes.toFixed(1)} min avg
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={agent.performance_indicator === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {agent.utilization_percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">System Health</CardTitle>
              <CardDescription className="text-xs">Current system status and performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Queue Length</span>
                  <span className="text-lg font-bold">{data.active_calls_and_queue.queued_calls}</span>
                </div>
                <Progress value={(data.active_calls_and_queue.queued_calls / 50) * 100} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs">Wait Time</span>
                  <span className="text-lg font-bold">{data.average_wait_time.current_wait_time_minutes.toFixed(1)} min</span>
                </div>
                <Progress value={(data.average_wait_time.current_wait_time_minutes / 5) * 100} className="h-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-xs">Utilization</span>
                  <span className="text-lg font-bold">{data.agent_utilization.utilization_percentage.toFixed(0)}%</span>
                </div>
                <Progress value={data.agent_utilization.utilization_percentage} className="h-1" />

                <div className="flex justify-between items-center">
                  <span className="text-xs">Success Rate</span>
                  <span className="text-lg font-bold">{data.transactions_and_success.success_rate_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={data.transactions_and_success.success_rate_percentage} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Recommendations */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-3">
            <div className="flex items-start space-x-2">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">Agent Utilization</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.agent_utilization.recommendation}
                </p>
                <Badge variant="outline" className="text-xs mt-2">
                  Risk: {data.agent_utilization.risk_level}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start space-x-2">
              <Activity className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">Call Volume</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {data.call_volume_trends_live.current_hour_volume} calls/hour
                  <br />Average: {data.call_volume_trends_live.average_hourly_volume.toFixed(0)} calls/hour
                </p>
                <Badge variant="outline" className="text-xs mt-2">
                  Trend: {data.call_volume_trends_live.trend}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">System Status</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Uptime: {data.system_uptime_and_response.uptime_status}
                  <br />Performance: {data.system_uptime_and_response.performance_status}
                </p>
                <Badge variant="outline" className="text-xs mt-2">
                  {data.system_uptime_and_response.total_requests} requests
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Data Freshness Info */}
        <Card className="p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Last updated: {new Date(data.monitoring_timestamp).toLocaleTimeString()}
            </div>
            <div>
              Refresh interval: {data.refresh_interval_seconds}s
            </div>
            <div>
              Data freshness: {data.data_freshness}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
