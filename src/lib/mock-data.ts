import type {
  ActivityLogEntry,
  Asset,
  CategoryOption,
  Department,
  DisposalRecord,
  Location,
  MaintenanceRecord,
  Org,
  OrgUser,
  PendingInvite,
  Transfer,
  VerificationCycle,
} from "@/types/asset-platform";

export const mockOrg: Org = {
  name: "Cornerstone Faith Community Church",
  plan: "Growth plan",
  contactEmail: "admin@cornerstonefcc.org",
  address: "Agbogba Junction, Accra, Ghana",
};

export const mockLocations: Location[] = [
  { id: "loc-agb", name: "Agbogba", address: "Agbogba Junction, Accra", assetCount: 612, createdAt: "2023-02-11" },
  { id: "loc-elg", name: "East Legon", address: "Lagos Ave, East Legon, Accra", assetCount: 448, createdAt: "2023-02-11" },
  { id: "loc-spx", name: "Spintex", address: "Spintex Road, Accra", assetCount: 389, createdAt: "2023-05-03" },
  { id: "loc-tem", name: "Tema", address: "Community 4, Tema", assetCount: 301, createdAt: "2023-08-19" },
  { id: "loc-ksi", name: "Kasoa", address: "Kasoa Old Barrier", assetCount: 264, createdAt: "2024-01-22" },
  { id: "loc-obn", name: "Obuasi", address: "Obuasi Central", assetCount: 198, createdAt: "2024-04-09" },
  { id: "loc-tak", name: "Takoradi", address: "Takoradi Market Circle", assetCount: 116, createdAt: "2024-09-14" },
];

const categories = ["Seating", "Audio", "Furniture", "Appliance", "Electronics", "Kitchen"];

const itemsByCategory: Record<string, { desc: string; itemCode: string; makeModel: string | null; supplier: string | null }[]> = {
  Seating: [
    { desc: "Plastic chair", itemCode: "PCHR", makeModel: "Bergère B-200", supplier: "Accra Furniture Co." },
    { desc: "Cushioned pew", itemCode: "PEW", makeModel: null, supplier: "Kumasi Woodworks" },
  ],
  Audio: [
    { desc: "Ceiling speaker", itemCode: "CSPK", makeModel: "JBL Control 24C", supplier: "SoundTech Ghana" },
    { desc: "Wireless microphone", itemCode: "WMIC", makeModel: "Shure BLX24", supplier: "SoundTech Ghana" },
    { desc: "Mixing console", itemCode: "MIXC", makeModel: "Yamaha MG20", supplier: "SoundTech Ghana" },
  ],
  Furniture: [
    { desc: "Foldable table", itemCode: "FTBL", makeModel: null, supplier: "Accra Furniture Co." },
    { desc: "Reception desk", itemCode: "RDSK", makeModel: "Steelcase Answer", supplier: null },
  ],
  Appliance: [
    { desc: "Ceiling fan", itemCode: "CFAN", makeModel: "Binatone CF-1610", supplier: "Melcom" },
    { desc: "Standing fan", itemCode: "SFAN", makeModel: "Binatone SF-1810", supplier: "Melcom" },
    { desc: "Water dispenser", itemCode: "WDSP", makeModel: "Nasco WD-20", supplier: "Nasco" },
  ],
  Electronics: [
    { desc: "Projector", itemCode: "PROJ", makeModel: "Epson EB-X500", supplier: "SoundTech Ghana" },
    { desc: "Laptop", itemCode: "LPTP", makeModel: "Dell Latitude 5420", supplier: "Business Systems Ltd" },
  ],
  Kitchen: [
    { desc: "Gas cooker", itemCode: "GCKR", makeModel: "Scanfrost SFC-5002", supplier: "Scanfrost" },
    { desc: "Refrigerator", itemCode: "FRDG", makeModel: "Nasco NASF-140", supplier: "Nasco" },
  ],
};

function locCode(name: string) {
  return name.slice(0, 3).toUpperCase();
}

