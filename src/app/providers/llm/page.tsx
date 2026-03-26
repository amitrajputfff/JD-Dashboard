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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
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
  Brain,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useProviders } from '@/hooks/use-providers';
import { Provider } from '@/types/provider';
import { withProvidersGuard } from '@/components/route-guard';

function LLMProvidersPageContent() {
  const { providers, loading, error, refetch } = useProviders('llm');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    region: 'Global',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      region: 'Global',
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
      description: provider.description || '',
      website: provider.website || '',
      region: provider.region,
      is_active: provider.is_active
    });
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = (provider: Provider) => {
    // Note: This would need to be implemented with an actual delete API call
    toast.success(`${provider.name} deleted successfully`);
    refetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Note: This would need to be implemented with actual create/update API calls
      if (editingProvider) {
        toast.success('Provider updated successfully');
      } else {
        toast.success('Provider added successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      refetch();
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

  const getServiceTypeBadge = (serviceType: string) => {
    const colors: Record<string, string> = {
      llm: 'bg-blue-50 text-blue-700',
      tts: 'bg-green-50 text-green-700',
      stt: 'bg-purple-50 text-purple-700',
      telephony: 'bg-orange-50 text-orange-700'
    };
    
    return (
      <Badge variant="outline" className={colors[serviceType] || 'bg-gray-50 text-gray-700'}>
        {serviceType.toUpperCase()}
      </Badge>
    );
  };

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

  // Handle page change
  const handlePageChange = async (page: number) => {
    goToPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = async (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
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
                  <BreadcrumbPage>LLM Providers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight">LLM Providers</h1>
              <p className="text-sm text-muted-foreground">
                Manage your Large Language Model provider configurations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading providers</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Large Language Model Providers
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
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.display_name}</TableCell>
                      <TableCell>{getServiceTypeBadge(provider.service_type)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {provider.description || 'No description'}
                      </TableCell>
                      <TableCell>{provider.region}</TableCell>
                      <TableCell>{getStatusBadge(provider.is_active)}</TableCell>
                      <TableCell>
                        {new Date(provider.created_at).toLocaleDateString()}
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
              {editingProvider ? 'Edit LLM Provider' : 'Add LLM Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure your Large Language Model provider settings
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., OpenAI GPT-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the provider..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://openai.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Global"
                />
              </div>
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
const ProtectedLLMProvidersPageContent = withProvidersGuard(LLMProvidersPageContent);

export default function LLMProvidersPage() {
  return <ProtectedLLMProvidersPageContent />;
}
