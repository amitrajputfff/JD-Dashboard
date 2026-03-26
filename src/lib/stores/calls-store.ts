import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Call, CallFilters } from '@/types/call';

interface CallsState {
  calls: Call[];
  selectedCall: Call | null;
  isLoading: boolean;
  error: string | null;
  filters: CallFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  activeBatchCalls: {
    campaignId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    totalContacts: number;
    completedCalls: number;
  }[];
}

interface CallsActions {
  setCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (id: string, updates: Partial<Call>) => void;
  setSelectedCall: (call: Call | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<CallFilters>) => void;
  setPagination: (pagination: Partial<CallsState['pagination']>) => void;
  clearFilters: () => void;
  addBatchCall: (batchCall: CallsState['activeBatchCalls'][0]) => void;
  updateBatchCall: (campaignId: string, updates: Partial<CallsState['activeBatchCalls'][0]>) => void;
  removeBatchCall: (campaignId: string) => void;
  reset: () => void;
}

type CallsStore = CallsState & CallsActions;

const initialState: CallsState = {
  calls: [],
  selectedCall: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  activeBatchCalls: [],
};

export const useCallsStore = create<CallsStore>()(
  devtools(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, _get) => ({
      ...initialState,

      setCalls: (calls) => 
        set({ calls }, false, 'setCalls'),

      addCall: (call) => 
        set(
          (state) => ({ 
            calls: [call, ...state.calls],
            pagination: {
              ...state.pagination,
              total: state.pagination.total + 1,
            }
          }),
          false,
          'addCall'
        ),

      updateCall: (id, updates) =>
        set(
          (state) => ({
            calls: state.calls.map((call) =>
              call.id === id ? { ...call, ...updates } : call
            ),
            selectedCall: state.selectedCall?.id === id 
              ? { ...state.selectedCall, ...updates } 
              : state.selectedCall,
          }),
          false,
          'updateCall'
        ),

      setSelectedCall: (call) =>
        set({ selectedCall: call }, false, 'setSelectedCall'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      setFilters: (newFilters) =>
        set(
          (state) => ({ 
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 }
          }),
          false,
          'setFilters'
        ),

      setPagination: (newPagination) =>
        set(
          (state) => ({ 
            pagination: { ...state.pagination, ...newPagination } 
          }),
          false,
          'setPagination'
        ),

      clearFilters: () =>
        set(
          (state) => ({
            filters: {},
            pagination: { ...state.pagination, page: 1 }
          }),
          false,
          'clearFilters'
        ),

      addBatchCall: (batchCall) =>
        set(
          (state) => ({
            activeBatchCalls: [...state.activeBatchCalls, batchCall]
          }),
          false,
          'addBatchCall'
        ),

      updateBatchCall: (campaignId, updates) =>
        set(
          (state) => ({
            activeBatchCalls: state.activeBatchCalls.map((batch) =>
              batch.campaignId === campaignId ? { ...batch, ...updates } : batch
            )
          }),
          false,
          'updateBatchCall'
        ),

      removeBatchCall: (campaignId) =>
        set(
          (state) => ({
            activeBatchCalls: state.activeBatchCalls.filter(
              (batch) => batch.campaignId !== campaignId
            )
          }),
          false,
          'removeBatchCall'
        ),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'calls-store' }
  )
);
