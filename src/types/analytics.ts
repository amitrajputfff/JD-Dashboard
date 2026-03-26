export interface DashboardMetrics {
  totalAgents: number;
  activeAgents: number;
  totalCalls: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  callSuccessRate: number;
  avgCallDuration: number;
  totalRevenue: number;
  costPerCall: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CallTrends {
  date: string;
  totalCalls: number;
  successfulCalls: number;
  avgDuration: number;
  revenue: number;
}

export interface TimeRange {
  start: string;
  end: string;
  period: 'hour' | 'day' | 'week' | 'month';
}

// Customer Service Dashboard Types
export interface MetricTrendItem {
  month: string;
  value: number;
  change_from_previous: number | null;
  change_percentage: number | null;
}

export interface AHTPerformance {
  current_aht_minutes: number;
  current_aht_seconds: number;
  previous_month_aht_minutes: number;
  change_minutes: number;
  change_percentage: number;
  trend_direction: string;
  monthly_trend: MetricTrendItem[];
  best_month: string;
  worst_month: string;
  average_6_months: number;
}

export interface FCRPerformance {
  current_fcr_rate: number;
  previous_month_fcr_rate: number;
  change_percentage: number;
  trend_direction: string;
  monthly_trend: MetricTrendItem[];
  target_rate: number;
  months_above_target: number;
  best_month: string;
  worst_month: string;
}

export interface AgentProductivityItem {
  agent_id: string;
  agent_name: string;
  calls_handled_6_months: number;
  avg_calls_per_day: number;
  avg_handle_time_minutes: number;
  fcr_rate: number;
  csat_score: number;
  resolution_rate: number;
  productivity_score: number;
  rank: number;
  trend: string;
}

export interface TopPerformingAgent {
  rank: number;
  agent_id: string;
  agent_name: string;
  calls_handled: number;
  csat_score: number;
  fcr_rate: number;
  resolution_rate: number;
  avg_handle_time_minutes: number;
  composite_score: number;
  strengths: string[];
  recognition: string;
}

export interface MonthlyPerformanceTrend {
  month: string;
  year: number;
  month_name: string;
  total_calls: number;
  aht_minutes: number;
  fcr_rate: number;
  csat_score: number;
  resolution_rate: number;
  agent_utilization: number;
  escalation_rate: number;
  overall_performance_score: number;
}

export interface CustomerJourneyStage {
  stage_name: string;
  avg_csat: number;
  total_interactions: number;
  satisfaction_rate_percentage: number;
  improvement_potential: string;
  key_issues: string[];
}

export interface ServiceQualityDimension {
  dimension_name: string;
  current_score: number;
  previous_score: number;
  change: number;
  rating: string;
  training_priority: number;
  recommendations: string[];
}

export interface PerformanceAnalyticsResponse {
  aht_performance: AHTPerformance;
  fcr_performance: FCRPerformance;
  satisfaction_performance: {
    current_score: number;
    previous_month_score: number;
    change: number;
    change_percentage: number;
    trend_direction: string;
    monthly_trend: MetricTrendItem[];
    best_month: string;
    worst_month: string;
    average_6_months: number;
  };
  agent_efficiency: {
    current_efficiency_percentage: number;
    previous_month_efficiency: number;
    change_percentage: number;
    trend_direction: string;
    productive_hours: number;
    total_logged_hours: number;
    monthly_trend: MetricTrendItem[];
    formula: string;
  };
  call_volume_trend: {
    current_month_volume: number;
    previous_month_volume: number;
    change_percentage: number;
    trend_direction: string;
    monthly_volumes: MetricTrendItem[];
    peak_month: string;
    lowest_month: string;
    average_monthly_volume: number;
    total_6_months: number;
    predicted_next_month: number;
  };
  monthly_performance_trends: MonthlyPerformanceTrend[];
  agent_productivity_analysis: AgentProductivityItem[];
  top_performing_agents: TopPerformingAgent[];
  service_quality_assessment: ServiceQualityDimension[];
  customer_journey_analysis: CustomerJourneyStage[];
  analysis_period: string;
  start_date: string;
  end_date: string;
  organization_id: string;
  generated_at: string;
  total_calls_analyzed: number;
  total_agents_analyzed: number;
  data_completeness_percentage: number;
}

// Customer Service Dashboard Types
export interface CallVolumeDataPoint {
  timestamp: string;
  value: number;
  label: string;
}

export interface AgentActivity {
  agent_id: string;
  agent_name: string;
  talk_time: number;
  idle_time: number;
  wrap_up_time: number;
  total_time: number;
}

export interface TopPerformer {
  agent_id: string;
  agent_name: string;
  csat_score: number;
  resolution_rate: number;
  average_handle_time: number;
  first_call_resolution_rate: number;
  total_calls: number;
}

export interface IssueTypeDistribution {
  issue_type: string;
  count: number;
  percentage: number;
}

export interface CustomerServiceDashboardResponse {
  active_calls: {
    count: number;
    timestamp: string;
  };
  queue_length: {
    count: number;
    average_wait_time: number;
    longest_wait_time: number;
    timestamp: string;
  };
  agent_utilization: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    utilization_percentage: number;
    total_agents: number;
    active_agents: number;
    timestamp: string;
  };
  satisfaction_score: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    score: number;
    total_ratings: number;
    positive_ratings: number;
    timestamp: string;
  };
  call_volume_trend: {
    time_period: string;
    data_points: CallVolumeDataPoint[];
    total_calls: number;
    average_calls_per_period: number;
  };
  resolution_rate: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    rate_percentage: number;
    resolved_cases: number;
    total_cases: number;
    timestamp: string;
  };
  agent_activity: {
    total_agents: number;
    active_agents: number;
    agent_activities: AgentActivity[];
    timestamp: string;
  };
  wait_time: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    average_wait_time: number;
    median_wait_time: number;
    p95_wait_time: number;
    timestamp: string;
  };
  call_volume_resolution: {
    date: string;
    call_volume: number;
    resolution_count: number;
    resolution_rate: number;
  }[];
  issue_type_distribution: {
    total_issues: number;
    distributions: IssueTypeDistribution[];
    timestamp: string;
  };
  agent_performance_overview: {
    total_agents: number;
    top_performers: TopPerformer[];
    bottom_performers: TopPerformer[];
    average_csat: number;
    average_resolution_rate: number;
    timestamp: string;
  };
  first_call_resolution: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    rate_percentage: number;
    first_call_resolved: number;
    total_issues: number;
    target_rate: number;
    timestamp: string;
  };
  average_handle_time: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    handle_time_minutes: number;
    talk_time_minutes: number;
    after_call_work_minutes: number;
    total_calls: number;
    timestamp: string;
  };
  response_time: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    average_response_time: number;
    median_response_time: number;
    p95_response_time: number;
    total_calls_answered: number;
    timestamp: string;
  };
  escalation_rate: {
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend_direction: string;
    rate_percentage: number;
    transferred_calls: number;
    total_calls: number;
    timestamp: string;
  };
  dashboard_timestamp: string;
  organization_id: string;
  time_range: string;
  data_freshness: string;
}

