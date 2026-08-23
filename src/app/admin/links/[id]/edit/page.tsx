import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateLink } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { LinkForm } from "@/components/link-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Edit link",
};

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase.from("links").select("*").eq("id", id).single();

  if (!link) notFound();

  const updateLinkWithId = updateLink.bind(null, link.id);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/admin/links/${link.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to link
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit Link</h1>

      <Card>
        <CardHeader>
          <CardTitle>Link details</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkForm
            action={updateLinkWithId}
            submitLabel="Save Changes"
            defaultValues={{
              name: link.name,
              recipient_number: link.recipient_number,
              message: link.message,
              platform: link.platform,
              status: link.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
