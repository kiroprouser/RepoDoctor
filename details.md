# Project details

## Project

- **Name:** Repo Doctor
- **One-line description:** A focused readiness check for public GitHub repositories and their prospective contributors.
- **Full description:** Repo Doctor inspects repository metadata and a small set of file signals, then produces a transparent score, grouped findings, and prioritized improvements for open-source contributor readiness.
- **Problem:** First-time contributors often cannot tell whether a project is welcoming or how to get started. Maintainers may overlook basic onboarding and community information.
- **Solution:** Analyze a public repository for actionable documentation, contribution, developer setup, and repository configuration signals, without requiring an account or repository access.

## Core features

- Accepts repository URLs and `owner/repo` identifiers.
- Fetches repository metadata and a recursive GitHub file tree.
- Checks documentation and community signals with deterministic rules.
- Calculates a weighted score and ranks improvements.
- Shares reports by URL and remembers five recent analyses in local storage.
- Supports light/dark themes and responsive, keyboard-accessible interactions.

## Technology and architecture

- **Stack:** Vite, React, TypeScript, React Router, GitHub REST API, CSS.
- **Architecture:** GitHub retrieval (`src/github/`) → deterministic checks/scoring (`src/analysis/`) → local recent history (`src/storage/`) → React pages/components. The browser calls GitHub directly; there is no backend, authentication, database, or AI service.
- **Deployment method:** GitHub Actions builds the Vite SPA and deploys `dist/` to GitHub Pages on pushes to `main`. The Pages artifact includes a generated SPA fallback for direct client-side routes.

## Submission metadata

- **Production URL:** https://kiroprouser.github.io/RepoDoctor/
- **Repository URL:** https://github.com/kiroprouser/RepoDoctor
- **MLH challenge:** `[Add the official challenge name or track]`
- **GitHub Copilot usage:** Used as a coding assistant during implementation and refinement of the React/TypeScript interface, repository checks, and project documentation. Generated changes were reviewed and validated with the project build and linter.
- **Showcase assets:**
  - `docs/assets/showcase/01-home.png` — 1920 × 1080 — Home page and repository input — README cover and project introduction.
  - `docs/assets/showcase/02-analysis-report.png` — 1920 × 1080 — Real `vercel/next.js` report (92/100) — README analysis showcase.
  - `docs/assets/showcase/03-actionable-findings.png` — 1920 × 1080 — Expanded usage finding with explanation, recommendation, and priority fixes — README findings showcase.
  - `docs/assets/showcase/04-responsive.png` — 1920 × 1080 — Real desktop and mobile Home layouts — README responsive showcase and portfolio.
  - `docs/assets/showcase/og-image.png` — 1200 × 630 — Home-led product preview — repository and link-sharing preview.
- **GitHub repository description:** Check whether a public GitHub repository is ready for open-source contributors.
- **GitHub homepage URL:** https://kiroprouser.github.io/RepoDoctor/
- **GitHub repository topics:** `open-source`, `github`, `developer-tools`, `contributor-experience`, `repository-health`, `repository-analysis`, `vite`, `react`, `typescript`
- **Submission summary:** Repo Doctor turns a public repository URL into a shareable, deterministic contributor-readiness report with concrete fixes.

## Future scope

Possible follow-up work, outside the current MVP, includes broader manifest and documentation signals, test coverage of individual checks, and a hosted API layer if GitHub's anonymous rate limits become a practical issue. These are not part of the current product.
