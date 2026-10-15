# Repo Doctor

![Repo Doctor mark](public/favicon.svg)

Repo Doctor checks whether a public GitHub repository gives potential contributors the information and basic setup signals they need to get involved. Paste a repository URL to get a deterministic, prioritized readiness report.

## What it checks

- **Documentation** — README, setup and usage guidance, license, and changelog signal
- **Contributor experience** — contribution guide, code of conduct, issue and pull-request templates, and security policy
- **Developer experience** — project manifest, test-file signals, and ignore rules
- **Repository setup** — description, topics, GitHub Actions workflow, and archived status

The score is out of 100, weighted across Documentation (35), Contributor Experience (30), Developer Experience (20), and Repository Setup (15). Repo Doctor checks presence and basic text signals; it does not assess source-code quality, test quality, or whether a workflow is correct.

## Run locally

Requirements: Node.js 24 and npm.

```sh
npm ci
npm run dev
```

The app calls the public GitHub REST API directly. No token or account is needed. Anonymous API rate limits apply.

## Usage

Open the app, enter a public GitHub repository as `owner/repo` or as a GitHub URL, and choose **Analyze repository**. The report includes the score, individual checks, prioritized recommendations, and a copyable improvement checklist.

## Validate

```sh
npm run lint
npm run build
```

To preview the production build locally, run `npm run preview` after the build.

## Architecture

The application is a client-side Vite SPA:

- `src/github/` normalizes repository identifiers and retrieves GitHub metadata, the recursive file tree, and README content.
- `src/analysis/` evaluates deterministic checks and computes weighted category scores.
- `src/storage/` keeps the five most recent score summaries in local storage.
- `src/pages/` and `src/components/` render the home, report, and explanatory views.

The report URL is `/report/:owner/:repo`; direct visits fetch a fresh analysis. Starting an analysis from the home page opens a progress dialog and passes the completed result to the report route without repeating the API requests.

## Deployment

The production site is hosted on GitHub Pages at [https://kiroprouser.github.io/RepoDoctor/](https://kiroprouser.github.io/RepoDoctor/). Pushing to `main` triggers GitHub Actions to run the quality checks, build the SPA for the project Pages path, and deploy the generated `dist/` output. The Pages build includes an SPA fallback for direct report and About URLs. Run `npm run build` to create a production build locally.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Community expectations are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and security reporting guidance is in [SECURITY.md](SECURITY.md).

## License

Released under the MIT License. See [LICENSE](LICENSE).
