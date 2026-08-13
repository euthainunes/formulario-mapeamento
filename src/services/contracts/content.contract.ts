import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint } from "@/types/metrics";
import { ContentItem } from "@/types/content";

export interface PerformanceDistribution {
  bucket: string;
  count: number;
}

export interface ContentData {
  kpis: KpiCard[];
  items: ContentItem[];
  publicationsByDate: TimeSeriesPoint[];
  performanceDistribution: PerformanceDistribution[];
  mostViewed: ContentItem[];
  mostLiked: ContentItem[];
  mostCommented: ContentItem[];
  partialCoverage?: boolean;
}

export interface IContentRepository {
  getContentData(filters: GlobalFilters): Promise<ContentData>;
}
