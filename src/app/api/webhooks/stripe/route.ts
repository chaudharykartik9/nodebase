import { type NextRequest, NextResponse } from "next/server";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";
import { verifyStripeSignature } from "@/lib/stripe-signature";
import { verifyWorkflowWebhook } from "@/lib/webhook-token";

// Stripe events can be large (they carry whole objects).
const MAX_BODY_BYTES = 1_000_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Called by Stripe for each event sent to this endpoint. Public route with two
// checks: the secret `token` in the URL (which workflow) and Stripe's own
// signature of the body (that the request really comes from Stripe).
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

    // Without the signing secret nothing can be verified, so refuse everything
    // instead of accepting unsigned events.
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "STRIPE_WEBHOOK_SECRET is not configured" },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Request body is too large" },
        { status: 413 },
      );
    }

    const signature = verifyStripeSignature(
      rawBody,
      request.headers.get("stripe-signature"),
      secret,
    );
    if (!signature.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid Stripe signature (${signature.reason})`,
        },
        { status: 400 },
      );
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Body must be valid JSON" },
        { status: 400 },
      );
    }

    if (
      !isRecord(event) ||
      typeof event.id !== "string" ||
      typeof event.type !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Not a Stripe event (missing id or type)" },
        { status: 400 },
      );
    }

    // Only workflows that actually have a Stripe trigger can be started.
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        nodes: {
          where: { type: NodeType.STRIPE_TRIGGER },
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

    const data = isRecord(event.data) ? event.data : {};
    const stripe = {
      eventId: event.id,
      eventType: event.type,
      // Seconds since 1970, as Stripe sends it.
      timestamp: typeof event.created === "number" ? event.created : null,
      livemode: event.livemode === true,
      account: typeof event.account === "string" ? event.account : "",
      // The object the event is about (a payment intent, a customer, ...).
      object: isRecord(data.object) ? data.object : {},
      raw: event,
    };

    // Stripe retries failed deliveries, and the same event id is only run once.
    await sendWorkflowExecution(
      { workflowId, initialData: { stripe } },
      `stripe:${workflowId}:${stripe.eventId}`,
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Stripe event" },
      { status: 500 },
    );
  }
}
