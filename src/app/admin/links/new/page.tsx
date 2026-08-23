import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createLink } from "@/app/admin/actions";
import { LinkForm } from "@/components/link-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "New link",
};

export default function NewLinkPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create New Link</h1>

      <Card>
        <CardHeader>
          <CardTitle>Link details</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkForm action={createLink} submitLabel="Generate Link" />
        </CardContent>
      </Card>
    </div>
  );
}
