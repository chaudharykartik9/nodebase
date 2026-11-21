import { useQuery } from "@tanstack/react-query";
import { BILLING_ENABLED } from "@/config/constants";
import { authClient } from "@/lib/auth-client";

export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    // Free mode: do not call Polar at all.
    enabled: BILLING_ENABLED,
    queryFn: async () => {
      const { data } = await authClient.customer.state();
      return data;
    },
  });
};

export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscription();

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0;

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  };
};
