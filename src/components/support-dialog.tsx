'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InlineLoader } from '@/components/ui/loader';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { supportApi } from '@/lib/api/support';
import { CreateSupportTicketRequest } from '@/types/support';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  HelpCircle,
  Bug,
  AlertTriangle,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle,
  FileText,
  User,

  MapPin,
  Calendar,
  Zap,
  Shield,
  BookOpen,
  Video,
  MessageCircle,
  ExternalLink,
  Copy,

  ArrowRight
} from 'lucide-react';

const supportSchema = z.object({
  type: z.enum(['technical', 'bug', 'feature', 'question', 'account',  'issue' ]).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Please provide a detailed description (minimum 20 characters)'),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  browser: z.string().optional(),
  operatingSystem: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
}).refine((data) => data.type, {
  message: "Please select a ticket type",
  path: ["type"],
}).refine((data) => data.priority, {
  message: "Please select priority level",
  path: ["priority"],
});

type SupportFormData = z.infer<typeof supportSchema>;

interface SupportDialogProps {
  children: React.ReactNode;
}

const ticketTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600', description: 'Report a software bug or error' },
  { value: 'technical', label: 'Technical Issue', icon: AlertTriangle, color: 'text-orange-600', description: 'Technical problems or system issues' },
  { value: 'feature', label: 'Feature Request', icon: Zap, color: 'text-blue-600', description: 'Request new features or improvements' },
  { value: 'question', label: 'General Question', icon: MessageSquare, color: 'text-green-600', description: 'Ask questions about the platform' },
  { value: 'account', label: 'Account Issues', icon: User, color: 'text-purple-600', description: 'Account access or billing issues' },
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', description: 'Minor issues, cosmetic problems' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', description: 'Standard issues affecting workflow' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', description: 'Important issues blocking work' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', description: 'System down, data loss, security issues' },
];

const categories = [
  'AI Agents', 'Voice Configuration', 'Call Management', 'Dashboard', 'Analytics',
  'Phone Numbers', 'Providers', 'Authentication', 'Billing', 'Integrations', 'API', 'Other'
];

const contactMethods = [
  {
    method: 'Email Support',
    value: 'admin@justdial.com',
    icon: Mail,
    description: 'Get help via email',
    responseTime: '24-48 hours',
    availability: '24/7'
  },
  {
    method: 'Live Chat',
    value: 'Available in-app',
    icon: MessageCircle,
    description: 'Real-time chat support',
    responseTime: 'Immediate',
    availability: 'Mon-Fri 9AM-6PM PST'
  },
  {
    method: 'Phone Support',
    value: '+1 (555) 123-4567',
    icon: Phone,
    description: 'Direct phone assistance',
    responseTime: 'Immediate',
    availability: 'Mon-Fri 9AM-6PM PST'
  },
  {
    method: 'Video Call',
    value: 'Schedule via calendar',
    icon: Video,
    description: 'Screen sharing and demos',
    responseTime: 'Scheduled',
    availability: 'By appointment'
  }
];

const resources = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and API docs',
    icon: BookOpen,
    url: '/docs',
    type: 'internal'
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides',
    icon: Video,
    url: 'https://youtube.com/justdial',
    type: 'external'
  }
];

