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
  lastActive: string;
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
