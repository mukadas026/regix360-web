"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppDialog } from "@/components/global/app-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewerImage = { id: string; url: string };

/**
 * One shared "look at the photo(s)" modal for every image surface in the
 * app (batch photo, per-unit gallery). Always just a viewer with prev/next
 * + a thumbnail strip when there's more than one image; `onAdd`/`onDelete`
 * are optional so the same component works for a read-only viewer (viewer
 * role) and an editable one (asset_manager role) without a second
 * component to maintain.
 */
export function ImageViewerDialog({
  title,
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  onAdd,
  adding = false,
  addLabel = "Add photos",
  multiple = true,
  onDelete,
  deletingId = null,
  deleteLabel = "Remove",
  emptyLabel = "No photos yet.",
}: {
  title: string;
  images: ViewerImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (files: FileList) => void;
  adding?: boolean;
  addLabel?: string;
  multiple?: boolean;
  onDelete?: (image: ViewerImage) => void;
  deletingId?: string | null;
  deleteLabel?: string;
  emptyLabel?: string;
}) {
  const [index, setIndex] = useState(initialIndex);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (index >= images.length && images.length > 0) setIndex(images.length - 1);
  }, [images.length, index]);

  const current = images[index];

  function handleFilesChosen(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !onAdd) return;
    onAdd(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      kind="modal"
      title={title}
      contentClassName="sm:max-w-[560px]"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex gap-2">
            {onAdd && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  multiple={multiple}
                  className="hidden"
                  onChange={(e) => handleFilesChosen(e.target.files)}
                />
                <Button variant="outline" size="sm" disabled={adding} onClick={() => fileInputRef.current?.click()}>
                  {adding ? "Uploading…" : addLabel}
                </Button>
              </>
            )}
            {onDelete && current && (
              <Button
                variant="outline"
                size="sm"
                disabled={deletingId === current.id}
                onClick={() => onDelete(current)}
              >
                {deletingId === current.id ? "Removing…" : deleteLabel}
              </Button>
            )}
          </div>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      }
    >
      {images.length === 0 ? (
        <p className="py-10 text-center text-[13.5px] text-muted-foreground">{emptyLabel}</p>
      ) : (
        <>
          <div className="relative flex items-center justify-center rounded-lg bg-secondary">
            <img src={current.url} alt="" className="max-h-[55vh] w-full rounded-lg object-contain" />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                  title="Previous"
                  className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % images.length)}
                  title="Next"
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-2.5 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "size-12 flex-none overflow-hidden rounded-md border-2",
                    i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={img.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </AppDialog>
  );
}
