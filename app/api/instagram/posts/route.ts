import { NextResponse } from "next/server";
import {
  fetchInstagramMedia,
  InstagramConfigError,
  MetaGraphApiError,
} from "@/lib/instagram";

export const dynamic = "force-dynamic";

/**
 * GET /api/instagram/posts
 * Fetches recent posts/reels from the configured Instagram Business/Creator account.
 */
export async function GET() {
  try {
    const posts = await fetchInstagramMedia(24);
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    if (error instanceof InstagramConfigError) {
      return NextResponse.json(
        { error: error.message, code: "CONFIG_MISSING" },
        { status: 503 }
      );
    }

    if (error instanceof MetaGraphApiError) {
      return NextResponse.json(
        { error: error.message, code: "META_API_ERROR", metaCode: error.code },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    console.error("[API /instagram/posts] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Instagram posts." },
      { status: 500 }
    );
  }
}

