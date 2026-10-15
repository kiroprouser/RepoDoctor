import { RepoDoctorSymbol } from '../components/Logo'

const categoryWeights = [
  { name: 'Documentation', weight: 35 },
  { name: 'Contributor Experience', weight: 30 },
  { name: 'Developer Experience', weight: 20 },
  { name: 'Repository Setup', weight: 15 },
]

const categories = [
  {
    name: 'Documentation',
    description: 'README clarity, installation and usage guidance, license, and release history.',
  },
  {
    name: 'Contributor Experience',
    description: 'Contribution guidance, community standards, issue and pull-request templates, and security policy.',
  },
  {
    name: 'Developer Experience',
    description: 'Project manifests, test-file signals, ignore rules, and a practical local setup path.',
  },
  {
    name: 'Repository Setup',
    description: 'Repository description, topics, license metadata, CI workflow, and active status.',
  },
]

export const AboutPage = () => (
  <div className="page-block container about-page">
    <header className="about-intro">
      <p className="eyebrow about-kicker">
        <RepoDoctorSymbol className="about-symbol" />
        About Repo Doctor
      </p>
      <h1>What Repo Doctor checks</h1>
      <p className="lede">
        Repo Doctor looks for practical signals that help people understand a public project, set it up locally,
        and make their first contribution with confidence.
      </p>
    </header>

    <section className="about-categories" aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="section-label">Readiness checks</h2>
      <div className="about-grid">
        {categories.map((category) => (
          <article className="about-category" key={category.name}>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="scoring-section" aria-labelledby="scoring-heading">
      <div className="scoring-copy">
        <h2 id="scoring-heading">Scoring</h2>
        <p>
          Checks use deterministic repository metadata and file signals. Category scores add up to 100; no source
          quality or test correctness is inferred.
        </p>
      </div>
      <dl className="weight-list">
        {categoryWeights.map((category) => (
          <div className="weight-row" key={category.name}>
            <dt>{category.name}</dt>
            <dd>{category.weight}</dd>
          </div>
        ))}
      </dl>
    </section>
  </div>
)
