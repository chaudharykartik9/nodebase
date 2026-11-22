import { type NextRequest, NextResponse } from "next/server";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import { verifyWorkflowWebhook } from "@/lib/webhook-token";

const MAX_BODY_BYTES = 200_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Called by the Apps Script of a Google Form each time the form is submitted.
// Public route: it is protected by the secret `token` in the URL.
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");
    const token = url.searchParams.get("token");

    if (!workflowId || !token) {
      return NextResponse.json(
        { success: false, error: "Missing workflowId or token" },
        { status: 400 },
      );
    }

    if (!verifyWorkflowWebhook(workflowId, token)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook token" },
        { status: 401 },
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Request body is too large" },
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Body must be valid JSON" },
        { status: 400 },
      );
    }

    if (
      !isRecord(body) ||
      typeof body.formId !== "string" ||
      typeof body.responseId !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Missing formId or responseId" },
        { status: 400 },
      );
    }

    // Only workflows that actually have a Google Form trigger can be started.
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        nodes: {
          where: { type: NodeType.GOOGLE_FORM_TRIGGER },
          select: { id: true },
        },
      },
    });

    if (!workflow || workflow.nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 },
      );
    }

    const googleForm = {
      formId: body.formId,
      formTitle: typeof body.formTitle === "string" ? body.formTitle : "",
      responseId: body.responseId,
      timestamp: typeof body.timestamp === "string" ? body.timestamp : "",
      respondentEmail:
        typeof body.respondentEmail === "string" ? body.respondentEmail : "",
      responses: isRecord(body.responses) ? body.responses : {},
    };

    // The same response is only run once, even if Google delivers it twice.
    await sendWorkflowExecution(
      { workflowId, initialData: { googleForm } },
      `google-form:${workflowId}:${googleForm.responseId}`,
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Google Form webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
}
