// UI State and Component Types
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;
  searchQuery: string;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  trend?: TimeSeriesDataPoint[];
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  permissions?: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: FilterOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: unknown;
  description?: string;
  disabled?: boolean;
}

export interface Modal {
  id: string;
  title: string;
  isOpen: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  onClose?: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
  read: boolean;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  retry?: () => void;
}

export interface ViewState {
  view: 'list' | 'grid' | 'card' | 'table';
  density: 'compact' | 'normal' | 'comfortable';
  groupBy?: string;
  showFilters: boolean;
  showSearch: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'custom';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data?: unknown;
  config?: Record<string, unknown>;
  visible: boolean;
  refreshInterval?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  description?: string;
  shortcut?: string;
  category?: string;
  permissions?: string[];
}

export interface SearchResult {
  id: string;
  type: 'agent' | 'call' | 'contact' | 'document';
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
  relevance: number;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}
