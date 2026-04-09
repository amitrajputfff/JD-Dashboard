'use client';

import React, { useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { TextareaWithSuggestions } from '@/components/ui/textarea-with-suggestions';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Code, Zap, Shield, Plus, Minus, Trash2, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { InlineLoader } from '@/components/ui/loader';
import { FormSectionProps, FunctionConfig, FunctionValidationResponse } from '@/types/assistant';
import { functionValidationApi } from '@/lib/api/function-validation';
import { toast } from 'sonner';

export default function AdvancedSettingsSection({ control, watch, setValue }: FormSectionProps) {
  const functionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Validation state management
  const [validationStates, setValidationStates] = useState<Record<number, {
    isLoading: boolean;
    result: FunctionValidationResponse | null;
  }>>({});
  
  const watchedFunctionCalling = watch('function_calling') || false;
  const watchedFunctions = watch('functions') || [];

  // Function management helpers
  const addFunction = () => {
    const newFunction: FunctionConfig = {
      id: `func_${Date.now()}`,
      name: '',
      description: '',
      url: '',
      method: 'POST',
      headers: {},
      query_params: {},
      body_format: 'json',
      custom_body: '',
      schema: {}
    };
    setValue('functions', [...watchedFunctions, newFunction]);
    
    // Scroll to the newly added function after a short delay
    setTimeout(() => {
      const newIndex = watchedFunctions.length;
      const functionElement = functionRefs.current[newIndex];
      if (functionElement) {
        functionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const removeFunction = (index: number) => {
    const newFunctions = watchedFunctions.filter((_: any, i: number) => i !== index);
    setValue('functions', newFunctions);
  };

  const updateFunction = (index: number, field: keyof FunctionConfig, value: any) => {
    const newFunctions = [...watchedFunctions];
    newFunctions[index] = { ...newFunctions[index], [field]: value };
    setValue('functions', newFunctions);
  };

  const duplicateFunction = (index: number) => {
    const functionToDuplicate = { ...watchedFunctions[index] };
    functionToDuplicate.id = `func_${Date.now()}`;
    functionToDuplicate.name = `${functionToDuplicate.name} (Copy)`;
    setValue('functions', [...watchedFunctions, functionToDuplicate]);
    
    // Scroll to the newly duplicated function after a short delay
    setTimeout(() => {
      const newIndex = watchedFunctions.length;
      const functionElement = functionRefs.current[newIndex];
      if (functionElement) {
        functionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Helper functions for managing key-value pairs within a function
  const addHeader = (functionIndex: number) => {
    const func = watchedFunctions[functionIndex];
    const newHeaders = { ...func.headers, '': '' };
    updateFunction(functionIndex, 'headers', newHeaders);
  };

  const removeHeader = (functionIndex: number, key: string) => {
    const func = watchedFunctions[functionIndex];
    const { [key]: removed, ...rest } = func.headers;
    updateFunction(functionIndex, 'headers', rest);
  };

  const updateHeader = (functionIndex: number, oldKey: string, newKey: string, value: string) => {
    const func = watchedFunctions[functionIndex];
    const newHeaders = { ...func.headers };
    if (oldKey !== newKey && oldKey in newHeaders) {
      delete newHeaders[oldKey];
    }
    newHeaders[newKey] = value;
    updateFunction(functionIndex, 'headers', newHeaders);
  };

  const addQueryParam = (functionIndex: number) => {
    const func = watchedFunctions[functionIndex];
    const newParams = { ...func.query_params, '': '' };
    updateFunction(functionIndex, 'query_params', newParams);
  };

  const removeQueryParam = (functionIndex: number, key: string) => {
    const func = watchedFunctions[functionIndex];
    const { [key]: removed, ...rest } = func.query_params;
    updateFunction(functionIndex, 'query_params', rest);
  };

  const updateQueryParam = (functionIndex: number, oldKey: string, newKey: string, value: string) => {
    const func = watchedFunctions[functionIndex];
    const newParams = { ...func.query_params };
    if (oldKey !== newKey && oldKey in newParams) {
      delete newParams[oldKey];
    }
    newParams[newKey] = value;
    updateFunction(functionIndex, 'query_params', newParams);
  };


  // Function validation
  const validateFunction = async (index: number) => {
    const func = watchedFunctions[index];
    
    // Basic validation - check if required fields are filled
    if (!func.name || !func.url || !func.method) {
      toast.error('Function Validation', {
        description: 'Please fill in function name, URL, and method before validating.'
      });
      return;
    }

    // Set loading state
    setValidationStates(prev => ({
      ...prev,
      [index]: {
        isLoading: true,
        result: null
      }
    }));

    try {
      const result = await functionValidationApi.validateFunction(func);
      setValidationStates(prev => ({
        ...prev,
        [index]: {
          isLoading: false,
          result
        }
      }));

      // Show success toast
      if (result.is_valid) {
        toast.success('Function Validation', {
          description: `Function "${result.function_name}" is valid and ready to use.`
        });
      } else {
        toast.error('Function Validation Failed', {
          description: `Function "${result.function_name}" has validation errors. Check the details below.`
        });
      }
    } catch (error: any) {
      setValidationStates(prev => ({
        ...prev,
        [index]: {
          isLoading: false,
          result: null
        }
      }));

      // Show error toast
      toast.error('Validation Error', {
        description: error.message || 'Failed to validate function. Please try again.'
      });
    }
  };

  const clearValidationResult = (index: number) => {
    setValidationStates(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };





  return (
    <div className="space-y-6">

      {/* Gemini VAD Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-zinc-600" />
          <h4 className="text-sm font-medium text-zinc-900">Voice Sensitivity Settings</h4>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Controls how Gemini Live detects the start and end of speech.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Sensitivity */}
          <FormField
            control={control}
            name="gemini_start_sensitivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Start Sensitivity</FormLabel>
                <Select value={field.value || 'START_SENSITIVITY_LOW'} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sensitivity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="START_SENSITIVITY_LOW">Low — less likely to trigger on noise</SelectItem>
                    <SelectItem value="START_SENSITIVITY_MEDIUM">Medium</SelectItem>
                    <SelectItem value="START_SENSITIVITY_HIGH">High — triggers more easily</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How sensitive the VAD is to detecting the start of speech.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Sensitivity */}
          <FormField
            control={control}
            name="gemini_end_sensitivity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">End Sensitivity</FormLabel>
                <Select value={field.value || 'END_SENSITIVITY_HIGH'} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sensitivity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="END_SENSITIVITY_LOW">Low — waits longer before cutting off</SelectItem>
                    <SelectItem value="END_SENSITIVITY_MEDIUM">Medium</SelectItem>
                    <SelectItem value="END_SENSITIVITY_HIGH">High — cuts off quickly after speech ends</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>How quickly the VAD detects the end of speech.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Silence Duration */}
          <FormField
            control={control}
            name="gemini_silence_duration_ms"
            render={({ field }) => {
              const val = typeof field.value === 'number' ? field.value : 800;
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Silence Duration</FormLabel>
                    <span className="text-sm text-zinc-600">{val} ms</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={200}
                      max={3000}
                      step={100}
                      value={[val]}
                      onValueChange={(v) => field.onChange(v[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>Milliseconds of silence before the utterance is considered complete.</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Prefix Padding */}
          <FormField
            control={control}
            name="gemini_prefix_padding_ms"
            render={({ field }) => {
              const val = typeof field.value === 'number' ? field.value : 100;
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Prefix Padding</FormLabel>
                    <span className="text-sm text-zinc-600">{val} ms</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={500}
                      step={50}
                      value={[val]}
                      onValueChange={(v) => field.onChange(v[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>Audio buffer captured before speech starts (keeps the first syllable intact).</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      </div>


      {/* Function Calling */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-zinc-600" />
          <h4 className="text-sm font-medium text-zinc-900">Function Calling</h4>
        </div>

        <FormField
          control={control}
          name="function_calling"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Enable Function Calling
                </FormLabel>
                <FormDescription>
                  Allow the agent to call external functions and APIs
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {watchedFunctionCalling && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-zinc-900">Functions</h5>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFunction}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Function
              </Button>
            </div>

            {watchedFunctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-200 rounded-lg">
                <Code className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-500 mb-6">No functions configured yet</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFunction}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Function
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {watchedFunctions.map((func: FunctionConfig, index: number) => (
                  <Card 
                    key={func.id || index} 
                    ref={(el) => (functionRefs.current[index] = el)}
                    className="border shadow-sm"
                  >
                    <Collapsible defaultOpen={true}>
                      <CardHeader className="pb-3 px-4 py-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CollapsibleTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-gray-100 flex-shrink-0"
                              >
                                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]:rotate-[-90deg]" />
                              </Button>
                            </CollapsibleTrigger>
                            <CardTitle className="text-sm font-semibold truncate">
                              Function {index + 1}{func.name ? `: ${func.name}` : ''}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => validateFunction(index)}
                              disabled={validationStates[index]?.isLoading}
                              className="h-7 px-2 text-xs hover:bg-gray-100"
                              title="Validate function"
                            >
                              {validationStates[index]?.isLoading ? (
                                <InlineLoader size="sm" className="w-3 h-3" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                              <span className="ml-1 hidden sm:inline">Validate</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateFunction(index)}
                              className="h-7 w-7 p-0 hover:bg-gray-100"
                              title="Duplicate function"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFunction(index)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete function"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-6">
                        {/* Function Name & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700">Function Name</FormLabel>
                            <Input
                              placeholder="e.g., get_weather"
                              value={func.name || ''}
                              onChange={(e) => updateFunction(index, 'name', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700">Function Description</FormLabel>
                            <Input
                              placeholder="e.g., Get current weather data"
                              value={func.description || ''}
                              onChange={(e) => updateFunction(index, 'description', e.target.value)}
                              className="h-10"
                            />
                          </div>
                        </div>
              
              {/* Function URL */}
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium text-gray-700">Function URL</FormLabel>
                      <Input
                        placeholder="https://api.example.com/function"
                            value={func.url || ''}
                            onChange={(e) => updateFunction(index, 'url', e.target.value)}
                            className="h-10"
                      />
                          <FormDescription className="text-xs text-gray-500 mt-1">
                      The endpoint URL where the function will be called
                    </FormDescription>
                        </div>

                        {/* HTTP Method & Body Format (One Row) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700">HTTP Method</FormLabel>
                            <Select
                              value={func.method || 'POST'}
                              onValueChange={(value) => updateFunction(index, 'method', value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                          </div>
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium text-gray-700">Body Format</FormLabel>
                            <Select
                              value={func.body_format || 'json'}
                              onValueChange={(value) => updateFunction(index, 'body_format', value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="form-data">Form Data</SelectItem>
                        <SelectItem value="raw">Raw</SelectItem>
                      </SelectContent>
                    </Select>
                          </div>
                        </div>

              {/* Headers */}
                        <div className="space-y-3">
                <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium text-gray-700">Headers</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                              onClick={() => addHeader(index)}
                              className="flex items-center gap-2 h-8"
                  >
                              <Plus className="h-3 w-3" />
                    Add Header
                  </Button>
                </div>
                          <div className="space-y-3">
                            {Object.entries(func.headers || {}).map(([key, value], headerIndex) => (
                              <div key={headerIndex} className="flex gap-3 items-end">
                                <div className="flex-1 space-y-1">
                                  <label className="text-xs text-gray-500">Header name</label>
                      <Input
                                    placeholder="Content-Type"
                        value={key || ''}
                                    onChange={(e) => updateHeader(index, key, e.target.value, value as string)}
                                    className="h-9"
                      />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <label className="text-xs text-gray-500">Header value</label>
                      <Input
                                    placeholder="application/json"
                        value={(value as string) || ''}
                                    onChange={(e) => updateHeader(index, key, key, e.target.value)}
                                    className="h-9"
                      />
                                </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                                  onClick={() => removeHeader(index, key)}
                                  className="h-9 w-9 p-0 flex-shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                            {Object.keys(func.headers || {}).length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-500">No headers configured</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Add Header" to add custom headers</p>
                              </div>
                  )}
                </div>
              </div>

              {/* Query Parameters */}
                        <div className="space-y-3">
                <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium text-gray-700">Query Parameters</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                              onClick={() => addQueryParam(index)}
                              className="flex items-center gap-2 h-8"
                  >
                              <Plus className="h-3 w-3" />
                    Add Parameter
                  </Button>
                </div>
                          <div className="space-y-3">
                            {Object.entries(func.query_params || {}).map(([key, value], paramIndex) => (
                              <div key={paramIndex} className="flex gap-3 items-end">
                                <div className="flex-1 space-y-1">
                                  <label className="text-xs text-gray-500">Parameter name</label>
                      <Input
                                    placeholder="city"
                        value={key || ''}
                                    onChange={(e) => updateQueryParam(index, key, e.target.value, value as string)}
                                    className="h-9"
                      />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <label className="text-xs text-gray-500">Parameter value</label>
                      <Input
                                    placeholder="New York"
                        value={(value as string) || ''}
                                    onChange={(e) => updateQueryParam(index, key, key, e.target.value)}
                                    className="h-9"
                      />
                                </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                                  onClick={() => removeQueryParam(index, key)}
                                  className="h-9 w-9 p-0 flex-shrink-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                            {Object.keys(func.query_params || {}).length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-500">No query parameters configured</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Add Parameter" to add parameters</p>
                              </div>
                  )}
                </div>
              </div>

              {/* Custom Body */}
                        <div className="space-y-3">
                    <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium text-gray-700">Custom Body</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                              onClick={() => {
                                const exampleCustomBody = `{
  "param1": "{{param1}}",
  "param2": "{{param2}}",
  "param3": "{{param3}}",
  "created_at": "{{today}}",
  "phone": "{{caller_number}}"
}`;
                                updateFunction(index, 'custom_body', exampleCustomBody);
                              }}
                              className="h-8"
                      >
                        Use Example
                      </Button>
                    </div>
                      <TextareaWithSuggestions
                        placeholder="Enter custom body content... Type {{ to see variable suggestions"
                            className="min-h-24 font-mono text-sm resize-none"
                            value={func.custom_body || ''}
                            onChange={(e) => updateFunction(index, 'custom_body', e.target.value)}
                          />
                          <FormDescription className="text-xs text-gray-500">
                      Custom body content for the request (optional). Use {"{{"+"today}"} for current date and {"{{"+"caller_number}"} for caller's phone number.
                    </FormDescription>
                        </div>

              {/* Function Schema */}
                        <div className="space-y-3">
                    <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium text-gray-700">Function Schema (JSON)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                              onClick={() => {
                                const exampleSchema = {
                                  type: "object",
                                  required: ["param1", "param2", "param3"],
                                  properties: {
                                    param1: {
                                      type: "string",
                                      description: "Clear description for the LLM"
                                    },
                                    param2: {
                                      type: "string", 
                                      description: "Clear description for the LLM"
                                    },
                                    param3: {
                                      type: "string",
                                      description: "Clear description for the LLM"
                                    }
                                  }
                                };
                                const exampleCustomBody = `{
  "param1": "{{param1}}",
  "param2": "{{param2}}",
  "param3": "{{param3}}",
  "created_at": "{{today}}",
  "phone": "{{caller_number}}"
}`;
                                // Update both fields in a single state update to avoid race conditions
                                const newFunctions = [...watchedFunctions];
                                newFunctions[index] = { 
                                  ...newFunctions[index], 
                                  schema: exampleSchema,
                                  custom_body: exampleCustomBody
                                };
                                setValue('functions', newFunctions);
                              }}
                              className="h-8"
                      >
                        Use Example
                      </Button>
                    </div>
                          <div className="space-y-2">
                      <Textarea
                        placeholder="Enter your function schema in JSON format..."
                              className="min-h-48 font-mono text-sm resize-none"
                              value={typeof func.schema === 'object' ? JSON.stringify(func.schema, null, 2) : func.schema || ''}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  updateFunction(index, 'schema', parsed);
                                } catch {
                                  updateFunction(index, 'schema', e.target.value);
                                }
                              }}
                            />
                            <FormDescription className="text-xs text-gray-500">
                              Define the schema for this function with proper parameter types.
                    </FormDescription>
                          </div>

              {/* Schema Validation */}
                          {func.schema && (
                <div className="rounded-lg border p-3 bg-zinc-50">
                              <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Schema Status</span>
                  </div>
                  <div className="text-sm text-green-700">
                    {(() => {
                      try {
                                    if (typeof func.schema === 'object') {
                                      return "✓ Valid JSON schema";
                                    } else {
                                      JSON.parse(func.schema);
                        return "✓ Valid JSON schema";
                                    }
                      } catch {
                        return "✗ Invalid JSON - please check syntax";
                      }
                    })()}
                  </div>
                            </div>
                          )}

              {/* Function Validation Results */}
                          {validationStates[index] && (
                <div className="space-y-3">
                              <div className="flex items-center justify-between">
                    <h6 className="text-sm font-medium text-gray-700">Function Validation</h6>
                                {validationStates[index].result && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => clearValidationResult(index)}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                )}
                  </div>
                  
                  {/* Loading State */}
                  {validationStates[index].isLoading && (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
                      <InlineLoader size="sm" className="text-blue-600" />
                      <span className="text-sm text-blue-700">Validating function...</span>
                    </div>
                  )}


                  {/* Success State */}
                  {validationStates[index].result && (
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 p-3 border rounded-lg ${
                        validationStates[index].result?.is_valid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        {validationStates[index].result?.is_valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          validationStates[index].result?.is_valid 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                          {validationStates[index].result?.is_valid 
                            ? 'Function validation passed' 
                            : 'Function validation failed'
                          }
                        </span>
                      </div>

                      {/* Errors */}
                      {validationStates[index].result?.errors && validationStates[index].result.errors.length > 0 && (
                        <div className="space-y-1">
                          <h6 className="text-xs font-medium text-red-700">Errors:</h6>
                          {validationStates[index].result.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className="text-xs text-red-600 bg-red-50 p-2 rounded border-l-2 border-red-300">
                              • {typeof error === 'object' && error?.message ? error.message : String(error)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Warnings */}
                      {validationStates[index].result?.warnings && validationStates[index].result.warnings.length > 0 && (
                        <div className="space-y-1">
                          <h6 className="text-xs font-medium text-yellow-700">Warnings:</h6>
                          {validationStates[index].result.warnings.map((warning, warningIndex) => (
                            <div key={warningIndex} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border-l-2 border-yellow-300">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              {typeof warning === 'object' && warning?.message ? warning.message : String(warning)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                          )}
                        </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
                </div>
              )}

              {/* Function Configuration Help */}
            {watchedFunctions.length > 0 && (
              <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Multiple Functions Configuration
                </h5>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Add multiple functions with unique names and descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Each function can have its own endpoint URL and HTTP settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Configure headers, query parameters, and body format per function</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Define function schema with proper parameter types for each function</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Click the chevron to collapse/expand functions for easier navigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>All functions will be available to your agent during conversations</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
