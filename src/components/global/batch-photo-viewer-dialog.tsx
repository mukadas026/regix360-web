"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { updateBatchImage, uploadBatchImage } from "@/api";
import type { ApiError } from "@/api";
import { ImageViewerDialog } from "@/components/global/image-viewer-dialog";

/**
 * Thin wrapper around the shared ImageViewerDialog for the ONE shared
 * batch photo (same image for every unit from that delivery). Callers
 * supply the current signed imageUrl (already in hand from wherever they
 * fetched the batch/unit) and an onChanged callback to invalidate/refetch
 * whatever query gave them that URL — this component owns only the
 * upload/replace/clear mutations, not the data fetch.
 */
export function BatchPhotoViewerDialog({
  batchId,
  imageUrl,
  open,
  onOpenChange,
  onChanged,
  canManage = false,
}: {
  batchId: string | null;
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  canManage?: boolean;
}) {
  const { mutate: replacePhoto, isPending: uploading } = useMutation({
    mutationFn: async (files: FileList) => {
      const path = await uploadBatchImage.fn(files[0]);
      return updateBatchImage.fn(batchId as string, path);
    },
    onSuccess: () => {
      onChanged();
      toast("Batch photo updated");
    },
    onError: (error) => toast.error((error as ApiError).message ?? "Couldn't upload that photo."),
  });

  const { mutate: clearPhoto, isPending: clearing } = useMutation({
    mutationFn: () => updateBatchImage.fn(batchId as string, null),
    onSuccess: () => {
      onChanged();
      toast("Batch photo removed");
    },
    onError: (error) => toast.error((error as ApiError).message ?? "Couldn't remove that photo."),
  });

  return (
    <ImageViewerDialog
      title="Batch photo"
      images={imageUrl ? [{ id: "batch", url: imageUrl }] : []}
      open={open}
      onOpenChange={onOpenChange}
      emptyLabel="No batch photo yet."
      multiple={false}
      onAdd={canManage && batchId ? (files) => replacePhoto(files) : undefined}
      adding={uploading}
      addLabel={imageUrl ? "Change photo" : "Add photo"}
      onDelete={canManage && batchId && imageUrl ? () => clearPhoto() : undefined}
      deletingId={clearing ? "batch" : null}
      deleteLabel="Remove"
    />
  );
}
