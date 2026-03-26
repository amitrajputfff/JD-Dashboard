import { ExportDataRequest } from '@/types/api';
import { authStorage } from '@/lib/auth-storage';

export const exportApi = {
  /**
   * Export data in the specified format
   * Returns a blob containing the file content (PDF/CSV)
   */
  exportData: async (request: ExportDataRequest): Promise<Blob> => {
    try {
      const token = authStorage.getAccessToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/export/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error: unknown) {
      console.error('Export data error:', error);
      throw error;
    }
  },
};
