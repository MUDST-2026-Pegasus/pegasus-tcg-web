import { useQuery } from "@tanstack/react-query";
import { financeApi } from "./finance.api";

export const refundKeys = {
  mine: ["finance", "my-refunds"] as const,
};

/** Every refund of the signed-in buyer; one request shared by all order cards. */
export function useBuyerRefunds() {
  return useQuery({ queryKey: refundKeys.mine, queryFn: financeApi.myRefunds });
}
