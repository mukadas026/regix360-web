const STATIC_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assets": "Assets",
  "/assets/add": "Add asset",
  "/assets/upload": "Upload assets",
  "/users": "Users",
  "/locations": "Locations",
  "/departments": "Departments",
  "/verification": "Verification",
  "/verification/run": "Run verification",
  "/transfers": "Transfers",
  "/maintenance": "Maintenance",
  "/disposal": "Disposal",
  "/reports": "Reports",
  "/activity-logs": "Activity Logs",
  "/settings": "Settings",
};

// Sub-pages (one level below a main nav destination) that should show a
// back button, and where it goes. Anything not listed here — the main nav
// destinations themselves — gets no back button.
const BACK_TARGETS: Record<string, string> = {
  "/assets/add": "/assets",
  "/assets/upload": "/assets",
  "/verification/run": "/verification",
};

function titleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPageInfo(pathname: string): { title: string; backHref: string | null } {
  if (STATIC_TITLES[pathname]) {
    return { title: STATIC_TITLES[pathname], backHref: BACK_TARGETS[pathname] ?? null };
  }

  // /verification/:id/report
  const reportMatch = pathname.match(/^\/verification\/[^/]+\/report$/);
  if (reportMatch) {
    return { title: "Verification report", backHref: "/verification" };
  }

  const segments = pathname.split("/").filter(Boolean);
  const title = segments.length ? titleCase(segments[segments.length - 1]) : "";
  const backHref = segments.length > 1 ? `/${segments[0]}` : null;
  return { title, backHref };
}
