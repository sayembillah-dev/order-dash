# Auto Entry — design notes (not yet implemented)

Status: **on hold**, user wants to think about it later. This file captures the discussion so it isn't lost.

## Goal

User sometimes forgets to manually push orders through the pipeline. Wants a scheduled job that,
once a day at a chosen time (Bangladesh time, UTC+6), automatically does the "entry" step for
orders that are still pending — so nothing gets left behind by end of day.

## Open decisions (need user input before building)

1. **Fixed time vs. customizable time.**
   - Fixed 6PM Bangladesh time, once a day → fits Vercel Hobby's native Cron Jobs (see below). Simple, no extra infra.
   - User-configurable time via Settings UI → Vercel Hobby cron is static (defined in `vercel.json`,
     redeploy required to change) and capped at once/day, so a user-adjustable time would need an
     external pinger (e.g. cron-job.org or a scheduled GitHub Actions workflow) hitting a secret-protected
     `/api/cron/auto-entry` route every 10–15 min, which then checks current Asia/Dhaka time against
     stored settings + a `lastRunAt` guard so it only actually runs once/day at the chosen hour.
   - **User is leaning toward fixed 6PM** — simpler, fits free tier natively. Not finalized.

2. **Scope of "auto entry."** No literal order-status field exists in the schema — lifecycle is tracked
   via two independent booleans on `Order`: `parcelCreationDone` and `pathaoEntryDone`. The parcel-creation
   queue's "Order created" button just flips `parcelCreationDone: true`. Need to confirm whether the daily
   job should:
   - (a) auto-confirm parcel creation AND push to Pathao for anything still pending either step, or
   - (b) only push to Pathao for orders where parcel creation is already done but Pathao entry hasn't happened.
   - **Not yet answered by user.**

## Vercel free-tier (Hobby) cron constraints

- Cron Jobs exist on Hobby but are capped at **once per day per job**, max **2 cron jobs** per project.
- Schedule is defined statically in `vercel.json` (or route config) — no dynamic per-user reschedule without a redeploy.
- Trigger time is not guaranteed to the exact minute — can be a few minutes late under load. Fine for "roughly 6PM," not for anything needing second-level precision.
- Serverless function timeout on Hobby defaults to 10s, extendable via `maxDuration` up to 60s. Worth watching if the pending-order batch ever gets large, since each order requires a live Pathao API call.
- Fixed 6PM Bangladesh = `0 12 * * *` in the cron schedule (12:00 UTC). Bangladesh has no DST, so this doesn't drift across the year.

## Relevant existing code (from earlier codebase survey)

- **Settings page**: `src/app/(dashboard)/settings/page.tsx` → `src/components/settings-client.tsx`.
  Currently only client-side toggles (localStorage): `src/components/lazy-mode-provider.tsx`,
  `src/components/pathao-api-provider.tsx` (`usePathaoApi()`, key `"order-dash-pathao-api-v1"`).
  **Problem**: a server-side cron can't read localStorage — the "Pathao API enabled" flag (and any
  auto-entry enable/time setting) needs to move into a DB-backed settings doc.
- **No global settings DB model exists yet.** Only Mongoose models are `src/lib/models/Order.ts` and
  `src/lib/models/PathaoTokenState.ts` (singleton `_id: "singleton"` doc — good template for a new
  `AutoEntrySettings` singleton: `enabled`, `timeOfDay` (if customizable), `lastRunAt`).
- **App is single-tenant**: `src/lib/auth.ts` uses one shared `AUTH_SECRET` JWT cookie, no `User` model.
  So settings are effectively global, not per-user.
- **Pathao integration**:
  - `src/lib/pathao/orders.ts` — `pathaoCreateOrder()` (single), `pathaoCreateBulkOrders()` (bulk, POST
    `/aladdin/api/v1/orders/bulk`, expects 202). `buildPayloadFromOrderFields()` builds the payload.
  - `src/lib/pathao/env.ts` — `getPathaoEnvConfig()` requires `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`,
    `PATHAO_STORE_ID`, `PATHAO_USERNAME`, `PATHAO_PASSWORD` (throws if missing).
  - `src/lib/pathao/token.ts` + `PathaoTokenState` — OAuth token handling/refresh.
  - `src/app/actions/pathao.ts` — manual entry flows already exist:
    - `submitPathaoQueueCompletion` (single order, real API call or manual mark-done).
    - `createPathaoBulkOrders` (array of order IDs → bulk API call → sets `pathaoEntryDone: true`,
      `pathaoEntryCompletedAt`, `pathaoConsignmentId`, `pathaoDeliveryFee` on each). **Closest existing
      building block for the scheduled job** — it already does "push all selected pending orders to
      Pathao at once."
  - Validation before sending: `shippingValidationError` in `src/app/actions/pathao.ts` requires
    non-empty `customerName`, `phone`, `address`.
- **Order query for "pending Pathao entry"**: `Order.find({ pathaoEntryDone: false })` — see
  `getTodayPathaoEntriesCompleted()` in `src/app/actions/orders.ts` for the pattern.
- **No cron/scheduled-job infrastructure exists yet** — no `vercel.json`, no `/api/cron/*` routes, no
  `node-cron`/`node-schedule` dependency.
- **No timezone library** (`dayjs`, `date-fns-tz`, `luxon`) present in `src/` — Bangladesh-time comparisons
  will need one added, or manual UTC+6 offset math (viable since no DST).
- **Database**: MongoDB via Mongoose (`mongoose: ^9.6.1`), connection helper `src/lib/mongodb.ts`
  (`connectDB()`, cached-connection pattern for serverless).

## Recommended shape (once decisions above are made)

1. New Mongoose singleton model, e.g. `AutoEntrySettings` (`enabled: boolean`, `pathaoApiEnabled: boolean`
   mirrored from/replacing the localStorage toggle, optional `timeOfDay`, `lastRunAt: Date`,
   `lastRunSummary` for visibility).
2. Settings UI updates to read/write that doc via a server action instead of (or in addition to)
   localStorage.
3. `vercel.json` cron entry (if fixed time) calling `/api/cron/auto-entry`, protected by Vercel's
   `CRON_SECRET` bearer-token convention.
4. Route handler: connect DB → load settings → bail out if disabled or Pathao not enabled → resolve
   the target order set (per scope decision above) → reuse/extend `createPathaoBulkOrders`-style logic →
   record `lastRunAt` + a run summary (succeeded/failed counts) so the automation isn't a silent black box.
5. Idempotency: guard on `lastRunAt` being same calendar day in Asia/Dhaka, in case the cron fires more
   than once or is retried.
