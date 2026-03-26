'use client';

import React, { useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { RouteGuard } from '@/components/route-guard';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePagination } from "@/hooks/use-pagination"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { withProvidersGuard } from '@/components/route-guard';
import { useProviders } from '@/hooks/use-providers';
import { Provider } from '@/types/provider';

// Use the Provider type from the API instead of custom interface

function PhoneProvidersPageContent() {
  const { providers, loading, error, refetch } = useProviders('phone_provider');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    service_type: 'phone_provider' as const,
    description: '',
    website: '',
    region: '',
    metadata_json: null as any,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      service_type: 'phone_provider',
      description: '',
      website: '',
      region: '',
      metadata_json: null,
      is_active: true
    });
  };

  const handleAdd = () => {
    resetForm();
    setEditingProvider(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (provider: Provider) => {
    setFormData({
      name: provider.name,
      display_name: provider.display_name,
      service_type: provider.service_type,
      description: provider.description || '',
      website: provider.website || '',
      region: provider.region,
      metadata_json: provider.metadata_json,
      is_active: provider.is_active
    });
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = (provider: Provider) => {
    // TODO: Implement actual delete API call
    toast.success(`${provider.display_name} deleted successfully`);
    refetch(); // Refresh the data after deletion
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual API calls for create/update
      if (editingProvider) {
        toast.success('Provider updated successfully');
      } else {
        toast.success('Provider added successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      refetch(); // Refresh the data after save
    } catch {
      toast.error('Failed to save provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="text-green-600 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getTypeBadge = (serviceType: string) => {
    const colors: Record<string, string> = {
      phone_provider: 'bg-blue-50 text-blue-700',
      telephony: 'bg-blue-50 text-blue-700',
      llm: 'bg-green-50 text-green-700',
      tts: 'bg-purple-50 text-purple-700',
      stt: 'bg-yellow-50 text-yellow-700'
    };
    
    return (
      <Badge variant="outline" className={colors[serviceType] || colors.phone_provider}>
        {serviceType.toUpperCase()}
      </Badge>
    );
  };

  // Remove country selection since it's not part of the Provider type

  // Pagination
  const {
    currentData: paginatedProviders,
    currentPage,
    totalPages,
    totalItems,
    goToPage
  } = usePagination({
    data: providers,
    itemsPerPage
  });

  // Handle page change with loading
  const handlePageChange = async (page: number) => {
    goToPage(page);
  };

  // Handle items per page change with loading
  const handleItemsPerPageChange = async (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <RouteGuard 
      permissions={['system.admin']} 
      requireAll={false}
      adminBypass={true}
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      }
    >
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
                    JustDial
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/providers">
                    Providers
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Telephont Providers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight">Telephony Providers</h1>
              <p className="text-sm text-muted-foreground">
                Manage your telephony provider configurations
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Telephony Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                // Skeleton loader for table
                <div className="space-y-3">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-20 rounded" />
                      <div className="flex space-x-1">
                        <Skeleton className="h-5 w-8 rounded" />
                        <Skeleton className="h-5 w-8 rounded" />
                        <Skeleton className="h-5 w-8 rounded" />
                      </div>
                      <Skeleton className="h-4 w-24 font-mono" />
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-5 w-12 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{provider.display_name}</TableCell>
                      <TableCell>{getTypeBadge(provider.service_type)}</TableCell>
                      <TableCell>{provider.region}</TableCell>
                      <TableCell>{getStatusBadge(provider.is_active)}</TableCell>
                      <TableCell>
                        {provider.website ? (
                          <a 
                            href={provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {provider.website}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(provider)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(provider)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 20, 50]}
            />
          )}
        </div>
      </SidebarInset>

      {/* Add/Edit Provider Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit Phone Provider' : 'Add Phone Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure your telephony provider settings
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., twilio"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="e.g., Twilio Primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provider description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://provider.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="e.g., us-east-1"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
    </RouteGuard>
  );
}

// Apply route protection to the page
const ProtectedPhoneProvidersPageContent = withProvidersGuard(PhoneProvidersPageContent);

export default function PhoneProvidersPage() {
  return <ProtectedPhoneProvidersPageContent />;
}
