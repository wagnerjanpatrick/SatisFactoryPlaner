"use client";

import { File } from "lucide-react";

interface FilePreviewProps {
  file: File;
}

export function FilePreview({ file }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted px-2 py-1 text-sm">
      <File className="h-4 w-4" />
      <span className="truncate">{file.name}</span>
    </div>
  );
}
