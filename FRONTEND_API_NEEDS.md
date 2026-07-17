# Frontend API Needs (asset-manager-web → regix360-backend)

Everything in this repo currently runs on mock data (`src/lib/mock-data.ts`), consumed through a `{ key, fn }` pattern in `src/api/*.ts` (React Query key + an `fn` that returns mocked data after a fake `delay`). None of these call the real backend yet. This doc maps what the frontend expects, against `regix360-backend/docs/api.md` and the actual backend source, so the backend team knows what integration will require.

Source used: `regix360-backend/docs/api.md`, `regix360-backend/src/modules/**`, frontend `src/api/*.ts`, `src/types/asset-platform.ts`, `src/app/**`.

## 1. Resource areas the frontend needs

Backed by a real (or documented) API today:
- Auth / session
- Dashboard
- Assets (register, CRUD)
- Locations
- Imports (upload wizard)
- Verification (count cycles)
- Categories
- Users / invites

Mock-only, no backend support, not real requirements yet (inspired by a reference UI, listed for awareness only):
- Departments
- Transfers
- Maintenance
- Disposal
- Activity log

## 2. Per-area notes

### Auth / session
The `login` and `setup` pages (`src/app/(auth)/login`, `.../setup`) are pure UI stubs — form submit just does `router.push("/dashboard")`, no request is made. `src/api/client.ts` already assumes a real flow: it's an axios instance that reads a `token` cookie and sends `Authorization: Bearer <token>`, matching api.md's Supabase-JWT model. But the frontend has no code yet that performs the Supabase password grant, stores the token in that cookie, or determines the signed-in user's `orgRole`/`platformRole` after a plain login.

### Dashboard
`src/api/dashboard.ts` (`getDashboard`) returns a **very different shape** than `GET /api/dashboard` in api.md: mock returns `{ kpi, byLocation, byCategory, attention, activity }` (all camelCase, includes a fabricated `activity` feed and `byCategory` breakdown); api.md returns `{ totals, needsAttention, lastImport, activeVerification, lastVerification, byLocation }` with snake_case row fields (`qty_bad`, `location_name`, etc.). No overlap in field names — this page will need a rewrite against the real shape, not just a client wiring change.

### Assets
`src/api/assets.ts` mock (`getAssets`/`getAsset`/`addAsset`) uses a flattened, fully camelCase `Asset` type (`good`/`fair`/`bad`, `locationName`, `category` as a plain string, `history` embedded on the object) — quite different from api.md's row shape (`qty_good`/`qty_fair`/`qty_bad`, separate `location_name`/`category`/`item_code`, and asset-detail `history` as a separate array keyed by verification cycles). `addAsset` in mock generates its own asset code client-side; per api.md, code generation is entirely server-side (atomic serial counter) — frontend must stop doing this. Filtering (`search`, `locationId`, `category`, `condition`) is done client-side in mock but api.md's `GET /api/assets` supports equivalent server-side pagination/filter params (`search`, `locationIds`, `categoryIds`, `conditions`, `sort`, `page`, `pageSize`) — frontend will need to switch from full-list-then-filter to real pagination.

### Locations
Mock `Location` type (`assetCount`, `address: string | null`) roughly matches api.md's `{ id, name, code, address, created_at, asset_lines, total_units }`, but frontend's type has no `code` field at all — location codes (permanent, baked into asset codes) aren't modeled on the frontend yet. `addLocation` mock never sends/receives a `code`; the real `POST /api/locations` requires one.

### Imports
There is no `src/api/imports.ts` and no dedicated import-history page — the only trace is the upload wizard UI (`src/app/(org)/assets/upload/page.tsx`), which is fully static/mocked (hardcoded row counts like "45 rows need your attention", no state passed to any api layer). The three-step upload → preview → commit flow, column-mapping negotiation, category-match/override step, and duplicate-detection (`similarPreviousImport`) described in api.md have no frontend representation to compare against yet — this is greenfield integration work, not a reshape of existing mock code.

