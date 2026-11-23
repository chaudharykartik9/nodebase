// Social sign-in (GitHub, Google). A provider is only turned on when both of
// its values exist in `.env`, so a provider that is not set up never breaks
// login and never shows a button that cannot work.
//
//   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
//
// The callback addresses to register at the provider are
// `<BETTER_AUTH_URL>/api/auth/callback/github` and `.../google`.

type ProviderConfig = { clientId: string; clientSecret: string };

const readProvider = (
  idName: string,
  secretName: string,
): ProviderConfig | undefined => {
  const clientId = process.env[idName]?.trim();
  const clientSecret = process.env[secretName]?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
};

// The `socialProviders` setting of better-auth: only the providers that are set up.
export const getSocialProviders = () => {
  const github = readProvider("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET");
  const google = readProvider("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");

  return {
    ...(github ? { github } : {}),
    ...(google ? { google } : {}),
  };
};

export type SocialProviderAvailability = { github: boolean; google: boolean };

// Which buttons the login and signup pages show. Only booleans leave the server.
export const getSocialProviderAvailability = (): SocialProviderAvailability => {
  const providers = getSocialProviders();
  return { github: !!providers.github, google: !!providers.google };
};
