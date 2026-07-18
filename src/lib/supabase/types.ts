/**
 * Database types for the Phase 0 schema (supabase/migrations/0001_init.sql).
 *
 * Hand-maintained. Once the project is linked you can regenerate instead:
 *   npx supabase gen types typescript --project-id akylsmzcoavwokikjlbb > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubmissionProof = "oauth_owner" | "roast_me_topic";
export type RepoStatus = "queued" | "crawling" | "roasted" | "failed";
export type VideoStatus = "pending" | "rendering" | "ready" | "failed";

/** Columns the database fills in for you, so they're optional on insert. */
type Table<Row, Generated extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Generated> & Partial<Pick<Row, Generated>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type UserRow = {
  id: string;
  github_id: number;
  github_login: string;
  avatar_url: string | null;
  created_at: string;
}

export type RepoRow = {
  id: string;
  owner: string;
  name: string;
  html_url: string;
  homepage_url: string | null;
  description: string | null;
  topics: string[];
  stars: number;
  forks: number;
  open_issues: number;
  primary_lang: string | null;
  pushed_at: string | null;
  submitted_by: string | null;
  proof: SubmissionProof;
  status: RepoStatus;
  error: string | null;
  skull_count: number;
  created_at: string;
  updated_at: string;
}

export type CrawlRow = {
  repo_id: string;
  readme: string | null;
  languages: Json;
  commits: Json;
  file_tree: Json;
  manifests: Json;
  screenshot_url: string | null;
  site_title: string | null;
  site_description: string | null;
  og_tags: Json;
  badge_count: number;
  todo_count: number;
  has_node_modules: boolean;
  dead_demo_links: string[];
  secret_suspected: boolean;
  crawled_at: string;
}

export type ScoreRow = {
  repo_id: string;
  slop_score: number;
  originality_deficit: number;
  abandonment_index: number;
  readme_cope: number;
  commit_poetry: number;
  vibe_check: number;
  crimes: Json;
  computed_at: string;
}

export type RoastRow = {
  repo_id: string;
  video_script: string;
  page_roast: string;
  one_liner: string;
  sarcastic_tagline: string;
  model: string | null;
  created_at: string;
}

export type ReceiptRow = {
  id: string;
  repo_id: string;
  name: string;
  url: string;
  description: string | null;
  position: number;
}

export type VideoRow = {
  repo_id: string;
  status: VideoStatus;
  job_id: string | null;
  video_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type ReactionRow = {
  id: string;
  repo_id: string;
  fingerprint: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: Table<UserRow, "id" | "created_at" | "avatar_url">;
      repos: Table<
        RepoRow,
        | "id"
        | "topics"
        | "stars"
        | "forks"
        | "open_issues"
        | "status"
        | "error"
        | "skull_count"
        | "created_at"
        | "updated_at"
        | "homepage_url"
        | "description"
        | "primary_lang"
        | "pushed_at"
        | "submitted_by"
      >;
      crawls: Table<
        CrawlRow,
        Exclude<keyof CrawlRow, "repo_id">
      >;
      scores: Table<ScoreRow, "crimes" | "computed_at">;
      roasts: Table<RoastRow, "model" | "created_at">;
      receipts: Table<ReceiptRow, "id" | "description" | "position">;
      videos: Table<
        VideoRow,
        "status" | "job_id" | "video_url" | "error" | "created_at" | "updated_at"
      >;
      reactions: Table<ReactionRow, "id" | "created_at">;
    };
    // `{ [_ in never]: never }` is the shape supabase-js expects for an empty
    // group — Record<string, never> fails its GenericSchema constraint and
    // silently degrades every table's types to `never`.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      submission_proof: SubmissionProof;
      repo_status: RepoStatus;
      video_status: VideoStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
