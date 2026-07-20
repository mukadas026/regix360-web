"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AppDialogKind = "alert" | "confirm" | "modal";
export type AppDialogSeverity = "info" | "warning" | "danger";

const severityIcon: Record<AppDialogSeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  danger: OctagonAlert,
};

const severityClass: Record<AppDialogSeverity, string> = {
  info: "bg-accent text-accent-foreground",
  warning: "bg-status-fair/15 text-status-fair",
  danger: "bg-status-bad/15 text-status-bad",
};

const severityButtonVariant: Record<AppDialogSeverity, "default" | "destructive"> = {
  info: "default",
  warning: "default",
  danger: "destructive",
};

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AppDialogKind;
  severity?: AppDialogSeverity;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirming?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  footer?: ReactNode;
};

/**
 * The one place in the app that asks "are you sure" or shows a form modal.
 * `kind` picks the shape: "alert" is a single-button acknowledgement,
 * "confirm" is a Cancel/Confirm pair styled by `severity`, "modal" renders
 * arbitrary `children` + a custom `footer` (used for small forms like
 * "change custodian" that need an input before confirming).
 */
export function AppDialog({
  open,
  onOpenChange,
  kind,
  severity = "info",
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isConfirming = false,
  confirmDisabled = false,
  children,
  footer,
}: AppDialogProps) {
  const Icon = severityIcon[severity];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {kind !== "modal" && (
            <div className={cn("mb-1 flex size-9 items-center justify-center rounded-full", severityClass[severity])}>
              <Icon size={18} />
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {description && <p className="text-[13.5px] text-muted-foreground">{description}</p>}
        {children}

        {kind === "modal" ? (
          footer && <DialogFooter>{footer}</DialogFooter>
        ) : (
          <DialogFooter>
            {kind === "confirm" && (
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={kind === "confirm" ? severityButtonVariant[severity] : "default"}
              disabled={isConfirming || confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel ?? (kind === "alert" ? "OK" : "Confirm")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
