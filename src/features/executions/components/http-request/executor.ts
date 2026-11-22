import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import type { NodeExecutor } from "@/features/executions/types";

type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  // Configuration mistakes can never succeed on retry.
  if (!data.endpoint) {
    throw new NonRetriableError(
      `HTTP Request node (${nodeId}): No endpoint configured`,
    );
  }

  if (!data.variableName) {
    throw new NonRetriableError(
      `HTTP Request node (${nodeId}): Variable name not configured`,
    );
  }
  const variableName = data.variableName;
  if (["__proto__", "constructor", "prototype"].includes(variableName)) {
    throw new NonRetriableError(
      `HTTP Request node (${nodeId}): "${variableName}" is not a valid variable name`,
    );
  }

  const endpoint = data.endpoint;
  const method = data.method || "GET";

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new NonRetriableError(
      `HTTP Request node (${nodeId}): "${endpoint}" is not a valid URL`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new NonRetriableError(
      `HTTP Request node (${nodeId}): only http and https URLs are allowed`,
    );
  }

  return await step.run("http-request", async () => {
    // Inngest handles retries, so the HTTP client must not retry on its own.
    const options: KyOptions = { method, retry: 0 };

    if (["POST", "PUT", "PATCH"].includes(method) && data.body) {
      options.body = data.body;
      options.headers = { "Content-Type": "application/json" };
    }

    const response = await ky(endpoint, options);
    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    // The result is stored under the node's variable name, so several HTTP
    // nodes in one workflow keep their own results.
    return {
      ...context,
      [variableName]: {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      },
    };
  });
};
