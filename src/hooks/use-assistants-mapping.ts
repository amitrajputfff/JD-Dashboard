import { useState, useEffect, useCallback } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agent';

export interface UseAssistantsMappingOptions {
  organizationId: string;
  enabled?: boolean;
}

export interface UseAssistantsMappingReturn {
  assistants: Agent[];
  assistantsMap: Map<string, Agent>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAssistantsMapping(options: UseAssistantsMappingOptions): UseAssistantsMappingReturn {
  const { organizationId, enabled = true } = options;
  
  const [assistants, setAssistants] = useState<Agent[]>([]);
  const [assistantsMap, setAssistantsMap] = useState<Map<string, Agent>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssistants = useCallback(async () => {
    if (!enabled || !organizationId) {
      setAssistants([]);
      setAssistantsMap(new Map());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await agentsApi.getAgents({
        organization_id: organizationId,
        skip: 0,
        limit: 1000, // Get all assistants for mapping
        is_deleted: false,
      });

      setAssistants(response.assistants);
      
      // Create a map for quick lookup by assistant_id
      const map = new Map<string, Agent>();
      response.assistants.forEach(assistant => {
        if (assistant.assistant_id) {
          map.set(assistant.assistant_id, assistant);
        }
      });
      setAssistantsMap(map);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assistants';
      setError(errorMessage);
      console.error('Error fetching assistants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, enabled]);

  const refetch = useCallback(() => {
    return fetchAssistants();
  }, [fetchAssistants]);

  useEffect(() => {
    if (enabled && organizationId) {
      fetchAssistants();
    }
  }, [enabled, organizationId, fetchAssistants]);

  return {
    assistants,
    assistantsMap,
    isLoading,
    error,
    refetch,
  };
}
