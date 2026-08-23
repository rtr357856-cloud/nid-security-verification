"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function QrDialog({
  open,
  onClose,
  url,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
}) {
  const [generated, setGenerated] = useState<{ url: string; src: string } | null>(null);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    QRCode.toDataURL(url, { width: 640, margin: 1, errorCorrectionLevel: "M" }).then(
      (src) => {
        if (!cancelled) setGenerated({ url, src });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const dataUrl = generated && generated.url === url ? generated.src : null;

  const download = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qr-code.png";
    a.click();
  }, [dataUrl]);

  return (
    <Dialog open={open} onClose={onClose} title="QR Code">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-slate-200 bg-white">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code" className="h-full w-full rounded-lg" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          )}
        </div>
        <p className="max-w-full truncate text-xs text-slate-500">{url}</p>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={download} disabled={!dataUrl}>
            Download PNG
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
