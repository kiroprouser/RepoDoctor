interface RepoInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  error?: string
}

export const RepoInput = ({ value, onChange, onSubmit, error }: RepoInputProps) => {
  return (
    <div className="repo-input-panel">
      <label htmlFor="repo-input" className="sr-only">
        GitHub repository URL or owner/repo
      </label>
      <div className="input-row">
        <input
          id="repo-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder="https://github.com/facebook/react"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'repo-input-error' : undefined}
        />
        <button type="button" className="primary-button" onClick={onSubmit}>
          Analyze repository
        </button>
      </div>
      {error ? (
        <p id="repo-input-error" className="input-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
