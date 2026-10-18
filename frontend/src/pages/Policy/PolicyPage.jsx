import { ShieldCheck } from 'lucide-react'

function PolicyPage({ icon, eyebrow, title, intro, sections, note }) {
  return (
    <main className="policy-page">
      <div className="policy-shell">
        <header className="policy-hero">
          <span className="policy-icon" aria-hidden="true">{icon}</span>
          <p className="policy-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="policy-intro">{intro}</p>
        </header>
        <div className="policy-content">
          {sections.map(({ heading, paragraphs }) => (
            <section className="policy-section" key={heading}>
              <h2>{heading}</h2>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <aside className="policy-note">
            <ShieldCheck size={19} aria-hidden="true" />
            <span>{note}</span>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default PolicyPage
