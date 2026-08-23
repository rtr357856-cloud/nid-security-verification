"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { FormState, LinkFormValues } from "@/lib/validation";

export function LinkForm({
  action,
  defaultValues,
  submitLabel = "Generate Link",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<LinkFormValues>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors;

  return (
    <form action={formAction} className="space-y-5">
      {state?.message && !errors && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.message}
        </div>
      )}

      <Field error={errors?.name?.[0]}>
        <Label htmlFor="name">Link Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="e.g. Summer promotion"
          required
        />
        <p className="mt-1 text-xs text-slate-400">Internal reference only — never shown publicly.</p>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field error={errors?.recipient_number?.[0]}>
          <Label htmlFor="recipient_number">Recipient Number</Label>
          <Input
            id="recipient_number"
            name="recipient_number"
            defaultValue={defaultValues?.recipient_number}
            placeholder="e.g. 1223"
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </Field>

        <Field error={errors?.platform?.[0]}>
          <Label htmlFor="platform">Messaging Platform</Label>
          <Select id="platform" name="platform" defaultValue={defaultValues?.platform ?? "sms"}>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </Select>
        </Field>
      </div>

      <Field error={errors?.message?.[0]}>
        <Label htmlFor="message">Pre-filled Message</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={defaultValues?.message}
          placeholder="Hi, this is your message."
          required
        />
        <p className="mt-1 text-xs text-slate-400">
          This text will be pre-filled when someone opens the link. They only press Send.
        </p>
      </Field>

      <Field error={errors?.status?.[0]}>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? "active"}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending} className="min-w-[170px]">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
