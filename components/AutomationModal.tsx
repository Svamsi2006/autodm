"use client";

import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { Automation, InstagramMediaItem } from "@/types";

interface AutomationModalProps {
  post: InstagramMediaItem | null;
  existingAutomation?: Automation;
  onClose: () => void;
  onSaved: (automation: Automation) => void;
  onDeleted: (postId: string) => void;
}

export default function AutomationModal({
  post,
  existingAutomation,
  onClose,
  onSaved,
  onDeleted,
}: AutomationModalProps) {
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [replyCommentText, setReplyCommentText] = useState("");
  const [buttonText, setButtonText] = useState("Send me the access");
  const [resourceUrl, setResourceUrl] = useState("");
  const [requireFollow, setRequireFollow] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    setError(null);
    if (existingAutomation) {
      setTriggerKeyword(existingAutomation.trigger_keyword);
      setReplyCommentText(existingAutomation.reply_comment_text ?? "");
      setButtonText(existingAutomation.button_text);
      setResourceUrl(existingAutomation.resource_url);
      setRequireFollow(existingAutomation.require_follow);
      setIsActive(existingAutomation.is_active);
    } else {
      setTriggerKeyword("ACCESS");
      setReplyCommentText("Just sent you a DM! Check your message requests.");
      setButtonText("Send me the access");
      setResourceUrl("");
      setRequireFollow(true);
      setIsActive(true);
    }
  }, [post, existingAutomation]);

  if (!post) return null;

  const thumbnail = post.thumbnail_url || post.media_url || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!post) return;

    setError(null);

    if (!triggerKeyword.trim()) {
      setError("Please enter a trigger keyword.");
      return;
    }

    if (!buttonText.trim() || buttonText.trim().length > 20) {
      setError("Button text must be between 1 and 20 characters.");
      return;
    }

    try {
      const parsed = new URL(resourceUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setError("Deliverable link must start with http:// or https://");
        return;
      }
    } catch {
      setError("Please enter a valid deliverable URL (e.g. https://...).");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          post_caption: post.caption ?? null,
          post_thumbnail: thumbnail,
          trigger_keyword: triggerKeyword.trim(),
          reply_comment_text: replyCommentText.trim() || null,
          button_text: buttonText.trim(),
          resource_url: resourceUrl.trim(),
          require_follow: requireFollow,
          is_active: isActive,
        }),
      });

      const json = (await response.json()) as {
        automation?: Automation;
        error?: string;
      };

      if (!response.ok || !json.automation) {
        setError(json.error || "Failed to save automation.");
        return;
      }

      onSaved(json.automation);
    } catch {
      setError("Network error while saving automation.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !existingAutomation) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/automations?post_id=${encodeURIComponent(post.id)}`,
        { method: "DELETE" }
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(json.error || "Failed to delete automation.");
        return;
      }
      onDeleted(post.id);
    } catch {
      setError("Network error while deleting automation.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="automation-modal-title"
    >
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="automation-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {existingAutomation ? "Edit Automation" : "Configure Automation"}
            </h2>
            <p className="text-xs text-slate-500">
              Media ID: <span className="font-mono">{post.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
        >
          {/* Post Preview */}
          <div className="mb-6 flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnail}
                  alt={post.caption?.slice(0, 40) || "Instagram post"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  No preview
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <p className="line-clamp-2 text-sm text-slate-700">
                {post.caption || "No caption on this post."}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                  {post.media_type}
                </span>
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View on Instagram
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Trigger Keyword */}
            <div>
              <label
                htmlFor="trigger_keyword"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Trigger Keyword <span className="text-rose-500">*</span>
              </label>
              <input
                id="trigger_keyword"
                type="text"
                value={triggerKeyword}
                onChange={(e) => setTriggerKeyword(e.target.value)}
                placeholder="ACCESS"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Case-insensitive. Separate multiple keywords with commas (e.g.{" "}
                <span className="font-mono">ACCESS, LINK</span>).
              </p>
            </div>

            {/* Public Comment Reply */}
            <div>
              <label
                htmlFor="reply_comment_text"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Public Comment Reply{" "}
                <span className="text-xs font-normal text-slate-400">
                  (optional)
                </span>
              </label>
              <input
                id="reply_comment_text"
                type="text"
                value={replyCommentText}
                onChange={(e) => setReplyCommentText(e.target.value)}
                placeholder="Check your DMs! 📩"
                maxLength={300}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Posted publicly as a reply under the user&apos;s comment. Leave
                blank to skip.
              </p>
            </div>

            {/* Button Text */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="button_text"
                  className="block text-sm font-medium text-slate-800"
                >
                  DM Button Text <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-xs ${
                    buttonText.length > 20 ? "text-rose-600" : "text-slate-400"
                  }`}
                >
                  {buttonText.length}/20
                </span>
              </div>
              <input
                id="button_text"
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Send me the access"
                maxLength={20}
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Sent in the initial Private Reply without raw links (max 20
                characters per Meta API).
              </p>
            </div>

            {/* Deliverable Link */}
            <div>
              <label
                htmlFor="resource_url"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Deliverable Link <span className="text-rose-500">*</span>
              </label>
              <input
                id="resource_url"
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://your-site.com/free-guide"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                Delivered via DM after the user clicks the button
                {requireFollow ? " and passes the follow check" : ""}.
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Require Follow Before Delivery
                    </p>
                    <p className="text-xs text-slate-500">
                      Verifies <span className="font-mono">is_user_follow_business</span>{" "}
                      before sending the link.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requireFollow}
                  onClick={() => setRequireFollow((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    requireFollow ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      requireFollow ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <Send className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Automation Active
                    </p>
                    <p className="text-xs text-slate-500">
                      Pause or resume comment-to-DM replies for this post.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    isActive ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Flow Preview */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                <MessageSquare className="h-3.5 w-3.5" />
                DM Flow Preview
              </div>
              <ol className="space-y-1.5 text-xs text-slate-600">
                <li>
                  1. Comment contains{" "}
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono font-medium text-slate-800 ring-1 ring-slate-200">
                    {triggerKeyword || "ACCESS"}
                  </span>{" "}
                  → sends Private Reply button{" "}
                  <span className="font-medium text-slate-800">
                    &ldquo;{buttonText || "Send me the access"}&rdquo;
                  </span>
                </li>
                <li>
                  2. User taps button →{" "}
                  {requireFollow
                    ? "checks follower status; non-followers get a 'Check Again' button"
                    : "immediately unlocks link"}
                </li>
                <li>
                  3. Delivers{" "}
                  <span className="font-mono text-indigo-700 underline">
                    {resourceUrl || "https://your-deliverable-link"}
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            {existingAutomation ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {existingAutomation ? "Update Automation" : "Save Automation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

