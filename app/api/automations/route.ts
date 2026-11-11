import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, SupabaseConfigError } from "@/lib/supabase";
import { validateAutomationInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/automations
 * Lists all saved post automations from Supabase.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ automations: data ?? [] }, { status: 200 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        { error: error.message, code: "CONFIG_MISSING" },
        { status: 503 }
      );
    }

    console.error("[API /automations GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automations
 * Creates or updates an automation keyed by unique post_id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateAutomationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          error: validation.error || "Invalid input.",
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("automations")
      .upsert(validation.data, { onConflict: "post_id" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ automation: data }, { status: 200 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        { error: error.message, code: "CONFIG_MISSING" },
        { status: 503 }
      );
    }

    console.error("[API /automations POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to save automation." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automations?post_id=...
 * Deletes an automation for a given post_id.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id")?.trim();

    if (!postId) {
      return NextResponse.json(
        { error: "post_id query parameter is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("automations")
      .delete()
      .eq("post_id", postId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        { error: error.message, code: "CONFIG_MISSING" },
        { status: 503 }
      );
    }

    console.error("[API /automations DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete automation." },
      { status: 500 }
    );
  }
}

