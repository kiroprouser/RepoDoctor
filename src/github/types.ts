export interface GitHubRepoApiData {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  language: string | null
  archived: boolean
  fork: boolean
  license: { spdx_id?: string | null; name?: string | null } | null
  homepage?: string | null
}

export interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
}

export interface GitHubTreeResponse {
  tree: GitHubTreeItem[]
  truncated?: boolean
}

export interface RepositoryFilesData {
  repo: GitHubRepoApiData
  files: string[]
  readmePath?: string
  readmeContent: string
  workflowFiles: string[]
  issueTemplates: string[]
  prTemplates: string[]
  manifestFiles: string[]
  testIndicators: string[]
}
