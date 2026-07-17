# Real API Integration Plan

Current state: entire app runs on mock data (`src/lib/mock-data.ts` + `src/api/*.ts` `fn` bodies). Shapes were invented before the real API existed and don't match `api.md` / the Postman collection. `src/api/client.ts` (axios + bearer cookie) is already the right shape to swap into — call sites (`useQuery`/`useMutation`) shouldn't need to change once each `fn` is rewired.

Because the mock shapes diverge from the real API, UI needs to change first in several places, then the `fn` bodies get swapped for real `client` calls. Phases below are ordered so each one is shippable/testable on its own.

## Open questions (need answers before starting)

1. **Signup flow.** Current `/signup` + `/setup` pages self-serve create an org. The real API has no such endpoint — orgs are created by a platform operator (`POST /api/admin/organizations`), optionally emailing the first admin an invite. So `/signup` as built doesn't map to anything. Do we: (a) delete self-serve signup and only support invite-acceptance (`/set-password`), or (b) keep a "request access" form that just emails us?
2. **Role source of truth.** `demo-role-switcher` lets you flip role client-side. Real role comes from the backend per-org membership — `api.md` doesn't show a `/me` endpoint. Need to confirm how the frontend learns the signed-in user's `orgRole`/`platformRole` after a plain login (not just after accepting an invite, which does return it).
3. **Token storage/refresh.** Tokens expire ~1h with no refresh endpoint mentioned — confirm we're expected to force re-login on 401, or if Supabase client-side SDK handles silent refresh instead of raw password-grant calls.
4. **Back Office.** Admin endpoints (`/api/admin/*`) imply a whole second app surface (org list, plans, operators, audit log, category dictionary, impersonation). Confirm that's in scope now or later — not touched in phases below.

## Phase 1 — Auth & session

- Replace fake `router.push` in `login/page.tsx` with real Supabase password-grant call, store `access_token` in the cookie `client.ts` already reads.
- Decide fate of `/signup`, `/setup` per open question 1; build `/set-password` (invite acceptance) page calling `POST /api/invites/accept`.
- Replace `SessionProvider`'s local `role` state with role/org data returned from login/invite-accept; drop or gate `demo-role-switcher` behind a dev-only flag.
- Handle 401 globally (redirect to `/login`) in `client.ts`'s response interceptor.

## Phase 2 — Types & assets list/detail

- Rework `types/asset-platform.ts` to match API field names (`qty_good/qty_fair/qty_bad`, `location_id`/`location_name`, `category_item_id`, permanent `code`, etc.) or add a mapping layer at the API boundary — pick one approach and apply consistently.
- Assets list (`assets/page.tsx`): move filtering/sorting/pagination server-side (`search`, `locationIds`, `categoryIds`, `conditions`, `sort`, `page`, `pageSize`) instead of the current client-side mock filter.
- Asset detail: add condition history section (`GET /api/assets/:id` returns last 20 verification snapshots).
- Add-asset form: swap free-text `category` for `categoryItemId` picked via `GET /api/categories?search=` autosuggest.

## Phase 3 — Locations

- Add required `code` field (2–6 alphanumeric, uppercase, permanent) to the add-location form; show it in the list (currently not modeled at all).
- Edit form: only `name`/`address` editable, disable code field.
- Delete: surface the `409` "N asset lines" message instead of a generic error.

## Phase 4 — Imports wizard

Current `assets/upload/page.tsx` and the setup-wizard's upload button are placeholders. Needs a real 3-step flow:

- **Upload** — multipart file, show parsed headers + suggested column mapping + sample rows, warn on `similarPreviousImport`.
- **Preview** — mapping UI (map columns to `description/location/qty_good/.../ignore`), show skipped-row reasons, category-match review (auto vs candidate picker per unmatched description), new-location code assignment.
- **Commit** — send `categoryOverrides`/`locationCodes`, show final `{ imported, skipped, locationsCreated }` summary, surface plan-limit `409`.
- Imports history + file re-download (`GET /api/imports/:id/file`) + skipped-rows CSV (`GET /api/imports/:id/skipped`).

## Phase 5 — Verification cycles

Current `verification/run/page.tsx` is a simplified mock. Needs to match the real state machine:

