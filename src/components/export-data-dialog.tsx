"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InlineLoader } from '@/components/ui/loader';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { exportApi } from '@/lib/api/export';
import { ExportDataRequest } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Download,
  CalendarIcon,
  FileText,
  Database,
} from 'lucide-react';

// Helper functions for date formatting and validation
function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

const exportSchema = z.object({
  format: z.enum(['pdf', 'csv'], {
    required_error: 'Please select a format',
  }),
  start_date: z.date({
    required_error: 'Please select a start date',
  }),
  end_date: z.date({
    required_error: 'Please select an end date',
  }),
});

type ExportFormData = z.infer<typeof exportSchema>;

interface ExportDataDialogProps {
  children?: React.ReactNode;
  defaultExportType?: 'assistants' | 'call_logs' | 'phone_numbers';
}

export function ExportDataDialog({ children, defaultExportType }: ExportDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: 'pdf',
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // Last day of current month
    },
  });

  const formatOptions = [
    {
      value: 'pdf' as const,
      label: 'PDF',
      description: 'Portable Document Format',
    },
    {
      value: 'csv' as const,
      label: 'CSV',
      description: 'Comma Separated Values',
    },
  ];

  const getExportTypeLabel = (type: string) => {
    switch (type) {
      case 'assistants':
        return 'Agents';
      case 'call_logs':
        return 'Call Logs';
      case 'phone_numbers':
        return 'Phone Numbers';
      default:
        return 'Data';
    }
  };

  const onSubmit = async (data: ExportFormData) => {
    if (!user?.organization_id) {
      toast.error('Organization ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const request: ExportDataRequest = {
        organization_id: user.organization_id,
        export_type: defaultExportType || 'assistants',
        format: data.format,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        include_relationships: true, // Always true
        include_metadata: true, // Always true
      };

      // Get the file content as blob from the API
      const blob = await exportApi.exportData(request);
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${defaultExportType || 'agents'}_${format(new Date(), 'yyyy-MM-dd')}.${data.format}`;
      link.style.display = 'none';
      
      // Add to DOM, click, and clean up safely
      document.body.appendChild(link);
      link.click();
      
      // Clean up with error handling
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      } catch (error) {
        console.warn('Could not remove download link:', error);
      }
      
      // Revoke the blob URL
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully!');
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export {getExportTypeLabel(defaultExportType || 'assistants')}
          </DialogTitle>
          <DialogDescription>
            Export your {getExportTypeLabel(defaultExportType || 'assistants').toLowerCase()} data for the selected date range.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Format Selection */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format">
                          {field.value && formatOptions.find(option => option.value === field.value)?.label}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => {
                  const [open, setOpen] = React.useState(false);
                  const [month, setMonth] = React.useState<Date | undefined>(field.value);
                  const [value, setValue] = React.useState(formatDate(field.value));

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel htmlFor="start-date" className="px-1">
                        Start Date
                      </FormLabel>
                      <div className="relative flex gap-2">
                        <Input
                          id="start-date"
                          value={value}
                          placeholder="June 01, 2025"
                          className="bg-background pr-10"
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            setValue(e.target.value);
                            if (isValidDate(date)) {
                              field.onChange(date);
                              setMonth(date);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setOpen(true);
                            }
                          }}
                        />
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              id="start-date-picker"
                              variant="ghost"
                              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                            >
                              <CalendarIcon className="size-3.5" />
                              <span className="sr-only">Select start date</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              captionLayout="dropdown"
                              month={month}
                              onMonthChange={setMonth}
                              onSelect={(date) => {
                                field.onChange(date);
                                setValue(formatDate(date));
                                setOpen(false);
                              }}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => {
                  const [open, setOpen] = React.useState(false);
                  const [month, setMonth] = React.useState<Date | undefined>(field.value);
                  const [value, setValue] = React.useState(formatDate(field.value));

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel htmlFor="end-date" className="px-1">
                        End Date
                      </FormLabel>
                      <div className="relative flex gap-2">
                        <Input
                          id="end-date"
                          value={value}
                          placeholder="June 01, 2025"
                          className="bg-background pr-10"
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            setValue(e.target.value);
                            if (isValidDate(date)) {
                              field.onChange(date);
                              setMonth(date);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setOpen(true);
                            }
                          }}
                        />
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              id="end-date-picker"
                              variant="ghost"
                              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                            >
                              <CalendarIcon className="size-3.5" />
                              <span className="sr-only">Select end date</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              captionLayout="dropdown"
                              month={month}
                              onMonthChange={setMonth}
                              onSelect={(date) => {
                                field.onChange(date);
                                setValue(formatDate(date));
                                setOpen(false);
                              }}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <InlineLoader size="sm" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export {getExportTypeLabel(defaultExportType || 'assistants')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
