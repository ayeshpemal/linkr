"use server";

import { cookies } from "next/headers";
import {
  CreateLinkResult,
  DailyStat,
  GetLinksResult,
  GetLinkStatsResult,
  Link,
  LinksMeta,
} from "../types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function getLinks(page: number): Promise<GetLinksResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkr_token")?.value;

  if (!token) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/links?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      data?: Link[];
      meta?: LinksMeta;
      error?: string;
    };

    if (!response.ok || !payload.data || !payload.meta) {
      return {
        success: false,
        error: payload.error ?? "Failed to fetch links",
      };
    }

    return {
      success: true,
      data: payload.data,
      meta: payload.meta,
    };
  } catch {
    return {
      success: false,
      error: "Unable to fetch links right now",
    };
  }
}

export async function createLink(formData: FormData): Promise<CreateLinkResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkr_token")?.value;
  const url = String(formData.get("url") ?? "").trim();

  if (!token) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: payload.error ?? "Failed to create link",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Unable to create link right now",
    };
  }
}

export async function getLinkStats(code: string, days: number = 30): Promise<GetLinkStatsResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("linkr_token")?.value;

  if (!token) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/links/${code}/stats?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      total_clicks?: number;
      daily_stats?: DailyStat[];
      error?: string;
    };

    if (!response.ok || payload.total_clicks === undefined || !payload.daily_stats) {
      return {
        success: false,
        error: payload.error ?? "Failed to fetch link stats",
      };
    }

    return {
      success: true,
      totalClicks: payload.total_clicks,
      dailyStats: payload.daily_stats,
    };
  } catch {
    return {
      success: false,
      error: "Unable to fetch link stats right now",
    };
  }
}
