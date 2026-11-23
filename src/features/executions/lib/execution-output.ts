import type { Prisma } from "@/generated/prisma/client";

// The most text a stored output may have. A huge answer (for example a big
// HTTP response) would otherwise make the table grow without limit.
export const MAX_OUTPUT_CHARACTERS = 1_000_000;

/**
 * Turns what a workflow produced into something that can be stored as JSON.
 * Too large or not serialisable results are replaced by a short note, so the
 * run itself is never marked as failed just because its output cannot be saved.
 */
export const toStoredOutput = (context: unknown): Prisma.InputJsonValue => {
  let text: string | undefined;
  try {
    text = JSON.stringify(context);
  } catch {
    return { note: "The output could not be stored because it is not JSON." };
  }

  if (text === undefined) {
    return { note: "The workflow produced no output." };
  }

  if (text.length > MAX_OUTPUT_CHARACTERS) {
    return {
      note: `The output was too large to store (${text.length} characters, the limit is ${MAX_OUTPUT_CHARACTERS}).`,
    };
  }

  return JSON.parse(text) as Prisma.InputJsonValue;
};
