"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deleteUnitImage, getAsset, uploadUnitImage } from "@/api";
import type { ApiError } from "@/api";
import { ImageViewerDialog } from "@/components/global/image-viewer-dialog";

/**
 * This unit's OWN photo gallery only (many photos — front, serial plate,
 * damage). The shared batch photo (one per batch, same for every unit
 * from that delivery) is a separate concept — see BatchPhotoViewerDialog —
 * managed on the batch details page, not here.
 */
export function AssetImageGalleryDialog({
  assetId,
  open,
  onOpenChange,
  fallbackImageUrl = null,
}: {
  assetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The unit's own thumbnail, already known from wherever this dialog was
  // opened (e.g. the units table row) — used if the gallery fetch below
  // ever comes back empty despite that known thumbnail existing, so a
  // photo visibly on screen never appears to vanish in the viewer.
  fallbackImageUrl?: string | null;
}) {
  const queryClient = useQueryClient();

  // staleTime: 0 — this dialog stays mounted with `enabled` just toggling,
  // so the global 1h staleTime would otherwise serve a cached "no images"
  // result from before a photo existed (e.g. added via a different flow
  // or session) instead of refetching on open.
  const { data: asset } = useQuery({
    queryKey: getAsset.key(assetId ?? ""),
    queryFn: () => getAsset.fn(assetId as string),
    enabled: open && Boolean(assetId),
    staleTime: 0,
  });

  function invalidateAfterMutate() {
    queryClient.invalidateQueries({ queryKey: getAsset.key(assetId ?? "") });
    queryClient.invalidateQueries({ queryKey: ["asset-units"] });
  }

  // The API only accepts one file per mint→upload→confirm cycle (no bulk
  // endpoint), but the picker lets you select several at once — so this
  // loops the single-file call, sequentially (keeps gallery `position`
  // ordering matching selection order), and reports how many made it.
  const { mutate: uploadImages, isPending: uploading } = useMutation({
    mutationFn: async (files: FileList) => {
      let succeeded = 0;
      let failed = 0;
      for (const file of Array.from(files)) {
        try {
          await uploadUnitImage.fn(assetId as string, file);
          succeeded++;
        } catch {
          failed++;
        }
      }
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      invalidateAfterMutate();
      if (succeeded && !failed) toast(`${succeeded} photo${succeeded === 1 ? "" : "s"} added`);
      else if (succeeded && failed) toast(`${succeeded} added, ${failed} failed`);
      else toast.error("Couldn't upload those photos.");
    },
  });

  const { mutate: removeImage, isPending: deleting, variables: deletingImageId } = useMutation({
    mutationFn: (imageId: string) => deleteUnitImage.fn(assetId as string, imageId),
    onSuccess: () => {
      invalidateAfterMutate();
      toast("Photo removed");
    },
    onError: (error) => toast.error((error as ApiError).message ?? "Couldn't remove that photo."),
  });

  const fetchedImages = [...(asset?.images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ id: img.id, url: img.url }));

  // Prefer the real gallery once fetched. Only fall back to the known
  // row thumbnail if the fetch came back empty despite it existing —
  // that thumbnail has no real image id, so it can be viewed but not
  // deleted from here.
  const usingFallback = fetchedImages.length === 0 && Boolean(fallbackImageUrl);
  const images = usingFallback ? [{ id: "thumbnail", url: fallbackImageUrl as string }] : fetchedImages;

  return (
    <ImageViewerDialog
      title={asset ? `This unit's photos — ${asset.code}` : "This unit's photos"}
      images={images}
      open={open}
      onOpenChange={onOpenChange}
      onAdd={(files) => uploadImages(files)}
      adding={uploading}
      addLabel="Add photos"
      onDelete={usingFallback ? undefined : (image) => removeImage(image.id)}
      deletingId={deleting ? (deletingImageId as string) : null}
    />
  );
}
