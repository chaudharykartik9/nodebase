import { NonRetriableError } from "inngest";
import ky, { HTTPError } from "ky";
import type {
  NodeExecutor,
  WorkflowContext,
} from "@/features/executions/types";
import { renderTemplate } from "../../lib/template";
import {
  checkWebhookUrl,
  getTestHosts,
  MESSAGE_PROVIDERS,
  type MessageProviderConfig,
} from "./providers";

type MessageNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

const REQUEST_TIMEOUT_MS = 15_000;

// Slack treats `<...>` and `&` in a message as special (links and pings such as
// `<!channel>`). Values that come from earlier nodes, for example an answer
// typed into a form, must not be able to use that. Only the values are changed,
// so the node's own message text can still use Slack formatting.
const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const mapStrings = (value: unknown, map: (text: string) => string): unknown => {
  if (typeof value === "string") return map(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStrings(item, map)]),
    );
  }
  return value;
};

// A short reason from the service's answer: Discord sends JSON with a
// `message`, Slack sends a plain word such as `invalid_token`. ky has already
// read the body and exposes it as `error.data`.
const describeBody = (body: unknown): string => {
  const text =
    typeof body === "string"
      ? body
      : body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "";
  return text.slice(0, 200).trim();
};

const shorten = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

// Builds the executor of one message node. Discord and Slack only differ in the
// accepted address and the shape of the request.
const createMessageExecutor = (
  provider: MessageProviderConfig,
): NodeExecutor<MessageNodeData> => {
  return async ({ data, nodeId, context, step }) => {
    const label = `${provider.label} node (${nodeId})`;

    // Configuration mistakes can never succeed on retry.
    if (!data.variableName) {
      throw new NonRetriableError(`${label}: Variable name not configured`);
    }
    const variableName = data.variableName;
    if (["__proto__", "constructor", "prototype"].includes(variableName)) {
      throw new NonRetriableError(
        `${label}: "${variableName}" is not a valid variable name`,
      );
    }
    if (!data.webhookUrl) {
      throw new NonRetriableError(`${label}: Webhook URL not configured`);
    }
    if (!data.content?.trim()) {
      throw new NonRetriableError(`${label}: Message not configured`);
    }

    // Checked again here, because the node data is only checked in the browser.
    const urlProblem = checkWebhookUrl(
      provider,
      data.webhookUrl,
      getTestHosts(),
    );
    if (urlProblem) {
      throw new NonRetriableError(`${label}: ${urlProblem}`);
    }
    const webhookUrl = data.webhookUrl;

    // Fill in {{variables}} from earlier nodes, outside the retried step.
    const templateContext: WorkflowContext =
      provider.id === "SLACK"
        ? (mapStrings(context, escapeSlack) as WorkflowContext)
        : context;
    const message = shorten(
      renderTemplate(data.content, templateContext, `${label} message`).trim(),
      provider.maxLength,
    );
    if (!message) {
      throw new NonRetriableError(
        `${label}: the message is empty after filling in the variables`,
      );
    }

    const username = provider.supportsUsername
      ? renderTemplate(data.username ?? "", context, `${label} username`)
          .trim()
          .slice(0, 80)
      : "";

    // Slack Incoming Webhooks take `text`. Discord takes `content`, and no
    // `@everyone` or role pings are allowed, even if a value contains them.
    const payload =
      provider.id === "SLACK"
        ? { text: message }
        : {
            content: message,
            ...(username ? { username } : {}),
            allowed_mentions: { parse: [] },
          };

    return await step.run(`${provider.id.toLowerCase()}-webhook`, async () => {
      try {
        // Inngest handles retries, so the HTTP client must not retry on its own.
        await ky.post(webhookUrl, {
          json: payload,
          retry: 0,
          timeout: REQUEST_TIMEOUT_MS,
        });
      } catch (error) {
        // The address contains the secret token of the webhook, and error
        // messages from ky include it. Only the status is reported, so the
        // token never ends up in run data or logs.
        if (error instanceof HTTPError) {
          const status = error.response.status;
          const detail = describeBody(error.data);
          const text = `${label}: ${provider.label} answered HTTP ${status}${detail ? ` (${detail})` : ""}`;
          // A wrong address or bad request fails the same way every time.
          // Rate limits and server errors are retried by Inngest.
          if (status >= 400 && status < 500 && status !== 429) {
            throw new NonRetriableError(text);
          }
          throw new Error(text);
        }
        throw new Error(
          `${label}: could not reach ${provider.label} (${error instanceof Error ? error.name : "network error"})`,
        );
      }

      return {
        ...context,
        [variableName]: { sent: true, message },
      };
    });
  };
};

export const discordExecutor = createMessageExecutor(MESSAGE_PROVIDERS.DISCORD);
export const slackExecutor = createMessageExecutor(MESSAGE_PROVIDERS.SLACK);
