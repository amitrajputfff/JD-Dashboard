import { 
  Role, 
  Permission, 
  User, 
  RoleMetrics,
  RoleStatistics,
  RoleMetadata,
  CreateRoleRequest,
  UpdateRoleRequest,
  UsersResponse,
  GetUsersParams
} from "@/types/role"
import { apiClient } from './client'
import { authStorage } from '@/lib/auth-storage'

export class RolesAPI {
  // Roles
  static async getRoles(params?: {
    skip?: number
    limit?: number
    search?: string
    type?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    includeSystemRoles?: boolean
    is_active?: boolean
    include_inactive?: boolean
  }): Promise<{
    roles: Role[]
    total: number
    skip: number
    limit: number
    permissions: Permission[]
    role_permissions: Record<string, Permission[]>
    permissions_by_resource: Record<string, Permission[]>
    statistics: RoleStatistics
    metadata: RoleMetadata
    pagination: {
      total_items: number
      total_pages: number
      current_page: number
      page_size: number
      has_next: boolean
      has_previous: boolean
      next_page: number | null
      previous_page: number | null
    }
  }> {
    const queryParams = new URLSearchParams()
    
    // Required parameters based on new API
    const includeSystemRoles = params?.includeSystemRoles ?? true
    queryParams.append('include_system_roles', includeSystemRoles.toString())
    
    // Add is_active parameter if provided
    if (params?.is_active !== undefined) {
      queryParams.append('is_active', params.is_active.toString())
    }
    
    // Add include_inactive parameter if provided
    if (params?.include_inactive !== undefined) {
      queryParams.append('include_inactive', params.include_inactive.toString())
    }
    
    // Add pagination parameters if provided (for future use)
    if (params?.skip !== undefined) {
      queryParams.append('skip', params.skip.toString())
    }
    
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString())
    }
    
    // Add search parameter if provided (for future use)
    if (params?.search) {
      queryParams.append('search', params.search)
    }
    
    // Add filter parameters if provided (for future use)
    if (params?.type && params.type !== 'all') {
      queryParams.append('type', params.type)
    }
    
    // Add sorting parameters if provided (for future use)
    if (params?.sortBy) {
      queryParams.append('sort_by', params.sortBy)
    }
    
    if (params?.sortOrder) {
      queryParams.append('sort_order', params.sortOrder)
    }
    
    const response = await apiClient.get<{
      roles: Role[]
      permissions: Permission[]
      role_permissions: Record<string, Permission[]>
      permissions_by_resource: Record<string, Permission[]>
      statistics: RoleStatistics
      metadata: RoleMetadata
      pagination: {
        total_items: number
        total_pages: number
        current_page: number
        page_size: number
        has_next: boolean
        has_previous: boolean
        next_page: number | null
        previous_page: number | null
      }
    }>(`/api/permissions/all?${queryParams.toString()}`)
    
    if (!response.roles || !Array.isArray(response.roles)) {
      console.error('RolesAPI: Invalid response format - roles is not an array')
      return {
        roles: [],
        total: 0,
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        permissions: [],
        role_permissions: {},
        permissions_by_resource: {},
        statistics: {
          total_roles: 0,
          total_permissions: 0,
          system_roles: 0,
          custom_roles: 0,
          permissions_by_resource: {}
        },
        metadata: {
          organization_id: '',
          include_system_roles: false,
          generated_at: ''
        },
        pagination: {
          total_items: 0,
          total_pages: 0,
          current_page: 1,
          page_size: params?.limit || 10,
          has_next: false,
          has_previous: false,
          next_page: null,
          previous_page: null
        }
      }
    }
    
    // Transform the API data to include legacy fields for backward compatibility
    const transformedRoles = response.roles.map(role => ({
      ...role,
      // Legacy compatibility fields
      userCount: role.total_users_assigned,
      type: role.is_system_role ? 'system' as const : 'custom' as const,
      isActive: role.is_active,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      createdBy: "api-user" // Default value since API doesn't provide this
    }))
    
    return {
      roles: transformedRoles,
      total: response.pagination?.total_items || response.statistics.total_roles || transformedRoles.length,
      skip: params?.skip || 0,
      limit: params?.limit || transformedRoles.length,
      permissions: response.permissions || [],
      role_permissions: response.role_permissions || {},
      permissions_by_resource: response.permissions_by_resource || {},
      statistics: response.statistics || {
        total_roles: 0,
        total_permissions: 0,
        system_roles: 0,
        custom_roles: 0,
        permissions_by_resource: {}
      },
      metadata: response.metadata || {
        organization_id: '',
        include_system_roles: false,
        generated_at: ''
      },
      pagination: response.pagination || {
        total_items: transformedRoles.length,
        total_pages: Math.ceil(transformedRoles.length / (params?.limit || 10)),
        current_page: Math.floor((params?.skip || 0) / (params?.limit || 10)) + 1,
        page_size: params?.limit || 10,
        has_next: false,
        has_previous: false,
        next_page: null,
        previous_page: null
      }
    }
  }

  static async getRole(id: string): Promise<Role | null> {
    try {
      const response = await apiClient.get<Role>(`/api/permissions/roles/${id}`)
      
      // Transform the API data to include legacy fields for backward compatibility
      const transformedRole = {
        ...response,
        // Legacy compatibility fields
        userCount: response.total_users_assigned,
        type: response.is_system_role ? 'system' as const : 'custom' as const,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        createdBy: "api-user" // Default value since API doesn't provide this
      }
      
      return transformedRole
    } catch (error: any) {
      console.error(`Failed to fetch role ${id}:`, error)
      
      // If role not found (404), return null
      if (error.status === 404) {
        return null
      }
      
      // Re-throw all other errors (including permission errors)
      throw error
    }
  }

  static async createRole(data: CreateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.post<Role>('/api/permissions/roles', data)
      
      // Transform the API response to include legacy fields for backward compatibility
      const transformedRole = {
        ...response,
        // Legacy compatibility fields
        userCount: response.total_users_assigned || 0,
        type: response.is_system_role ? 'system' as const : 'custom' as const,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        createdBy: "api-user" // Default value since API doesn't provide this
      }
      
      return transformedRole
    } catch (error: any) {
      console.error('Failed to create role:', error)
      throw error
    }
  }

  static async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.put<Role>(`/api/permissions/roles/${id}`, data)
      
      // Transform the API response to include legacy fields for backward compatibility
      const transformedRole = {
        ...response,
        // Legacy compatibility fields
        userCount: response.total_users_assigned || 0,
        type: response.is_system_role ? 'system' as const : 'custom' as const,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        createdBy: "api-user" // Default value since API doesn't provide this
      }
      
      return transformedRole
    } catch (error: any) {
      console.error(`Failed to update role ${id}:`, error)
      throw error
    }
  }

  static async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/permissions/roles/${id}`)
    } catch (error: any) {
      console.error(`Failed to delete role ${id}:`, error)
      throw error
    }
  }

  static async activateRole(id: string): Promise<Role> {
    try {
      const response = await apiClient.patch<Role>(`/api/permissions/roles/${id}/activate`)
      
      // Transform the API response to include legacy fields for backward compatibility
      const transformedRole = {
        ...response,
        // Legacy compatibility fields
        userCount: response.total_users_assigned || 0,
        type: response.is_system_role ? 'system' as const : 'custom' as const,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        createdBy: "api-user" // Default value since API doesn't provide this
      }
      
      return transformedRole
    } catch (error: any) {
      console.error(`Failed to activate role ${id}:`, error)
      throw error
    }
  }

  static async deactivateRole(id: string): Promise<Role> {
    try {
      const response = await apiClient.patch<Role>(`/api/permissions/roles/${id}/deactivate`)
      
      // Transform the API response to include legacy fields for backward compatibility
      const transformedRole = {
        ...response,
        // Legacy compatibility fields
        userCount: response.total_users_assigned || 0,
        type: response.is_system_role ? 'system' as const : 'custom' as const,
        isActive: response.is_active,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        createdBy: "api-user" // Default value since API doesn't provide this
      }
      
      return transformedRole
    } catch (error: any) {
      console.error(`Failed to deactivate role ${id}:`, error)
      throw error
    }
  }



  // Permissions
  static async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<{
        permissions: Permission[]
        total: number
        skip: number
        limit: number
      }>('/api/permissions/?skip=0&limit=100')
      
      // The API returns permissions array directly in the response
      if (Array.isArray(response.permissions)) {
        return response.permissions
      } else {
        console.error('RolesAPI: Invalid permissions response format - permissions is not an array')
        return []
      }
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error)
      
      // If this is a permission error, re-throw it so the UI can handle it appropriately
      if (error.isPermissionError && error.status === 403) {
        throw error
      }
      
      // Re-throw all other errors
      throw error
    }
  }

  static async getPermissionsByResource(resource: string): Promise<Permission[]> {
    try {
      const allPermissions = await this.getPermissions()
      return allPermissions.filter(permission => permission.resource_type === resource)
    } catch (error) {
      console.error('Failed to fetch permissions by resource:', error)
      throw error
    }
  }

  // Users
  static async getUsersWithRoles(params?: GetUsersParams): Promise<User[]> {
    try {
      const queryParams = new URLSearchParams()
      
      // Convert skip/limit pagination to page-based pagination
      if (params?.skip !== undefined) {
        const page = Math.floor(params.skip / (params.limit || 100)) + 1
        queryParams.append('page', page.toString())
      }
      
      if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString())
      } else {
        queryParams.append('limit', '100') // Default limit
      }
      
      // Add search parameter
      if (params?.search) {
        queryParams.append('search', params.search)
      }
      
      // Add status filter - convert to is_active parameter
      if (params?.status && params.status !== 'all') {
        const isActive = params.status === 'active' ? 'true' : 'false'
        queryParams.append('is_active', isActive)
      }
      
      // Always require organization_id
      const organization = authStorage.getOrganization()
      if (!organization?.id) {
        throw new Error('Organization not found. Please log in again.')
      }
      queryParams.append('organization_id', organization.id)
      
      // Add role filter
      if (params?.role_id) {
        queryParams.append('role_id', params.role_id.toString())
      }

      const response = await apiClient.get<UsersResponse>(`/api/users?${queryParams.toString()}`)
      
      if (!response.users || !Array.isArray(response.users)) {
        console.error('RolesAPI: Invalid response format - users is not an array')
        return []
      }
      
      return response.users
    } catch (error: any) {
      console.error('Failed to fetch users with roles:', error)
      throw error
    }
  }

  static async getUsersPaginated(params?: GetUsersParams): Promise<UsersResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // Handle pagination parameters
      if (params?.skip !== undefined) {
        queryParams.append('skip', params.skip.toString())
      } else {
        queryParams.append('skip', '0')
      }
      
      if (params?.limit !== undefined) {
        queryParams.append('limit', params.limit.toString())
      } else {
        queryParams.append('limit', '100')
      }
      
      // Add search parameter
      if (params?.search) {
        queryParams.append('search', params.search)
      }
      
      // Add status filter - convert to is_active parameter
      if (params?.status && params.status !== 'all') {
        const isActive = params.status === 'active' ? 'true' : 'false'
        queryParams.append('is_active', isActive)
      }
      
      // Always require organization_id
      const organization = authStorage.getOrganization()
      if (!organization?.id) {
        throw new Error('Organization not found. Please log in again.')
      }
      queryParams.append('organization_id', organization.id)
      
      // Add role filter
      if (params?.role_id) {
        queryParams.append('role_id', params.role_id.toString())
      }

      const response = await apiClient.get<UsersResponse>(`/api/users?${queryParams.toString()}`)
      
      if (!response.users || !Array.isArray(response.users)) {
        console.error('RolesAPI: Invalid response format - users is not an array')
        return {
          users: [],
          total: 0,
          page: 1,
          per_page: params?.limit || 100,
          total_pages: 1
        }
      }
      
      return response
    } catch (error: any) {
      console.error('Failed to fetch users with pagination:', error)
      throw error
    }
  }

  static async getUsersByRole(roleId: string): Promise<User[]> {
    try {
      // Organization ID will be automatically included by getUsersWithRoles
      return await this.getUsersWithRoles({ role_id: parseInt(roleId) })
    } catch (error: any) {
      console.error(`Failed to fetch users by role ${roleId}:`, error)
      throw error
    }
  }


  static async assignRoleToUser(params: {
    user_id: string
    role_ids: number[]
    organization_id?: string
    expires_at?: string
  }): Promise<void> {
    try {
      const { user_id, role_ids, organization_id, expires_at } = params
      await apiClient.post(`/api/permissions/users/${user_id}/roles`, {
        user_id: parseInt(user_id),
        role_ids,
        organization_id,
        expires_at
      })
    } catch (error: any) {
      console.error(`Failed to assign roles ${params.role_ids} to user ${params.user_id}:`, error)
      throw error
    }
  }

  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/roles/${roleId}`)
    } catch (error: any) {
      console.error(`Failed to remove role ${roleId} from user ${userId}:`, error)
      throw error
    }
  }

  static async assignUserToSecurityGroup(userId: string, groupId: string): Promise<void> {
    try {
      await apiClient.post(`/api/users/${userId}/security-groups`, { group_id: parseInt(groupId) })
    } catch (error: any) {
      console.error(`Failed to assign user ${userId} to security group ${groupId}:`, error)
      throw error
    }
  }

  static async removeUserFromSecurityGroup(userId: string, groupId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}/security-groups/${groupId}`)
    } catch (error: any) {
      console.error(`Failed to remove user ${userId} from security group ${groupId}:`, error)
      throw error
    }
  }

  static async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/api/users/${userId}`, updateData)
      return response
    } catch (error: any) {
      console.error(`Failed to update user ${userId}:`, error)
      throw error
    }
  }

  static async getUserWithRoles(userId: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/api/users/${userId}`)
      return response
    } catch (error: any) {
      console.error(`Failed to fetch user ${userId} with roles:`, error)
      throw error
    }
  }

  static async activateUser(userId: string): Promise<User> {
    try {
      const response = await apiClient.post<User>(`/api/users/${userId}/activate`)
      return response
    } catch (error: any) {
      console.error(`Failed to activate user ${userId}:`, error)
      throw error
    }
  }

  static async deactivateUser(userId: string): Promise<User> {
    try {
      const response = await apiClient.post<User>(`/api/users/${userId}/deactivate`)
      return response
    } catch (error: any) {
      console.error(`Failed to deactivate user ${userId}:`, error)
      throw error
    }
  }

  static async toggleUserStatus(userId: string, isCurrentlyActive: boolean): Promise<User> {
    // Use the new separate endpoints based on current status
    if (isCurrentlyActive) {
      return await this.deactivateUser(userId)
    } else {
      return await this.activateUser(userId)
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${userId}`)
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error)
      throw error
    }
  }

  static async bulkUpdateUsers(userIds: number[], updates: {
    role?: string
    is_active?: boolean
  }): Promise<void> {
    try {
      await apiClient.post('/api/users/bulk-update', {
        user_ids: userIds,
        updates: updates
      })
    } catch (error: any) {
      console.error('Failed to bulk update users:', error)
      throw error
    }
  }

  static async bulkActivateUsers(userIds: number[]): Promise<void> {
    return await this.bulkUpdateUsers(userIds, { is_active: true })
  }

  static async bulkDeactivateUsers(userIds: number[]): Promise<void> {
    return await this.bulkUpdateUsers(userIds, { is_active: false })
  }

  static async bulkAssignRoles(params: {
    user_ids: number[]
    role_ids: number[]
    organization_id?: string
    expires_at?: string
  }): Promise<void> {
    try {
      await apiClient.post('/api/permissions/users/bulk/roles', params)
    } catch (error: any) {
      console.error('Failed to bulk assign roles:', error)
      throw error
    }
  }

  // Metrics
  static async getRoleMetrics(): Promise<RoleMetrics> {
    throw new Error("Get role metrics API endpoint not implemented yet")
  }

  // Bulk operations
  static async bulkDeleteRoles(roleIds: string[]): Promise<void> {
    throw new Error("Bulk delete roles API endpoint not implemented yet")
  }

  static async bulkToggleRoleStatus(roleIds: string[], isActive: boolean): Promise<Role[]> {
    throw new Error("Bulk toggle role status API endpoint not implemented yet")
  }
}
