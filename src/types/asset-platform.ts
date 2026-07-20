export type Role = "org_admin" | "asset_manager" | "viewer";

export type PlatformRole = "operator" | "super_admin";

export type Condition = "good" | "fair" | "bad";

export type AssetStatus = "active" | "under_maintenance" | "disposed" | "missing";

// GET /api/me — docs/api.md "Authentication". Source of truth for the
// signed-in user's role; there is no other way to learn it after plain login.
export type Me = {
  user: { id: string; email: string; fullName: string | null };
  platformRole: PlatformRole | null;
  org: { id: string; role: Role | null; status: "active" | "suspended" | "pending" | null } | null;
  impersonating: { orgId: string; readOnly: true } | null;
  effectiveOrgId: string | null;
};

// Locations — org → location → department → asset (unit).

export type Location = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  created_at: string;
  asset_lines: number;
  total_units: number;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  created_at: string;
  asset_lines: number;
};

// Assets — one row is one PHYSICAL UNIT. The register list is GROUPED
// (by description+category+location+department); drill down for units.

export type AssetGroup = {
  description: string;
  category_item_id: string;
  category: string;
  item_code: string;
  location_id: string;
  location_name: string;
  department_id: string;
  department_name: string;
  unit_count: number;
  good_count: number;
  fair_count: number;
  bad_count: number;
  updated_at: string;
};

