import { client, throwError } from "./client";
import { supabase } from "@/lib/supabase-client";
import type {
  ImportCommitAccepted,
  ImportInitResult,
  ImportPreviewResult,
  ImportRecord,
  ImportUploadedResult,
} from "@/types/asset-platform";

export const initImport = {
  fn: async (fileName: string): Promise<ImportInitResult> => {
    try {
      const res = await client.post<ImportInitResult>("/api/imports", { fileName });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export async function uploadImportFile(upload: ImportInitResult["upload"], file: File) {
  const { error } = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file);
  if (error) {
    throw { name: "ApiError", message: error.message ?? "The file upload failed. Try again." };
  }
}

export const markUploaded = {
  fn: async (batchId: string): Promise<ImportUploadedResult> => {
    try {
      const res = await client.post<ImportUploadedResult>(`/api/imports/${batchId}/uploaded`);
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type PreviewImportInput = {
  batchId: string;
  columnMapping: Record<string, string>;
};

export const previewImport = {
  fn: async ({ batchId, columnMapping }: PreviewImportInput): Promise<ImportPreviewResult> => {
    try {
      const res = await client.post<ImportPreviewResult>(`/api/imports/${batchId}/preview`, { columnMapping });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export type CommitImportInput = {
  batchId: string;
  categoryOverrides?: Record<string, string>;
  locationCodes?: Record<string, string>;
  departmentCodes?: Record<string, string>;
};

export const commitImport = {
  fn: async ({ batchId, categoryOverrides, locationCodes, departmentCodes }: CommitImportInput): Promise<ImportCommitAccepted> => {
    try {
      const res = await client.post<ImportCommitAccepted>(`/api/imports/${batchId}/commit`, {
        categoryOverrides,
        locationCodes,
        departmentCodes,
      });
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

export const getImportStatus = {
  key: (batchId: string) => ["imports", batchId] as const,
  fn: async (batchId: string): Promise<ImportRecord> => {
    try {
      const res = await client.get<{ import: ImportRecord }>(`/api/imports/${batchId}`);
      return res.data.import;
    } catch (error) {
      throwError(error);
    }
  },
};

export const getImports = {
  key: ["imports"] as const,
  fn: async (): Promise<ImportRecord[]> => {
    try {
      const res = await client.get<{ imports: ImportRecord[] }>("/api/imports");
      return res.data.imports;
    } catch (error) {
      throwError(error);
    }
  },
};

export const getImportFileUrl = {
  fn: async (importId: string) => {
    try {
      const res = await client.get<{ url: string; fileName: string; expiresInSeconds: number }>(
        `/api/imports/${importId}/file`,
      );
      return res.data;
    } catch (error) {
      throwError(error);
    }
  },
};

// The endpoint requires the same Bearer auth as everything else, so a plain
// <a href> won't work (browsers don't attach custom headers on navigation) —
// fetch it authenticated and trigger the download client-side instead.
export const downloadSkippedCsv = {
  fn: async (importId: string) => {
    try {
      const res = await client.get(`/api/imports/${importId}/skipped`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `import-${importId}-skipped.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      throwError(error);
    }
  },
};
