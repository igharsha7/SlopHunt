import "server-only";

/**
 * Repo crawler — GitHub REST only, no cloning (spec §5). Works unauthenticated
 * at 60 req/hr; set GITHUB_TOKEN to lift the limit. Everything returned here
 * is evidence: the scorer cites it, the roast quotes it.
 */

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "slophunt-crawler",
  };
  if (process.env.GITHUB_TOKEN) {
    h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function gh<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export interface RepoMeta {
  owner: string;
  name: string;
  htmlUrl: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  isPrivate: boolean;
  ownerLogin: string;
}

export interface Commit {
  sha: string;
  message: string;
  date: string;
}

export interface CrawlResult {
  meta: RepoMeta;
  readme: string;
  commits: Commit[];
  languages: Record<string, number>;
  topLevelFiles: string[];
  badgeCount: number;
  todoCount: number;
  comingSoon: boolean;
  superlatives: string[];
  hasNodeModules: boolean;
  hasEnvFile: boolean;
  demoLinks: string[];
  deadDemoLinks: string[];
}

export async function fetchRepoMeta(
  owner: string,
  name: string,
): Promise<RepoMeta | null> {
  const data = await gh<{
    name: string;
    html_url: string;
    description: string | null;
    homepage: string | null;
    topics?: string[];
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string | null;
    pushed_at: string | null;
    created_at: string | null;
    private: boolean;
    owner: { login: string };
  }>(`/repos/${owner}/${name}`);
  if (!data) return null;

  return {
    owner,
    name: data.name,
    htmlUrl: data.html_url,
    description: data.description,
    homepage: data.homepage || null,
    topics: data.topics ?? [],
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    language: data.language,
    pushedAt: data.pushed_at,
    createdAt: data.created_at,
    isPrivate: data.private,
    ownerLogin: data.owner.login,
  };
}

const SUPERLATIVES = [
  "blazingly fast",
  "blazing fast",
  "revolutionary",
  "next-generation",
  "next generation",
  "game-changing",
  "the last",
  "you'll ever need",
  "state of the art",
  "state-of-the-art",
  "world-class",
  "enterprise-grade",
  "production-ready",
  "10x",
];

async function checkLink(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    // Some hosts reject HEAD; retry cheap GET before declaring it dead.
    if (res.status === 405 || res.status === 403) {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      return get.ok;
    }
    return res.ok;
  } catch {
    return false;
  }
}

export async function crawlRepo(meta: RepoMeta): Promise<CrawlResult> {
  const { owner, name } = meta;

  const [readmeRes, commits, languages, contents] = await Promise.all([
    fetch(`${API}/repos/${owner}/${name}/readme`, {
      headers: { ...headers(), accept: "application/vnd.github.raw+json" },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => ""),
    gh<Array<{ sha: string; commit: { message: string; author: { date: string } | null; committer: { date: string } | null } }>>(
      `/repos/${owner}/${name}/commits?per_page=100`,
    ),
    gh<Record<string, number>>(`/repos/${owner}/${name}/languages`),
    gh<Array<{ name: string; type: string }>>(
      `/repos/${owner}/${name}/contents`,
    ),
  ]);

  const readme = readmeRes ?? "";
  const readmeLower = readme.toLowerCase();

  const commitList: Commit[] = (commits ?? []).map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0].slice(0, 120),
    date: c.commit.author?.date ?? c.commit.committer?.date ?? "",
  }));

  const topLevelFiles = (contents ?? []).map((f) => f.name);

  // Markdown badges: ![...](https://img.shields.io/...) and friends.
  const badgeCount =
    (readme.match(/img\.shields\.io|badge\.fury|travis-ci|circleci\.com\/gh/g) ?? [])
      .length;

  const todoCount = (readme.match(/\bTODO\b|\bFIXME\b/gi) ?? []).length;
  const comingSoon = /coming soon|work in progress|under construction/i.test(
    readme,
  );
  const superlatives = SUPERLATIVES.filter((s) => readmeLower.includes(s));

  const hasNodeModules = topLevelFiles.includes("node_modules");
  const hasEnvFile = topLevelFiles.some(
    (f) => f === ".env" || f === ".env.local" || f === ".env.production",
  );

  // Demo links: homepage + first few absolute links in the README that look
  // like deployed apps rather than docs/badges.
  const readmeLinks = [
    ...new Set(
      [...readme.matchAll(/https?:\/\/[^\s)\]"'<>]+/g)]
        .map((m) => m[0].replace(/[.,]$/, ""))
        .filter(
          (u) =>
            !/github\.com|img\.shields|shields\.io|badge|travis|circleci|npmjs\.com|license/i.test(
              u,
            ),
        ),
    ),
  ].slice(0, 3);

  const demoLinks = [
    ...new Set([meta.homepage, ...readmeLinks].filter((u): u is string => !!u)),
  ].slice(0, 3);

  const checks = await Promise.all(demoLinks.map(checkLink));
  const deadDemoLinks = demoLinks.filter((_, i) => !checks[i]);

  return {
    meta,
    readme: readme.slice(0, 20_000),
    commits: commitList,
    languages: languages ?? {},
    topLevelFiles,
    badgeCount,
    todoCount,
    comingSoon,
    superlatives,
    hasNodeModules,
    hasEnvFile,
    demoLinks,
    deadDemoLinks,
  };
}
