import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import type { WorkflowContext } from "../types";

// A separate Handlebars instance, so helpers registered here never leak into
// other code that uses Handlebars.
const handlebars = Handlebars.create();

// {{json value}} turns a whole value into JSON text. Handy for request bodies.
handlebars.registerHelper("json", (value) => {
  try {
    return new Handlebars.SafeString(JSON.stringify(value, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to convert the value to JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

/**
 * Fills in {{variables}} in a text with values from the workflow context.
 *
 * - `{{myApi.httpResponse.data.id}}` reads a field from an earlier node.
 * - `{{json myApi.httpResponse.data}}` inserts a whole value as JSON.
 * - A variable that does not exist makes the node fail with a clear message,
 *   instead of silently becoming an empty text (for example `/users/` in a URL).
 * - Values are inserted as they are (no HTML escaping), because the text is a
 *   URL or JSON, not a web page.
 *
 * Mistakes in a template can never succeed on retry, so they are not retried.
 */
export const renderTemplate = (
  template: string,
  context: WorkflowContext,
  label: string,
): string => {
  try {
    return handlebars.compile(template, { noEscape: true, strict: true })(
      context,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Turn the two most common mistakes into a hint people can act on.
    let hint = "";
    if (message.includes("CLOSE_UNESCAPED")) {
      hint =
        " Hint: when a {{variable}} is directly followed by a closing brace, add a space, for example {{json value}} }.";
    } else if (/Cannot read propert|not defined in/.test(message)) {
      hint =
        " Hint: check the variable name, and that the node that creates it runs before this one.";
    }

    throw new NonRetriableError(`${label}: template error: ${message}${hint}`);
  }
};
