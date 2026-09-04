# ClientCollect — Prototype Plan

Status: prototype only. A separate, real build will happen later in a different
folder on Cloudflare R2 + a real auth system. This document is the single
source of truth for that prototype's scope so any future session (or future
you) can pick this up without re-deriving the decisions below.

## 1. What this is

ClientCollect is a document collection tool for Indian professional service
firms (CA firms, accountants, lawyers, consultants, loan agents). The pitch:

> Create a document checklist, send your client one secure link, and see
> exactly what's been received and what's still missing.

Not a practice-management system. Not billing, not e-signature, not filing.
One job only: collect documents, show what's missing.

## 2. Why this prototype exists

To demo to real prospective customers (CA firms) and confirm the workflow
before investing in the real build. It has to *look and feel* finished —
smooth, fast, not "AI generated" — even though the backend underneath is
intentionally simple (JSON files instead of Postgres, local disk instead of
object storage, no auth, no real email/WhatsApp).

## 3. Explicit scope decisions (from discussion with the user)

**In scope:**
- Org side: Dashboard, Clients, Document Requests, Activity
- Client side: plain, mobile-first upload portal, no login
- A client can have **multiple document collection runs over time** — not
  one static checklist per client. E.g. Ravi Kumar might have an "ITR
  FY24-25" run in July and a separate "Loan Application" run in November.
  Each run is its own `document_requests` row with its own link, checklist,
  and progress. The client detail page manages/lists all of a client's runs.
- Real file uploads (stored on local disk for now, behind a storage
  abstraction — see §6).
- Activity log (append-only, drives the dashboard and client-detail history).
- "Send Reminder" as a **simulated** action (toast + activity log entry) —
  no real email/notification is sent.
- Reset-demo-data action so the demo can be re-run cleanly.
- QR code on the "request created" success screen (scan with your own phone
  during a live demo instead of typing a link).

**Explicitly deferred / cut for this prototype:**
- Templates page/management UI — decide later, not building now. Document
  request creation uses manual document selection only for v1 (a hardcoded
  quick-pick list of common Indian doc names is fine to speed up selection,
  but no Templates CRUD screen).
- Settings page — not needed.
- Auth / login — not needed. No sessions, no users table enforcement.
- Real notifications (email/WhatsApp/SMS) — simulated only.
- Dashboard analytics beyond 3 numbers — no completion-rate chart, no
  recent-activity widget on the dashboard itself (activity has its own page).
- Billing, payments, OCR/AI, e-signature, RBAC, SSO, marketing site — never
  in scope for this prototype (matches the original brief).

## 4. Site map

```
/                         Home launcher — pick "Business" or "Client" demo entry
/app                      Org side (redirects to /app/dashboard)
/app/dashboard            3 stat cards only
/app/clients              Client list table
/app/clients/[id]         Client detail — contact info + list of their
                           collection runs (past & active), each with its
                           own progress
/app/clients/[id]/new     Start a new collection run for this client
                           (pick documents, create the run)
/app/requests             All collection runs across all clients (flat list)
/app/activity             Timestamped event log
/u/[token]                Client-facing upload portal — no chrome, no login
```

## 5. Page-by-page behavior

### `/` — Home launcher
- Logo/name + one-line pitch.
- Two entry cards: "I'm the Business" → `/app/dashboard`. "I'm the Client" →
  shows the currently-open collection runs from the live data (not a fake
  list) and clicking one opens that run's real `/u/[token]` link.
- Small "Reset demo data" action.

### `/app/dashboard`
- Exactly 3 stat cards: **Total Clients**, **Pending Requests** (collection
  runs not yet complete), **Documents Awaiting** (sum of missing docs across
  all pending runs). Nothing else on this page.

