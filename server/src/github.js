/**
 * GitHub crawler, Workers-native. Pure `fetch`, no Node built-ins, so the same
 * code runs on the edge and under vitest.
 */
const API = "https://api.github.com";
function headers(token) {
    const h = {
        accept: "application/vnd.github+json",
        "user-agent": "slophunt-worker",
    };
    if (token)
        h.authorization = `Bearer ${token}`;
    return h;
}
async function gh(path, token) {
    const res = await fetch(`${API}${path}`, { headers: headers(token) });
    if (!res.ok)
        return null;
    return (await res.json());
}
export async function fetchRepoMeta(owner, name, token) {
    const data = await gh(`/repos/${owner}/${name}`, token);
    if (!data)
        return null;
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
async function checkLink(url) {
    try {
        const res = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: AbortSignal.timeout(5000),
        });
        // Some hosts reject HEAD; retry once with GET before calling it dead.
        if (res.status === 405 || res.status === 403) {
            const get = await fetch(url, {
                method: "GET",
                redirect: "follow",
                signal: AbortSignal.timeout(5000),
            });
            return get.ok;
        }
        return res.ok;
    }
    catch {
        return false;
    }
}
export async function crawlRepo(meta, token) {
    const { owner, name } = meta;
    const [readmeText, commits, languages, contents] = await Promise.all([
        fetch(`${API}/repos/${owner}/${name}/readme`, {
            headers: { ...headers(token), accept: "application/vnd.github.raw+json" },
        })
            .then((r) => (r.ok ? r.text() : ""))
            .catch(() => ""),
        gh(`/repos/${owner}/${name}/commits?per_page=100`, token),
        gh(`/repos/${owner}/${name}/languages`, token),
        gh(`/repos/${owner}/${name}/contents`, token),
    ]);
    const readme = readmeText ?? "";
    const readmeLower = readme.toLowerCase();
    const commitList = (commits ?? []).map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0].slice(0, 120),
        date: c.commit.author?.date ?? c.commit.committer?.date ?? "",
    }));
    const topLevelFiles = (contents ?? []).map((f) => f.name);
    const badgeCount = (readme.match(/img\.shields\.io|badge\.fury|travis-ci|circleci\.com\/gh/g) ?? []).length;
    const readmeLinks = [
        ...new Set([...readme.matchAll(/https?:\/\/[^\s)\]"'<>]+/g)]
            .map((m) => m[0].replace(/[.,]$/, ""))
            .filter((u) => !/github\.com|img\.shields|shields\.io|badge|travis|circleci|npmjs\.com|license/i.test(u))),
    ].slice(0, 3);
    const demoLinks = [
        ...new Set([meta.homepage, ...readmeLinks].filter((u) => !!u)),
    ].slice(0, 3);
    const checks = await Promise.all(demoLinks.map(checkLink));
    return {
        meta,
        readme: readme.slice(0, 20_000),
        commits: commitList,
        languages: languages ?? {},
        topLevelFiles,
        badgeCount,
        todoCount: (readme.match(/\bTODO\b|\bFIXME\b/gi) ?? []).length,
        comingSoon: /coming soon|work in progress|under construction/i.test(readme),
        superlatives: SUPERLATIVES.filter((s) => readmeLower.includes(s)),
        hasNodeModules: topLevelFiles.includes("node_modules"),
        hasEnvFile: topLevelFiles.some((f) => f === ".env" || f === ".env.local" || f === ".env.production"),
        demoLinks,
        deadDemoLinks: demoLinks.filter((_, i) => !checks[i]),
    };
}
/** Originality agent — real prior art via GitHub search. */
export async function findReceipts(meta, token) {
    const terms = [
        ...new Set([
            ...(meta.description ?? "")
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, " ")
                .split(/\s+/)
                .filter((w) => w.length > 3 &&
                !["with", "your", "this", "that", "from", "using", "built", "simple", "awesome"].includes(w))
                .slice(0, 4),
            ...meta.topics.filter((t) => t !== "roast-me").slice(0, 2),
        ]),
    ];
    const q = `${terms.length ? terms.join(" ") : meta.name.replace(/[-_]/g, " ")} stars:>100`;
    try {
        const res = await fetch(`${API}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`, { headers: headers(token), signal: AbortSignal.timeout(8000) });
        if (!res.ok)
            return [];
        const data = (await res.json());
        return (data.items ?? [])
            .filter((i) => i.full_name.toLowerCase() !== `${meta.owner}/${meta.name}`.toLowerCase())
            .slice(0, 3)
            .map((i) => ({
            name: i.full_name,
            url: i.html_url,
            description: `${(i.description ?? "Does the same thing.").slice(0, 90)} (${i.stargazers_count.toLocaleString()} stars)`,
        }));
    }
    catch {
        return [];
    }
}
