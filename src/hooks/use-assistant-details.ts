import { useState, useEffect, useCallback } from 'react';
import { AssistantDetails, UpdateAssistantRequest } from '@/lib/api/assistants';
import { mockAgents } from '@/lib/mock-data/agents';

// Build an AssistantDetails object from the mock agents array
function findMockAssistant(assistantId: string): AssistantDetails | null {
  const agent = mockAgents.find((a) => a.assistant_id === assistantId);
  if (!agent) return null;

  return {
    organization_id: agent.organization_id,
    name: agent.name,
    tags: agent.tags,
    category: agent.category,
    status: agent.status,
    language_id: agent.language_id,
    stt_model_id: agent.stt_model_id ?? 1,
    tts_model_id: agent.tts_model_id ?? 1,
    llm_model_id: agent.llm_model_id ?? 1,
    voice_id: agent.voice_id ?? 1,
    prompt: agent.prompt ?? '',
    speech_speed: typeof agent.speech_speed === 'string' ? parseFloat(agent.speech_speed) : (agent.speech_speed as number),
    pitch: agent.pitch,
    interruption_level: agent.interruption_level,
    cutoff_seconds: agent.cutoff_seconds,
    ideal_time_seconds: agent.ideal_time_seconds,
    call_end_text: agent.call_end_text ?? '',
    max_token: agent.max_token,
    temperature: typeof agent.temperature === 'string' ? parseFloat(agent.temperature) : (agent.temperature as number),
    memory_enabled: agent.memory_enabled,
    max_memory_retrieval: agent.max_memory_retrieval,
    initial_message: agent.initial_message,
    call_recording: agent.call_recording,
    barge_in: agent.barge_in,
    voice_activity_detection: agent.voice_activity_detection,
    noise_suppression: agent.noise_suppression,
    function_calling: agent.function_calling,
    functions: (agent.functions ?? []) as any[],
    max_call_duration: agent.max_call_duration,
    silence_timeout: agent.silence_timeout,
    is_transferable: agent.is_transferable,
    transfer_number: agent.transfer_number,
    description: agent.description,
    filler_message: agent.filler_message,
    function_filler_message: agent.function_filler_message,
    id: agent.id,
    assistant_id: agent.assistant_id,
    training_status: agent.training_status,
    logo_file_url: agent.logo_file_url,
    logo_file_type: agent.logo_file_type,
    logo_file_size: agent.logo_file_size,
    is_active: agent.is_active,
    is_deleted: agent.is_deleted,
    deleted_until: agent.deleted_until,
    created_at: agent.created_at,
    updated_at: agent.updated_at,
    calls_today: agent.calls_today,
    avg_duration: agent.avg_duration,
    last_active: agent.last_active ?? '',
  };
}

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
      const data = findMockAssistant(assistantId);
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
    refetch: fetchAssistant,
  };
};

export const useUpdateAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAssistant = useCallback(
    async (assistantId: string, data: UpdateAssistantRequest): Promise<AssistantDetails | null> => {
      setLoading(true);
      setError(null);

      try {
        const existing = findMockAssistant(assistantId);
        if (!existing) return null;

        // Return the merged result without actually mutating mock data
        const updated: AssistantDetails = { ...existing, ...data };
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update assistant');
        console.error('Error updating assistant:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateAssistant,
    loading,
    error,
  };
};

export const useAssistantOperations = (assistantId?: string) => {
  const { assistant, loading: fetchLoading, error: fetchError, refetch } = useAssistantDetails(assistantId);
  const { updateAssistant, loading: updateLoading, error: updateError } = useUpdateAssistant();

  const handleUpdate = useCallback(
    async (data: UpdateAssistantRequest): Promise<boolean> => {
      if (!assistantId) return false;

      const result = await updateAssistant(assistantId, data);
      if (result) {
        await refetch();
        return true;
      }
      return false;
    },
    [assistantId, updateAssistant, refetch]
  );

  return {
    assistant,
    loading: fetchLoading || updateLoading,
    error: fetchError || updateError,
    refetch,
    updateAssistant: handleUpdate,
  };
};
