# Contributing

Thank you for helping improve Repo Doctor. Contributions should keep the tool focused on deterministic, public-repository readiness checks and maintain its lightweight, client-side architecture.

## Development setup

1. Install Node.js 20.19+ or 22.12+ and npm.
2. Clone the repository and install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Before submitting, run:

   ```sh
   npm run lint
   npm run build
   ```

No GitHub token or environment variables are required. Development and production use the anonymous GitHub REST API, so requests are subject to its rate limits.

## Making a change

- Keep GitHub retrieval, repository analysis, scoring, storage, and UI concerns separate.
- Keep analysis deterministic and base it on explicit repository metadata or file signals.
- Do not claim to evaluate source quality, test correctness, or workflow effectiveness.
- Preserve keyboard operation, visible focus, semantic status, reduced-motion support, and mobile layouts.
- Update relevant documentation when behavior or project setup changes.
- Prefer focused changes that do not add dependencies without a clear need.

## Pull requests

Use the pull-request template. Describe the user-facing change, note any scoring or API behavior changes, and include the validation commands you ran. For interface changes, screenshots at desktop and mobile widths are useful.

Please be respectful in review and follow the expectations in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
