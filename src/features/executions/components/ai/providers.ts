import { NodeType } from "@/generated/prisma/enums";

// What differs between the AI nodes. Everything else (dialog, node, executor)
// is shared. This file has no SDK imports, so the browser can use it too.
export type AiProviderId = "GEMINI" | "OPENAI" | "ANTHROPIC";

export type AiProviderConfig = {
  id: AiProviderId;
  nodeType: NodeType;
  label: string;
  description: string;
  icon: string;
  // Name of the environment variable that holds the API key (read on the server).
  envVar: string;
  // Used when the node has no model set. The model can be changed per node.
  defaultModel: string;
  modelHint: string;
  // Anthropic needs an explicit limit; without one the SDK guesses from the
  // model id, which can be larger than a model allows. Others use their default.
  maxOutputTokens?: number;
};

export const AI_PROVIDERS: Record<AiProviderId, AiProviderConfig> = {
  GEMINI: {
    id: "GEMINI",
    nodeType: NodeType.GEMINI,
    label: "Gemini",
    description: "Uses Google Gemini to generate text",
    icon: "/gemini.svg",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
    defaultModel: "gemini-3.1-flash-lite",
    modelHint:
      "A Gemini model id your key can use, for example gemini-3.1-flash-lite",
  },
  OPENAI: {
    id: "OPENAI",
    nodeType: NodeType.OPENAI,
    label: "OpenAI",
    description: "Uses OpenAI to generate text",
    icon: "/openai.svg",
    envVar: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    modelHint: "An OpenAI model id your key can use, for example gpt-4o-mini",
  },
  ANTHROPIC: {
    id: "ANTHROPIC",
    nodeType: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Uses Anthropic Claude to generate text",
    icon: "/anthropic.svg",
    envVar: "ANTHROPIC_API_KEY",
    defaultModel: "claude-haiku-5-5",
    maxOutputTokens: 4096,
    modelHint:
      "A Claude model id your key can use, for example claude-haiku-5-5",
  },
};
