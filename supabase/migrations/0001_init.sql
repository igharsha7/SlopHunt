-- SlopHunt Phase 0 schema.
-- Public reads everywhere (it's a public leaderboard); all writes go through the
-- service-role client in the agent pipeline, so no anon write policies exist.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: GitHub OAuth identities. Ownership proof for self-submission (§7).
-- ---------------------------------------------------------------------------
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  github_id     bigint not null unique,
  github_login  text   not null,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- repos: one row per submitted repo. The product page is keyed on owner/name.
-- ---------------------------------------------------------------------------
create type public.submission_proof as enum ('oauth_owner', 'roast_me_topic');
create type public.repo_status      as enum ('queued', 'crawling', 'roasted', 'failed');

create table public.repos (
  id             uuid primary key default gen_random_uuid(),
  owner          text not null,
  name           text not null,
  html_url       text not null,
  homepage_url   text,
  description    text,
  topics         text[] not null default '{}',
  stars          integer not null default 0,
  forks          integer not null default 0,
  open_issues    integer not null default 0,
  primary_lang   text,
  pushed_at      timestamptz,
  -- Consent trail. Nulls are impossible: one of these two must hold.
  submitted_by   uuid references public.users(id) on delete set null,
  proof          public.submission_proof not null,
  status         public.repo_status not null default 'queued',
  error          text,
  skull_count    integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint repos_owner_name_key unique (owner, name),
  -- oauth_owner submissions must carry the submitting user.
  constraint repos_oauth_needs_user
    check (proof <> 'oauth_owner' or submitted_by is not null)
);

create index repos_status_idx      on public.repos (status);
create index repos_created_at_idx  on public.repos (created_at desc);
create index repos_topics_idx      on public.repos using gin (topics);

-- ---------------------------------------------------------------------------
-- crawls: raw evidence from agents 2a/2b/2c. One row per repo, upserted.
-- ---------------------------------------------------------------------------
create table public.crawls (
  repo_id          uuid primary key references public.repos(id) on delete cascade,
  readme           text,
  languages        jsonb not null default '{}'::jsonb,
  commits          jsonb not null default '[]'::jsonb,  -- [{sha, message, date}]
  file_tree        jsonb not null default '[]'::jsonb,
  manifests        jsonb not null default '{}'::jsonb,
  -- Site crawler (RenderGate).
  screenshot_url   text,
  site_title       text,
  site_description text,
  og_tags          jsonb not null default '{}'::jsonb,
  -- Derived flags used by the analysis agent.
  badge_count       integer not null default 0,
  todo_count        integer not null default 0,
  has_node_modules  boolean not null default false,
  dead_demo_links   text[] not null default '{}',
  -- NEVER store the secret's value (§7) — only that one was spotted.
  secret_suspected  boolean not null default false,
  crawled_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- scores: the Slop Score and its five sub-scores.
-- ---------------------------------------------------------------------------
create table public.scores (
  repo_id             uuid primary key references public.repos(id) on delete cascade,
  slop_score          integer not null check (slop_score          between 0 and 100),
  originality_deficit integer not null check (originality_deficit between 0 and 100),
  abandonment_index   integer not null check (abandonment_index   between 0 and 100),
  readme_cope         integer not null check (readme_cope         between 0 and 100),
  commit_poetry       integer not null check (commit_poetry       between 0 and 100),
  vibe_check          integer not null check (vibe_check          between 0 and 100),
  -- 6-10 citable pieces of evidence: [{category, evidence, detail}]
  crimes              jsonb not null default '[]'::jsonb,
  computed_at         timestamptz not null default now()
);

create index scores_slop_score_idx on public.scores (slop_score desc);

-- ---------------------------------------------------------------------------
-- roasts: the four Deepak outputs.
-- ---------------------------------------------------------------------------
create table public.roasts (
  repo_id           uuid primary key references public.repos(id) on delete cascade,
  video_script      text not null,
  page_roast        text not null,
  one_liner         text not null,
  sarcastic_tagline text not null,
  model             text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- receipts: "Already Exists" — 2-3 real prior-art links per repo.
-- ---------------------------------------------------------------------------
create table public.receipts (
  id          uuid primary key default gen_random_uuid(),
  repo_id     uuid not null references public.repos(id) on delete cascade,
  name        text not null,
  url         text not null,
  description text,
  position    smallint not null default 0
);

create index receipts_repo_id_idx on public.receipts (repo_id, position);

-- ---------------------------------------------------------------------------
-- videos: async HyperFrames job. Never blocks the instant path.
-- ---------------------------------------------------------------------------
create type public.video_status as enum ('pending', 'rendering', 'ready', 'failed');

create table public.videos (
  repo_id     uuid primary key references public.repos(id) on delete cascade,
  status      public.video_status not null default 'pending',
  job_id      text,
  video_url   text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index videos_status_idx on public.videos (status) where status in ('pending', 'rendering');

-- ---------------------------------------------------------------------------
-- reactions: the 💀 button. One per visitor fingerprint per repo.
-- ---------------------------------------------------------------------------
create table public.reactions (
  id          uuid primary key default gen_random_uuid(),
  repo_id     uuid not null references public.repos(id) on delete cascade,
  fingerprint text not null,
  created_at  timestamptz not null default now(),

  constraint reactions_one_per_visitor unique (repo_id, fingerprint)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger repos_touch_updated_at
  before update on public.repos
  for each row execute function public.touch_updated_at();

create trigger videos_touch_updated_at
  before update on public.videos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: everything readable by anon (public leaderboard), nothing writable.
-- The pipeline writes with the service-role key, which bypasses RLS entirely.
-- ---------------------------------------------------------------------------
alter table public.users     enable row level security;
alter table public.repos     enable row level security;
alter table public.crawls    enable row level security;
alter table public.scores    enable row level security;
alter table public.roasts    enable row level security;
alter table public.receipts  enable row level security;
alter table public.videos    enable row level security;
alter table public.reactions enable row level security;

create policy "public read" on public.repos     for select using (true);
create policy "public read" on public.crawls    for select using (true);
create policy "public read" on public.scores    for select using (true);
create policy "public read" on public.roasts    for select using (true);
create policy "public read" on public.receipts  for select using (true);
create policy "public read" on public.videos    for select using (true);
create policy "public read" on public.reactions for select using (true);

-- users gets NO anon select policy on purpose: GitHub identities stay private.
