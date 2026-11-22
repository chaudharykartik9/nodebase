import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { renderTemplate } from "../../lib/template";

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
  const label = `HTTP Request node (${nodeId})`;

  // Configuration mistakes can never succeed on retry.
  if (!data.endpoint) {
    throw new NonRetriableError(`${label}: No endpoint configured`);
  }

  if (!data.variableName) {
    throw new NonRetriableError(`${label}: Variable name not configured`);
  }
  const variableName = data.variableName;
  if (["__proto__", "constructor", "prototype"].includes(variableName)) {
    throw new NonRetriableError(
      `${label}: "${variableName}" is not a valid variable name`,
    );
  }

  const method = data.method || "GET";

  // Fill in {{variables}} from earlier nodes. This happens before the request,
  // outside the retried step, so mistakes fail right away.
  const endpoint = renderTemplate(data.endpoint, context, `${label} endpoint`);

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new NonRetriableError(`${label}: "${endpoint}" is not a valid URL`);
  }
  // Checked after filling in the template, because a variable could change it.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new NonRetriableError(
      `${label}: only http and https URLs are allowed`,
    );
  }

  let body: string | undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    body = renderTemplate(data.body || "{}", context, `${label} body`);
    try {
      JSON.parse(body);
    } catch {
      throw new NonRetriableError(
        `${label}: the request body is not valid JSON after filling in the template. Use {{json variable}} to insert values safely.`,
      );
    }
  }

  return await step.run("http-request", async () => {
    // Inngest handles retries, so the HTTP client must not retry on its own.
    const options: KyOptions = { method, retry: 0 };

    if (body !== undefined) {
      options.body = body;
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