// Real-Time Monitoring Types
export interface HourlyCallData {
  hour: string;
  call_count: number;
  is_peak: boolean;
}

export interface AgentStatus {
  agent_id: string;
  agent_name: string;
  status: string;
  current_calls: number;
  avg_call_duration_minutes: number;
  total_calls_today: number;
  utilization_percentage: number;
  performance_indicator: string;
}

export interface RealTimeMonitoringResponse {
  active_calls_and_queue: {
    active_calls: number;
    queued_calls: number;
    total_demand: number;
    demand_pressure: string;
    timestamp: string;
  };
  average_wait_time: {
    current_wait_time_minutes: number;
    current_wait_time_seconds: number;
    target_wait_time_minutes: number;
    exceeds_target: boolean;
    capacity_status: string;
    waiting_count: number;
    timestamp: string;
  };
  agent_utilization: {
    utilization_percentage: number;
    total_agents: number;
    active_agents: number;
    available_agents: number;
    on_break_agents: number;
    risk_level: string;
    recommendation: string;
    timestamp: string;
  };
  transactions_and_success: {
    total_transactions: number;
    successful_transactions: number;
    failed_transactions: number;
    success_rate_percentage: number;
    reliability_status: string;
    timestamp: string;
  };
  system_uptime_and_response: {
    uptime_percentage: number;
    total_uptime_hours: number;
    total_scheduled_hours: number;
    average_response_time_seconds: number;
    average_response_time_ms: number;
    total_requests: number;
    uptime_status: string;
    performance_status: string;
    timestamp: string;
  };
  call_volume_trends_live: {
    current_hour_volume: number;
    hourly_data: HourlyCallData[];
    peak_hour: string;
    peak_volume: number;
    average_hourly_volume: number;
    trend: string;
    timestamp: string;
  };
  transaction_success_rate_live: {
    current_hour_transactions: number;
    current_hour_successful: number;
    current_hour_success_rate: number;
    last_hour_success_rate: number;
    trend: string;
    technical_failures: number;
    timestamp: string;
  };
  agent_status: {
    total_agents: number;
    active_agents: number;
    on_break_agents: number;
    offline_agents: number;
    agents: AgentStatus[];
    resource_allocation: string;
    timestamp: string;
  };
  monitoring_timestamp: string;
  organization_id: string;
  refresh_interval_seconds: number;
  data_freshness: string;
}
