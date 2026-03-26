'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { templatesApi, AgentTemplateResponse } from '@/lib/api/templates';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Star,
  Clock,
  Download,
  ChevronRight,
  Play,
  CheckCircle,
  Sparkles,
  Filter,
  Eye,
  ArrowRight
} from 'lucide-react';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateSelectionDialog({ open, onOpenChange }: TemplateSelectionDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showFeatured, setShowFeatured] = useState(false);
  const [apiTemplates, setApiTemplates] = useState<AgentTemplateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch templates from API when dialog opens
  useEffect(() => {
    if (open && apiTemplates.length === 0) {
      const fetchTemplates = async () => {
        setIsLoading(true);
        try {
          const response = await templatesApi.getAllTemplates({ limit: 100 });
          setApiTemplates(response.templates);
        } catch (error) {
          console.error('Error fetching templates:', error);
          toast.error('Failed to load templates');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [open, apiTemplates.length]);

  // Filter API templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return apiTemplates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || template.level === selectedLevel;
      const matchesFeatured = !showFeatured || template.is_featured;

      return matchesSearch && matchesCategory && matchesLevel && matchesFeatured;
    });
  }, [apiTemplates, searchQuery, selectedCategory, selectedLevel, showFeatured]);

  const featuredTemplates = apiTemplates.filter(t => t.is_featured);

  // Get unique categories from API templates
  const categories = useMemo(() => {
    const uniqueCategories = new Set(apiTemplates.map(t => t.category));
    return Array.from(uniqueCategories);
  }, [apiTemplates]);

  // Get unique levels from API templates
  const levels = useMemo(() => {
    const uniqueLevels = new Set(apiTemplates.map(t => t.level));
    return Array.from(uniqueLevels);
  }, [apiTemplates]);

  const handleUseTemplate = (template: AgentTemplateResponse) => {
    router.push(`/agents/create?template=${template.template_id}`);
    onOpenChange(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setShowFeatured(false);
  };

  if (false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[800px] lg:!max-w-[900px] h-[85vh] flex flex-col">
          <div className="p-6 pb-4 border-b bg-muted/20 flex-shrink-0">
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <DialogTitle className="text-xl">{selectedTemplate.name}</DialogTitle>
                    <DialogDescription className="mt-1">{selectedTemplate.description}</DialogDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Back to Templates
                </Button>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Setup Time</span>
                  </div>
                  <p className="text-lg font-semibold">{selectedTemplate.estimatedSetupTime}</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Rating</span>
                  </div>
                  <p className="text-lg font-semibold">{selectedTemplate.metadata.rating}/5.0</p>
                  <p className="text-xs text-muted-foreground">({selectedTemplate.metadata.reviews} reviews)</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Downloads</span>
                  </div>
                  <p className="text-lg font-semibold">{selectedTemplate.metadata.downloads.toLocaleString()}</p>
                </Card>
              </div>

              {/* Use Case & Industries */}
              <div>
                <h3 className="font-semibold mb-2">Use Case</h3>
                <p className="text-muted-foreground">{selectedTemplate.useCase}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium">Industries:</span>
                  <div className="flex gap-1">
                    {selectedTemplate.industry.map(industry => (
                      <Badge key={industry} variant="outline" className="text-xs">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              {selectedTemplate.preview && (
                <div className="space-y-4">
                  {/* Sample Conversation */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Sample Conversation
                    </h3>
                    <Card className="p-4 bg-muted/30">
                      <div className="space-y-2">
                        {selectedTemplate.preview.sampleConversation.map((message, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              AI
                            </div>
                            <p className="text-sm italic">&ldquo;{message}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Key Features & Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-3">Key Features</h3>
                      <ul className="space-y-2">
                        {selectedTemplate.preview.keyFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Benefits</h3>
                      <ul className="space-y-2">
                        {selectedTemplate.preview.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div>
                <h3 className="font-semibold mb-3">Configuration Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">AI Configuration</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Provider:</strong> {selectedTemplate.configuration.provider}</div>
                      <div><strong>Model:</strong> {selectedTemplate.configuration.model}</div>
                      <div><strong>Temperature:</strong> {selectedTemplate.configuration.temperature}</div>
                      <div><strong>Max Tokens:</strong> {selectedTemplate.configuration.maxTokens}</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Voice Configuration</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>TTS Provider:</strong> {selectedTemplate.configuration.ttsProvider}</div>
                      <div><strong>Voice:</strong> {selectedTemplate.configuration.ttsVoice}</div>
                      <div><strong>Speaking Rate:</strong> {selectedTemplate.configuration.speakingRate}x</div>
                      <div><strong>Language:</strong> {selectedTemplate.configuration.language}</div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 pt-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(selectedTemplate.difficulty)}>
              {selectedTemplate.difficulty}
            </Badge>
            {selectedTemplate.featured && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Featured
              </Badge>
            )}
          </div>
          <Button onClick={() => handleUseTemplate(selectedTemplate)} className="flex items-center gap-2">
            Use This Template
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] w-full p-0 sm:!max-w-[800px] lg:!max-w-[900px] h-[85vh] flex flex-col">
        <div className="p-6 pb-4 border-b bg-muted/20 flex-shrink-0">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-xl">Choose an Agent Template</DialogTitle>
            <DialogDescription className="mt-1">
              Start with a pre-configured template to quickly create an AI agent for your specific use case
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant={showFeatured ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setShowFeatured(!showFeatured)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Featured
                </Button>

                {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' || showFeatured) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <Filter className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            
            {/* Templates */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No templates found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <>
                  {/* Featured Templates Section */}
                  {!searchQuery && selectedCategory === 'all' && selectedLevel === 'all' && !showFeatured && featuredTemplates.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Featured Templates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {featuredTemplates.slice(0, 3).map(template => (
                          <Card key={template.template_id} className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline">
                                      {template.level}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{template.estimated_setup_time}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" className="w-full" onClick={() => handleUseTemplate(template)}>
                                  Use Template
                                  <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Separator className="my-6" />
                    </div>
                  )}

                  {/* All Templates */}
                  <h3 className="font-semibold mb-3">
                    {showFeatured ? 'Featured Templates' : 'All Templates'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map(template => (
                      <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{template.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                            </div>
                            {template.is_featured && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Featured
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {template.level}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{template.estimated_setup_time}</span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button size="sm" className="w-full" onClick={() => handleUseTemplate(template)}>
                              Use Template
                              <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
