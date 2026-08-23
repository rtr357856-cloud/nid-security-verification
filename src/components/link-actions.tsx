"use client";

import { useState } from "react";
import { Copy, ExternalLink, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { QrDialog } from "@/components/qr-dialog";

export function LinkActions({ url, name }: { url: string; name: string }) {
  const [qrOpen, setQrOpen] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await copy();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy}>
          <Copy className="h-4 w-4" />
          Copy Link
        </Button>
        <Button variant="outline" onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
        <Button variant="outline" onClick={share}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="ghost" onClick={() => window.open(url, "_blank", "noopener")}>
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>
      </div>

      <QrDialog open={qrOpen} onClose={() => setQrOpen(false)} url={url} />
    </>
  );
}
