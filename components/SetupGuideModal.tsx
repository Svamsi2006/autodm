"use client";

import React, { useState } from "react";
import { Check, Copy, Webhook, X } from "lucide-react";

interface SetupGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SetupGuideModal({
  open,
  onClose,
}: SetupGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-vercel-app.vercel.app";
  const webhookUrl = `${origin}/api/webhook`;

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure in restricted contexts
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Meta Webhook &amp; Env Setup
              </h2>
              <p className="text-xs text-slate-500">
                Connect Instagram Graph API &amp; Supabase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="mb-1.5 font-medium text-slate-800">
              1. Meta App Webhook Callback URL
            </p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              <span className="truncate">{webhookUrl}</span>
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Subscribe to <span className="font-mono">comments</span> and{" "}
              <span className="font-mono">messages</span> (messaging postbacks)
              with your <span className="font-mono">INSTAGRAM_VERIFY_TOKEN</span>.
            </p>
          </div>

          <div>
            <p className="mb-1.5 font-medium text-slate-800">
              2. Required Environment Variables
            </p>
            <ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
              <li>INSTAGRAM_PAGE_ACCESS_TOKEN</li>
              <li>INSTAGRAM_VERIFY_TOKEN</li>
              <li>INSTAGRAM_ACCOUNT_ID</li>
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>

          <div>
            <p className="mb-1 font-medium text-slate-800">
              3. Supabase Table Setup
            </p>
            <p className="text-xs text-slate-500">
              Run <span className="font-mono">supabase/schema.sql</span> in your
              Supabase SQL Editor to create the{" "}
              <span className="font-mono">automations</span> table.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

