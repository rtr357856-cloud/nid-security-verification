"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, LogOut, Plus } from "lucide-react";

import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Link2 className="h-4 w-4 text-white" />
          </span>
          <span className="hidden sm:inline">MasterLink</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/links/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Link</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
