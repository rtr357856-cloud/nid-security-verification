# MasterLink — Shareable Messaging Link Generator

Admin panel for generating shareable messaging links. Opening a generated link
redirects the visitor straight into their device's messaging app with a
pre-filled recipient and message — they only press **Send**.

Built with **Next.js 16** (App Router) + **Supabase** (Postgres, Auth, RLS).

## Features

- **Admin authentication** — email/password login (Supabase Auth), admin-only access enforced by RLS + a server-side admin check.
- **Create / edit / delete links** with Link Name, Recipient Number, Pre-filled Message, Platform (SMS, WhatsApp, Telegram) and Status.
- **Unique shareable URLs** — `https://yourdomain.com/m/<unguessable-slug>` with one-click copy, QR code and Web Share API.
- **Regenerate link** to produce a new URL (invalidates the old one).
- **Public redirect** — resolves the slug and builds the correct deep link per platform/OS:
  - SMS Android: `sms:1223?body=…`
  - SMS iOS: `sms:1223&body=…`
  - WhatsApp: `https://wa.me/<number>?text=…`
  - Telegram: `https://t.me/+<number>?text=…`
- **Analytics** — total clicks, last opened, device / browser / OS breakdown, and recent click history.
- **Validation** — recipient & message required, number character validation, duplicate-slug protection (unique constraint + retry).
- **Mobile-first responsive UI** — card view on phones, table on desktop, toast notifications, loading states.

## Project structure

```
src/
  proxy.ts                      # Auth guard (Next.js 16 "Proxy")
  app/
    page.tsx                    # Public landing page
    login/                      # Admin sign-in
    admin/                      # Protected dashboard (layout checks session + admin)
      actions.ts                # create/update/toggle/delete/regenerate server actions
      page.tsx                  # Links table + summary stats
      links/new/                # Create form
      links/[id]/               # Link detail + analytics
      links/[id]/edit/          # Edit form
    m/[slug]/route.ts           # Public redirect endpoint
  components/                   # UI components (table, forms, dialogs, QR, toasts)
  lib/
    supabase/                   # server / browser / public / admin clients
    auth-actions.ts             # login + logout server actions
    deep-link.ts                # platform + OS aware deep link builder
    links.ts                    # data access (links + click stats)
    ua.ts                       # lightweight user-agent parsing
    validation.ts               # zod schemas
  types/database.ts             # Supabase Database typings
supabase/migrations/0001_init.sql   # Schema + RLS (paste into Supabase SQL editor)
scripts/create-admin.mjs        # Create the first admin user
```

## Getting started

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/migrations/0001_init.sql`.
3. In **Project Settings → API**, copy the **Project URL**, **anon/public key** and **service_role key**.

> **Security note:** the service role key bypasses RLS. It is used only by the
> `create-admin` script and must never be exposed to the browser
> (`SUPABASE_SERVICE_ROLE_KEY` is server-only).

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create an admin user

```bash
npm install
npm run create-admin -- admin@example.com
# Optionally pass a password:  npm run create-admin -- admin@example.com 'S3cure-Pass!'
```

The script creates the auth user (email confirmed) and marks the profile as admin.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in, and start creating links.

## How it works

1. Admin creates a link → the app generates a 12-character random slug and stores the config in `links`.
2. A visitor opens `/m/<slug>` → the route resolves the slug (via a security-definer RPC — the public key cannot enumerate the table), records a click with device/browser/OS, and serves a small interstitial page that immediately redirects to the platform-specific deep link.
3. If the link is disabled, visitors see an "unavailable" page instead of the redirect.
4. The dashboard aggregates click stats via the `link_stats` view (security-invoker, so RLS still applies).

## Extending to more platforms

1. Add the platform to the `messaging_platform` enum in the migration (or use a string column).
2. Add a case in `src/lib/deep-link.ts` (`buildDeepLink`).
3. Add the option to the platform `<Select>` in `src/components/link-form.tsx` and to `MESSAGING_PLATFORMS` in `src/lib/validation.ts`.

## Deploying

- **Vercel:** connect the repo, add the four env vars, deploy.
- Set `NEXT_PUBLIC_APP_URL` to your production domain so share links use the right host.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run create-admin -- <email>` | Create / promote an admin user |
