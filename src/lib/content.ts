import { useEffect, useState } from "react";
import { jobPostings, type JobPosting } from "../data/careers";
import { clients as localClients } from "../data/clients";
import { history as localHistory, orgChart as localOrg, type HistoryPeriod } from "../data/company";
import { works as localWorks, type WorkItem } from "../data/works";

/**
 * 공개 페이지의 서버 콘텐츠 훅 (설계 §8 프론트엔드 연동 지점).
 *
 * API 가 없는 환경(GitHub Pages 프리뷰·오프라인)이나 아직 데이터가 없는 초기 상태에서는
 * src/data/* 하드코딩 데이터로 폴백해 화면이 비지 않게 한다.
 * 응답은 모듈 캐시에 저장해 페이지 이동 시 재요청하지 않는다.
 */

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const body = (await res.json()) as { ok: boolean; data: T };
    return body.ok ? body.data : null;
  } catch {
    return null;
  }
}

const cache = new Map<string, unknown>();

function useCached<T>(key: string, load: () => Promise<T>, fallback: T): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(() => (cache.has(key) ? (cache.get(key) as T) : fallback));
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    if (cache.has(key)) return;
    let alive = true;
    void load().then((result) => {
      cache.set(key, result);
      if (alive) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}

/* ---------------- 채용공고 (F3) */

export function useJobs(): { jobs: JobPosting[]; loading: boolean } {
  const { data, loading } = useCached<JobPosting[]>(
    "jobs",
    async () => {
      const rows = await apiGet<JobPosting[]>("/api/jobs");
      return rows && rows.length ? rows : jobPostings;
    },
    jobPostings,
  );
  return { jobs: data, loading };
}

/** 상세 진입 시 조회수 집계 — 응답은 쓰지 않는다 (목록 데이터로 렌더) */
export function useJobViewPing(id: string | undefined) {
  useEffect(() => {
    if (!id) return;
    void fetch(`/api/jobs?id=${encodeURIComponent(id)}`).catch(() => undefined);
  }, [id]);
}

/* ---------------- 포트폴리오 (F5) */

export function useWorks(): { works: WorkItem[]; loading: boolean } {
  const { data, loading } = useCached<WorkItem[]>(
    "works",
    async () => {
      const rows = await apiGet<WorkItem[]>("/api/works");
      return rows && rows.length ? rows : localWorks;
    },
    localWorks,
  );
  return { works: data, loading };
}

/* ---------------- 사이트 콘텐츠 — 연혁·조직·클라이언트·팝업·기능 토글 (F14·C1·F16) */

export interface SitePopup {
  id: string;
  title: string;
  imagePath: string | null;
  linkUrl: string | null;
}

export interface SiteContent {
  history: HistoryPeriod[];
  org: { division: string; teams: string[] }[];
  clients: string[];
  popup: SitePopup | null;
  settings: Record<string, unknown>;
}

const SITE_FALLBACK: SiteContent = {
  history: localHistory,
  org: localOrg,
  clients: localClients,
  popup: null,
  settings: {},
};

export function useSiteContent(): { site: SiteContent; loading: boolean } {
  const { data, loading } = useCached<SiteContent>(
    "site",
    async () => {
      const d = await apiGet<SiteContent>("/api/site");
      if (!d) return SITE_FALLBACK;
      return {
        history: d.history?.length ? d.history : localHistory,
        org: d.org?.length ? d.org : localOrg,
        clients: d.clients?.length ? d.clients : localClients,
        popup: d.popup ?? null,
        settings: d.settings ?? {},
      };
    },
    SITE_FALLBACK,
  );
  return { site: data, loading };
}

/* ---------------- 회사소개서 (F13) */

export interface BrochureMeta {
  id: string;
  version: string;
  url: string;
  fileSize: number;
}

export function useBrochureMeta(): { meta: BrochureMeta | null } {
  const { data } = useCached<BrochureMeta | null>(
    "brochure",
    () => apiGet<BrochureMeta | null>("/api/brochure"),
    null,
  );
  return { meta: data };
}

/** 소개서 열람·다운로드 집계 — 서버 카운트 (F13). id 가 없으면(폴백) 건너뛴다 */
export function countBrochure(id: string | undefined, action: "view" | "download") {
  if (!id) return;
  void fetch("/api/brochure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action }),
  }).catch(() => undefined);
}

/* ---------------- 공지사항 */

export interface NoticeListItem {
  id: string;
  slug: string;
  title: string;
  pinned: boolean;
  publishedAt: string;
  viewCount: number;
  sourceName: string | null;
  sourceUrl: string | null;
  thumb: string | null;
}

export interface NoticeImage {
  name: string;
  size: number | null;
  width: number | null;
  height: number | null;
  url: string;
  downloadUrl: string;
}

export interface NoticeDetail extends NoticeListItem {
  body: string;
  images: NoticeImage[];
}

export function useNotices(): { notices: NoticeListItem[]; loading: boolean } {
  const { data, loading } = useCached<NoticeListItem[]>(
    "notices",
    async () => (await apiGet<NoticeListItem[]>("/api/site?resource=notices")) ?? [],
    [],
  );
  return { notices: data, loading };
}

/** 상세는 슬러그별 캐시. 서버가 조회수를 함께 집계한다 */
export function useNotice(slug: string | undefined): {
  notice: NoticeDetail | null;
  loading: boolean;
} {
  const { data, loading } = useCached<NoticeDetail | null>(
    `notice:${slug ?? ""}`,
    () =>
      slug
        ? apiGet<NoticeDetail>(`/api/site?resource=notices&slug=${encodeURIComponent(slug)}`)
        : Promise.resolve(null),
    null,
  );
  return { notice: data, loading };
}
