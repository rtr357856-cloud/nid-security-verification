import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { fetchLinks } from "@/lib/links";
import { getBaseUrl } from "@/lib/base-url";
import { LinksTable } from "@/components/links-table";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const links = await fetchLinks(supabase);
  const baseUrl = await getBaseUrl();

  const totalClicks = links.reduce((sum, l) => sum + l.total_clicks, 0);
  const activeCount = links.filter((l) => l.status === "active").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messaging Links</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Create, share and track your messaging links.
          </p>
        </div>
        <Link
          href="/admin/links/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create New Link
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Total links</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{links.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Active links</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Total clicks</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{totalClicks}</p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Loading links…</p>}>
        <LinksTable links={links} baseUrl={baseUrl} />
      </Suspense>
    </div>
  );
}