### Verification
`src/api/verification.ts` is minimal: `getVerificationCycles` returns a flat `VerificationCycle` list (`date`, `runBy`, `locationsLabel`, `discrepancies`) that doesn't line up with api.md's cycle object (`started_at`, `started_by_name`, separate `counted`/`in_scope`/`discrepancies`). `getVerifyRows` just slices `mockAssets` by location — none of the real lifecycle (start/count/complete/abandon, the active-cycle poll, the diff report) is represented in frontend code yet. The `verification/run` page will need much more state than the current mock provides.

### Categories
No dedicated `src/api/categories.ts` — `mockCategoryDictionary` is read directly inside `assets.ts` (`getCategoryDictionary`) and shaped as `{ category, itemCode }` only (`CategoryOption` type), missing `id` and `item_description` that api.md's `GET /api/categories` returns. Since asset creation needs a real `categoryItemId` (not just a code), the frontend will need the full item object, not just the two display fields it uses today.

### Users / invites
`src/api/org.ts` mock shapes (`OrgUser`, `PendingInvite`) are close to api.md's `GET /api/users` response, but flattened — mock `OrgUser` has no separate `membership_id` vs `user_id` distinction that api.md's `members[]` rows have (`membership_id`, `user_id`, `is_active`, `last_active_at`). `updateOrgUser` mock takes `userId`; the real `PATCH /api/users/:membershipId` is keyed by **membership id**, not user id — this is a real mismatch to fix during integration, not just a rename.

### Mock-only areas (no backend, not yet real requirements)
Departments, Transfers, Maintenance, Disposal, and Activity Log each have a full `{key, fn}` mock API and dedicated types in `asset-platform.ts`, seeded from `mock-data.ts`, and each has its own page under `src/app/(org)/`. None of these appear anywhere in `regix360-backend` (no routes, no modules, no mention in api.md). These were built mock-first, inspired by a reference UI — flagging them here for visibility, not asking backend to scope them yet.

## 3. Known gaps / open questions for backend

- **Role discovery after plain login**: api.md only documents `orgRole`/`platformRole` being returned from `POST /api/invites/accept`. There's no documented way for the frontend to learn a signed-in user's role (org or platform) after a normal Supabase sign-in — is that a `GET /api/me`-style endpoint, or does the frontend need to derive it from a 403 on a role-gated call?
- **Token refresh**: api.md notes Supabase tokens expire after ~1 hour with "sign in again to refresh" — no refresh-token flow is described. Does the frontend need to silently re-auth, or prompt for re-login on 401?
- **Error envelope shape**: the frontend's `client.ts` already parses errors as `error.response.data.error.message` (nested object with a `message` field), but api.md documents errors as a flat `{ "error": "human-readable sentence" }` string. These don't match — needs reconciling before wiring up real error handling.
- **No imports UI/state exists yet**: the upload wizard is fully static; the real preview/commit/column-mapping/category-override contract in api.md has nothing on the frontend to map against, so this will be new frontend work, not a swap-in.
- **Asset code generation**: frontend's `addAsset` mock currently fabricates codes client-side; needs to be removed once wired to the real endpoint (server generates the permanent code).
- **Membership vs user id**: `PATCH /api/users/:membershipId` needs the membership id, but the frontend's user-management mock keys everything by `userId` — API surface for identifying "which row to update" needs to be corrected during integration.
- **No backend support at all for**: Departments, Transfers, Maintenance, Disposal, Activity Log. If/when these become real requirements, they'll need new modules on the backend — nothing to reconcile today, just flagging so backend doesn't get surprised by frontend types/pages that look load-bearing but aren't backed by any spec.
- **Categories `id` needed for asset creation**: frontend today doesn't carry `categoryItemId`/`id` through its category dictionary type; will need extending to support `POST /api/assets`'s `categoryItemId` requirement.
