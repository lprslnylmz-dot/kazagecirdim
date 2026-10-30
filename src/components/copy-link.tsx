"use client";

import { useState } from "react";

export function CopyLink({ label = "Bağlantıyı kopyala" }: { label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary btn-sm ml-2 mt-2 sm:mt-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* pano izni yoksa sessizce geç */
        }
      }}
    >
      {copied ? "Kopyalandı" : label}
    </button>
  );
}
