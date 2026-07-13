import type {
  Asset,
  CategoryOption,
  Location,
  Org,
  OrgUser,
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
  { id: "user-1", name: "Ama Mensah", email: "ama@cornerstonefcc.org", role: "admin", lastActive: "Today" },
  { id: "user-2", name: "Kwabena Osei", email: "kwabena@cornerstonefcc.org", role: "asset_manager", lastActive: "Yesterday" },
  { id: "user-3", name: "Efua Boateng", email: "efua@cornerstonefcc.org", role: "viewer", lastActive: "3 days ago" },
];

export const mockVerificationCycles: VerificationCycle[] = [
  { id: "cycle-1", date: "14 Mar 2025", runBy: "Ama Mensah", locationsLabel: "All locations", discrepancies: 12 },
  { id: "cycle-2", date: "02 Sep 2024", runBy: "Kwabena Osei", locationsLabel: "Agbogba, East Legon", discrepancies: 5 },
  { id: "cycle-3", date: "18 Mar 2024", runBy: "Ama Mensah", locationsLabel: "All locations", discrepancies: 21 },
];
