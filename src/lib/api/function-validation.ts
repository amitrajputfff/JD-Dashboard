import { apiClient } from './client';
import { FunctionConfig, FunctionValidationResponse } from '@/types/assistant';

export const functionValidationApi = {
  validateFunction: async (functionConfig: FunctionConfig): Promise<FunctionValidationResponse> => {
    try {
      // Prepare the request body according to the API specification
      const requestBody = {
        url: functionConfig.url,
        name: functionConfig.name,
        method: functionConfig.method,
        schema: functionConfig.schema,
        headers: functionConfig.headers,
        body_format: functionConfig.body_format,
        custom_body: functionConfig.custom_body,
        description: functionConfig.description,
        query_params: functionConfig.query_params
      };

      const response = await apiClient.post<FunctionValidationResponse>(
        '/api/function-validation/validate',
        requestBody
      );

      return response;
    } catch (error: any) {
      console.error('Function validation error:', error);
      
      // Handle different error scenarios
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to validate function. Please try again.');
      }
    }
  }
};
