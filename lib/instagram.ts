import type { InstagramMediaItem } from "@/types";

const GRAPH_API_VERSION = "v20.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class InstagramConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InstagramConfigError";
  }
}

export class MetaGraphApiError extends Error {
  status: number;
  code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "MetaGraphApiError";
    this.status = status;
    this.code = code;
  }
}

function getPageAccessToken(): string {
  const token = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!token) {
    throw new InstagramConfigError(
      "Missing INSTAGRAM_PAGE_ACCESS_TOKEN environment variable."
    );
  }
  return token;
}

function getInstagramAccountId(): string {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!accountId) {
    throw new InstagramConfigError(
      "Missing INSTAGRAM_ACCOUNT_ID environment variable."
    );
  }
  return accountId;
}

async function graphFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getPageAccessToken();
  const url = `${GRAPH_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; code?: number };
  } & T;

  if (!response.ok || json.error) {
    throw new MetaGraphApiError(
      json.error?.message || `Meta Graph API error (${response.status})`,
      response.status,
      json.error?.code
    );
  }

  return json;
}

/**
 * Fetches recent posts/reels from the connected Instagram Business/Creator account.
 */
export async function fetchInstagramMedia(
  limit = 24
): Promise<InstagramMediaItem[]> {
  const accountId = getInstagramAccountId();
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink";
  const result = await graphFetch<{ data?: InstagramMediaItem[] }>(
    `/${encodeURIComponent(accountId)}/media?fields=${fields}&limit=${limit}`
  );

  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Sends a Private Reply to an Instagram comment using a Button Template
 * with a postback payload (no raw URLs in the initial message).
 */
export async function sendPrivateReply(
  commentId: string,
  buttonText: string,
  postId: string
): Promise<void> {
  const safeTitle = buttonText.trim().slice(0, 20) || "Send me the access";

  await graphFetch("/me/messages", {
    method: "POST",
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Hey! Thanks for commenting. Tap the button below to unlock your access 👇",
            buttons: [
              {
                type: "postback",
                title: safeTitle,
                payload: `CHECK_FOLLOW|${postId}`,
              },
            ],
          },
        },
      },
    }),
  });
}

/**
 * Optionally posts a public reply under the triggering Instagram comment.
 */
export async function replyToComment(
  commentId: string,
  message: string
): Promise<void> {
  await graphFetch(`/${encodeURIComponent(commentId)}/replies`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/**
 * Checks whether the Instagram user (by IGSID) follows the business account.
 */
export async function checkUserFollowsBusiness(
  igsid: string
): Promise<boolean> {
  const result = await graphFetch<{ is_user_follow_business?: boolean }>(
    `/${encodeURIComponent(igsid)}?fields=is_user_follow_business`
  );

  return Boolean(result.is_user_follow_business);
}

/**
 * Sends the final deliverable resource URL to the user's DM.
 */
export async function sendResourceMessage(
  igsid: string,
  resourceUrl: string
): Promise<void> {
  await graphFetch("/me/messages", {
    method: "POST",
    body: JSON.stringify({
      recipient: { id: igsid },
      message: {
        text: `Awesome, you're all set! Here is your requested link:\n${resourceUrl}`,
      },
    }),
  });
}

/**
 * Prompts a non-follower to follow the account and click "Check Again".
 */
export async function sendFollowPrompt(
  igsid: string,
  postId: string
): Promise<void> {
  await graphFetch("/me/messages", {
    method: "POST",
    body: JSON.stringify({
      recipient: { id: igsid },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "It looks like you haven't followed our account yet! Please follow us first, then tap 'Check Again' to unlock your link.",
            buttons: [
              {
                type: "postback",
                title: "Check Again",
                payload: `CHECK_FOLLOW|${postId}`,
              },
            ],
          },
        },
      },
    }),
  });
}

