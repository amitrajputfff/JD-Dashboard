import { useState, useEffect, useCallback } from 'react';
import { assistantsApi, AssistantDetails, UpdateAssistantRequest } from '@/lib/api/assistants';

export const useAssistantDetails = (assistantId?: string) => {
  const [assistant, setAssistant] = useState<AssistantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssistant = useCallback(async () => {
    if (!assistantId) {
      setAssistant(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await assistantsApi.getAssistant(assistantId);
      setAssistant(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assistant details');
      console.error('Error fetching assistant details:', err);
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => {
    fetchAssistant();
  }, [fetchAssistant]);

  return {
    assistant,
    loading,
    error,
    refetch: fetchAssistant
  };
};

export const useUpdateAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAssistant = useCallback(async (assistantId: string, data: UpdateAssistantRequest): Promise<AssistantDetails | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedAssistant = await assistantsApi.updateAssistant(assistantId, data);
      return updatedAssistant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assistant');
      console.error('Error updating assistant:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateAssistant,
    loading,
    error
  };
};

export const useAssistantOperations = (assistantId?: string) => {
  const { assistant, loading: fetchLoading, error: fetchError, refetch } = useAssistantDetails(assistantId);
  const { updateAssistant, loading: updateLoading, error: updateError } = useUpdateAssistant();

  const handleUpdate = useCallback(async (data: UpdateAssistantRequest): Promise<boolean> => {
    if (!assistantId) return false;
    
    const result = await updateAssistant(assistantId, data);
    if (result) {
      // Refetch the assistant details after successful update
      await refetch();
      return true;
    }
    return false;
  }, [assistantId, updateAssistant, refetch]);

  return {
    assistant,
    loading: fetchLoading || updateLoading,
    error: fetchError || updateError,
    refetch,
    updateAssistant: handleUpdate
  };
};
