
export interface LoginRequest {
  email: string;
  password: string;
  recaptcha_token: string;
  remember_me: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  name: string;
  organization_name: string;
  phone_number: string;
  recaptcha_token: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    name: string | null;
    organization_id: string;
    email_verified: boolean;
  };
  verification_sent: boolean;
  message?: string; // Optional message field for success responses
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  message?: string; // Optional message field for success responses
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone_number: string | null;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Additional fields for registration/other responses
  phone?: string; // Optional - only in registration
  email_verified?: boolean; // Optional - only in registration
  organization?: {
    id: string;
    name: string;
  }; // Optional - populated separately via organization API
  // OAuth-specific fields
  is_oauth_user?: boolean; // Optional - only in OAuth responses
  oauth_provider?: string | null; // Optional - only in OAuth responses
  profile_picture?: string | null; // Optional - only in OAuth responses
  // Permissions - populated via permissions API
  permissions?: UserPermissions; // Optional - populated separately via permissions API
}



export interface Session {
  id: number;
  user_agent?: string; // Changed from device_info to user_agent
  ip_address?: string;
  created_at: string;
  expires_at: string; // Changed from last_active to expires_at
  is_current: boolean; // Changed from is_active to is_current
}

export interface OAuthProvider {
  name: 'google' | 'github' | 'sso';
  displayName: string;
  icon: React.ReactNode;
}

export interface OAuthLoginRequest {
  provider: 'google' | 'github' | 'sso';
  code?: string;
  state?: string;
  redirect_uri?: string;
}

export interface OAuthLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  message?: string; // Optional message field for success responses
}

// Permissions types
export interface Permission {
  name: string;
  display_name: string;
  description: string;
  resource_type: string;
  action: string;
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  name: string;
  display_name: string;
  description: string;
  organization_id: string | null;
  is_system_role: boolean;
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
  total_permissions: number;
  total_users_assigned: number;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  organization_id: string;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  role: Role;
}

export interface UserPermissions {
  user_id: number;
  roles: UserRole[];
  role_permissions: string[];
  granted_permissions: string[];
  denied_permissions: string[];
  effective_permissions: string[];
  field_permissions: Record<string, any>;
}
