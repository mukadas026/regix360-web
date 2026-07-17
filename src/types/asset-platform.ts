export type Role = "admin" | "asset_manager" | "viewer";

export type Condition = "good" | "fair" | "bad";

export type Location = {
  id: string;
  name: string;
  address: string | null;
  assetCount: number;
  createdAt: string;
};

export type ConditionHistoryEntry = {
  date: string;
  summary: string;
};

export type Asset = {
  id: string;
  code: string;
  description: string;
  locationId: string;
  locationName: string;
  category: string;
  good: number;
  fair: number;
  bad: number;
  makeModel: string | null;
  supplier: string | null;
  updatedAt: string;
  history: ConditionHistoryEntry[];
};

export type VerificationCycle = {
  id: string;
  date: string;
  runBy: string;
  locationsLabel: string;
  discrepancies: number;
};

export type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastActive: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Org = {
  name: string;
  plan: string;
  contactEmail: string;
  address: string;
};

export type CategoryOption = {
  category: string;
  itemCode: string;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string;
  isActive: boolean;
  createdAt: string;
};

export type TransferStatus = "pending" | "completed" | "cancelled";

export type Transfer = {
  id: string;
  code: string;
  assetId: string;
  assetDescription: string;
  assetCode: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  reason: string;
  status: TransferStatus;
  requestedBy: string;
  createdAt: string;
};

export type MaintenanceType = "preventive" | "corrective";
export type MaintenancePriority = "low" | "medium" | "high";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type MaintenanceRecord = {
  id: string;
  code: string;
  assetId: string;
  assetDescription: string;
  assetCode: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  scheduledDate: string;
  estimatedHours: number | null;
  status: MaintenanceStatus;
};

export type DisposalMethod = "sold" | "scrapped" | "donated" | "written_off";
export type DisposalStatus = "pending_approval" | "approved" | "completed";

export type DisposalRecord = {
  id: string;
  code: string;
  assetId: string;
  assetDescription: string;
  assetCode: string;
  method: DisposalMethod;
  reason: string;
  proceeds: number | null;
  status: DisposalStatus;
  requestedBy: string;
  requestedAt: string;
};

export type ActivityLogEntry = {
  id: string;
  occurredAt: string;
  userName: string;
  action: string;
  entityType: "asset" | "location" | "department" | "user" | "transfer" | "maintenance" | "disposal" | "verification" | "import";
  description: string;
  status: "success" | "failed";
};
