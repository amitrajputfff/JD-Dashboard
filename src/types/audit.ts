export interface AuditLog {
  id: string
  organizationId: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  action: string
  resource: string
  resourceId?: string
  details: string
  ipAddress: string
  userAgent: string
  location: string
  device: string
  status: 'success' | 'failure' | 'warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, any> | null
}

export interface AuditLogFilter {
  search?: string
  action?: string
  severity?: string
  status?: string
  user?: string
  dateRange?: string
  startDate?: string
  endDate?: string
}

export interface AuditLogStats {
  totalLogs: number
  successfulActions: number
  failedActions: number
  warningActions: number
  activeUsers: number
  highSeverityLogs: number
  criticalSeverityLogs: number
}

export interface AuditAction {
  action: string
  label: string
  icon: string
  color: string
  category: 'auth' | 'agent' | 'call' | 'system' | 'knowledge' | 'phone' | 'provider'
}

export interface AuditLogExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeMetadata: boolean
  dateRange: {
    start: string
    end: string
  }
  filters: AuditLogFilter
}

export interface AuditEventPayload {
  action: string
  resource: string
  resourceId?: string
  details: string
  metadata?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

// Pre-defined audit actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'login.success',
  LOGIN_FAILED: 'login.failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGED: 'password.changed',
  MFA_ENABLED: 'mfa.enabled',
  MFA_DISABLED: 'mfa.disabled',
  
  // Agent Management
  AGENT_CREATED: 'agent.created',
  AGENT_UPDATED: 'agent.updated',
  AGENT_DELETED: 'agent.deleted',
  AGENT_ACTIVATED: 'agent.activated',
  AGENT_DEACTIVATED: 'agent.deactivated',
  AGENT_CLONED: 'agent.cloned',
  
  // Call Management
  CALL_STARTED: 'call.started',
  CALL_COMPLETED: 'call.completed',
  CALL_FAILED: 'call.failed',
  CALL_TRANSFERRED: 'call.transferred',
  CALL_RECORDED: 'call.recorded',
  
  // System Settings
  SETTINGS_UPDATED: 'settings.updated',
  PROVIDER_CONFIGURED: 'provider.configured',
  PROVIDER_REMOVED: 'provider.removed',
  
  // Knowledge Base
  KNOWLEDGE_UPLOADED: 'knowledge.uploaded',
  KNOWLEDGE_DELETED: 'knowledge.deleted',
  KNOWLEDGE_UPDATED: 'knowledge.updated',
  
  // Phone Numbers
  PHONE_ASSIGNED: 'phone.assigned',
  PHONE_UNASSIGNED: 'phone.unassigned',
  PHONE_PURCHASED: 'phone.purchased',
  PHONE_RELEASED: 'phone.released',
  
  // User Management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role.changed',
  
  // System Events
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_RESTORE: 'system.restore',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import'
} as const

export type AuditActionType = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]
