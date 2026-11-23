// Turns the error code that better-auth puts in `?error=` after a failed or
// cancelled social sign-in into a message people can understand.
const MESSAGES: Record<string, string> = {
  access_denied: "Sign-in was cancelled.",
  account_not_linked:
    "An account with this email already exists. Sign in with your email and password first.",
  unable_to_link_account:
    "This account could not be linked to your existing account.",
  email_not_found:
    "The provider did not share an email address. Make your email visible and try again.",
  unable_to_get_user_info: "Could not read your profile from the provider.",
  signup_disabled: "Sign-up with this provider is turned off.",
};

export const socialErrorMessage = (code: string): string =>
  MESSAGES[code] ?? "Sign-in with the provider failed. Please try again.";
