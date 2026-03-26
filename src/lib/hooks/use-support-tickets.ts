import { useState, useEffect, useCallback } from 'react';
import { supportApi } from '@/lib/api/support';
import { SupportTicket, SupportTicketFilters, CreateSupportTicketRequest } from '@/types/support';
import { toast } from 'sonner';

interface UseSupportTicketsParams {
  page?: number;
  limit?: number;
  filters?: SupportTicketFilters;
  autoLoad?: boolean;
}

interface UseSupportTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  stats: any;
  loadTickets: () => Promise<void>;
  updateTicketStatus: (id: number, status: SupportTicket['status']) => Promise<void>;
  closeTicket: (id: number) => Promise<void>;
  reopenTicket: (id: number) => Promise<void>;
  // deleteTicket: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSupportTickets(params: UseSupportTicketsParams = {}): UseSupportTicketsReturn {
  const { page = 1, limit = 10, filters, autoLoad = true } = params;
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supportApi.getTickets({
        page,
        limit,
        filters
      });
      setTickets(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);



  const updateTicketStatus = useCallback(async (id: number, status: SupportTicket['status']) => {
    try {
      await supportApi.updateTicketStatus(id, status);
      toast.success('Ticket status updated successfully');
      await loadTickets();
    } catch (err: any) {
      toast.error('Failed to update ticket status');
    }
  }, [loadTickets]);

  const closeTicket = useCallback(async (id: number) => {
    try {
      await supportApi.closeTicket(id);
      toast.success('Ticket closed successfully');
      await loadTickets();
    } catch (err: any) {
      toast.error('Failed to close ticket');
    }
  }, [loadTickets]);

  const reopenTicket = useCallback(async (id: number) => {
    try {
      await supportApi.reopenTicket(id);
      toast.success('Ticket reopened successfully');
      await loadTickets();
    } catch (err: any) {
      toast.error('Failed to reopen ticket');
    }
  }, [loadTickets]);

  // const deleteTicket = useCallback(async (id: number) => {
  //   try {
  //     // Note: This would need to be implemented in the API
  //     // await supportApi.deleteTicket(id);
  //     toast.error('Delete functionality not yet implemented');
  //     throw new Error('Delete functionality not yet implemented');
  //   } catch (err: any) {
  //     toast.error('Failed to delete ticket');
  //     throw err;
  //   }
  // }, []);

  const refetch = useCallback(async () => {
    await loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (autoLoad) {
      loadTickets();
    }
  }, [loadTickets, autoLoad]);

  return {
    tickets,
    loading,
    error,
    totalPages,
    totalItems,
    stats,
    loadTickets,
    updateTicketStatus,
    closeTicket,
    reopenTicket,
    // deleteTicket,
    refetch,
  };
}

// Hook for individual ticket management
export function useSupportTicket(ticketId?: number) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await supportApi.getTicket(ticketId);
      setTicket(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket');
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const updateTicket = useCallback(async (data: Partial<CreateSupportTicketRequest>) => {
    if (!ticketId) return;
    try {
      setUpdating(true);
      const response = await supportApi.updateTicket(ticketId, data);
      setTicket(response.data);
      return response.data;
    } catch (err: any) {
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [ticketId]);

  const updateTicketStatus = useCallback(async (status: SupportTicket['status']) => {
    if (!ticketId) return;
    try {
      setUpdating(true);
      const response = await supportApi.updateTicketStatus(ticketId, status);
      setTicket(response.data);
    } catch (err: any) {
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [ticketId]);

  const closeTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setUpdating(true);
      const response = await supportApi.closeTicket(ticketId);
      setTicket(response.data);
    } catch (err: any) {
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [ticketId]);

  const reopenTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      setUpdating(true);
      const response = await supportApi.reopenTicket(ticketId);
      setTicket(response.data);
    } catch (err: any) {
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId, loadTicket]);

  return {
    ticket,
    loading,
    updating,
    error,
    loadTicket,
    updateTicket,
    updateTicketStatus,
    closeTicket,
    reopenTicket,
    refetch: loadTicket,
  };
} 