import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  rightSidebarOpen: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Quick actions
  quickActionsVisible: boolean;
  
  // Modals and dialogs
  modals: {
    createAgent: boolean;
    editAgent: boolean;
    deleteAgent: boolean;
    batchCall: boolean;
    callPlayer: boolean;
    settings: boolean;
  };
  
  // Notifications
  notifications: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }[];
  
  // Dashboard customization
  dashboardLayout: {
    widgets: {
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      visible: boolean;
    }[];
  };
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  
  // Theme actions
  setTheme: (theme: UIState['theme']) => void;
  
  // Quick actions
  toggleQuickActions: () => void;
  
  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Dashboard layout actions
  updateWidgetPosition: (widgetId: string, position: { x: number; y: number }) => void;
  updateWidgetSize: (widgetId: string, size: { width: number; height: number }) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  resetDashboardLayout: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarCollapsed: false,
  rightSidebarOpen: false,
  theme: 'system',
  quickActionsVisible: true,
  modals: {
    createAgent: false,
    editAgent: false,
    deleteAgent: false,
    batchCall: false,
    callPlayer: false,
    settings: false,
  },
  notifications: [],
  dashboardLayout: {
    widgets: [
      { id: 'metrics-overview', type: 'metrics', position: { x: 0, y: 0 }, size: { width: 12, height: 2 }, visible: true },
      { id: 'call-trends', type: 'chart', position: { x: 0, y: 2 }, size: { width: 8, height: 4 }, visible: true },
      { id: 'agent-performance', type: 'table', position: { x: 8, y: 2 }, size: { width: 4, height: 4 }, visible: true },
      { id: 'recent-calls', type: 'list', position: { x: 0, y: 6 }, size: { width: 6, height: 4 }, visible: true },
      { id: 'active-campaigns', type: 'list', position: { x: 6, y: 6 }, size: { width: 6, height: 4 }, visible: true },
    ],
  },
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (set, _get) => ({
        ...initialState,

        // Sidebar actions
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebar'),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),

        toggleRightSidebar: () =>
          set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen }), false, 'toggleRightSidebar'),

        setRightSidebarOpen: (open) =>
          set({ rightSidebarOpen: open }, false, 'setRightSidebarOpen'),

        // Theme actions
        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),

        // Quick actions
        toggleQuickActions: () =>
          set((state) => ({ quickActionsVisible: !state.quickActionsVisible }), false, 'toggleQuickActions'),

        // Modal actions
        openModal: (modal) =>
          set((state) => ({ modals: { ...state.modals, [modal]: true } }), false, 'openModal'),

        closeModal: (modal) =>
          set((state) => ({ modals: { ...state.modals, [modal]: false } }), false, 'closeModal'),

        closeAllModals: () =>
          set((state) => ({ 
            modals: Object.keys(state.modals).reduce((acc, key) => ({ ...acc, [key]: false }), {} as UIState['modals'])
          }), false, 'closeAllModals'),

        // Notification actions
        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Date.now(),
                read: false,
              },
              ...state.notifications,
            ].slice(0, 50) // Keep only last 50 notifications
          }), false, 'addNotification'),

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
          }), false, 'removeNotification'),

        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            )
          }), false, 'markNotificationRead'),

        clearAllNotifications: () =>
          set({ notifications: [] }, false, 'clearAllNotifications'),

        // Dashboard layout actions
        updateWidgetPosition: (widgetId, position) =>
          set((state) => ({
            dashboardLayout: {
              ...state.dashboardLayout,
              widgets: state.dashboardLayout.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, position } : widget
              ),
            }
          }), false, 'updateWidgetPosition'),

        updateWidgetSize: (widgetId, size) =>
          set((state) => ({
            dashboardLayout: {
              ...state.dashboardLayout,
              widgets: state.dashboardLayout.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, size } : widget
              ),
            }
          }), false, 'updateWidgetSize'),

        toggleWidgetVisibility: (widgetId) =>
          set((state) => ({
            dashboardLayout: {
              ...state.dashboardLayout,
              widgets: state.dashboardLayout.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
              ),
            }
          }), false, 'toggleWidgetVisibility'),

        resetDashboardLayout: () =>
          set({ dashboardLayout: initialState.dashboardLayout }, false, 'resetDashboardLayout'),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          dashboardLayout: state.dashboardLayout,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);
