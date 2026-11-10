import { useState } from "react";
import { useAddresses } from "@/features/account/address.queries";

/**
 * Shipping address for checkout: the buyer's pick, else the default shipping address,
 * else the first one. Also holds whether the address picker is open.
 */
export function useCheckoutAddress() {
  const {
    data: addresses = [],
    isLoading: isAddressLoading,
    error: addressError,
    refetch: refetchAddresses,
  } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);

  const activeAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.find((address) => address.defaultShipping) ??
    addresses[0] ??
    null;

  return {
    addresses,
    isAddressLoading,
    addressError,
    refetchAddresses,
    activeAddress,
    setSelectedAddressId,
    addressPickerOpen,
    setAddressPickerOpen,
  };
}