function seededHistory(good: number, fair: number, bad: number): Asset["history"] {
  return [
    { date: "2024-03-14", summary: `${good} good · ${fair} fair · ${bad} bad` },
    { date: "2023-03-02", summary: `${good + 1} good · ${Math.max(fair - 1, 0)} fair · ${bad} bad` },
  ];
}

let serial = 1;
export const mockAssets: Asset[] = mockLocations.flatMap((location) =>
  categories.flatMap((category) =>
    itemsByCategory[category].map((item, i) => {
      const good = 4 + ((serial * 7) % 20);
      const fair = (serial * 3) % 6;
      const bad = serial % 4 === 0 ? (serial % 3) + 1 : 0;
      const code = `CFCC/${locCode(location.name)}/${item.itemCode}/${String(serial).padStart(4, "0")}`;
      const asset: Asset = {
        id: `asset-${serial}`,
        code,
        description: item.desc,
        locationId: location.id,
        locationName: location.name,
        category,
        good,
        fair,
        bad,
        makeModel: item.makeModel,
        supplier: item.supplier,
        updatedAt: i % 2 === 0 ? "2 days ago" : "3 weeks ago",
        history: seededHistory(good, fair, bad),
      };
      serial += 1;
      return asset;
    }),
  ),
);

export const mockCategoryDictionary: CategoryOption[] = Object.entries(itemsByCategory).flatMap(
  ([category, items]) => items.map((item) => ({ category, itemCode: item.itemCode })),
);

export const mockUsers: OrgUser[] = [
  { id: "user-1", name: "Ama Mensah", email: "ama@cornerstonefcc.org", role: "org_admin", isActive: true, lastActive: "Today" },
  { id: "user-2", name: "Kwabena Osei", email: "kwabena@cornerstonefcc.org", role: "asset_manager", isActive: true, lastActive: "Yesterday" },
  { id: "user-3", name: "Efua Boateng", email: "efua@cornerstonefcc.org", role: "viewer", isActive: true, lastActive: "3 days ago" },
  { id: "user-4", name: "Yaw Darko", email: "yaw@cornerstonefcc.org", role: "viewer", isActive: false, lastActive: "2 months ago" },
];

export const mockPendingInvites: PendingInvite[] = [
  { id: "invite-1", email: "abena@cornerstonefcc.org", role: "asset_manager", createdAt: "2 days ago" },
];

export const mockVerificationCycles: VerificationCycle[] = [
  { id: "cycle-1", date: "14 Mar 2025", runBy: "Ama Mensah", locationsLabel: "All locations", discrepancies: 12 },
  { id: "cycle-2", date: "02 Sep 2024", runBy: "Kwabena Osei", locationsLabel: "Agbogba, East Legon", discrepancies: 5 },
  { id: "cycle-3", date: "18 Mar 2024", runBy: "Ama Mensah", locationsLabel: "All locations", discrepancies: 21 },
];

const departmentNamesByLocation: Record<string, string[]> = {
  "loc-agb": ["Sanctuary Ops", "Media & Sound", "Facilities"],
  "loc-elg": ["Sanctuary Ops", "Children's Ministry"],
  "loc-spx": ["Facilities", "Media & Sound"],
  "loc-tem": ["Sanctuary Ops"],
  "loc-ksi": ["Facilities"],
  "loc-obn": ["Sanctuary Ops"],
  "loc-tak": ["Facilities"],
};