### `/app/clients`
- Searchable table. Columns: Client, Contact, Forms (aggregate across that
  client's runs, e.g. "12/15" summed across active runs), Status
  (Complete/Pending/Mixed), Last activity.
- "+ Add Client" → small form (Name, Email, Phone) → on save, offer to
  immediately start a collection run for them.
- Row click → client detail.

### `/app/clients/[id]`
- Header: name, email, phone.
- List of this client's collection runs (cards), each showing: run label
  (e.g. "Income Tax Return — FY 2024-25"), created date, progress
  (e.g. 7/9), status pill, and actions: **Copy Link**, **Send Reminder**
  (simulated), **View Documents** (expands the checklist with per-doc
  uploaded/missing state and lets you open any uploaded file via a signed
  URL from the storage abstraction).
- "+ New Collection Run" button → `/app/clients/[id]/new`.

### `/app/clients/[id]/new`
- Pick required documents for this run (checkbox list of common Indian
  document types + free-text "add custom document").
- Optional short label/description for the run (e.g. "Income Tax Return —
  FY 2024-25") since the same client will run this repeatedly across time.
- Create → success screen: the client link, **Copy Link** button, and a
  **QR code** rendering that same link.

### `/app/requests`
- Flat table of every collection run across every client — for when you
  want to see "what's outstanding" without going client-by-client.

### `/app/activity`
- Reverse-chronological list: client created, run created, link opened,
  document uploaded, document replaced, run completed, reminder sent
  (simulated). Each row has a relative + absolute timestamp.

### `/u/[token]` — Client upload portal
Deliberately minimal, mobile-first, no sidebar, no branding chrome beyond:
- Org name at top, and the run's label/description below it if one was set.
- A short doc list. Each row = document name + a compact upload control
  (small dashed tap-to-upload box, not a tall drop zone — see the reference
  screenshot the user provided: compact "Tap to upload" card, not
  full-height). Accepts PDF/JPG/PNG, opens the camera on mobile.
- Once a file is uploaded: row collapses to filename + a small ✕ button
  that removes it and reverts the row to "not uploaded" so they can redo it.
- A progress indicator at the top (e.g. "4 / 6 received").
- When every document is present: the checklist is replaced by a single
  completion state — "All documents received."

## 6. Data & storage architecture

**Why JSON instead of Postgres right now:** Supabase is down at the time of
this build. Rather than blocking, the data layer is written against a
`types.ts` file that mirrors the intended Postgres schema 1:1, with a thin
JSON-file-backed store implementing the same read/write shape a Postgres
client would. When Supabase is back, swap the store implementation only —
the types and every call site stay the same.

**Known limitation to flag before a real Vercel deploy:** Vercel's
serverless filesystem is read-only outside `/tmp`, and `/tmp` doesn't
persist across invocations. The JSON-file store works for local dev and for
a screen-shared/local demo. Before deploying this prototype live on Vercel
for a remote demo, the JSON store must be swapped for real Supabase
Postgres — this is a config/store-swap, not a rewrite, by design.

### Entities (mirrors the eventual Postgres schema)

```
organizations        (id, name)
clients               (id, org_id, name, email, phone, created_at)
document_requests      (id, org_id, client_id, label, description, token,
                        status, created_at, first_opened_at, completed_at)
                        — this is a "collection run"
required_documents     (id, request_id, name, sort_order)
uploaded_documents      (id, required_document_id, file_name, storage_key,
                        mime_type, size_bytes, version, is_current,
                        uploaded_at)
activity_logs         (id, org_id, client_id, request_id, type, message,
                        created_at)
```

`document_requests.token` is a random unguessable string (nanoid) — it *is*
the client link (`/u/<token>`). Required regardless of what's behind it.

### Storage abstraction

`lib/storage/` exposes a small interface: `put(file) -> storageKey`,
`signedGetUrl(storageKey) -> url`, `remove(storageKey)`. The prototype's
implementation writes to local disk under a gitignored folder and serves
files through an API route that acts like a signed-URL endpoint (so the
frontend never hardcodes a real file path — matches the original brief's
"don't hardcode fake file URLs" requirement even without real object
storage). Swapping to Supabase Storage or R2 later means writing one new
implementation of the same interface.

## 7. Tech stack

- Next.js (App Router) + TypeScript, deployed to Vercel eventually.
- Tailwind CSS for styling.
- **Font: Geist only** (via `next/font/google`, both Geist Sans and Geist
  Mono where a mono/tabular look helps, e.g. file sizes, progress counts).
- **Light theme only** for now, no dark mode toggle needed yet.
- No component library skin (no default shadcn/Claude-generated look) —
  hand-built minimal components: buttons, cards, tables, progress bars,
  a toast, an upload row. Deliberately restrained: no gradients, no
  decorative motion, few and purposeful transitions only (progress bar fill,
  upload success). Must not read as AI-generated boilerplate.
- No auth library — no login screens at all in this prototype.
- `qrcode` (or similar) for the link QR code on request-created screen.
- `nanoid` for tokens/ids.

## 8. Responsive requirements

Client is expected to demo this primarily on **mobile**, so `/u/[token]`
must be built mobile-first and tested at ~375px width first. But both sides
must work properly on desktop too — org side is a normal desktop dashboard
layout that should also degrade sensibly on a tablet/phone, not just be
usable on mobile.

## 9. End-to-end demo script this build must support

1. **Business**: `/` → "I'm the Business" → Dashboard → Clients → Add
   Client → immediately start a new collection run → pick documents →
   create → copy link (or show QR).
2. **Client**: scan/open the link on a phone → see the checklist → upload
   a couple of files → see progress update live → upload the rest → see
   completion state.
3. **Business**: back on `/app/clients/[id]` → see the run's progress
   updated → expand → view/open an uploaded document → check `/app/activity`
   for the corresponding log lines.

This exact loop must work without errors before considering the build done.
