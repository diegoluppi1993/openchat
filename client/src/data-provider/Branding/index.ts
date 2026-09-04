import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService, MutationKeys, QueryKeys } from 'librechat-data-provider';
import type { TBrandingConfig } from 'librechat-data-provider';

export function useGetBrandingConfigQuery() {
  return useQuery<TBrandingConfig>([QueryKeys.branding], () => dataService.getBrandingConfig(), {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateBrandingConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation((branding: TBrandingConfig) => dataService.updateBrandingConfig(branding), {
    mutationKey: [MutationKeys.updateBranding],
    onSuccess: (branding) => {
      queryClient.setQueryData([QueryKeys.branding], branding);
      queryClient.invalidateQueries([QueryKeys.startupConfig]);
    },
  });
}

export function useResetBrandingConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation(() => dataService.resetBrandingConfig(), {
    mutationKey: [MutationKeys.resetBranding],
    onSuccess: () => {
      queryClient.setQueryData([QueryKeys.branding], {});
      queryClient.invalidateQueries([QueryKeys.startupConfig]);
    },
  });
}
