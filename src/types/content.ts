export type ContentType = "noticia" | "video" | "enquete" | "photobook" | "blog" | "podcast";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  publishedAt: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  performance: "acima_media" | "na_media" | "abaixo_media";
}

export interface BeezzPost {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  likes: number;
  comments: number;
}

export const REACTION_TYPES = [
  "countBeezzLiked",
  "countCommentsBeezz",
  "countBeezzCommentLike",
  "countNewsLiked",
  "countCommentsNews",
  "countNewsCommentLike",
  "countVideoLiked",
  "countCommentsVideos",
  "countPollLiked",
  "countPhotobookLiked",
  "countBlogLiked",
  "countPodcastLiked",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_LABELS: Record<ReactionType, string> = {
  countBeezzLiked: "Curtidas em Beezz",
  countCommentsBeezz: "Comentários em Beezz",
  countBeezzCommentLike: "Curtidas em comentários de Beezz",
  countNewsLiked: "Curtidas em notícias",
  countCommentsNews: "Comentários em notícias",
  countNewsCommentLike: "Curtidas em comentários de notícias",
  countVideoLiked: "Curtidas em vídeos",
  countCommentsVideos: "Comentários em vídeos",
  countPollLiked: "Curtidas em enquetes",
  countPhotobookLiked: "Curtidas em photobooks",
  countBlogLiked: "Curtidas em blog",
  countPodcastLiked: "Curtidas em podcast",
};

export interface ReactionTotal {
  type: ReactionType;
  label: string;
  count: number;
}

export interface Pod {
  id: string;
  name: string;
  description: string;
  accessCount: number;
  participationPercent: number;
  status: "crescimento" | "queda" | "estavel";
}
