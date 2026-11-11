import type { AutomationUpsertInput } from "@/types";

export interface ValidationResult {
  success: boolean;
  data?: AutomationUpsertInput;
  error?: string;
  fieldErrors?: Partial<Record<keyof AutomationUpsertInput, string>>;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes incoming automation creation/update payloads.
 */
export function validateAutomationInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { success: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;
  const fieldErrors: Partial<Record<keyof AutomationUpsertInput, string>> = {};

  const postId = typeof body.post_id === "string" ? body.post_id.trim() : "";
  if (!postId) {
    fieldErrors.post_id = "Instagram post ID is required.";
  }

  const triggerKeyword =
    typeof body.trigger_keyword === "string" ? body.trigger_keyword.trim() : "";
  if (!triggerKeyword) {
    fieldErrors.trigger_keyword = "Trigger keyword is required.";
  } else if (triggerKeyword.length > 100) {
    fieldErrors.trigger_keyword = "Trigger keyword must be 100 characters or fewer.";
  }

  const buttonText =
    typeof body.button_text === "string" ? body.button_text.trim() : "";
  if (!buttonText) {
    fieldErrors.button_text = "Button text is required.";
  } else if (buttonText.length > 20) {
    fieldErrors.button_text =
      "Instagram button titles must be 20 characters or fewer.";
  }

  const resourceUrl =
    typeof body.resource_url === "string" ? body.resource_url.trim() : "";
  if (!resourceUrl) {
    fieldErrors.resource_url = "Deliverable URL is required.";
  } else if (!isValidHttpUrl(resourceUrl)) {
    fieldErrors.resource_url =
      "Deliverable URL must be a valid http:// or https:// URL.";
  }

  const replyCommentText =
    typeof body.reply_comment_text === "string" &&
    body.reply_comment_text.trim().length > 0
      ? body.reply_comment_text.trim()
      : null;

  if (replyCommentText && replyCommentText.length > 300) {
    fieldErrors.reply_comment_text =
      "Public reply text must be 300 characters or fewer.";
  }

  const postCaption =
    typeof body.post_caption === "string" ? body.post_caption : null;
  const postThumbnail =
    typeof body.post_thumbnail === "string" ? body.post_thumbnail : null;

  const requireFollow =
    typeof body.require_follow === "boolean" ? body.require_follow : true;
  const isActive =
    typeof body.is_active === "boolean" ? body.is_active : true;

  if (Object.keys(fieldErrors).length > 0) {
    const firstError = Object.values(fieldErrors)[0] ?? "Validation failed.";
    return { success: false, error: firstError, fieldErrors };
  }

  return {
    success: true,
    data: {
      post_id: postId,
      post_caption: postCaption,
      post_thumbnail: postThumbnail,
      trigger_keyword: triggerKeyword,
      reply_comment_text: replyCommentText,
      button_text: buttonText,
      resource_url: resourceUrl,
      require_follow: requireFollow,
      is_active: isActive,
    },
  };
}

/**
 * Checks whether a comment contains the configured trigger keyword (case-insensitive).
 * Supports comma-separated keywords (e.g. "ACCESS, LINK").
 */
export function matchesTriggerKeyword(
  commentText: string,
  triggerKeyword: string
): boolean {
  const normalizedComment = commentText.toLowerCase();
  const keywords = triggerKeyword
    .split(",")
    .map((kw) => kw.trim().toLowerCase())
    .filter(Boolean);

  return keywords.some((kw) => normalizedComment.includes(kw));
}

