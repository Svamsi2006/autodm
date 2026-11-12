import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  checkUserFollowsBusiness,
  replyToComment,
  sendFollowPrompt,
  sendPrivateReply,
  sendResourceMessage,
} from "@/lib/instagram";
import { matchesTriggerKeyword } from "@/lib/validation";
import type {
  Automation,
  MetaCommentChangeValue,
  MetaMessagingEvent,
  MetaWebhookPayload,
} from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhook
 * Meta Webhook Challenge Verification.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;

  if (!expectedVerifyToken) {
    console.error("[Webhook] INSTAGRAM_VERIFY_TOKEN is not configured.");
    return NextResponse.json(
      { error: "Webhook verification token is not configured." },
      { status: 500 }
    );
  }

  if (mode === "subscribe" && token === expectedVerifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/webhook
 * Immediately acknowledges Meta webhook with HTTP 200 and processes events
 * asynchronously using Vercel's waitUntil().
 */
export async function POST(request: NextRequest) {
  let payload: MetaWebhookPayload;

  try {
    payload = (await request.json()) as MetaWebhookPayload;
    console.log("=== INCOMING WEBHOOK DATA ===", JSON.stringify(payload, null, 2));
  } catch {
    console.error("=== INCOMING WEBHOOK ERROR: INVALID JSON ===");
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  waitUntil(processWebhookPayload(payload));

  return new Response("EVENT_RECEIVED", { status: 200 });
}

async function processWebhookPayload(
  payload: MetaWebhookPayload
): Promise<void> {
  try {
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change.field === "comments" && change.value) {
          await handleCommentEvent(change.value);
        }
      }

      const messagingEvents = Array.isArray(entry.messaging)
        ? entry.messaging
        : [];
      for (const event of messagingEvents) {
        if (event.postback) {
          await handlePostbackEvent(event);
        }
      }
    }
  } catch (error) {
    console.error("[Webhook] Unhandled background processing error:", error);
  }
}

async function handleCommentEvent(
  value: MetaCommentChangeValue
): Promise<void> {
  const commentId = value.id?.trim();
  const commentText = value.text?.trim();
  const mediaId = value.media?.id?.trim();
  const commenterId = value.from?.id?.trim();

  if (!commentId || !commentText || !mediaId) {
    return;
  }

  // Prevent infinite loops if the business account itself replies to a comment
  if (
    process.env.INSTAGRAM_ACCOUNT_ID &&
    commenterId === process.env.INSTAGRAM_ACCOUNT_ID
  ) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("post_id", mediaId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[Webhook] Supabase lookup error (comment):", error.message);
    return;
  }

  const automation = data as Automation | null;
  if (!automation) {
    return;
  }

  if (!matchesTriggerKeyword(commentText, automation.trigger_keyword)) {
    return;
  }

  try {
    await sendPrivateReply(
      commentId,
      automation.button_text,
      automation.post_id
    );
  } catch (err) {
    console.error("[Webhook] Failed to send private reply:", err);
  }

  if (automation.reply_comment_text && automation.reply_comment_text.trim()) {
    try {
      await replyToComment(commentId, automation.reply_comment_text.trim());
    } catch (err) {
      console.error("[Webhook] Failed to send public comment reply:", err);
    }
  }
}

async function handlePostbackEvent(event: MetaMessagingEvent): Promise<void> {
  const igsid = event.sender?.id?.trim();
  const payload = event.postback?.payload?.trim();

  if (!igsid || !payload) {
    return;
  }

  if (!payload.startsWith("CHECK_FOLLOW|")) {
    return;
  }

  const postId = payload.slice("CHECK_FOLLOW|".length).trim();
  if (!postId) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    console.error("[Webhook] Supabase lookup error (postback):", error.message);
    return;
  }

  const automation = data as Automation | null;
  if (!automation || !automation.is_active) {
    return;
  }

  try {
    if (automation.require_follow) {
      const isFollowing = await checkUserFollowsBusiness(igsid);
      if (isFollowing) {
        await sendResourceMessage(igsid, automation.resource_url);
      } else {
        await sendFollowPrompt(igsid, automation.post_id);
      }
    } else {
      await sendResourceMessage(igsid, automation.resource_url);
    }
  } catch (err) {
    console.error("[Webhook] Failed to process postback response:", err);
  }
}

