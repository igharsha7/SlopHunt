/**
 * Slop Score — pure, dependency-free, and shared verbatim with the Next app
 * (src/lib/pipeline/score.ts). No `server-only` import here so it runs on
 * Workers too; the Next copy re-exports this one to keep them from drifting.
 */
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const DAY = 86_400_000;
const LAZY_COMMIT = /^(fix|fixes|fixed|wip|update|updates|updated|asdf+|test|testing|stuff|minor|misc|changes|final|final final.*|\.+|cleanup|clean up|tweak|tweaks|oops|typo|temp|aaa+|qwe.*|todo)$/i;
export function computeScore(crawl, receipts, now = Date.now()) {
    const crimes = [];
    const { meta, commits } = crawl;
    /* ---------------------------------------------------- Abandonment Index */
    let abandonment = 8;
    const lastDate = commits[0]?.date ? new Date(commits[0].date).getTime() : 0;
    const daysSince = lastDate ? Math.floor((now - lastDate) / DAY) : 999;
    if (daysSince >= 365)
        abandonment = 96;
    else if (daysSince >= 180)
        abandonment = 82;
    else if (daysSince >= 90)
        abandonment = 64;
    else if (daysSince >= 30)
        abandonment = 38;
    else if (daysSince >= 7)
        abandonment = 18;
    if (daysSince >= 90 && commits[0]) {
        const months = Math.floor(daysSince / 30);
        crimes.push({
            category: "abandonment",
            evidence: `Last commit: "${commits[0].message}" — ${months} months ago`,
        });
    }
    /* ------------------------------------------------------- Commit Poetry */
    let commitPoetry = 10;
    if (commits.length > 0) {
        const lazy = commits.filter((c) => LAZY_COMMIT.test(c.message.trim()));
        const lazyRatio = lazy.length / commits.length;
        const singleWord = commits.filter((c) => !c.message.trim().includes(" ")).length / commits.length;
        commitPoetry = clamp(lazyRatio * 120 + singleWord * 40);
        const counts = new Map();
        for (const c of lazy) {
            const key = c.message.trim().toLowerCase();
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const [topMsg, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
        if (topMsg && topCount && topCount >= 3) {
            crimes.push({
                category: "commit_poetry",
                evidence: `${topCount} of the last ${commits.length} commits are just "${topMsg}"`,
            });
        }
        const gem = commits.find((c) => /final final|asdf|revert revert|^\.+$/i.test(c.message));
        if (gem) {
            crimes.push({
                category: "commit_poetry",
                evidence: `Commit: "${gem.message}" (still in main)`,
            });
        }
    }
    /* -------------------------------------------------------- README Cope */
    let readmeCope = 12;
    const { badgeCount, superlatives, comingSoon, deadDemoLinks, readme } = crawl;
    readmeCope += badgeCount * 8;
    readmeCope += superlatives.length * 14;
    if (comingSoon)
        readmeCope += 18;
    readmeCope += deadDemoLinks.length * 22;
    if (readme.length < 200 && meta.stars < 5)
        readmeCope = Math.min(readmeCope, 25);
    readmeCope = clamp(readmeCope);
    if (badgeCount >= 4) {
        crimes.push({
            category: "readme_cope",
            evidence: `${badgeCount} badges in the README`,
            detail: "Confidence inversely proportional to CI runs.",
        });
    }
    if (superlatives.length > 0) {
        crimes.push({
            category: "readme_cope",
            evidence: `README claims: "${superlatives[0]}"`,
        });
    }
    if (comingSoon) {
        crimes.push({
            category: "readme_cope",
            evidence: 'README says "coming soon"',
            detail: `Repo created ${meta.createdAt ? new Date(meta.createdAt).getFullYear() : "a while ago"}. Still coming.`,
        });
    }
    for (const dead of deadDemoLinks) {
        crimes.push({
            category: "vibe_check",
            evidence: `Demo link returns nothing: ${dead}`,
        });
    }
    /* ---------------------------------------------------------- Vibe Check */
    let vibeCheck = 10;
    const { hasNodeModules, hasEnvFile, todoCount } = crawl;
    if (hasNodeModules)
        vibeCheck += 40;
    if (hasEnvFile)
        vibeCheck += 32;
    vibeCheck += Math.min(24, todoCount * 3);
    vibeCheck += Math.min(14, meta.openIssues);
    vibeCheck += deadDemoLinks.length * 8;
    vibeCheck = clamp(vibeCheck);
    if (hasNodeModules) {
        crimes.push({
            category: "vibe_check",
            evidence: "node_modules is committed to the repository",
        });
    }
    if (hasEnvFile) {
        crimes.push({
            category: "vibe_check",
            evidence: "Possible leaked secret detected (.env in version control)",
            detail: "Value not stored or displayed. Rotate it anyway.",
        });
    }
    if (todoCount >= 5) {
        crimes.push({
            category: "vibe_check",
            evidence: `${todoCount} TODO/FIXME markers in the README alone`,
        });
    }
    /* -------------------------------------------------- Originality Deficit */
    let originality = 20 + receipts.length * 22;
    if (/clone|wrapper|gpt|ai-|-ai$|awesome-|todo|portfolio|url-short/i.test(meta.name)) {
        originality += 12;
    }
    originality = clamp(originality);
    if (receipts.length > 0) {
        crimes.push({
            category: "originality",
            evidence: `${receipts.length} existing project${receipts.length > 1 ? "s" : ""} already do this — receipts attached`,
            detail: receipts.map((r) => r.name).join(", "),
        });
    }
    const breakdown = {
        originality,
        abandonment: clamp(abandonment),
        readmeCope,
        commitPoetry: clamp(commitPoetry),
        vibeCheck,
    };
    const slop = clamp((breakdown.originality +
        breakdown.abandonment +
        breakdown.readmeCope +
        breakdown.commitPoetry +
        breakdown.vibeCheck) /
        5);
    return { slop, breakdown, crimes: crimes.slice(0, 10), secretSuspected: hasEnvFile };
}
