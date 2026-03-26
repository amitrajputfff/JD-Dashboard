export interface Permission {
  id: number
  name: string
  display_name: string
  description: string
  resource_type: string
  action: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description: string
  organization_id: string
  is_system_role: boolean
  is_active: boolean
  permissions: Permission[]
  total_permissions: number
  total_users_assigned: number
  created_at: string
  updated_at: string
  // Legacy fields for compatibility with existing components
  userCount?: number
  type?: 'system' | 'custom'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}


export interface User {
  id: number
  name: string | null
  email: string
  avatar?: string
  roles: Role[]
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  organization_id: string | null
  organization_name: string | null
  phone_number: string | null
  securityGroups?: SecurityGroup[]
}

export interface SecurityGroup {
  id: number
  name: string
  display_name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoleMetrics {
  totalRoles: number
  customRoles: number
  systemRoles: number
  totalPermissions: number
  totalUsers: number
  activeUsers: number
}

export interface RoleStatistics {
  total_roles: number
  total_permissions: number
  system_roles: number
  custom_roles: number
  permissions_by_resource: Record<string, number>
}

export interface RoleMetadata {
  organization_id: string
  include_system_roles: boolean
  generated_at: string
}

export interface CreateRoleRequest {
  name: string
  display_name: string
  description: string
  organization_id: string
  is_system_role: boolean
  permission_ids: number[]
}

export type UpdateRoleRequest = Partial<CreateRoleRequest>

// API Response types to match your database structure
export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

export interface RolePermissionAssignment {
  id: number
  role_id: number
  permission_id: number
  granted: boolean
  created_at: string
}

// Users API Response types
export interface UsersResponse {
  users: User[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface GetUsersParams {
  skip?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  organization_id?: string
  role_id?: number
}
