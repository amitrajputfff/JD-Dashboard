import React, { useState, useEffect, useCallback } from 'react';
import { campaignsApi } from '@/lib/api/campaigns';
import { CampaignDetails, CampaignContact } from '@/types/campaign';

interface UseCampaignDetailsParams {
  campaignId: string;
  contact_skip?: number;
  contact_limit?: number;
  enabled?: boolean; // Add option to disable API calls
}

interface UseCampaignDetailsReturn {
  campaign: CampaignDetails | null;
  contacts: CampaignContact[];
  totalContacts: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateContactPagination: (skip: number, limit: number) => void;
}

export const useCampaignDetails = (params: UseCampaignDetailsParams): UseCampaignDetailsReturn => {
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(params.enabled !== false);
  const [error, setError] = useState<string | null>(null);
  const [contactSkip, setContactSkip] = useState(params.contact_skip || 0);
  const [contactLimit, setContactLimit] = useState(params.contact_limit || 10);
  const hasInitialized = React.useRef(false);

  const fetchCampaignDetails = useCallback(async () => {
    if (!params.campaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await campaignsApi.getCampaign(params.campaignId, {
        contact_skip: contactSkip,
        contact_limit: contactLimit,
      });

      if (response.success && response.campaign) {
        setCampaign(response.campaign);
        setContacts(response.campaign.contacts?.data || []);
        setTotalContacts(response.campaign.contacts?.total || 0);
      } else {
        throw new Error('Failed to fetch campaign details');
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign details');
      setCampaign(null);
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  }, [params.campaignId, contactSkip, contactLimit]);

  const updateContactPagination = useCallback((skip: number, limit: number) => {
    setContactSkip(skip);
    setContactLimit(limit);
  }, []);

  useEffect(() => {
    if (params.enabled !== false && params.campaignId) {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
      }
      fetchCampaignDetails();
    } else if (params.enabled === false) {
      setLoading(false);
    }
  }, [params.enabled, params.campaignId, contactSkip, contactLimit, fetchCampaignDetails]);

  return {
    campaign,
    contacts,
    totalContacts,
    loading,
    error,
    refetch: fetchCampaignDetails,
    updateContactPagination,
  };
};

