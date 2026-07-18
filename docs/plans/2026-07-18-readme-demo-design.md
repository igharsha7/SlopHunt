# README demo design

**Status:** approved on 2026-07-18

The README is the project's first product surface, so it should explain the
joke, establish the safety boundary, and show the working application before
asking a reader to install anything. It opens with the existing SlopHunt
wordmark and the concise product promise, followed immediately by a clickable
demo poster. The poster is a static, repository-owned JPEG extracted from the
existing `Video.mp4` at a branded moment in the demo. It links to `Video.mp4`
rather than using an inline video tag, because this remains dependable in
GitHub's README renderer while still opening the repository's native video
viewer.

After the demo, the README follows the user's reading order: a short product
explanation, the four-step submission-to-ranking loop, the five score
dimensions, then the actual stack. It retains the important guardrails—consent,
evidence-only jokes, and no secret disclosure—rather than treating the roast
as generic comedy. The local setup section is intentionally concise and only
names commands and environment configuration present in this repository. A
small command block supports contributors without making the README an
operations manual. The final documentation links send deeper technical readers
to the build spec and the HyperFrames/LangGraph guide.

Success means a GitHub visitor can click the demo, understand the product loop
in under a minute, see the safety rules, and start the application without
guessing which files or commands matter.
