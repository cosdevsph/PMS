import { useQuery } from '@tanstack/react-query';
import { clinicServicesApi } from '@/features/manage/services/clinic-services.api';
import type { ClinicService } from '@/features/manage/services/clinic-services.api';

interface UseAppointmentServicesParams {
  discipline?: string | null;
}

/**
 * Lightweight hook used inside AppointmentModal / AppointmentEditForm.
 * Fetches only active services for the appointment service picker.
 *
 * Uses React Query with the shared 'clinic-services' key — deduplicated
 * and cached across all components (including the billing invoice page).
 *
 * When `discipline` is provided, only services matching that discipline
 * are returned (matching the Patient Portal behavior).
 */
export const useAppointmentServices = (params?: UseAppointmentServicesParams) => {
  const discipline = params?.discipline ?? null;

  const { data, isLoading, error } = useQuery<ClinicService[]>({
    queryKey: discipline
      ? ['clinic-services', 'by-discipline', discipline]
      : ['clinic-services'],
    queryFn: async () => {
      if (discipline) {
        const data = await clinicServicesApi.getByDiscipline(discipline);
        return data.filter(s => s.is_active);
      }
      const data = await clinicServicesApi.list();
      return data.filter(s => s.is_active);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    throwOnError: false,
  });

  return {
    services: data ?? [],
    loading: isLoading,
    error: error ? 'Failed to load services.' : null,
  };
};