// The right-hand column of every optimization panel. It has three states and the empty one
// matters most: before anything is submitted this used to be a grey card reading "Report", which
// told a student nothing about what they were about to get. Now it shows the shape of the markup
// that is coming, ghosted; while the model works it shows the pass being made over the page; and
// when the result lands it holds the report itself.

// Ruled lines with a pass being made over them — the same mechanic as the sign-in hero, drawn
// abstractly because there is no real text to show yet. Rows and their timings are staggered in
// CSS; `prefers-reduced-motion` collapses this to the finished state.
function PenPass() {
  const rows = [
    { w: 94 },
    { w: 88, revised: true },
    { w: 97 },
    { w: 71 },
    { w: 92, revised: true },
    { w: 84 },
    { w: 96 },
    { w: 63, revised: true },
  ];
  return (
    <div className="pen-pass" aria-hidden="true">
      {rows.map((row, i) => (
        <div
          className={row.revised ? 'pen-row is-revised' : 'pen-row'}
          key={i}
          style={{ '--row-delay': `${i * 0.28}s` }}
        >
          <span className="pen-line" style={{ width: `${row.w}%` }} />
          {row.revised && <span className="pen-written" style={{ width: `${Math.max(40, row.w - 12)}%` }} />}
        </div>
      ))}
    </div>
  );
}

// The ghost of the report that has not been written yet: the sections it will arrive in, each
// with a couple of ruled lines under it, so the empty state is a description of the work.
function Ghost({ sections }) {
  return (
    <div className="markup-ghost" aria-hidden="true">
      {sections.map((section) => (
        <div className="ghost-block" key={section}>
          <div className="ghost-heading">{section}</div>
          <span className="ghost-line" style={{ width: '92%' }} />
          <span className="ghost-line" style={{ width: '78%' }} />
        </div>
      ))}
    </div>
  );
}

export default function MarkupPanel({ title, loading, loadingLabel, invitation, sections = [], result, children }) {
  const state = loading ? 'working' : result ? 'marked' : 'empty';

  return (
    <section className={`markup markup-is-${state}`} aria-busy={loading || undefined}>
      <header className="markup-head">
        <h2>{title}</h2>
        {state === 'working' && <p className="markup-status">{loadingLabel}</p>}
        {state === 'marked' && <p className="markup-status is-done">Marked up</p>}
      </header>

      {state === 'empty' && (
        <div className="markup-body">
          <p className="markup-invitation">{invitation}</p>
          <Ghost sections={sections} />
        </div>
      )}

      {state === 'working' && (
        <div className="markup-body">
          <PenPass />
        </div>
      )}

      {state === 'marked' && <div className="markup-body markup-report">{children}</div>}
    </section>
  );
}
