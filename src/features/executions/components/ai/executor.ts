import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, generateText, type LanguageModel } from "ai";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { renderTemplate } from "../../lib/template";
import {
  AI_PROVIDERS,
  type AiProviderConfig,
  type AiProviderId,
} from "./providers";

type AiNodeData = {
  variableName?: string;
  // A saved credential (see the Credentials page). Without one, the key from
  // `.env` is used.
  credentialId?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

const createModel = (
  providerId: AiProviderId,
  apiKey: string,
  modelId: string,
): LanguageModel => {
  switch (providerId) {
    case "GEMINI":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "OPENAI":
      return createOpenAI({ apiKey })(modelId);
    case "ANTHROPIC":
      return createAnthropic({ apiKey })(modelId);
  }
};

// The text of an answer. `step.ai.wrap` hands the result back as plain JSON, so
// the `text` shortcut of the AI SDK is gone and the text is read from the last
// step's content instead.
const readText = (result: unknown): string => {
  const steps = (result as { steps?: { content?: unknown[] }[] })?.steps;
  const content = steps?.at(-1)?.content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (part): part is { type: "text"; text: string } =>
          (part as { type?: string })?.type === "text",
      )
      .map((part) => part.text)
      .join("");
  }
  const text = (result as { text?: unknown })?.text;
  return typeof text === "string" ? text : "";
};

// Builds the executor of one AI node. The three providers only differ in the
// model and the API key, so they share all the other code.
const createAiExecutor = (
  provider: AiProviderConfig,
): NodeExecutor<AiNodeData> => {
  return async ({ data, nodeId, userId, context, step }) => {
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
    if (!data.userPrompt?.trim()) {
      throw new NonRetriableError(`${label}: User prompt not configured`);
    }

    let apiKey: string;
    if (data.credentialId) {
      const credentialId = data.credentialId;

      // Only the encrypted value is loaded inside the step, so Inngest never
      // stores the plain key. It is decrypted right here, only to make the call.
      const credential = await step.run("get-credential", async () => {
        const found = await prisma.credential.findUnique({
          // Scoped to the owner of the workflow, never to just the id.
          where: { id: credentialId, userId },
          select: { value: true, type: true },
        });
        return found;
      });

      if (!credential) {
        throw new NonRetriableError(
          `${label}: the selected credential was not found. It may have been deleted. Pick another one in the node settings.`,
        );
      }
      if (credential.type !== provider.id) {
        throw new NonRetriableError(
          `${label}: the selected credential is for another provider. Pick a ${provider.label} credential.`,
        );
      }

      try {
        apiKey = decrypt(credential.value);
      } catch (error) {
        throw new NonRetriableError(
          `${label}: ${error instanceof Error ? error.message : "could not read the credential"}`,
        );
      }
    } else {
      const envKey = process.env[provider.envVar];
      if (!envKey) {
        throw new NonRetriableError(
          `${label}: no credential selected and ${provider.envVar} is not set. Pick a credential in the node settings, or add the key to .env and restart the app.`,
        );
      }
      apiKey = envKey;
    }

    // Fill in {{variables}} from earlier nodes, outside the retried step.
    const system = data.systemPrompt?.trim()
      ? renderTemplate(data.systemPrompt, context, `${label} system prompt`)
      : undefined;
    const prompt = renderTemplate(
      data.userPrompt,
      context,
      `${label} user prompt`,
    );
    const modelId = data.model?.trim() || provider.defaultModel;

    // A wrong key, an unknown model or a bad request fails the same way every
    // time, so those are not retried. Rate limits and server errors are retried
    // by Inngest. This is decided inside the step, because Inngest hands step
    // errors back as plain errors, so the type of the error is lost outside.
    const generate = async (options: Parameters<typeof generateText>[0]) => {
      try {
        return await generateText(options);
      } catch (error) {
        if (APICallError.isInstance(error) && !error.isRetryable) {
          throw new NonRetriableError(
            `${label}: ${error.message}${error.statusCode ? ` (HTTP ${error.statusCode})` : ""}`,
          );
        }
        throw error;
      }
    };

    const result = await step.ai.wrap(
      `${provider.id.toLowerCase()}-generate-text`,
      generate,
      {
        model: createModel(provider.id, apiKey, modelId),
        system,
        prompt,
        maxOutputTokens: provider.maxOutputTokens,
        // Lets Sentry's Vercel AI integration record the prompt and the answer.
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      },
    );

    const text = readText(result);
    if (!text) {
      throw new NonRetriableError(`${label}: the model returned no text`);
    }

    return {
      ...context,
      [variableName]: { text },
    };
  };
};

export const geminiExecutor = createAiExecutor(AI_PROVIDERS.GEMINI);
export const openAiExecutor = createAiExecutor(AI_PROVIDERS.OPENAI);
export const anthropicExecutor = createAiExecutor(AI_PROVIDERS.ANTHROPIC);
