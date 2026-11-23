import { NodeType } from "@/generated/prisma/enums";

// What differs between the Discord and Slack nodes. Everything else (dialog,
// node, executor) is shared. No server-only imports, so the browser can use it.
export type MessageProviderId = "DISCORD" | "SLACK";

export type MessageProviderConfig = {
  id: MessageProviderId;
  nodeType: NodeType;
  label: string;
  description: string;
  icon: string;
  // The only hosts and path a webhook URL may have. A node that posts to any
  // address could be used to reach internal services, so only the official
  // webhook addresses are accepted.
  hosts: string[];
  pathPrefix: string;
  urlPlaceholder: string;
  // The longest message the service accepts. Longer text is shortened.
  maxLength: number;
  // Discord can show another name for the bot. Slack Incoming Webhooks cannot.
  supportsUsername: boolean;
};

export const MESSAGE_PROVIDERS: Record<
  MessageProviderId,
  MessageProviderConfig
> = {
  DISCORD: {
    id: "DISCORD",
    nodeType: NodeType.DISCORD,
    label: "Discord",
    description: "Sends a message to a Discord channel",
    icon: "/discord.svg",
    hosts: [
      "discord.com",
      "ptb.discord.com",
      "canary.discord.com",
      "discordapp.com",
    ],
    pathPrefix: "/api/webhooks/",
    urlPlaceholder: "https://discord.com/api/webhooks/...",
    maxLength: 2000,
    supportsUsername: true,
  },
  SLACK: {
    id: "SLACK",
    nodeType: NodeType.SLACK,
    label: "Slack",
    description: "Sends a message to a Slack channel",
    icon: "/slack.svg",
    hosts: ["hooks.slack.com"],
    pathPrefix: "/services/",
    urlPlaceholder: "https://hooks.slack.com/services/...",
    maxLength: 40000,
    supportsUsername: false,
  },
};

// Hosts that are also accepted for testing against a local fake server. Set
// `WEBHOOK_TEST_HOSTS` (for example `127.0.0.1:4010`) only in a test setup.
export const getTestHosts = (): string[] =>
  (process.env.WEBHOOK_TEST_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

// Returns an error message, or null when the URL is acceptable.
export const checkWebhookUrl = (
  provider: MessageProviderConfig,
  value: string,
  testHosts: string[] = [],
): string | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter a valid URL";
  }

  const isTestHost = testHosts.includes(url.host);
  if (isTestHost) return null;

  if (url.protocol !== "https:") {
    return "The webhook URL must start with https://";
  }
  if (!provider.hosts.includes(url.hostname) || url.port) {
    return `Use the ${provider.label} webhook URL (${provider.urlPlaceholder})`;
  }
  if (!url.pathname.startsWith(provider.pathPrefix)) {
    return `Use the ${provider.label} webhook URL (${provider.urlPlaceholder})`;
  }
  return null;
};