- Start: location picker (or all), block if a cycle is already `in_progress` (surface the `409` with `cycleId` so the UI can jump straight into it).
- Active cycle view: per-location progress (`in_scope`/`counted`), counting screen filterable by location/counted-status, upsert counts per asset.
- Complete: show summary (`discrepancies`, `reported_missing`, `uncounted`), or Abandon.
- Report view: diff table (discrepancies sorted first) + uncounted list, works for any past cycle from history.

## Phase 6 — Users & invites

Not modeled in the UI at all today (`settings/page.tsx` needs a members/invites section, or a dedicated `/users` page):

- Member list with role + active/inactive toggle (blocked on demoting the last active `org_admin` — surface that `409`).
- Send invite (email + role), pending invites list, revoke invite.

## Phase 7 — Dashboard & reports rewire

- Dashboard KPI shape differs (`totals`, `needsAttention`, `lastImport`, `activeVerification`, `lastVerification`, `byLocation`) — restructure `dashboard/page.tsx` to match, including the various "nothing yet" (`null`) states.
- Reports: "condition by category" needs the category dictionary join (not modeled yet); "verification report" needs a past-cycle picker feeding Phase 5's report view.

## Phase 8 — Wire real client calls

Once each screen's shape matches the API: replace every `fn` in `src/api/*.ts` with real `client.get/post/patch/delete` calls (delete `src/api/mock.ts` and `src/lib/mock-data.ts` last, once nothing imports them), point `NEXT_PUBLIC_API_URL` at the deployed backend, and smoke-test each flow end-to-end against Supabase (`https://kjgmvkbaehkcyxefzryz.supabase.co`) using the Postman collection as a reference for exact error strings/status codes to handle in the UI (toasts, inline errors).

## Phase 9 — UI expansion (inspired by a reference government asset system, not a 1:1 copy)

Independent track from Phases 1–8 — this is new surface area with no backend support yet, so it stays mock-first (same pattern the whole app already uses) until the real API grows to cover it. Two kinds of additions:

**A. Pure frontend, buildable now against existing data — no backend gap:**
- Shared list-page shell (title/subtitle, primary CTA top-right, search + filter dropdowns, table, footer with "Total N" + pager + page-size select) — retrofit onto Assets/Locations/Imports/Verification/Users so every list page looks and behaves the same.
- Modal-based CRUD for quick actions (add/edit Location, create/invite User) instead of full pages; keep full pages for genuinely multi-step flows (import wizard, verification run).
- Header: global search + notification bell + name/role chip (role chip sourced from Phase 1's real auth, not the demo switcher).
- Richer dashboard: stat-tile grid + pie/bar charts (condition distribution, units by category) alongside the existing KPI cards, using data already in `getDashboard`'s shape.
- QR code + printable label per asset (client-side only — encode the asset's `code`/description/category into a QR with a JS QR lib, render a print view). No endpoint needed since everything it displays already exists on the asset record.

**B. New hierarchy/workflow concepts, mock data + UI now, real endpoints later:**
- **Departments** — a new level under Location: `Org → Location (Branch) → Department`. (Ministry/Agency, as its own CRUD screen, is dropped — our org already *is* one ministry/agency/organization; that concept lives one level up, at the org itself, not inside a single org's UI.) Add `Department` to `types/asset-platform.ts`, seed mock data, add a `/departments` list+CRUD page, and let assets optionally reference a department.
- **Transfers** — move an asset between locations/departments with a reason, mock-tracked history (`/transfers` list + "Initiate Transfer" modal). Note in the plan that `api.md` explicitly calls real location-move a "future bulk action" — this stays mock until that lands.
- **Maintenance** — maintenance tickets against an asset (type/priority/status/scheduled date), mock-tracked (`/maintenance` list + "New Maintenance" modal). No backend concept of this today.
- **Disposal** — mark an asset disposed with a reason/date, mock-tracked (`/disposal` list). No backend concept of this today.
- **Activity Logs (org-scoped)** — a per-org activity feed distinct from Back Office's cross-org audit log (which is operator-only); mock a feed of asset/location/user/import/verification events scoped to the signed-in org.

When the real API eventually grows Department/Transfer/Maintenance/Disposal endpoints, these swap over the same way Phase 8 describes for the rest of the app — mock `fn` bodies replaced by `client` calls, call sites unchanged.
