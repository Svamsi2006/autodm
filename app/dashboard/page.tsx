"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import AutomationModal from "@/components/AutomationModal";
import SetupGuideModal from "@/components/SetupGuideModal";
import type { Automation, InstagramMediaItem } from "@/types";

type FilterMode = "all" | "active" | "unconfigured";

export default function DashboardPage() {
  const [posts, setPosts] = useState<InstagramMediaItem[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [postsError, setPostsError] = useState<string | null>(null);
  const [automationsError, setAutomationsError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<InstagramMediaItem | null>(
    null
  );
  const [setupOpen, setSetupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPostsError(null);
    setAutomationsError(null);

    const [postsRes, automationsRes] = await Promise.allSettled([
      fetch("/api/instagram/posts", { cache: "no-store" }),
      fetch("/api/automations", { cache: "no-store" }),
    ]);

    if (postsRes.status === "fulfilled") {
      try {
        const json = (await postsRes.value.json()) as {
          posts?: InstagramMediaItem[];
          error?: string;
        };
        if (!postsRes.value.ok) {
          setPostsError(json.error || "Unable to fetch Instagram posts.");
          setPosts([]);
        } else {
          setPosts(json.posts ?? []);
        }
      } catch {
        setPostsError("Invalid response from Instagram posts endpoint.");
      }
    } else {
      setPostsError("Network error while fetching Instagram posts.");
    }

    if (automationsRes.status === "fulfilled") {
      try {
        const json = (await automationsRes.value.json()) as {
          automations?: Automation[];
          error?: string;
        };
        if (!automationsRes.value.ok) {
          setAutomationsError(
            json.error || "Unable to fetch automations from Supabase."
          );
          setAutomations([]);
        } else {
          setAutomations(json.automations ?? []);
        }
      } catch {
        setAutomationsError("Invalid response from automations endpoint.");
      }
    } else {
      setAutomationsError("Network error while fetching automations.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const automationByPostId = useMemo(() => {
    const map = new Map<string, Automation>();
    for (const item of automations) {
      map.set(item.post_id, item);
    }
    return map;
  }, [automations]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const auto = automationByPostId.get(post.id);

      if (filterMode === "active" && (!auto || !auto.is_active)) {
        return false;
      }
      if (filterMode === "unconfigured" && auto) {
        return false;
      }

      if (!q) return true;
      const caption = (post.caption ?? "").toLowerCase();
      const keyword = (auto?.trigger_keyword ?? "").toLowerCase();
      return (
        caption.includes(q) ||
        post.id.toLowerCase().includes(q) ||
        keyword.includes(q)
      );
    });
  }, [posts, automationByPostId, filterMode, searchQuery]);

  const activeCount = useMemo(
    () => automations.filter((a) => a.is_active).length,
    [automations]
  );

  const followGatedCount = useMemo(
    () => automations.filter((a) => a.is_active && a.require_follow).length,
    [automations]
  );

  function handleSaved(saved: Automation) {
    setAutomations((prev) => {
      const exists = prev.some((a) => a.post_id === saved.post_id);
      if (exists) {
        return prev.map((a) => (a.post_id === saved.post_id ? saved : a));
      }
      return [saved, ...prev];
    });
    setSelectedPost(null);
    showToast(`Saved automation for keyword "${saved.trigger_keyword}".`);
  }

  function handleDeleted(postId: string) {
    setAutomations((prev) => prev.filter((a) => a.post_id !== postId));
    setSelectedPost(null);
    showToast("Automation removed.");
  }

  function renderMediaIcon(mediaType: string) {
    if (mediaType === "VIDEO") {
      return <Film className="h-3.5 w-3.5" />;
    }
    if (mediaType === "CAROUSEL_ALBUM") {
      return <Layers className="h-3.5 w-3.5" />;
    }
    return <ImageIcon className="h-3.5 w-3.5" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                InstaFlow
              </h1>
              <p className="text-xs text-slate-500">
                Comment-to-DM Automation Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-sm"
            >
              <Webhook className="h-4 w-4 text-indigo-600" />
              Webhook &amp; Setup
            </button>
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 sm:text-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Posts
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Recent IG Media
              </span>
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "—" : posts.length}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Posts &amp; reels synced from Meta Graph API
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Active Automations
              </span>
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "—" : activeCount}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Listening for keyword comments in real time
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Follow-Gated Flows
              </span>
              <ShieldCheck className="h-4 w-4 text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loading ? "—" : followGatedCount}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Requiring account follow before link delivery
            </p>
          </div>
        </div>

        {/* Config / API Alerts */}
        {(postsError || automationsError) && (
          <div className="mb-6 space-y-3">
            {postsError && (
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Instagram API Notice</p>
                    <p className="text-xs text-amber-800">{postsError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                >
                  View Setup Guide
                </button>
              </div>
            )}

            {automationsError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="font-semibold">Supabase Notice</p>
                  <p className="text-xs text-rose-800">{automationsError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls Bar */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(
              [
                { id: "all", label: "All Posts" },
                { id: "active", label: "Active" },
                { id: "unconfigured", label: "Unconfigured" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition sm:text-sm ${
                  filterMode === tab.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search caption, keyword, or ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                <div className="space-y-2.5 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Settings2 className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              {posts.length === 0
                ? "No Instagram posts loaded yet"
                : "No posts match your filter"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {posts.length === 0
                ? "Configure your Meta Page Access Token, Instagram Account ID, and Supabase credentials in your environment variables to load your feed."
                : "Try clearing your search query or switching filter tabs."}
            </p>
            {posts.length === 0 && (
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Webhook className="h-4 w-4" />
                Open Setup Guide
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const auto = automationByPostId.get(post.id);
              const thumbnail = post.thumbnail_url || post.media_url;

              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={post.caption?.slice(0, 50) || "Instagram media"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        Preview unavailable
                      </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        {renderMediaIcon(post.media_type)}
                        {post.media_type === "CAROUSEL_ALBUM"
                          ? "CAROUSEL"
                          : post.media_type}
                      </span>

                      {auto ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                            auto.is_active
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              auto.is_active ? "bg-white" : "bg-slate-400"
                            }`}
                          />
                          {auto.is_active ? "Active" : "Paused"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                          Not configured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <p className="line-clamp-2 text-sm text-slate-700">
                      {post.caption || "Untitled Instagram post"}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      {auto ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
                            {auto.trigger_keyword}
                          </span>
                          {auto.require_follow && (
                            <span className="shrink-0 text-[11px] font-medium text-slate-500">
                              Follow Gate
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                          + Set up trigger
                        </span>
                      )}

                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">
                        Configure →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Automation Config Modal */}
      <AutomationModal
        post={selectedPost}
        existingAutomation={
          selectedPost ? automationByPostId.get(selectedPost.id) : undefined
        }
        onClose={() => setSelectedPost(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* Setup Guide Modal */}
      <SetupGuideModal open={setupOpen} onClose={() => setSetupOpen(false)} />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

