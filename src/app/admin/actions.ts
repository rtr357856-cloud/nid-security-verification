"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LinkFormSchema, type FormState } from "@/lib/validation";
import { generateSlug } from "@/lib/utils";
import type { LinkInput, SupabaseServer } from "@/lib/links";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

async function insertLinkWithSlug(
  supabase: SupabaseServer,
  input: LinkInput & { created_by: string | null },
) {
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("links")
      .insert({ ...input, slug })
      .select("id")
      .single();
    if (!error) return { data, error: null };
    if (!isUniqueViolation(error)) return { data, error };
  }
  return { data: null, error: new Error("Could not generate a unique link") };
}

async function updateSlugWithRetry(supabase: SupabaseServer, id: string) {
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("links")
      .update({ slug, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, slug")
      .single();
    if (!error) return { data, error: null };
    if (!isUniqueViolation(error)) return { data, error };
  }
  return { data: null, error: new Error("Could not generate a unique link") };
}

export async function createLink(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = LinkFormSchema.safeParse({
    name: formData.get("name"),
    recipient_number: formData.get("recipient_number"),
    message: formData.get("message"),
    platform: formData.get("platform"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the errors below." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await insertLinkWithSlug(supabase, {
    name: parsed.data.name,
    recipient_number: parsed.data.recipient_number,
    message: parsed.data.message,
    platform: parsed.data.platform,
    status: parsed.data.status,
    created_by: user.id,
  });

  if (error) {
    return { message: `Failed to create link: ${error.message}` };
  }

  revalidatePath("/admin");
  redirect(`/admin/links/${data?.id}`);
}

export async function updateLink(
  id: string,
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = LinkFormSchema.safeParse({
    name: formData.get("name"),
    recipient_number: formData.get("recipient_number"),
    message: formData.get("message"),
    platform: formData.get("platform"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the errors below." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("links")
    .update({
      name: parsed.data.name,
      recipient_number: parsed.data.recipient_number,
      message: parsed.data.message,
      platform: parsed.data.platform,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { message: `Failed to update link: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
  redirect(`/admin/links/${id}`);
}

export async function toggleLink(id: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: link } = await supabase.from("links").select("status").eq("id", id).single();
  if (!link) return { ok: false, message: "Link not found." };

  const nextStatus = link.status === "active" ? "inactive" : "active";
  const { error } = await supabase
    .from("links")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
  return { ok: true, message: nextStatus };
}

export async function deleteLink(id: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function regenerateSlug(id: string): Promise<{
  ok: boolean;
  slug?: string;
  message?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await updateSlugWithRetry(supabase, id);

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Failed to regenerate link." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
  return { ok: true, slug: data.slug };
}
