"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Eye,
  Pencil,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { deleteLink, regenerateSlug, toggleLink } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QrDialog } from "@/components/qr-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { LinkWithStats } from "@/lib/links";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export function LinksTable({
  links,
  baseUrl,
}: {
  links: LinkWithStats[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<LinkWithStats | null>(null);
  const [confirm, setConfirm] = useState<{
    link: LinkWithStats;
    type: "delete" | "regenerate";
  } | null>(null);

  const shareUrl = (link: LinkWithStats) => `${baseUrl}/m/${link.slug}`;

  async function handleToggle(link: LinkWithStats) {
    setBusy(`toggle-${link.id}`);
    const res = await toggleLink(link.id);
    setBusy(null);
    if (res.ok) {
      toast.success(res.message === "active" ? "Link enabled" : "Link disabled");
      router.refresh();
    } else {
      toast.error(res.message ?? "Failed to update link");
    }
  }

  async function handleCopy(link: LinkWithStats) {
    const ok = await copyToClipboard(shareUrl(link));
    if (ok) toast.success("Link copied to clipboard");
    else toast.error("Could not copy link");
  }

  async function handleShare(link: LinkWithStats) {
    const url = shareUrl(link);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: link.name, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await handleCopy(link);
  }

  async function handleConfirm() {
    if (!confirm) return;
    const { link, type } = confirm;
    setBusy(`${type}-${link.id}`);
    if (type === "delete") {
      const res = await deleteLink(link.id);
      setBusy(null);
      setConfirm(null);
      if (res.ok) {
        toast.success("Link deleted");
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to delete link");
      }
    } else {
      const res = await regenerateSlug(link.id);
      setBusy(null);
      setConfirm(null);
      if (res.ok && res.slug) {
        toast.success("New link generated");
        await handleCopy(link);
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to regenerate link");
      }
    }
  }

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-slate-900 font-medium">No messaging links yet</p>
          <p className="max-w-sm text-sm text-slate-500">
            Create your first link to start generating shareable messaging links.
          </p>
          <Link
            href="/admin/links/new"
            className="mt-2 inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Create New Link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Link Name</th>
                <th className="px-3 py-3 font-medium">Recipient</th>
                <th className="px-3 py-3 font-medium">Message</th>
                <th className="px-3 py-3 font-medium">URL</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Created</th>
                <th className="px-3 py-3 font-medium text-right">Clicks</th>
                <th className="px-3 py-3 font-medium">Last Opened</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{link.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400 capitalize">
                          {link.platform}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                      {link.recipient_number}
                    </code>
                  </td>
                  <td className="max-w-[180px] px-3 py-3 text-slate-600" title={link.message}>
                    {truncate(link.message, 40)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className="max-w-[130px] truncate font-mono text-xs text-blue-600">
                        /m/{link.slug}
                      </span>
                      <button
                        onClick={() => handleCopy(link)}
                        className="text-slate-400 transition-colors hover:text-slate-700"
                        aria-label={`Copy link for ${link.name}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={link.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {formatDate(link.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {link.total_clicks}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {formatDate(link.last_opened)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton
                        asLink={`/admin/links/${link.id}`}
                        icon={<Eye className="h-4 w-4" />}
                        label="View"
                      />
                      <ActionButton
                        asLink={`/admin/links/${link.id}/edit`}
                        icon={<Pencil className="h-4 w-4" />}
                        label="Edit"
                      />
                      <ActionButton
                        icon={<Copy className="h-4 w-4" />}
                        label="Copy link"
                        onClick={() => handleCopy(link)}
                      />
                      <ActionButton
                        icon={<QrCode className="h-4 w-4" />}
                        label="QR code"
                        onClick={() => setQrLink(link)}
                      />
                      <ActionButton
                        icon={<Share2 className="h-4 w-4" />}
                        label="Share"
                        onClick={() => handleShare(link)}
                      />
                      <ActionButton
                        icon={
                          busy === `toggle-${link.id}` ? (
                            <Spinner />
                          ) : link.status === "active" ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )
                        }
                        label={link.status === "active" ? "Disable" : "Enable"}
                        onClick={() => handleToggle(link)}
                        disabled={busy === `toggle-${link.id}`}
                      />
                      <ActionButton
                        icon={<RefreshCw className="h-4 w-4" />}
                        label="Regenerate link"
                        onClick={() => setConfirm({ link, type: "regenerate" })}
                        disabled={busy === `regenerate-${link.id}`}
                      />
                      <ActionButton
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete"
                        danger
                        onClick={() => setConfirm({ link, type: "delete" })}
                        disabled={busy === `delete-${link.id}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {links.map((link) => (
          <Card key={link.id}>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/admin/links/${link.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {link.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400 capitalize">
                    {link.platform} · {formatDate(link.created_at)}
                  </p>
                </div>
                <StatusBadge status={link.status} />
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Recipient</p>
                  <code className="font-mono text-sm font-medium text-slate-800">
                    {link.recipient_number}
                  </code>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Clicks</p>
                  <p className="text-sm font-semibold text-slate-900">{link.total_clicks}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Message</p>
                  <p className="truncate text-sm text-slate-700">{truncate(link.message, 80)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-blue-700">
                  {shareUrl(link)}
                </span>
                <button
                  onClick={() => handleCopy(link)}
                  className="shrink-0 text-blue-600 hover:text-blue-800"
                  aria-label={`Copy link for ${link.name}`}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <MobileAction href={`/admin/links/${link.id}`} label="View" icon={<Eye className="h-4 w-4" />} />
                <MobileAction href={`/admin/links/${link.id}/edit`} label="Edit" icon={<Pencil className="h-4 w-4" />} />
                <MobileActionButton label="QR" icon={<QrCode className="h-4 w-4" />} onClick={() => setQrLink(link)} />
                <MobileActionButton label="Share" icon={<Share2 className="h-4 w-4" />} onClick={() => handleShare(link)} />
                <MobileActionButton
                  label={link.status === "active" ? "Disable" : "Enable"}
                  icon={link.status === "active" ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  onClick={() => handleToggle(link)}
                  disabled={busy === `toggle-${link.id}`}
                />
                <MobileActionButton
                  label="New URL"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={() => setConfirm({ link, type: "regenerate" })}
                  disabled={busy === `regenerate-${link.id}`}
                />
                <MobileActionButton
                  label="Delete"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setConfirm({ link, type: "delete" })}
                  danger
                  disabled={busy === `delete-${link.id}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <QrDialog
        open={!!qrLink}
        onClose={() => setQrLink(null)}
        url={qrLink ? shareUrl(qrLink) : ""}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirm?.type === "delete" ? "Delete link" : "Regenerate link"}
        description={
          confirm?.type === "delete"
            ? `"${confirm?.link.name}" and all of its click data will be permanently deleted. This cannot be undone.`
            : `A new URL will be generated for "${confirm?.link.name}". The current URL will stop working immediately.`
        }
        confirmLabel={confirm?.type === "delete" ? "Delete" : "Regenerate"}
        loading={busy === `${confirm?.type}-${confirm?.link.id}`}
      />
    </>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <Badge tone={status === "active" ? "green" : "gray"}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  asLink,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  asLink?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const classes = cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
    danger
      ? "text-red-500 hover:bg-red-50 hover:text-red-700"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    disabled && "pointer-events-none opacity-40",
  );
  if (asLink) {
    return (
      <Link href={asLink} className={classes} aria-label={label} title={label}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} aria-label={label} title={label} disabled={disabled}>
      {icon}
    </button>
  );
}

function MobileAction({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileActionButton({
  label,
  icon,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium transition-colors hover:bg-slate-50",
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-600",
        disabled && "opacity-40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />;
}
