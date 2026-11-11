# InstaFlow — Instagram Comment-to-DM Automation

Production-ready Instagram Comment-to-DM automation tool built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, and the Meta Graph API (v20.0), deployed on Vercel.

## Features

- **Real-time Comment-to-DM Webhooks** (`/api/webhook`):
  - Instant `200 EVENT_RECEIVED` acknowledgment with background processing via `@vercel/functions` `waitUntil()`.
  - Keyword matching against active post automations in Supabase.
  - Sends a Private Reply Button Template (`CHECK_FOLLOW|<post_id>`) with no raw links in the first message.
  - Optional public comment reply (`reply_comment_text`).
  - Follow-gate verification via `is_user_follow_business` with automatic "Check Again" retry flow for non-followers.
- **Instagram Media Feed** (`/api/instagram/posts`):
  - Fetches recent posts and reels from the connected Instagram Business/Creator account.
- **Automation Studio Dashboard** (`/dashboard`):
  - Filterable post/reel grid with status badges, slide-over configuration drawer, input validation, and live DM flow preview.

## Setup

1. **Create Supabase Table**:
   Run `supabase/schema.sql` in the Supabase SQL Editor.

2. **Configure Environment Variables** (`.env.local` and Vercel Project Settings):
   - `INSTAGRAM_PAGE_ACCESS_TOKEN`
   - `INSTAGRAM_VERIFY_TOKEN`
   - `INSTAGRAM_ACCOUNT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Locally**:
   ```bash
   npm install
   npm run dev
   ```

4. **Configure Meta Webhook**:
   Point your Meta App Instagram webhook callback URL to `https://<your-vercel-domain>/api/webhook` with your `INSTAGRAM_VERIFY_TOKEN`, and subscribe to `comments` and `messages`.

