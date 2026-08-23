import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Unavailable",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <Lock className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
          not found need some updates
        </h1>
        <p className="mt-3 max-w-md text-base text-slate-400">
          The application failed to start and is unavailable right now. Please try
          again later.
        </p>
        <p className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          Error: application failed to start
        </p>
      </div>
    </main>
  );
}