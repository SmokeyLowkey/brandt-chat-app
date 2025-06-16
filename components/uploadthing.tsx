"use client";

import { useCallback } from "react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

export function UploadButton({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadProgress,
  className,
}: {
  endpoint: keyof OurFileRouter;
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
}) {
  const { startUpload, isUploading } = useUploadThing(endpoint);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        const res = await startUpload(Array.from(files));
        
        if (onUploadProgress) {
          onUploadProgress(100); // Set to 100% when complete
        }

        onClientUploadComplete?.(res);
      } catch (error) {
        onUploadError?.(error as Error);
      }
    },
    [startUpload, onClientUploadComplete, onUploadError, onUploadProgress]
  );

  return (
    <div className={className}>
      <label
        className="bg-[#E31937] hover:bg-[#c01730] text-white font-medium py-2 px-4 rounded cursor-pointer inline-block"
        htmlFor="file-upload"
      >
        {isUploading ? "Uploading..." : "Select Files"}
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
        multiple
        disabled={isUploading}
      />
    </div>
  );
}

export function UploadDropzone({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  onUploadProgress,
  className,
}: {
  endpoint: keyof OurFileRouter;
  onClientUploadComplete?: (res: any) => void;
  onUploadError?: (error: Error) => void;
  onUploadProgress?: (progress: number) => void;
  className?: string;
}) {
  const { startUpload, isUploading } = useUploadThing(endpoint);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      try {
        const res = await startUpload(files);
        
        if (onUploadProgress) {
          onUploadProgress(100); // Set to 100% when complete
        }

        onClientUploadComplete?.(res);
      } catch (error) {
        onUploadError?.(error as Error);
      }
    },
    [startUpload, onClientUploadComplete, onUploadError, onUploadProgress]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      handleUpload(files);
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-medium">Drag and drop files here</p>
        <p className="text-sm text-gray-500">or</p>
        <label
          className="bg-[#E31937] hover:bg-[#c01730] text-white font-medium py-2 px-4 rounded cursor-pointer"
          htmlFor="dropzone-file"
        >
          {isUploading ? "Uploading..." : "Select Files"}
        </label>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            handleUpload(Array.from(files));
          }}
          multiple
          disabled={isUploading}
        />
      </div>
    </div>
  );
}