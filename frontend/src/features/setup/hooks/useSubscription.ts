import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  subscriptionApi,
  type ActivateMonthlyResponse,
  type SubscriptionStatusResponse,
} from '../services/subscription.api';

export const SUBSCRIPTION_QUERY_KEYS = {
  status: ['subscription', 'status'] as const,
};

const getErrorMessage = (error: any, fallback: string): string => {
  return error?.response?.data?.message || error?.response?.data?.detail || fallback;
};

export const useSubscriptionStatus = (enabled = true) => {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: SUBSCRIPTION_QUERY_KEYS.status,
    queryFn: subscriptionApi.getStatus,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
};

export const useActivateMonthlyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<ActivateMonthlyResponse, unknown, void>({
    mutationFn: subscriptionApi.activateMonthly,
    onSuccess: (data) => {
      toast.success(data?.message || 'Subscription activated successfully.');
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.status });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to activate monthly plan.'));
    },
  });
};

export const useSubscription = () => {
  const statusQuery = useSubscriptionStatus(true);
  const activateMutation = useActivateMonthlyPlan();

  return {
    subscription: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isFetching: statusQuery.isFetching,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refresh: statusQuery.refetch,
    activateMonthly: activateMutation.mutateAsync,
    isActivatingMonthly: activateMutation.isPending,
  };
};
