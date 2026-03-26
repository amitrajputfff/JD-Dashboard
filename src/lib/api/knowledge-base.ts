import { authUtils } from '@/lib/auth-utils'
import { apiClient } from './client'

export interface FileUploadParams {
  file: File
  file_name: string
  file_type: string
  file_metadata: {
    description?: string
    category?: string
    tags?: string[]
  }
}

export interface FileUploadResponse {
  success: boolean
  message: string
  file_id: number
  file_url: string
  file_name: string
  file_type: string
  file_size: number
}

export interface FileInfo {
  file_name: string
  file_type: string
  storage_provider: string
  file_metadata: Record<string, any>
  organization_id: string
  id: number
  file_url: string
  created_by: number
  updated_by: number
  is_active: boolean
  created_at: string
  updated_at: string
  file_size?: number
}

export interface FilesListResponse {
  files: FileInfo[]
  total: number
  skip: number
  limit: number
}

export interface SupportedFileType {
  mime_type: string
  description: string
  extensions: string[]
}

export interface FileTypesResponse {
  supported_types: SupportedFileType[]
  max_file_size: string
  storage_provider: string
}

export interface UserInfo {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

// Bulk Upload Types
export interface BulkUploadFileRequest {
  file_name: string
  file_type: string
  description?: string
  category?: string
  metadata?: Record<string, any>
}

export interface BulkUploadRequest {
  files: BulkUploadFileRequest[]
  default_description?: string
  default_category?: string
  default_metadata?: Record<string, any>
}

export interface PresignedUrlResult {
  file_name: string
  file_type: string
  upload_url: string
  file_key: string
  expires_in: number
  status: string
}

export interface BulkUploadPresignedResponse {
  success: boolean
  message: string
  total_files: number
  successful_uploads: number
  failed_uploads: number
  upload_results: PresignedUrlResult[]
}

export interface ConfirmUploadFile {
  file_key: string
  file_name: string
  file_type: string
  file_size: number
}

export interface ConfirmUploadsRequest {
  uploads: ConfirmUploadFile[]
}

export interface ConfirmedFile {
  file_name: string
  file_type: string
  file_id: number
  file_url: string
  file_size: number
  file_key: string
  status: string
}

export interface ConfirmUploadsResponse {
  success: boolean
  message: string
  total_files: number
  confirmed_uploads: number
  failed_confirmations: number
  confirmed_files: ConfirmedFile[]
}

export class KnowledgeBaseAPI {
  private static baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.liaplus.com/backend'

  static async uploadFile(params: FileUploadParams & { organization_id?: string }): Promise<FileUploadResponse> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    // Get organization ID if not provided
    let orgId = params.organization_id;
    if (!orgId && typeof window !== 'undefined') {
      orgId = authUtils.getOrganizationId() || undefined;
    }
    
    if (!orgId) {
      throw new Error('Organization ID is required for file upload');
    }
    
    const formData = new FormData()
    
    // Add the file
    formData.append('file', params.file)
    
    // Add file metadata
    formData.append('file_name', params.file_name)
    formData.append('file_type', params.file_type)
    formData.append('file_metadata', JSON.stringify(params.file_metadata))
    formData.append('organization_id', orgId)
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  static async getAllFiles(params?: {
    organization_id?: string
    skip?: number
    limit?: number
    file_type?: string
    is_active?: boolean
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<FilesListResponse> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    // Get organization ID if not provided
    let orgId = params?.organization_id;
    if (!orgId && typeof window !== 'undefined') {
      orgId = authUtils.getOrganizationId() || undefined;
    }
    
    if (!orgId) {
      console.warn('No organization ID found - returning empty files list');
      return {
        files: [],
        total: 0,
        skip: params?.skip || 0,
        limit: params?.limit || 10
      };
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.append('organization_id', orgId)
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params?.file_type) queryParams.append('file_type', params.file_type)
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)
    
    const url = `${this.baseUrl}/api/knowledge-base/files?${queryParams.toString()}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch files: ${response.statusText}`)
    }

