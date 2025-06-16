"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { ReactNode } from "react";

// Generate the helpers we need
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

interface UploadthingProviderProps {
  children: ReactNode;
}

export function UploadthingProvider({ children }: UploadthingProviderProps) {
  // In newer versions of uploadthing, there's no provider component
  // The provider functionality is handled internally by the generated helpers
  // So we just return the children directly
  return <>{children}</>;
}