export type Link = {
  id: string;
  user_id: string;
  short_code: string;
  url: string;
  click_count: number;
  created_at: string;
};

export type LinksMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type GetLinksResult =
  | {
      success: true;
      data: Link[];
      meta: LinksMeta;
    }
  | {
      success: false;
      error: string;
    };

export type CreateLinkResult = { success: true } | { success: false; error: string };

export type DailyStat = {
  date: string;
  count: number;
};

export type GetLinkStatsResult =
  | {
      success: true;
      totalClicks: number;
      dailyStats: DailyStat[];
    }
  | {
      success: false;
      error: string;
    };

export type StatsState = {
  totalClicks: number;
  dailyStats: DailyStat[];
};
