"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface CopyButtonProps {
  content: string;
  copyMessage?: string;
}

export function CopyButton({
  content,
  copyMessage = "Copied!",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className="h-6 w-6 p-0"
      onClick={handleCopy}
      size="sm"
      variant="ghost"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}
