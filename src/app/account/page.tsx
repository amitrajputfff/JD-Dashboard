'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  User,
  Settings,
  Bell,
  CreditCard,
  Shield,
  Key,
  Download,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
  Edit,
  Camera,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { InlineLoader, Loader } from '@/components/ui/loader';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { Session } from '@/types/auth';
import { useAuth } from '@/hooks/use-auth';

interface UserProfile {
  name: string;
  phone_number: string | null;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastPasswordChange: string;
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    created: string;
    lastUsed: string;
    permissions: string[];
  }>;
}

interface BillingInfo {
  plan: string;
  status: string;
  nextBilling: string;
  amount: number;
  currency: string;
  paymentMethod: {
    type: string;
    last4: string;
    expiry: string;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    downloadUrl: string;
  }>;
}

interface NotificationSettings {
  emailNotifications: {
    marketing: boolean;
    security: boolean;
    billing: boolean;
    updates: boolean;
    callAlerts: boolean;
  };
  smsNotifications: {
    security: boolean;
    billing: boolean;
    callAlerts: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    callAlerts: boolean;
    systemAlerts: boolean;
  };
}





export default function AccountPage() {
  const router = useRouter();
  const { user, sessions, refreshUserData, refreshSessionsOnly, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing' | 'notifications' | 'preferences' | 'danger'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone_number: null
  });
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailVerified: false,
    phoneVerified: false,
    lastPasswordChange: '',
    activeSessions: [],
    apiKeys: []
  });
  const [billing] = useState<BillingInfo>({
    plan: '',
    status: 'active',
    nextBilling: '',
    amount: 0,
    currency: 'USD',
    paymentMethod: {
      type: '',
      last4: '',
      expiry: ''
    },
    invoices: []
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: {
      marketing: false,
      security: true,
      billing: true,
      updates: false,
      callAlerts: true
    },
    smsNotifications: {
      security: false,
      billing: false,
      callAlerts: false
    },
    pushNotifications: {
      enabled: false,
      callAlerts: false,
      systemAlerts: false
    }
  });

  // State for session management
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch fresh profile data from API when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Always fetch fresh user data from API instead of relying on localStorage
        const freshUserData = await authApi.getCurrentUser();
        if (freshUserData) {
          setProfile({
            name: freshUserData.name || '',
            phone_number: freshUserData.phone_number || null
          });
        }
      } catch (error) {
        console.error('Failed to fetch fresh profile data:', error);
        // Fallback to cached user data if API fails
        if (user) {
          setProfile({
            name: user.name || '',
            phone_number: user.phone_number || null
          });
        }
      }
    };

    fetchProfileData();
  }, []); // Only run once when component mounts

  // Debug sessions data
  useEffect(() => {

    if (sessions.length > 0) {
      // Check if any session is marked as current
      const currentSessions = sessions.filter(s => s.is_current);
    }
  }, [sessions]);

  const revokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      // Call the API to revoke the session
      await authApi.revokeSession(parseInt(sessionId));
      
      // Refresh sessions to update the UI
      await refreshSessionsOnly();
      toast.success('Session revoked successfully');
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  };

  const revokeAllSessions = async () => {
    try {
      // Call the API to revoke all sessions
      await authApi.revokeAllSessions();
      
      // Refresh sessions to update the UI
      await refreshSessionsOnly();
      toast.success('All other sessions revoked successfully');
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      toast.error('Failed to revoke all sessions');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!profile.name.trim()) {
        toast.error('Name is required');
        setIsSubmitting(false);
        return;
      }

      if (!user?.id) {
        toast.error('User ID not found');
        setIsSubmitting(false);
        return;
      }

      // Prepare update data - only include fields that have values
      const updateData: { name?: string; phone_number?: string } = {
        name: profile.name.trim()
      };

      // Only include phone_number if it's not empty
      if (profile.phone_number && profile.phone_number.trim()) {
        updateData.phone_number = profile.phone_number.trim();
      }

      // Call the API to update user
      const updatedUser = await authApi.updateUser(user.id, updateData);
      
      // Update local profile state with the fresh data from API
      setProfile({
        name: updatedUser.name || '',
        phone_number: updatedUser.phone_number || null
      });
      
      // Also refresh user data in the auth context
      await refreshUserData();
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!passwordForm.currentPassword.trim()) {
      toast.error('Current password is required');
      return;
    }
    
    if (!passwordForm.newPassword.trim()) {
      toast.error('New password is required');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the API to change password
      const response = await authApi.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword
      });
      
      // Update security state
      setSecurity(prev => ({ ...prev, lastPasswordChange: new Date().toISOString() }));
      
      // Clear form
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Show success message
      toast.success(response.message || 'Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = () => {
    toast.success('Account deletion initiated. Check your email for confirmation.');
    setShowDeleteDialog(false);
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceInfo = (session: Session) => {
    // Extract device info from session data
    return session.user_agent || 'Unknown Device';
  };

  const getLocationInfo = (session: Session) => {
    // Extract location info from session data
    return session.ip_address || 'Unknown Location';
  };

  const getLastActiveTime = (session: Session) => {
    // Use created_at as last active time since that's what we have
    return session.created_at;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                          {(profile.name || user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{profile.name || user?.name || 'User'}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={profile.name || user?.name || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profile.phone_number || user?.phone_number || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        value={user?.organization?.name || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground">Organization cannot be changed</p>
                    </div>
                  </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }))}
                  />
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Change Password</h4>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>

                <p className="text-sm text-muted-foreground">
                  Last changed: {formatDate(security.lastPasswordChange)}
                </p>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Sessions
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshSessionsOnly}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 w-full">
                    <Loader text="Loading sessions..." />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions found
                  </div>
                ) : (
                  <div className="space-y-3">
                    
                    {sessions.map((session, index) => {
                      // If no session is marked as current, treat the most recent one as current
                      const isCurrentSession = session.is_current || (sessions.filter(s => s.is_current).length === 0 && index === 0);
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isCurrentSession ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div>
                              <p className="font-medium">{getDeviceInfo(session)}</p>
                              <p className="text-sm text-muted-foreground">
                                {getLocationInfo(session)} • {formatDate(getLastActiveTime(session))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {session.id} • Current: {isCurrentSession ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                          {isCurrentSession ? (
                            <Badge variant="outline">Current</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeSession(session.id.toString())}
                              disabled={revokingSession === session.id.toString()}
                            >
                              {revokingSession === session.id.toString() ? (
                                <Spinner className="w-4 h-4" />
                              ) : (
                                'Revoke'
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              {sessions.length > 1 && (
                <div className="px-6 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={revokeAllSessions}
                    className="text-red-600 hover:text-red-700"
                  >
                    Revoke All Other Sessions
                  </Button>
                </div>
              )}
            </Card>

            {/* API Keys */}
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {security.apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-sm font-mono text-muted-foreground">{apiKey.key}</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {formatDate(apiKey.created)} • Last used: {formatDate(apiKey.lastUsed)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyApiKey(apiKey.key.replace('***************', 'full_api_key_here'))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{billing.plan}</h3>
                    <p className="text-muted-foreground">
                      ${billing.amount}/{billing.currency} per month
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next billing: {formatDate(billing.nextBilling)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                    </Badge>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Change Plan
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {billing.paymentMethod.type} •••• {billing.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {billing.paymentMethod.expiry}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billing.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>${invoice.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications.emailNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-muted-foreground">
                        {key === 'marketing' && 'Product updates, tips, and promotional content'}
                        {key === 'security' && 'Security alerts and login notifications'}
                        {key === 'billing' && 'Billing updates and payment confirmations'}
                        {key === 'updates' && 'Feature announcements and system updates'}
                        {key === 'callAlerts' && 'Real-time call notifications and alerts'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({
                          ...prev,
                          emailNotifications: { ...prev.emailNotifications, [key]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  SMS Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications.smsNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-muted-foreground">
                        {key === 'security' && 'Critical security alerts via SMS'}
                        {key === 'billing' && 'Payment failures and billing issues'}
                        {key === 'callAlerts' && 'Urgent call notifications'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({
                          ...prev,
                          smsNotifications: { ...prev.smsNotifications, [key]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications.pushNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-sm text-muted-foreground">
                        {key === 'enabled' && 'Enable browser push notifications'}
                        {key === 'callAlerts' && 'Real-time call status updates'}
                        {key === 'systemAlerts' && 'System maintenance and downtime alerts'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({
                          ...prev,
                          pushNotifications: { ...prev.pushNotifications, [key]: checked }
                        }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="mdy">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme across the application</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-save drafts</p>
                      <p className="text-sm text-muted-foreground">Automatically save Agent configurations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Keyboard shortcuts</p>
                      <p className="text-sm text-muted-foreground">Enable keyboard shortcuts for quick actions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'danger':
        return (
          <div className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                    All your data, including call logs, agents, and settings will be permanently deleted.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>

                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <h3 className="font-medium text-yellow-800 mb-2">Export Data</h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    Download a copy of your data before deleting your account.
                  </p>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Liaplus AI
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Account Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight">Account Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account preferences and settings
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="w-full">
            <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
              {[
                { title: "Profile", value: "profile", icon: User },
                { title: "Security", value: "security", icon: Shield },
                { title: "Billing", value: "billing", icon: CreditCard },
                { title: "Notifications", value: "notifications", icon: Bell },
                { title: "Preferences", value: "preferences", icon: Settings },
                { title: "Danger Zone", value: "danger", icon: AlertTriangle },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value as 'profile' | 'security' | 'billing' | 'notifications')}
                  className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm ${
                    activeTab === tab.value
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </SidebarInset>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account 
              and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              To confirm deletion, please type <strong>DELETE</strong> below:
            </p>
            <Input placeholder="Type DELETE to confirm" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