export function SupportDialog({ children }: SupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('ticket');

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      type: undefined,
      priority: undefined,
      subject: '',
      description: '',
      email: '',
      name: '',
      category: '',
      browser: '',
      operatingSystem: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
    },
  });

  const { handleSubmit, watch, reset, formState: { isValid } } = form;
  const watchedType = watch('type');

  const handleSubmitTicket = async (data: SupportFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!data.type || !data.priority) {
        throw new Error('Please select both ticket type and priority');
      }

      // Prepare the request data
      const requestData: CreateSupportTicketRequest = {
        type: data.type,
        name: data.name,
        email: data.email,
        priority: data.priority,
        category: data.category,
        subject: data.subject,
        description: data.description,
        system_config: {
          browser: data.browser,
          operating_system: data.operatingSystem,
          steps_to_reproduce: data.stepsToReproduce,
          expected_behavior: data.expectedBehavior,
          actual_behavior: data.actualBehavior,
        },
      };

      // Submit the ticket to the API
      const response = await supportApi.createTicket(requestData);
      
      // Backend returns the ticket data directly
      if (response && response.id) {
        const ticketId = response.id.toString();
        setGeneratedTicketId(ticketId);
        setTicketSubmitted(true);
        
        toast.success('Support ticket submitted successfully!', {
          description: `Ticket ID: ${ticketId}. We'll get back to you soon.`
        });
      } else {
        throw new Error('Failed to create ticket - invalid response format');
      }
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      
      // Extract more detailed error information
      let errorMessage = 'Failed to submit ticket';
      let errorDescription = 'Please try again or contact us directly.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.response?.data?.detail) {
        errorDescription = error.response.data.detail;
      } else if (error?.response?.status) {
        errorDescription = `HTTP ${error.response.status}: ${errorMessage}`;
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const resetForm = () => {
    setTicketSubmitted(false);
    setGeneratedTicketId('');
    reset();
  };

  const getBrowserInfo = () => {
    return navigator.userAgent;
  };

  const getSystemInfo = () => {
    return navigator.platform;
  };

  React.useEffect(() => {
    if (open) {
      form.setValue('browser', getBrowserInfo());
      form.setValue('operatingSystem', getSystemInfo());
    }
  }, [open, form]);

  if (ticketSubmitted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent 
          className="!max-w-[90vw] w-full p-0 sm:!max-w-[700px] lg:!max-w-[800px] max-h-[90vh] flex flex-col"
          showCloseButton={false}
        >
          <div className="p-6 pb-4 border-b bg-muted/20">
            <DialogHeader className="space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm">Ticket Submitted Successfully!</DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    Your support request has been received and is being processed
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
            <div className="space-y-8 pb-6">
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Ticket ID</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-lg font-mono font-bold bg-background px-3 py-1 rounded border">
                        {generatedTicketId}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedTicketId)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Please save this ticket ID for future reference
                  </p>
                </div>
              </CardContent>
            </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Response Time</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24-48 hours during business days
                  </p>
                </CardContent>
              </Card>

                <Card>
                  <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Email Updates</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You`&apos`ll receive updates via email as we work on your ticket
                  </p>
                </CardContent>
              </Card>
            </div>

              <div className="flex gap-4 pt-6">
                <Button onClick={resetForm} className="flex-1 text-xs h-8">
                  Submit Another Ticket
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 text-xs h-8">
                  Close
                </Button>
              </div>
            </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="!max-w-[90vw] w-full sm:!max-w-[900px] lg:!max-w-[1000px] max-h-[90vh] p-0 flex flex-col"
        showCloseButton={false}
      >
        <div className="p-6 pb-4 border-b bg-muted/20">
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
                <div>
                  <DialogTitle className="text-sm">Support Center</DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    Get help, report issues, or contact our support team
                  </DialogDescription>
                </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pb-8 flex-1 overflow-hidden">
          <div className="w-full text-sm">
            {/* Tab Headers */}
            <div className="flex flex-row items-center gap-3 justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-6">
              {[
                { title: "Submit Ticket", value: "ticket", icon: FileText },
                { title: "Contact Info", value: "contact", icon: Phone },
                { title: "Resources", value: "resources", icon: BookOpen },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`relative px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                    activeTab === tab.value
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  <span className="text-xs">{tab.title}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="w-full">
              {activeTab === 'ticket' && (
                <div className="overflow-y-auto pr-2 pl-1 pb-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div className="space-y-6">
                    <Form {...form}>
                      <div className="space-y-6">
                        {/* Ticket Type Selection */}
                        <div>
                    <FormLabel className="text-xs font-semibold">What can we help you with?</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                      {ticketTypes.map((type) => (
                        <FormField
                          key={type.value}
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <Card
                              className={`cursor-pointer transition-all ${
                                field.value === type.value
                                  ? 'ring-2 ring-primary border-primary'
                                  : 'hover:shadow-md'
                              }`}
                              onClick={() => field.onChange(type.value)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <type.icon className={`h-5 w-5 ${type.color}`} />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{type.label}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {type.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {watchedType && (
                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" className="text-xs h-8" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@company.com" className="text-xs h-8" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Priority Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select priority">
                                      {field.value && (
                                        <Badge variant="outline" className={priorityLevels.find(p => p.value === field.value)?.color}>
                                          {priorityLevels.find(p => p.value === field.value)?.label}
                                        </Badge>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {priorityLevels.map(priority => (
                                    <SelectItem key={priority.value} value={priority.value}>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className={priority.color}>
                                            {priority.label}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {priority.description}
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

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-xs h-8">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map(category => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of the issue" className="text-xs h-8" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Please provide a detailed description of your issue or request..."
                                className="min-h-[100px] text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Include as much detail as possible to help us resolve your issue quickly
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Bug-specific fields */}
                      {watchedType === 'bug' && (
                        <div className="space-y-4">
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-3">Bug Report Details</h4>
                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="stepsToReproduce"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Steps to Reproduce</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="1. Go to... &#10;2. Click on... &#10;3. See error"
                                        className="min-h-[80px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FormField
                                  control={form.control}
                                  name="expectedBehavior"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Expected Behavior</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="What should happen..."
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="actualBehavior"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Actual Behavior</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="What actually happens..."
                                          className="min-h-[80px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* System Information */}
                      <div className="space-y-4">
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3">System Information (Auto-detected)</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="browser"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Browser</FormLabel>
                                  <FormControl>
                                    <Input {...field} readOnly className="bg-muted text-muted-foreground" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="operatingSystem"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Operating System</FormLabel>
                                  <FormControl>
                                    <Input {...field} readOnly className="bg-muted text-muted-foreground" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                        <Button variant="outline" onClick={() => setOpen(false)} className="text-xs h-8">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmit(handleSubmitTicket)}
                          disabled={!isValid || isSubmitting}
                          className="text-xs h-8"
                        >
                          {isSubmitting ? (
                            <>
                              <InlineLoader size="sm" className="mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Ticket
                              <Send className="ml-2 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                      </div>
                    </Form>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="overflow-y-auto pr-2 pl-1 pb-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div>
                <h3 className="font-semibold text-lg mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactMethods.map((contact, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <contact.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{contact.method}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-mono truncate">{contact.value}</p>
                            {contact.method === 'Email Support' && (
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(contact.value)} className="h-6 w-6 p-0">
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
                            <span><strong>Response:</strong> {contact.responseTime}</span>
                            <span><strong>Available:</strong> {contact.availability}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

              <div>
                <h3 className="font-semibold text-lg mb-6">Office Information</h3>
                <Card>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Headquarters
                      </h4>
                      <address className="text-sm text-muted-foreground not-italic">
                        JustDial<br />
                        123 Innovation Drive<br />
                        San Francisco, CA 94105<br />
                        United States
                      </address>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Business Hours
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Monday - Friday: 9:00 AM - 6:00 PM PST</div>
                        <div>Saturday: 10:00 AM - 2:00 PM PST</div>
                        <div>Sunday: Closed</div>
                        <div className="mt-2 text-xs">
                          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30">
                            Email support available 24/7
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="overflow-y-auto pr-2 pl-1 pb-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div>
                <h3 className="font-semibold text-lg mb-6">Self-Help Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <resource.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{resource.title}</h4>
                            {resource.type === 'external' && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={() => {
                              if (resource.type === 'external') {
                                window.open(resource.url, '_blank');
                              } else {
                                window.location.href = resource.url;
                              }
                            }}
                          >
                            {resource.type === 'external' ? 'Visit' : 'View'}
                            {resource.type === 'external' ? (
                              <ExternalLink className="ml-1 h-3 w-3" />
                            ) : (
                              <ArrowRight className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

              <div>
                <h3 className="font-semibold text-lg mb-6">Quick Help</h3>
                <div className="space-y-3">
                <Card className="bg-muted/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">
                          Live Chat Available
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Get instant help during business hours. Look for the chat widget in the bottom right corner.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">
                          Schedule a Demo
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Book a personalized demo to learn more about JustDial features and capabilities.
                        </p>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Schedule Demo
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
