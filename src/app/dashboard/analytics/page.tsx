"use client"

import { useState, useEffect } from "react"
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Award,
  Star,
  Timer,
  Zap
} from "lucide-react"
import { usePerformanceAnalytics } from "@/hooks/use-dashboard-data"

const serviceQualityConfig = {
  score: {
    label: "Quality Score",
    color: "#000000",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { data, loading, error } = usePerformanceAnalytics()

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
          <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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

  if (error || !data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load analytics data</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    )
  }

  // Transform data for charts
  const monthlyTrendData = data.monthly_performance_trends.map(trend => ({
    month: trend.month_name.split(' ')[0],
    calls: trend.total_calls,
    fcr: trend.fcr_rate,
    satisfaction: trend.csat_score,
    resolution: trend.resolution_rate,
    efficiency: trend.agent_utilization
  }))

  const productivityData = data.agent_productivity_analysis.slice(0, 5).map(agent => ({
    agent: agent.agent_name.length > 15 ? agent.agent_name.substring(0, 12) + '...' : agent.agent_name,
    calls: agent.calls_handled_6_months,
    efficiency: agent.productivity_score
  }))

  const serviceQualityData = data.service_quality_assessment.map(dimension => ({
    category: dimension.dimension_name,
    score: dimension.current_score
  }))

  const customerJourneyData = data.customer_journey_analysis.map(stage => ({
    touchpoint: stage.stage_name,
    satisfaction: stage.avg_csat,
    volume: stage.total_interactions
  }))

  const topPerformers = data.top_performing_agents.slice(0, 3)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {data.analysis_period}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {currentTime?.toLocaleTimeString() || '--:--:--'}
          </Badge>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Handle Time</p>
              <p className="text-xl font-bold">{data.aht_performance.current_aht_minutes.toFixed(2)} min</p>
              <p className={`text-xs ${data.aht_performance.change_percentage < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.aht_performance.change_percentage.toFixed(1)}% vs last month
              </p>
            </div>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">FCR Rate</p>
              <p className="text-xl font-bold">{data.fcr_performance.current_fcr_rate.toFixed(1)}%</p>
              <p className={`text-xs ${data.fcr_performance.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.fcr_performance.change_percentage > 0 ? '+' : ''}{data.fcr_performance.change_percentage.toFixed(1)}% vs last month
              </p>
            </div>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Satisfaction Score</p>
              <p className="text-xl font-bold">{data.satisfaction_performance.current_score.toFixed(1)}/5.0</p>
              <p className={`text-xs ${data.satisfaction_performance.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.satisfaction_performance.change_percentage > 0 ? '+' : ''}{data.satisfaction_performance.change_percentage.toFixed(1)}% vs last month
              </p>
            </div>
            <Star className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Agent Efficiency</p>
              <p className="text-xl font-bold">{data.agent_efficiency.current_efficiency_percentage.toFixed(0)}%</p>
              <p className={`text-xs ${data.agent_efficiency.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.agent_efficiency.change_percentage > 0 ? '+' : ''}{data.agent_efficiency.change_percentage.toFixed(1)}% vs last month
              </p>
            </div>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Mini Charts */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Call Volume Trend</p>
              {data.call_volume_trend.trend_direction === 'increasing' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={monthlyTrendData.slice(-5)}>
                <Line type="monotone" dataKey="calls" stroke="#000000" strokeWidth={1.5} dot={false} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Month: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Call Volume: ${payload[0].value}`}
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
              <p className="text-xs font-medium">FCR Trend</p>
              {data.fcr_performance.trend_direction === 'improving' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={monthlyTrendData.slice(-5)}>
                <Line type="monotone" dataKey="fcr" stroke="#000000" strokeWidth={1.5} dot={false} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Month: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`FCR Rate: ${payload[0].value}%`}
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
              <BarChart data={monthlyTrendData.slice(-5)}>
                <Bar dataKey="resolution" fill="#000000" radius={[2, 2, 0, 0]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Month: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Resolution Rate: ${payload[0].value}%`}
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
              <p className="text-xs font-medium">Efficiency Trend</p>
              <Zap className="h-3 w-3 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={monthlyTrendData.slice(-5)}>
                <Area type="monotone" dataKey="efficiency" fill="#666666" fillOpacity={0.1} stroke="#666666" strokeWidth={1} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-sm font-medium">{`Month: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-[#666666] rounded mr-2"></span>
                            {`Efficiency: ${payload[0].value}%`}
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
      </div>

      {/* Main Charts */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Performance Trends</CardTitle>
            <CardDescription className="text-xs">Call volume and key metrics over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <Bar dataKey="calls" fill="#000000" radius={[2, 2, 0, 0]} name="Total Calls" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Month: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Total Calls: ${payload[0].value}`}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Agent Productivity Analysis</CardTitle>
            <CardDescription className="text-xs">Top agents by call volume (6-month period)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityData}>
                <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                <XAxis 
                  dataKey="agent" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#666666' }}
                />
                <Bar dataKey="calls" fill="#000000" radius={[2, 2, 0, 0]} name="Calls Handled" />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{`Agent: ${label}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                            {`Calls Handled: ${payload[0].value}`}
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
          </CardContent>
        </Card>
      </div>

      {/* Service Quality Analysis */}
      <div className="grid gap-3 md:grid-cols-2">
        {serviceQualityData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Quality Assessment</CardTitle>
              <CardDescription className="text-xs">Performance across different service dimensions</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer
                config={serviceQualityConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <RadarChart data={serviceQualityData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <PolarAngleAxis dataKey="category" />
                  <PolarGrid radialLines={false} />
                  <Radar
                    dataKey="score"
                    fill="var(--color-score)"
                    fillOpacity={0.5}
                    stroke="var(--color-score)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {customerJourneyData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Customer Journey Analysis</CardTitle>
              <CardDescription className="text-xs">Satisfaction scores across customer touchpoints</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={customerJourneyData}>
                  <CartesianGrid stroke="#E5E5E5" strokeDasharray="1 1" />
                  <XAxis 
                    dataKey="touchpoint" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#666666' }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#666666' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#000000" 
                    fill="#000000" 
                    fillOpacity={0.1}
                    name="Satisfaction"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="text-sm font-medium mb-2">{`Touchpoint: ${label}`}</p>
                            <p className="text-sm text-muted-foreground">
                              <span className="inline-block w-3 h-3 bg-black rounded mr-2"></span>
                              {`Satisfaction Score: ${payload[0].value}`}
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Performing Agents</CardTitle>
          <CardDescription className="text-xs">Best performing agents in the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {topPerformers.map((agent) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Award className="h-3 w-3 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{agent.agent_name}</p>
                    <p className="text-xs text-muted-foreground">{agent.calls_handled} calls • {agent.recognition}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">CSAT</p>
                    <p className="text-sm font-medium">{agent.csat_score.toFixed(1)}/5</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">FCR</p>
                    <p className="text-sm font-medium">{agent.fcr_rate.toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="text-sm font-medium">{agent.resolution_rate.toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-sm font-medium text-green-600">{agent.composite_score.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Analysis Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Total Calls Analyzed</span>
                <span className="font-medium">{data.total_calls_analyzed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Total Agents</span>
                <span className="font-medium">{data.total_agents_analyzed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Data Completeness</span>
                <span className="font-medium">{data.data_completeness_percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Call Volume Insights</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Peak Month</span>
                <span className="font-medium">{data.call_volume_trend.peak_month}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Monthly Average</span>
                <span className="font-medium">{Math.round(data.call_volume_trend.average_monthly_volume).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Predicted Next Month</span>
                <span className="font-medium">{data.call_volume_trend.predicted_next_month.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quality Benchmarks</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Best AHT Month</span>
                <span className="font-medium">{data.aht_performance.best_month}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Best FCR Month</span>
                <span className="font-medium">{data.fcr_performance.best_month}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Months Above Target</span>
                <span className="font-medium">{data.fcr_performance.months_above_target} / 6</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
