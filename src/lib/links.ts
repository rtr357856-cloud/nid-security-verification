import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, LinkStatus, MessagingPlatform } from "@/types/database";

export type LinkRow = Database["public"]["Tables"]["links"]["Row"];

export type SupabaseServer = SupabaseClient<Database>;

export type LinkWithStats = LinkRow & {
  total_clicks: number;
  last_opened: string | null;
};

/**
 * Fetch all links (RLS restricts to admins) with click stats.
 */
export async function fetchLinks(supabase: SupabaseServer): Promise<LinkWithStats[]> {
  const { data: links, error } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !links) return [];

  const { data: stats } = await supabase.from("link_stats").select("*");

  const statsMap = new Map<string, { total_clicks: number; last_opened: string | null }>();
  for (const row of stats ?? []) {
    statsMap.set(row.link_id, {
      total_clicks: row.total_clicks,
      last_opened: row.last_opened,
    });
  }

  return links.map((link) => ({
    ...link,
    total_clicks: statsMap.get(link.id)?.total_clicks ?? 0,
    last_opened: statsMap.get(link.id)?.last_opened ?? null,
  }));
}

export type ClickBreakdown = {
  name: string;
  count: number;
};

export type LinkStats = {
  totals: number;
  lastOpened: string | null;
  byDevice: ClickBreakdown[];
  byBrowser: ClickBreakdown[];
  byOs: ClickBreakdown[];
  recent: Array<{
    id: string;
    clicked_at: string;
    device_type: string | null;
    browser: string | null;
    os: string | null;
  }>;
};

export async function fetchLinkStats(
  supabase: SupabaseServer,
  linkId: string,
  limit = 100,
): Promise<LinkStats> {
  const { count } = await supabase
    .from("clicks")
    .select("*", { count: "exact", head: true })
    .eq("link_id", linkId);

  const { data: recent, error } = await supabase
    .from("clicks")
    .select("id, clicked_at, device_type, browser, os")
    .eq("link_id", linkId)
    .order("clicked_at", { ascending: false })
    .limit(limit);

  if (error || !recent) {
    return { totals: 0, lastOpened: null, byDevice: [], byBrowser: [], byOs: [], recent: [] };
  }

  const countBy = (key: "device_type" | "browser" | "os"): ClickBreakdown[] => {
    const map = new Map<string, number>();
    for (const r of recent) {
      const value = r[key] ?? "Unknown";
      map.set(value, (map.get(value) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    totals: count ?? 0,
    lastOpened: recent[0]?.clicked_at ?? null,
    byDevice: countBy("device_type"),
    byBrowser: countBy("browser"),
    byOs: countBy("os"),
    recent,
  };
}

export type LinkInput = {
  name: string;
  recipient_number: string;
  message: string;
  platform: MessagingPlatform;
  status: LinkStatus;
};
