import { Permission, Role, SecurityGroup, User, RoleMetrics } from "@/types/role"

export const permissions: Permission[] = [
  // System Administration
  {
    id: 1,
    name: "system.admin",
    display_name: "System Administration",
    description: "Full system administration access",
    resource_type: "system",
    action: "admin",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 2,
    name: "system.audit",
    display_name: "View Audit Logs",
    description: "View audit logs and system monitoring",
    resource_type: "system",
    action: "audit",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // Organization Management
  {
    id: 3,
    name: "organization.create",
    display_name: "Create Organization",
    description: "Create new organizations",
    resource_type: "organization",
    action: "create",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 4,
    name: "organization.read",
    display_name: "View Organization",
    description: "View organization details",
    resource_type: "organization",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 5,
    name: "organization.update",
    display_name: "Update Organization",
    description: "Update organization information",
    resource_type: "organization",
    action: "update",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 6,
    name: "organization.delete",
    display_name: "Delete Organization",
    description: "Delete organizations",
    resource_type: "organization",
    action: "delete",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // User Management
  {
    id: 7,
    name: "user.create",
    display_name: "Create User",
    description: "Create new users",
    resource_type: "user",
    action: "create",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 8,
    name: "user.read",
    display_name: "View User",
    description: "View user information",
    resource_type: "user",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 9,
    name: "user.update",
    display_name: "Update User",
    description: "Update user information",
    resource_type: "user",
    action: "update",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 10,
    name: "user.delete",
    display_name: "Delete User",
    description: "Delete users",
    resource_type: "user",
    action: "delete",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 11,
    name: "user.manage_roles",
    display_name: "Manage User Roles",
    description: "Assign and remove user roles",
    resource_type: "user",
    action: "manage_roles",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // Assistant Management
  {
    id: 12,
    name: "assistant.create",
    display_name: "Create Assistant",
    description: "Create new assistants",
    resource_type: "assistant",
    action: "create",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 13,
    name: "assistant.read",
    display_name: "View Assistant",
    description: "View assistant details",
    resource_type: "assistant",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 14,
    name: "assistant.update",
    display_name: "Update Assistant",
    description: "Update assistant configuration",
    resource_type: "assistant",
    action: "update",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 15,
    name: "assistant.delete",
    display_name: "Delete Agent",
    description: "Delete Agents",
    resource_type: "assistant",
    action: "delete",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 16,
    name: "assistant.deploy",
    display_name: "Deploy Assistant",
    description: "Deploy assistants to production",
    resource_type: "assistant",
    action: "deploy",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 17,
    name: "assistant.test",
    display_name: "Test Assistant",
    description: "Test assistant functionality",
    resource_type: "assistant",
    action: "test",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // Call Management
  {
    id: 18,
    name: "call.read",
    display_name: "View Calls",
    description: "View call logs and transcripts",
    resource_type: "call",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 19,
    name: "call.export",
    display_name: "Export Calls",
    description: "Export call data",
    resource_type: "call",
    action: "export",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 20,
    name: "call.analytics",
    display_name: "View Call Analytics",
    description: "Access call analytics and reports",
    resource_type: "call",
    action: "analytics",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // Phone Management
  {
    id: 21,
    name: "phone.create",
    display_name: "Create Phone Number",
    description: "Create new phone numbers",
    resource_type: "phone",
    action: "create",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 22,
    name: "phone.read",
    display_name: "View Phone Number",
    description: "View phone number details",
    resource_type: "phone",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 23,
    name: "phone.update",
    display_name: "Update Phone Number",
    description: "Update phone number configuration",
    resource_type: "phone",
    action: "update",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 24,
    name: "phone.delete",
    display_name: "Delete Phone Number",
    description: "Delete phone numbers",
    resource_type: "phone",
    action: "delete",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  // Prompt Management
  {
    id: 25,
    name: "prompt.create",
    display_name: "Create Prompt",
    description: "Create new prompts",
    resource_type: "prompt",
    action: "create",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 26,
    name: "prompt.read",
    display_name: "View Prompt",
    description: "View prompt details",
    resource_type: "prompt",
    action: "read",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 27,
    name: "prompt.update",
    display_name: "Update Prompt",
    description: "Update prompt content",
    resource_type: "prompt",
    action: "update",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 28,
    name: "prompt.delete",
    display_name: "Delete Prompt",
    description: "Delete prompts",
    resource_type: "prompt",
    action: "delete",
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  }
]

export const roles: Role[] = [
  {
    id: 1,
    name: "super_admin",
    display_name: "Super Administrator",
    description: "Full system access with all permissions",
    organization_id: null,
    is_system_role: true,
    is_active: true,
    permissions: permissions,
    userCount: 2,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 2,
    name: "org_admin",
    display_name: "Organization Administrator",
    description: "Full access within organization",
    organization_id: null,
    is_system_role: true,
    is_active: true,
    permissions: permissions.filter(p => !p.name.includes('system.admin')),
    userCount: 5,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 3,
    name: "assistant_manager",
    display_name: "Assistant Manager",
    description: "Can manage assistants and view calls",
    organization_id: null,
    is_system_role: false,
    is_active: true,
    permissions: permissions.filter(p => 
      p.resource_type === 'assistant' || 
      p.resource_type === 'call' || 
      p.name === 'user.read'
    ),
    userCount: 8,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 4,
    name: "call_analyst",
    display_name: "Call Analyst",
    description: "Can view calls and analytics",
    organization_id: null,
    is_system_role: false,
    is_active: true,
    permissions: permissions.filter(p => 
      p.resource_type === 'call' || 
      p.name === 'assistant.read'
    ),
    userCount: 6,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 5,
    name: "support_agent",
    display_name: "Support Agent",
    description: "Can view calls and basic assistant info",
    organization_id: null,
    is_system_role: false,
    is_active: true,
    permissions: permissions.filter(p => 
      p.action === 'read' && 
      (p.resource_type === 'call' || p.resource_type === 'assistant')
    ),
    userCount: 15,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 6,
    name: "readonly_user",
    display_name: "Read-Only User",
    description: "Can only view data",
    organization_id: null,
    is_system_role: true,
    is_active: true,
    permissions: permissions.filter(p => p.action === 'read'),
    userCount: 25,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 7,
    name: "restricted_assistant_manager",
    display_name: "Restricted Assistant Manager",
    description: "Assistant manager without update permissions",
    organization_id: null,
    is_system_role: false,
    is_active: true,
    permissions: permissions.filter(p => 
      (p.resource_type === 'assistant' && p.action !== 'update') || 
      p.name === 'call.read'
    ),
    userCount: 3,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  }
]

export const securityGroups: SecurityGroup[] = [
  {
    id: 1,
    name: "Executive Team",
    description: "C-level executives and senior leadership",
    organization_id: null,
    roles: [roles[0], roles[1]], // Super Admin, Org Admin
    userCount: 5,
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 2,
    name: "Engineering Team",
    description: "Software engineers and developers",
    organization_id: null,
    roles: [roles[1], roles[2]], // Org Admin, Assistant Manager
    userCount: 12,
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 3,
    name: "Operations Team",
    description: "Day-to-day operations and management",
    organization_id: null,
    roles: [roles[2], roles[3]], // Assistant Manager, Call Analyst
    userCount: 18,
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 4,
    name: "Customer Success",
    description: "Customer support and success teams",
    organization_id: null,
    roles: [roles[4], roles[5]], // Support Agent, Read-Only User
    userCount: 30,
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 5,
    name: "Data Analytics",
    description: "Business intelligence and data analysis",
    organization_id: null,
    roles: [roles[3], roles[5]], // Call Analyst, Read-Only User
    userCount: 8,
    is_active: true,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  },
  {
    id: 6,
    name: "Beta Testers",
    description: "Internal beta testing group",
    organization_id: null,
    roles: [roles[2], roles[5]], // Assistant Manager, Read-Only User
    userCount: 6,
    is_active: false,
    created_at: "2025-09-04T13:09:26.626Z",
    updated_at: "2025-09-04T13:09:26.626Z"
  }
]

export const users: User[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@justdial.com",
    roles: [roles[0]], // Super Admin
    securityGroups: [securityGroups[0]], // Executive Team
    is_active: true,
    last_login: "2024-09-10T08:30:00Z",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@justdial.com",
    roles: [roles[1]], // Org Admin
    securityGroups: [securityGroups[0]], // Executive Team
    is_active: true,
    last_login: "2024-09-10T09:15:00Z",
    created_at: "2024-01-05T00:00:00Z"
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike.chen@justdial.com",
    roles: [roles[2], roles[3]], // Assistant Manager, Call Analyst
    securityGroups: [securityGroups[1], securityGroups[2]], // Engineering, Operations
    is_active: true,
    last_login: "2024-09-09T16:45:00Z",
    created_at: "2024-01-10T00:00:00Z"
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@justdial.com",
    roles: [roles[3]], // Call Analyst
    securityGroups: [securityGroups[4]], // Data Analytics
    is_active: true,
    last_login: "2024-09-10T07:20:00Z",
    created_at: "2024-02-01T00:00:00Z"
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.wilson@justdial.com",
    roles: [roles[4]], // Support Agent
    securityGroups: [securityGroups[3]], // Customer Success
    is_active: true,
    last_login: "2024-09-10T10:30:00Z",
    created_at: "2024-02-15T00:00:00Z"
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.anderson@justdial.com",
    roles: [roles[5]], // Read-Only User
    securityGroups: [securityGroups[3]], // Customer Success
    is_active: false,
    last_login: "2024-08-15T14:22:00Z",
    created_at: "2024-03-01T00:00:00Z"
  }
]

export const roleMetrics: RoleMetrics = {
  totalRoles: roles.length,
  customRoles: roles.filter(r => !r.is_system_role).length,
  systemRoles: roles.filter(r => r.is_system_role).length,
  totalPermissions: permissions.length,
  totalUsers: users.length,
  activeUsers: users.filter(u => u.is_active).length
}