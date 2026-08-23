import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { fetchLinkStats } from "@/lib/links";
import { getBaseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkActions } from "@/components/link-actions";

export const metadata: Metadata = {
  title: "Link details",
};

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase.from("links").select("*").eq("id", id).single();
  if (!link) notFound();

  const stats = await fetchLinkStats(supabase, link.id);
  const baseUrl = await getBaseUrl();
  const shareUrl = `${baseUrl}/m/${link.slug}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <Link
          href={`/admin/links/${link.id}/edit`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{link.name}</h1>
        <Badge tone={link.status === "active" ? "green" : "gray"}>
          {link.status === "active" ? "Active" : "Inactive"}
        </Badge>
        <Badge tone="blue">{link.platform}</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shareable Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 break-all font-mono text-sm text-blue-700">{shareUrl}</span>
          </div>
          <LinkActions url={shareUrl} name={link.name} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Recipient number
                </p>
                <code className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-slate-800">
                  {link.recipient_number}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Pre-filled message
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">
                  {link.message}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p>
                  <p className="mt-1 text-slate-700">{formatDate(link.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Updated</p>
                  <p className="mt-1 text-slate-700">{formatDate(link.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">{stats.totals}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total clicks
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-sm font-semibold leading-6 text-slate-900">
                  {formatDate(stats.lastOpened)}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last opened
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Audience breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Breakdown title="Device type" rows={stats.byDevice} />
              <Breakdown title="Browser" rows={stats.byBrowser} />
              <Breakdown title="Operating system" rows={stats.byOs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent clicks</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recent.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No clicks yet. Share the link and the first visitor will show up here.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {stats.recent.slice(0, 10).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {c.device_type ?? "Unknown"} · {c.browser ?? "Unknown"} · {c.os ?? "Unknown"}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(c.clicked_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0) {
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">{title}</p>
        <p className="text-sm text-slate-400">No data yet.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-slate-600">{row.name}</span>
              <span className="font-medium text-slate-500">{row.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${(row.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
