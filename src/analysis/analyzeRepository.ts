import type { RepositoryFilesData } from '../github/types'
import type { CategorySummary, CheckPriority, RepositoryCheck } from './types'
import { summarizeReport } from './scoring'

const normalizeLookupText = (value: string) => value.toLowerCase().replace(/[#*_`-]/g, ' ')

const containsKeywords = (text: string, keywords: string[]): boolean => {
  const normalized = normalizeLookupText(text)
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

const makeCheck = (
  id: string,
  category: string,
  status: RepositoryCheck['status'],
  title: string,
  summary: string,
  score: number,
  maxScore: number,
  priority?: CheckPriority,
  explanation?: string,
  recommendation?: string,
): RepositoryCheck => ({
  id,
  category,
  status,
  title,
  summary,
  score,
  maxScore,
  priority,
  explanation,
  recommendation,
})

export const analyzeRepository = (payload: RepositoryFilesData) => {
  const files = payload.files.map((file) => file.toLowerCase())
  const repo = payload.repo
  const readmeContent = payload.readmeContent.toLowerCase()

  const readmePath = payload.readmePath ?? files.find((file) => /^readme(?:\.(md|rst|txt))?$/i.test(file.split('/').at(-1) ?? file))
  const readmeExists = Boolean(readmePath)
  const licensePresent = Boolean(repo.license?.name || files.some((file) => /^license(\.md|\.txt)?$/i.test(file.split('/').at(-1) ?? file)))
  const contributingPresent = files.some((file) => /(^|\/)(contributing|contributing\.md)$/.test(file))
  const codeOfConductPresent = files.some((file) => /code[_-]?of[_-]?conduct(\.md)?$/.test(file))
  const issueTemplatesPresent = payload.issueTemplates.length > 0
  const prTemplatePresent = payload.prTemplates.length > 0
  const securityPolicyPresent = files.some((file) => /security\.md$/i.test(file))
  const gitignorePresent = files.includes('.gitignore') || files.some((file) => /(^|\/)\.gitignore$/.test(file))
  const manifestPresent = payload.manifestFiles.length > 0
  const testsPresent = payload.testIndicators.length > 0
  const workflowPresent = payload.workflowFiles.length > 0
  const descriptionPresent = Boolean(repo.description && repo.description.trim())
  const topicsPresent = Array.isArray(repo.topics) && repo.topics.length > 0
  const changelogPresent = files.some((file) => /(^|\/)(changelog|history)(\.(md|txt|rst))?$/.test(file))

  const hasInstallInstructions = containsKeywords(readmeContent, ['installation', 'install', 'setup', 'getting started', 'quick start'])
  const hasUsageInstructions = containsKeywords(readmeContent, ['usage', 'example', 'examples', 'how to use', 'quick start'])

  const checks: RepositoryCheck[] = [
    makeCheck(
      'readme',
      'Documentation',
      readmeExists ? 'pass' : 'fail',
      'README',
      readmeExists ? 'A repository README was found and is discoverable.' : 'No README file was detected.',
      readmeExists ? 12 : 0,
      12,
      'critical',
      'A README is the first thing contributors see and is the primary source of project context.',
      'Add a clear README with project purpose, setup, and usage guidance.',
    ),
    makeCheck(
      'install-docs',
      'Documentation',
      hasInstallInstructions ? 'pass' : readmeExists ? 'warning' : 'fail',
      'Installation instructions',
      hasInstallInstructions ? 'Setup guidance is visible and actionable.' : 'The repository does not clearly explain how to install or run it.',
      hasInstallInstructions ? 10 : readmeExists ? 4 : 0,
      10,
      'critical',
      'Without clear setup steps, contributors cannot validate or run the project locally.',
      'Document installation and local development setup in the README or a dedicated guide.',
    ),
    makeCheck(
      'usage-docs',
      'Documentation',
      hasUsageInstructions ? 'pass' : readmeExists ? 'warning' : 'fail',
      'Usage examples',
      hasUsageInstructions ? 'The README includes usage or example guidance.' : 'There is limited guidance on how the project is used in practice.',
      hasUsageInstructions ? 6 : readmeExists ? 2 : 0,
      6,
      'high',
      'Examples help contributors understand expected behavior and reduce onboarding friction.',
      'Add a basic usage section with example commands or code snippets.',
    ),
    makeCheck(
      'license',
      'Documentation',
      licensePresent ? 'pass' : 'fail',
      'License',
      licensePresent ? 'The repository declares a clear license.' : 'No license file or SPDX metadata was found.',
      licensePresent ? 5 : 0,
      5,
      'critical',
      'A repository without a permissive license is much harder for contributors to use and adopt safely.',
      'Add a LICENSE file and confirm the project is clearly licensed for reuse and contribution.',
    ),
    makeCheck(
      'changelog',
      'Documentation',
      changelogPresent ? 'info' : 'info',
      'Changelog history',
      changelogPresent ? 'A changelog or history file is present.' : 'A changelog is not present, but it is optional for the MVP.',
      changelogPresent ? 2 : 1,
      2,
      'low',
      'Release notes are helpful but not essential for contributor readiness.',
      'Consider adding a CHANGELOG.md if the project maintains a public release history.',
    ),
    makeCheck(
      'contributing',
      'Contributor Experience',
      contributingPresent ? 'pass' : 'fail',
      'Contribution guide',
      contributingPresent ? 'CONTRIBUTING guidance is available.' : 'There is no contribution guide for new contributors.',
      contributingPresent ? 10 : 0,
      10,
      'critical',
      'A contribution guide tells contributors how to set up and submit work in a consistent way.',
      'Create CONTRIBUTING.md with setup, testing, and pull-request instructions.',
    ),
    makeCheck(
      'code-of-conduct',
      'Contributor Experience',
      codeOfConductPresent ? 'pass' : 'warning',
      'Code of conduct',
      codeOfConductPresent ? 'The repository includes expected community standards.' : 'A code of conduct is not present yet.',
      codeOfConductPresent ? 6 : 1,
      6,
      'medium',
      'Community guidance reduces friction and helps manage contributor behavior and inclusion.',
      'Add a CODE_OF_CONDUCT.md to set expectations for the community.',
    ),
    makeCheck(
      'issue-templates',
      'Contributor Experience',
      issueTemplatesPresent ? 'pass' : 'warning',
      'Issue templates',
      issueTemplatesPresent ? 'Issue templates help contributors report bugs and requests clearly.' : 'The repo does not yet include issue templates.',
      issueTemplatesPresent ? 5 : 1,
      5,
      'medium',
      'A clear issue template reduces low-quality bug reports and speeds triage.',
      'Add issue templates under .github/ISSUE_TEMPLATE to improve issue quality.',
    ),
    makeCheck(
      'pr-template',
      'Contributor Experience',
      prTemplatePresent ? 'pass' : 'warning',
      'Pull request template',
      prTemplatePresent ? 'Pull requests have an expected structure.' : 'There is no pull request template to guide contributions.',
      prTemplatePresent ? 4 : 1,
      4,
      'medium',
      'A consistent PR format makes review and acceptance easier for maintainers.',
      'Add a pull request template so contributors can explain their changes clearly.',
    ),
    makeCheck(
      'security-policy',
      'Contributor Experience',
      securityPolicyPresent ? 'pass' : 'warning',
      'Security policy',
      securityPolicyPresent ? 'A security policy is documented.' : 'Security reporting guidance is not yet defined.',
      securityPolicyPresent ? 5 : 1,
      5,
      'high',
      'A security policy improves trust and provides a safe process for responsible disclosure.',
      'Create SECURITY.md with reporting guidance and responsible disclosure expectations.',
    ),
    makeCheck(
      'gitignore',
      'Developer Experience',
      gitignorePresent ? 'pass' : 'warning',
      '.gitignore',
      gitignorePresent ? 'The repository ignores generated or machine-specific files.' : 'No .gitignore file is present.',
      gitignorePresent ? 5 : 1,
      5,
      'medium',
      'Ignoring local build artifacts keeps the repository cleaner and reduces noise for contributors.',
      'Add a .gitignore file to keep editor and build output out of version control.',
    ),
    makeCheck(
      'manifest',
      'Developer Experience',
      manifestPresent ? 'pass' : 'warning',
      'Project manifest',
      manifestPresent ? 'A recognized dependency manifest is present.' : 'No clear package or project manifest was detected.',
      manifestPresent ? 7 : 1,
      7,
      'high',
      'A manifest communicates the project type, dependencies, and contributor setup path.',
      'Add a project manifest such as package.json, pyproject.toml, or Cargo.toml.',
    ),
    makeCheck(
      'tests',
      'Developer Experience',
      testsPresent ? 'pass' : 'warning',
      'Testing signals',
      testsPresent ? 'The repository includes test files or a conventional test directory.' : 'No obvious test setup was detected.',
      testsPresent ? 6 : 1,
      6,
      'high',
      'Testing signals help contributors know where validation belongs and how to verify changes.',
      'Add a tests folder or conventional test files and document the expected commands.',
    ),
    makeCheck(
      'setup-guidance',
      'Developer Experience',
      hasInstallInstructions ? 'pass' : 'warning',
      'Local setup guidance',
      hasInstallInstructions ? 'It is possible to understand how to start the project locally.' : 'The project may be difficult to run locally without extra context.',
      hasInstallInstructions ? 2 : 0,
      2,
      'high',
      'Clear local setup instructions are among the biggest contributors to a healthy open-source repo.',
      'Document a straightforward install and run flow for developers and contributors.',
    ),
    makeCheck(
      'description',
      'Repository Setup',
      descriptionPresent ? 'pass' : 'warning',
      'Repository description',
      descriptionPresent ? 'The repository has a clear description that explains its purpose.' : 'The repository is missing a meaningful description.',
      descriptionPresent ? 3 : 0,
      3,
      'medium',
      'A concise description helps people understand the project before they dig further.',
      'Add a short repository description that clearly explains the repository purpose.',
    ),
    makeCheck(
      'topics',
      'Repository Setup',
      topicsPresent ? 'pass' : 'warning',
      'Repository topics',
      topicsPresent ? 'Relevant repository topics make discovery easier.' : 'This repository does not yet expose tags.',
      topicsPresent ? 3 : 0,
      3,
      'low',
      'Topics improve discoverability and help people find the project through GitHub search.',
      'Add repository topics to improve discoverability and categorization.',
    ),
    makeCheck(
      'ci',
      'Repository Setup',
      workflowPresent ? 'pass' : 'warning',
      'CI workflow',
      workflowPresent ? 'A GitHub Actions workflow is present.' : 'No GitHub workflow was detected for automation.',
      workflowPresent ? 6 : 1,
      6,
      'high',
      'Continuous integration signals that the project has at least a basic validation path.',
      'Add a workflow to automate linting, tests, or build validation for pull requests.',
    ),
    makeCheck(
      'archive',
      'Repository Setup',
      repo.archived ? 'warning' : 'pass',
      'Repository status',
      repo.archived ? 'This repository is archived and may no longer accept new contributions.' : 'The repository is active and available for contribution.',
      repo.archived ? 2 : 3,
      3,
      'medium',
      'Archived repositories are not ideal for active contributor onboarding unless intentionally read-only.',
      'If the project is still active, make sure it is not archived and remains welcoming to contributors.',
    ),
  ]

  const categoryGroups: Record<string, { score: number; maxScore: number }> = {
    Documentation: { score: 0, maxScore: 35 },
    'Contributor Experience': { score: 0, maxScore: 30 },
    'Developer Experience': { score: 0, maxScore: 20 },
    'Repository Setup': { score: 0, maxScore: 15 },
  }

  for (const check of checks) {
    const bucket = categoryGroups[check.category]
    if (!bucket) continue
    bucket.score += check.score
  }

  const categories: CategorySummary[] = Object.entries(categoryGroups).map(([key, value]) => ({
    id: key.toLowerCase().replace(/\s+/g, '-'),
    label: key,
    score: value.score,
    maxScore: value.maxScore,
  }))

  const total = Math.round(categories.reduce((sum, category) => sum + category.score, 0))
  const report = summarizeReport(checks, categories)

  return {
    ...report,
    total,
    label: total >= 90 ? 'Excellent' : total >= 75 ? 'Healthy' : total >= 60 ? 'Needs attention' : total >= 40 ? 'Weak' : 'Not contributor-ready',
  }
}
