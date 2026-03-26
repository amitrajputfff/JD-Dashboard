import { useState, useEffect, useCallback } from 'react';
import { supportApi } from '@/lib/api/support';
import { SupportTicket } from '@/types/support';

interface SupportTicketCounts {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface UseSupportTicketCountsReturn {
  counts: SupportTicketCounts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupportTicketCounts(): UseSupportTicketCountsReturn {
  const [counts, setCounts] = useState<SupportTicketCounts>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all tickets to calculate counts
      // We use a reasonable limit to get tickets for counting
      const response = await supportApi.getTickets({
        page: 1,
        limit: 100, // Reasonable limit to get tickets
      });

      const tickets = response.data || [];
      
      // Calculate counts by status
      const newCounts: SupportTicketCounts = {
        total: tickets.length,
        open: tickets.filter(ticket => ticket.status === 'open').length,
        in_progress: tickets.filter(ticket => ticket.status === 'in_progress').length,
        resolved: tickets.filter(ticket => ticket.status === 'resolved').length,
        closed: tickets.filter(ticket => ticket.status === 'closed').length,
      };

      setCounts(newCounts);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket counts');
      console.error('Failed to load support ticket counts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return {
    counts,
    loading,
    error,
    refetch: loadCounts,
  };
}