export const mockDepartments: Department[] = mockLocations.flatMap((location) =>
  (departmentNamesByLocation[location.id] ?? []).map((name, i) => ({
    id: `dept-${location.id}-${i}`,
    name,
    code: `${locCode(location.name)}-${name.slice(0, 2).toUpperCase()}`,
    locationId: location.id,
    locationName: location.name,
    isActive: true,
    createdAt: location.createdAt,
  })),
);

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export const mockTransfers: Transfer[] = mockAssets.slice(0, 6).map((asset, i) => {
  const fromLocation = mockLocations.find((l) => l.id === asset.locationId)!;
  const toLocation = pick(mockLocations.filter((l) => l.id !== fromLocation.id), i);
  return {
    id: `transfer-${i + 1}`,
    code: `TRF-${String(i + 1).padStart(4, "0")}`,
    assetId: asset.id,
    assetDescription: asset.description,
    assetCode: asset.code,
    fromLocationId: fromLocation.id,
    fromLocationName: fromLocation.name,
    toLocationId: toLocation.id,
    toLocationName: toLocation.name,
    reason: pick(["Branch relocation", "Program requirement", "Damaged in place, sending for repair", "Consolidating inventory"], i),
    status: pick(["pending", "completed", "completed", "cancelled"], i),
    requestedBy: pick(["Ama Mensah", "Kwabena Osei"], i),
    createdAt: pick(["Today", "Yesterday", "3 days ago", "1 week ago"], i),
  };
});

export const mockMaintenanceRecords: MaintenanceRecord[] = mockAssets
  .filter((a) => a.bad > 0)
  .slice(0, 6)
  .map((asset, i) => ({
    id: `maint-${i + 1}`,
    code: `MNT-${String(i + 1).padStart(4, "0")}`,
    assetId: asset.id,
    assetDescription: asset.description,
    assetCode: asset.code,
    type: pick(["corrective", "preventive"], i),
    priority: pick(["high", "medium", "low"], i),
    description: `${asset.bad} unit(s) reported in bad condition — needs inspection.`,
    scheduledDate: pick(["2025-04-02", "2025-04-10", "2025-04-18"], i),
    estimatedHours: pick([2, 4, null, 1], i),
    status: pick(["scheduled", "in_progress", "completed"], i),
  }));

export const mockDisposalRecords: DisposalRecord[] = mockAssets
  .filter((a) => a.bad > 2)
  .slice(0, 4)
  .map((asset, i) => ({
    id: `disp-${i + 1}`,
    code: `DSP-${String(i + 1).padStart(4, "0")}`,
    assetId: asset.id,
    assetDescription: asset.description,
    assetCode: asset.code,
    method: pick(["scrapped", "written_off", "sold", "donated"], i),
    reason: "Beyond economical repair",
    proceeds: pick([null, null, 150, 0], i),
    status: pick(["pending_approval", "approved", "completed"], i),
    requestedBy: pick(["Ama Mensah", "Kwabena Osei"], i),
    requestedAt: pick(["Today", "3 days ago", "2 weeks ago"], i),
  }));

export const mockActivityLog: ActivityLogEntry[] = [
  { id: "act-1", occurredAt: "2 hours ago", userName: "Kwabena Osei", action: "import.completed", entityType: "import", description: "Uploaded register.xlsx — 412 assets imported to Agbogba", status: "success" },
  { id: "act-2", occurredAt: "Yesterday", userName: "Ama Mensah", action: "verification.completed", entityType: "verification", description: "Verification completed for East Legon — 2 discrepancies", status: "success" },
  { id: "act-3", occurredAt: "2 days ago", userName: "Ama Mensah", action: "asset.updated", entityType: "asset", description: "Ceiling fan CFAN/0042 condition updated", status: "success" },
  { id: "act-4", occurredAt: "3 days ago", userName: "Efua Boateng", action: "transfer.requested", entityType: "transfer", description: "Requested transfer of Projector PROJ/0031 to Spintex", status: "success" },
  { id: "act-5", occurredAt: "1 week ago", userName: "Ama Mensah", action: "location.created", entityType: "location", description: "Spintex location added", status: "success" },
  { id: "act-6", occurredAt: "1 week ago", userName: "Kwabena Osei", action: "user.invited", entityType: "user", description: "Invited abena@cornerstonefcc.org as Asset manager", status: "success" },
  { id: "act-7", occurredAt: "2 weeks ago", userName: "Kwabena Osei", action: "import.failed", entityType: "import", description: "Upload of stale-register.csv failed — no data rows found under the header", status: "failed" },
];
