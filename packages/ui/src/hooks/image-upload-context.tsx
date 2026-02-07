"use client";
import { createContext, type ReactNode, useContext } from "react";

type UploadFn = (file: File) => Promise<string>;

const ImageUploadContext = createContext<UploadFn | null>(null);

interface ImageUploadProviderProps {
  children: ReactNode;
  uploadFn: UploadFn;
}

export function ImageUploadProvider({
  children,
  uploadFn,
}: ImageUploadProviderProps) {
  return (
    <ImageUploadContext.Provider value={uploadFn}>
      {children}
    </ImageUploadContext.Provider>
  );
}

export function useImageUploadFn(): UploadFn | null {
  return useContext(ImageUploadContext);
}