    return response.json()
  }

  static async getFileById(id: string | number): Promise<FileInfo> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch file: ${response.statusText}`)
    }

    return response.json()
  }

  static async updateFile(id: string | number, updates: {
    file_name?: string
    file_metadata?: {
      description?: string
      category?: string
      version?: string
      tags?: string[]
      [key: string]: any
    }
  }): Promise<FileInfo> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update file: ${response.statusText}`)
    }

    return response.json()
  }

  static async deleteFile(id: string | number, permanent: boolean = false): Promise<void> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    // Use different endpoints for soft vs permanent delete
    const endpoint = permanent 
      ? `${this.baseUrl}/api/knowledge-base/files/${id}/permanent`
      : `${this.baseUrl}/api/knowledge-base/files/${id}`
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to delete file: ${response.statusText}`)
    }
  }

  // Convenience methods for specific delete types
  static async softDeleteFile(id: string | number): Promise<void> {
    return this.deleteFile(id, false)
  }

  static async permanentDeleteFile(id: string | number): Promise<void> {
    return this.deleteFile(id, true)
  }

  static async getFileDownloadUrl(id: string | number, expiresIn: number = 3600): Promise<{
    success: boolean
    download_url: string
    expires_in: number
    message: string
  }> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/${id}/download-url?expires_in=${expiresIn}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to get download URL: ${response.statusText}`)
    }

    return response.json()
  }

  static async getOrganizationFiles(): Promise<FileInfo[]> {
    const token = authUtils.getAccessToken()
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/organization`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch organization files: ${response.statusText}`)
    }

    return response.json()
  }

  static async getFileTypesInfo(): Promise<{
    supported_types: Array<{
      mime_type: string
      description: string
      extensions: string[]
    }>
    max_file_size: string
    storage_provider: string
  }> {
    // Use apiClient to benefit from automatic token refresh
    const response = await apiClient.get<{
      supported_types: Array<{
        mime_type: string
        description: string
        extensions: string[]
      }>
      max_file_size: string
      storage_provider: string
    }>('/api/knowledge-base/file-types')
    return response
  }


  // Helper methods for common operations
  static async getFileInfo(id: string | number): Promise<FileInfo> {
    return this.getFileById(id)
  }

  static async updateFileMetadata(id: string | number, metadata: {
    description?: string
    category?: string
    version?: string
    tags?: string[]
    [key: string]: any
  }): Promise<FileInfo> {
    return this.updateFile(id, { file_metadata: metadata })
  }

  static async renameFile(id: string | number, newName: string): Promise<FileInfo> {
    return this.updateFile(id, { file_name: newName })
  }

  static async getSupportedFileTypes(): Promise<FileTypesResponse> {
    // Use apiClient to benefit from automatic token refresh
    const response = await apiClient.get<FileTypesResponse>('/api/knowledge-base/file-types')
    return response
  }

  static async getUserById(userId: string | number): Promise<UserInfo> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to fetch user details: ${response.statusText}`)
    }

    return response.json()
  }

  // Bulk Upload Methods
  static async generatePresignedUrls(request: BulkUploadRequest & { organization_id?: string }): Promise<BulkUploadPresignedResponse> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    // Get organization ID if not provided
    let orgId = request.organization_id;
    if (!orgId && typeof window !== 'undefined') {
      orgId = authUtils.getOrganizationId() || undefined;
    }
    
    if (!orgId) {
      throw new Error('Organization ID is required for bulk upload');
    }
    
    const requestWithOrgId = {
      ...request,
      organization_id: orgId
    };
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithOrgId),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to generate presigned URLs: ${response.statusText}`)
    }

    return response.json()
  }

  static async uploadToS3(uploadUrl: string, file: File, fileType: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': fileType,
      },
    })

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`)
    }
  }

  static async confirmUploads(request: ConfirmUploadsRequest): Promise<ConfirmUploadsResponse> {
    const token = authUtils.getAccessToken()
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }
    
    const response = await fetch(`${this.baseUrl}/api/knowledge-base/files/bulk-upload/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to confirm uploads: ${response.statusText}`)
    }

    return response.json()
  }

  // Combined bulk upload method (all 3 steps)
  static async bulkUploadFiles(
    files: File[],
    options?: {
      organization_id?: string
      description?: string
      category?: string
      metadata?: Record<string, any>
      onProgress?: (progress: { current: number; total: number; fileName: string }) => void
    }
  ): Promise<ConfirmedFile[]> {
    // Get organization ID if not provided
    let orgId = options?.organization_id;
    if (!orgId && typeof window !== 'undefined') {
      orgId = authUtils.getOrganizationId() || undefined;
    }
    
    if (!orgId) {
      throw new Error('Organization ID is required for bulk upload');
    }
    
    // Step 1: Generate pre-signed URLs
    const uploadRequest: BulkUploadRequest & { organization_id: string } = {
      files: files.map(file => ({
        file_name: file.name,
        file_type: file.type,
        description: options?.description,
        category: options?.category,
        metadata: options?.metadata,
      })),
      default_description: options?.description,
      default_category: options?.category,
      default_metadata: options?.metadata,
      organization_id: orgId
    }

    const presignedResponse = await this.generatePresignedUrls(uploadRequest)

    if (!presignedResponse.success) {
      throw new Error(presignedResponse.message || 'Failed to generate presigned URLs')
    }

    // Step 2: Upload files to S3
    const uploadPromises = presignedResponse.upload_results.map(async (result, index) => {
      const file = files[index]
      
      try {
        if (options?.onProgress) {
          options.onProgress({ current: index + 1, total: files.length, fileName: file.name })
        }

        await this.uploadToS3(result.upload_url, file, result.file_type)

        return {
          file_key: result.file_key,
          file_name: result.file_name,
          file_type: result.file_type,
          file_size: file.size,
        }
      } catch (error) {
        throw error
      }
    })

    const uploadResults = await Promise.all(uploadPromises)

    // Step 3: Confirm uploads
    const confirmResponse = await this.confirmUploads({
      uploads: uploadResults,
    })

    if (!confirmResponse.success) {
      throw new Error(confirmResponse.message || 'Failed to confirm uploads')
    }

    return confirmResponse.confirmed_files
  }
}