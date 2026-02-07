"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useImageUploadFn } from "./image-upload-context";

interface UseImageUploadProps {
  onUpload?: (url: string) => void;
  uploadFn?: (file: File) => Promise<string>;
}

export function useImageUpload({
  onUpload,
  uploadFn: propUploadFn,
}: UseImageUploadProps = {}) {
  const contextUploadFn = useImageUploadFn();
  const uploadFn = propUploadFn ?? contextUploadFn;

  if (!uploadFn) {
    throw new Error(
      "useImageUpload requires either an uploadFn prop or an ImageUploadProvider"
    );
  }

  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performUpload = useCallback(
    async (file: File): Promise<string> => {
      try {
        setUploading(true);
        setError(null);
        const url = await uploadFn(file);
        return url;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setUploading(false);
      }
    },
    [uploadFn]
  );

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        previewRef.current = localUrl;

        try {
          const uploadedUrl = await performUpload(file);
          onUpload?.(uploadedUrl);
        } catch (err) {
          URL.revokeObjectURL(localUrl);
          setPreviewUrl(null);
          setFileName(null);
          console.error(err);
        }
      }
    },
    [onUpload, performUpload]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    previewRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }, [previewUrl]);

  useEffect(
    () => () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    },
    []
  );

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  };
}