export type AssetUnit = {
  id: string;
  code: string;
  unit_serial: string;
  condition: Condition;
  status: AssetStatus;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  supplier: string | null;
  acquisition_method: "purchase" | "donation" | "transfer" | "other";
  acquisition_date: string | null;
  acquisition_cost: number | null;
  custodian_id: string | null;
  custodian_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ConditionHistoryEntry = {
  cycle_id: string;
  prev_condition: Condition;
  counted_condition: Condition;
  found: boolean;
  counted_at: string;
  counted_by_name: string;
};

export type AssetTransferSnapshot = {
  id: string;
  code: string;
  status: TransferStatus;
  reason: string | null;
  from_location_name: string;
  to_location_name: string;
  from_department_name: string;
  to_department_name: string;
  from_custodian_name: string | null;
  to_custodian_name: string | null;
  requested_by_name: string;
  completed_by_name: string | null;
  cancelled_by_name: string | null;
  requested_at: string;
  completed_at_actual: string | null;
  cancelled_at: string | null;
};

// GET /api/assets/:id — a single unit's full detail.
export type AssetDetail = AssetUnit & {
  description: string;
  location_id: string;
  location_name: string;
  location_code: string;
  department_id: string;
  department_name: string;
  department_code: string;
  category: string;
  item_code: string;
  custom_code: string | null;
  history: ConditionHistoryEntry[];
  transfers: AssetTransferSnapshot[];
};

export type AssetCodeRange = { condition: Condition; count: number; firstCode: string; lastCode: string };

export type CreateAssetSummary = {
  created: number;
  description: string;
  locationId: string;
  departmentId: string;
  categoryItemId: string;
  codeRanges: AssetCodeRange[];
};

// Transfers — request → complete | cancel. Never touches condition/code.

export type TransferStatus = "pending" | "completed" | "cancelled";

export type Transfer = {
  id: string;
  code: string;
  status: TransferStatus;
  asset_id: string;
  asset_code: string;
  asset_description: string;
  from_location_name: string;
  to_location_name: string;
  from_department_name: string;
  to_department_name: string;
  to_custodian_name: string | null;
  requested_by_name: string;
  completed_by_name?: string | null;
  cancelled_by_name?: string | null;
  reason: string | null;
  requested_at: string;
  completed_at_actual: string | null;
  cancelled_at: string | null;
};

// Maintenance — scheduled → in_progress → completed | cancelled.

export type MaintenanceType = "corrective" | "preventive";
export type MaintenancePriority = "low" | "medium" | "high";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type MaintenanceRecord = {
  id: string;
  code: string;
  status: MaintenanceStatus;
  type: MaintenanceType;
  priority: MaintenancePriority;
  scheduled_at: string;
  asset_id: string;
  asset_code: string;
  asset_description: string;
  requested_by_name: string;
  completed_by_name?: string | null;
  cancelled_by_name?: string | null;
  notes: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

// Disposal — pending_approval → approved → completed | cancelled.

export type DisposalMethod = "scrapped" | "written_off" | "sold" | "donated";
export type DisposalStatus = "pending_approval" | "approved" | "completed" | "cancelled";

export type DisposalRecord = {
  id: string;
  code: string;
  status: DisposalStatus;
  method: DisposalMethod;
  proceeds: number | null;
  reason: string | null;
  asset_id: string;
  asset_code: string;
  asset_description: string;
  requested_by_name: string;
  approved_by_name?: string | null;
  cancelled_by_name?: string | null;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

// Verification — per-unit physical count cycles.

export type VerificationCycleStatus = "in_progress" | "completed" | "abandoned";

export type VerificationCycle = {
  id: string;
  status: VerificationCycleStatus;
  started_at: string;
  completed_at: string | null;
  started_by_name: string;
  counted: number;
  discrepancies: number;
};

export type VerificationScopeAsset = {
  id: string;
  description: string;
  code: string;
  condition: Condition;
  status: AssetStatus;
  location_name: string;
  counted_condition: Condition | null;
  found: boolean | null;
  counted_at: string | null;
};

export type VerificationReportRow = {
  description: string;
  code: string;
  location_name: string;
  prev_condition: Condition;
  counted_condition: Condition | null;
  found: boolean;
  counted_at: string;
  counted_by_name: string;
  discrepancy: boolean;
  reported_missing: boolean;
};

// Imports — init → direct-to-Storage upload → uploaded (parse) → preview → commit (async) → poll.

export type ImportStatus = "uploading" | "previewing" | "importing" | "completed" | "failed";

export type ImportInitResult = {
  batchId: string;
  fileName: string;
  upload: { bucket: string; path: string; token: string; signedUrl: string };
};

export type ImportUploadedResult = {
  batchId: string;
  fileName: string;
  totalRows: number;
  headers: string[];
  suggestedMapping: Record<string, string>;
  sampleRows: unknown[][];
  similarPreviousImport: { id: string; file_name: string; created_at: string } | null;
};

export type ImportSkippedRow = { rowNumber: number; reason: string; raw: unknown[] };

export type ImportCategoryCandidate = {
  id: string;
  itemDescription: string;
  itemCode: string;
  category: string;
  score: number;
};

export type ImportCategoryMatch = {
  auto: string | null;
  candidates: ImportCategoryCandidate[];
};

export type ImportPreviewResult = {
  validRows: number;
  unitTotal: number;
  skipped: ImportSkippedRow[];
  categoryMatches: Record<string, ImportCategoryMatch>;
  unmatchedDescriptions: string[];
  newLocations: { name: string; suggestedCode: string }[];
  newDepartments: { location: string; name: string; suggestedCode: string }[];
};

export type ImportCommitAccepted = { jobId: string; batchId: string; status: "importing" };

export type ImportRecord = {
  id: string;
  file_name: string;
  status: ImportStatus;
  total_rows: number;
  imported_count: number | null;
  skipped_count: number | null;
  locations_created: number | null;
  departments_created: number | null;
  created_at: string;
  completed_at: string | null;
  has_file: boolean;
  uploaded_by_name?: string;
  file_path?: string;
};

// Users & invites — unchanged shape from the previous API version.

export type OrgUser = {
  membership_id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_active_at: string | null;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  created_at: string;
  expires_at: string;
};

// No org-profile endpoint exists in api.md — this stays display-only mock data.
export type Org = {
  name: string;
  plan: string;
  contactEmail: string;
  address: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  code: string;
};

export type ActivityLogEntry = {
  id: string;
  occurred_at: string;
  action: string;
  target_type: string;
  target_id: string;
  description: string;
  actor_name: string;
  metadata: Record<string, unknown>;
};
