import type { Metadata } from "next";
import { Link2 } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "NID Verification",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Link2 className="h-6 w-6 text-white" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-wide text-white">
            NID VERIFICATION
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Admin sign in to manage verification links.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
