import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sellerKeys } from '../shared/seller.queries';
import { shopApi } from './shop.api';

export const shopKeys = { shipping: ['seller', 'shipping-options'] as const, listings: ['seller', 'shop-listings-count'] as const };
export function useShopSettings() {
  const client = useQueryClient();
  return useMutation({ mutationFn: shopApi.settings, onSuccess: (profile) => client.setQueryData(sellerKeys.profile(), profile) });
}
export function useShippingOptions() {
  return useQuery({ queryKey: shopKeys.shipping, queryFn: shopApi.shipping });
}
