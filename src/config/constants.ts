// Payments switch. While false, the app is free for every logged-in user:
// - premiumProcedure behaves like protectedProcedure (no subscription needed)
// - the sidebar hides "Upgrade to Pro" and "Billing Portal"
// Set to true to enforce the Polar "Pro" subscription again.
export const BILLING_ENABLED = true;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
};
