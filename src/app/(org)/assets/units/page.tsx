"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, MoreHorizontal, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import { getAssetUnits, getOrgUsers, updateAsset } from "@/api";
import type { ApiError } from "@/api";
import type { AssetUnitsQuery } from "@/api/assets";
import type { AssetStatus, AssetUnit, Condition } from "@/types/asset-platform";
import { AppDialog } from "@/components/global/app-dialog";
import { AssetDetailSheet } from "@/components/global/asset-detail-sheet";
import { AssetEditDetailsDialog } from "@/components/global/asset-edit-details-dialog";
import { AssetLabelDialog } from "@/components/global/asset-label-dialog";
import { DataTable } from "@/components/global/data-table";
import { PageContainer } from "@/components/global/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/providers/session-provider";

const conditionBadgeVariant: Record<Condition, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

const statusLabel: Record<AssetStatus, string> = {
  active: "Active",
  under_maintenance: "Under maintenance",
  disposed: "Disposed",
  missing: "Missing",
};

const conditionOptions: Condition[] = ["good", "fair", "bad"];
const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "under_maintenance", label: "Under maintenance" },
  { value: "disposed", label: "Disposed" },
  { value: "missing", label: "Missing" },
];

type CustodianTarget = { id: string; code: string; custodianId: string };
type StatusTarget = { id: string; code: string; status: AssetStatus; confirming: boolean };
type ConditionTarget = { id: string; code: string; condition: Condition };

function UnitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { canEdit, isAdmin } = useSession();

  const description = searchParams.get("description") ?? "";
  const categoryItemId = searchParams.get("categoryItemId") ?? "";
  const locationId = searchParams.get("locationId") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";
  const category = searchParams.get("category") ?? "";
  const itemCode = searchParams.get("itemCode") ?? "";
  const locationName = searchParams.get("locationName") ?? "";
  const departmentName = searchParams.get("departmentName") ?? "";

  const query: AssetUnitsQuery = { description, categoryItemId, locationId, departmentId };
  const ready = Boolean(description && categoryItemId && locationId && departmentId);

  const { data: units, isPending } = useQuery({
    queryKey: getAssetUnits.key(query),
    queryFn: () => getAssetUnits.fn(query),
    enabled: ready,
  });

  // GET /api/users is org_admin-only, so custodian reassignment only loads for admins.
  const { data: orgUsers } = useQuery({ queryKey: getOrgUsers.key, queryFn: getOrgUsers.fn, enabled: isAdmin });
  const activeMembers = (orgUsers?.members ?? []).filter((m) => m.is_active);

  const [historyUnitId, setHistoryUnitId] = useState<string | null>(null);
  const [editUnitId, setEditUnitId] = useState<string | null>(null);
  const [qrUnitId, setQrUnitId] = useState<string | null>(null);
  const [conditionTarget, setConditionTarget] = useState<ConditionTarget | null>(null);
  const [custodianTarget, setCustodianTarget] = useState<CustodianTarget | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);

  function invalidateAfterMutate() {
    queryClient.invalidateQueries({ queryKey: getAssetUnits.key(query) });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["asset"] });
  }

  const { mutate: mutateCondition, isPending: savingCondition } = useMutation({
    mutationFn: ({ id, condition }: { id: string; condition: Condition }) => updateAsset.fn(id, { condition }),
    onSuccess: () => {
      invalidateAfterMutate();
      toast("Condition updated");
      setConditionTarget(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update condition."),
  });

  const { mutate: mutateCustodian, isPending: savingCustodian } = useMutation({
    mutationFn: ({ id, custodianId }: { id: string; custodianId: string }) =>
      updateAsset.fn(id, { custodianId: custodianId || null }),
    onSuccess: () => {
      invalidateAfterMutate();
      toast("Custodian updated");
      setCustodianTarget(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update custodian."),
  });

  const { mutate: mutateStatus, isPending: savingStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssetStatus }) => updateAsset.fn(id, { status }),
    onSuccess: () => {
      invalidateAfterMutate();
      toast("Status updated");
      setStatusTarget(null);
    },
    onError: (error) => toast((error as ApiError).message ?? "Could not update status."),
  });

  function launchWorkflow(path: string, unit: AssetUnit) {
    router.push(`${path}?prefillCode=${encodeURIComponent(unit.code)}`);
  }

  const columns: ColumnDef<AssetUnit>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-[12.5px] font-medium">{row.original.code}</span>,
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => (
        <Badge variant={conditionBadgeVariant[row.original.condition]} className="capitalize">
          {row.original.condition}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{statusLabel[row.original.status]}</Badge>,
    },
    {
      accessorKey: "custodian_name",
      header: "Custodian",
      cell: ({ row }) => <span className="text-[13px]">{row.original.custodian_name ?? "Unassigned"}</span>,
    },
    {
      accessorKey: "updated_at",
      header: () => <div className="text-right">Updated</div>,
      cell: ({ row }) => (
        <div className="text-right text-xs text-muted-foreground">
          {new Date(row.original.updated_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const unit = row.original;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              title="View QR label"
              onClick={() => setQrUnitId(unit.id)}
            >
              <QrCode size={15} />
            </Button>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" title="More actions">
                    <MoreHorizontal size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setHistoryUnitId(unit.id)}>View history</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditUnitId(unit.id)}>Edit details</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConditionTarget({ id: unit.id, code: unit.code, condition: unit.condition })}
                  >
                    Adjust condition
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() =>
                        setCustodianTarget({ id: unit.id, code: unit.code, custodianId: unit.custodian_id ?? "" })
                      }
                    >
                      Change custodian
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      setStatusTarget({ id: unit.id, code: unit.code, status: unit.status, confirming: false })
                    }
                  >
                    Update status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => launchWorkflow("/transfers", unit)}>
                    Initiate transfer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => launchWorkflow("/maintenance", unit)}>
                    Schedule maintenance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => launchWorkflow("/disposal", unit)}>Start disposal</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/assets")}
        className="mb-3.5 flex items-center gap-1 text-[13px] font-semibold text-muted-foreground"
      >
        <ChevronLeft size={15} /> Back to register
      </button>

      <div className="mb-[18px]">
        <h1 className="mb-1 font-heading text-2xl font-semibold tracking-tight">{description}</h1>
        <p className="text-[13.5px] text-muted-foreground">
          {category} <span className="font-mono">({itemCode})</span> · {locationName} / {departmentName} ·{" "}
          {units?.length ?? 0} unit{units?.length === 1 ? "" : "s"}
        </p>
      </div>

      {!ready ? (
        <p className="text-[13.5px] text-muted-foreground">
          This link is missing some details — go back to the register and open the group again.
        </p>
      ) : (
        <DataTable
          data={units ?? []}
          columns={columns}
          isLoading={isPending}
          onRowClick={(unit) => setHistoryUnitId(unit.id)}
          pageSize={50}
          emptyTitle="No units found for this group"
        />
      )}

      <AssetDetailSheet assetId={historyUnitId} onClose={() => setHistoryUnitId(null)} />
      <AssetEditDetailsDialog
        unitId={editUnitId}
        open={Boolean(editUnitId)}
        onOpenChange={(open) => !open && setEditUnitId(null)}
      />
      <AssetLabelDialog unitId={qrUnitId} open={Boolean(qrUnitId)} onOpenChange={(open) => !open && setQrUnitId(null)} />

      {conditionTarget && (
        <AppDialog
          open={Boolean(conditionTarget)}
          onOpenChange={(open) => !open && setConditionTarget(null)}
          kind="modal"
          title={`Adjust condition — ${conditionTarget.code}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setConditionTarget(null)} disabled={savingCondition}>
                Cancel
              </Button>
              <Button
                disabled={savingCondition}
                onClick={() => mutateCondition({ id: conditionTarget.id, condition: conditionTarget.condition })}
              >
                Save
              </Button>
            </>
          }
        >
          <select
            value={conditionTarget.condition}
            onChange={(e) => setConditionTarget({ ...conditionTarget, condition: e.target.value as Condition })}
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
          >
            {conditionOptions.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </AppDialog>
      )}

      {custodianTarget && (
        <AppDialog
          open={Boolean(custodianTarget)}
          onOpenChange={(open) => !open && setCustodianTarget(null)}
          kind="modal"
          title={`Change custodian — ${custodianTarget.code}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setCustodianTarget(null)} disabled={savingCustodian}>
                Cancel
              </Button>
              <Button
                disabled={savingCustodian}
                onClick={() => mutateCustodian({ id: custodianTarget.id, custodianId: custodianTarget.custodianId })}
              >
                Save
              </Button>
            </>
          }
        >
          <select
            value={custodianTarget.custodianId}
            onChange={(e) => setCustodianTarget({ ...custodianTarget, custodianId: e.target.value })}
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
          >
            <option value="">Unassigned</option>
            {activeMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name ?? m.email}
              </option>
            ))}
          </select>
        </AppDialog>
      )}

      {statusTarget &&
        (statusTarget.confirming ? (
          <AppDialog
            open
            onOpenChange={(open) => !open && setStatusTarget(null)}
            kind="confirm"
            severity={statusTarget.status === "disposed" || statusTarget.status === "missing" ? "danger" : "warning"}
            title={`Mark ${statusTarget.code} as ${statusLabel[statusTarget.status]}?`}
            description="This changes how the asset is reported and filtered across the app."
            isConfirming={savingStatus}
            onConfirm={() => mutateStatus({ id: statusTarget.id, status: statusTarget.status })}
          />
        ) : (
          <AppDialog
            open
            onOpenChange={(open) => !open && setStatusTarget(null)}
            kind="modal"
            title={`Update status — ${statusTarget.code}`}
            footer={
              <>
                <Button variant="outline" onClick={() => setStatusTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setStatusTarget({ ...statusTarget, confirming: true })}>Continue</Button>
              </>
            }
          >
            <select
              value={statusTarget.status}
              onChange={(e) => setStatusTarget({ ...statusTarget, status: e.target.value as AssetStatus })}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px]"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </AppDialog>
        ))}
    </PageContainer>
  );
}

export default function AssetUnitsPage() {
  return (
    <Suspense>
      <UnitsContent />
    </Suspense>
  );
}
