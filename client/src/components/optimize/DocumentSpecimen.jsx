// The four documents, drawn rather than iconified. A student recognises the shape of their own
// transcript / resume / essay / letter before they read the label, and each specimen carries
// exactly one editor's mark — the thing this lane actually does to the page — which draws itself
// in on hover or focus. Bars stand in for text so nothing here needs a font.
//
// One viewBox for all four (120x160, a page's proportions) so they line up in the picker and
// shrink to the same glyph in the rail.

const PAPER = { x: 4, y: 3, width: 112, height: 154, rx: 3 };

function Paper({ children }) {
  return (
    <svg className="specimen" viewBox="0 0 120 160" role="presentation" focusable="false">
      <rect {...PAPER} className="spec-paper" />
      {children}
    </svg>
  );
}

// Ruled line of "text". `w` is a fraction of the writing measure.
function Line({ x = 16, y, w = 1, measure = 88, weight = 'body' }) {
  return <rect x={x} y={y} width={measure * w} height={weight === 'head' ? 5 : 3} rx={1.5} className={`spec-${weight}`} />;
}

// Transcript: subjects down the left, grades in a narrow right column, one row ticked off.
function Transcript() {
  const rows = [0.62, 0.78, 0.55, 0.7, 0.6];
  return (
    <Paper>
      <Line x={16} y={20} w={0.5} weight="head" />
      <line x1={16} y1={33} x2={104} y2={33} className="spec-rule" />
      {rows.map((w, i) => (
        <g key={i}>
          <Line x={16} y={44 + i * 17} w={w} measure={58} />
          <rect x={88} y={43 + i * 17} width={16} height={5} rx={1.5} className="spec-grade" />
        </g>
      ))}
      <line x1={16} y1={130} x2={104} y2={130} className="spec-rule" />
      <Line x={16} y={139} w={0.42} measure={88} />
      {/* The mark: a requirement ticked off the baseline checklist. */}
      <g className="spec-mark spec-mark-tick">
        <circle cx={96} cy={139} r={8} className="spec-tick-field" />
        <path d="M92 139.5 l3 3 l6 -7" className="spec-tick" />
      </g>
    </Paper>
  );
}

// Resume: name, contact hairline, dated entries with bulleted lines — one bullet struck and
// rewritten underneath, which is the whole of what this lane does.
function Resume() {
  return (
    <Paper>
      <Line x={16} y={18} w={0.52} weight="head" />
      <Line x={16} y={29} w={0.74} measure={88} />
      <line x1={16} y1={40} x2={104} y2={40} className="spec-rule" />

      <Line x={16} y={50} w={0.44} measure={88} weight="head" />
      <circle cx={19} cy={64} r={1.6} className="spec-dot" />
      <Line x={25} y={62.5} w={0.86} measure={79} />
      <circle cx={19} cy={75} r={1.6} className="spec-dot" />
      <Line x={25} y={73.5} w={0.62} measure={79} />

      <Line x={16} y={92} w={0.38} measure={88} weight="head" />
      <circle cx={19} cy={106} r={1.6} className="spec-dot" />
      {/* The mark: the weak line cut, the stronger one written beneath it. */}
      <g className="spec-mark spec-mark-revise">
        <rect x={25} y={104.5} width={68} height={3} rx={1.5} className="spec-body spec-cut" />
        <line x1={24} y1={106} x2={94} y2={106} className="spec-strike" />
        <rect x={25} y={115} width={74} height={3} rx={1.5} className="spec-written" />
      </g>
      <circle cx={19} cy={130} r={1.6} className="spec-dot" />
      <Line x={25} y={128.5} w={0.7} measure={79} />
    </Paper>
  );
}

// Essay: a title, a ruled margin, and prose running to the edge of the measure — with a note
// pencilled in the margin beside the line it belongs to.
function Essay() {
  const lines = [0.94, 0.88, 0.97, 0.72, 0.93, 0.9, 0.96, 0.6];
  return (
    <Paper>
      <Line x={30} y={20} w={0.62} measure={74} weight="head" />
      <line x1={24} y1={34} x2={24} y2={146} className="spec-rule spec-margin" />
      {lines.map((w, i) => (
        <Line key={i} x={30} y={45 + i * 12} w={w} measure={74} />
      ))}
      {/* The mark: an annotation in the margin, tied to one line. */}
      <g className="spec-mark spec-mark-note">
        <path d="M24 92 h-8" className="spec-leader" />
        <circle cx={13} cy={92} r={4} className="spec-note-dot" />
        <rect x={30} y={92} width={71} height={11} rx={2} className="spec-note-field" />
      </g>
    </Paper>
  );
}

// Cover letter: the address block sitting top-right, a salutation, three paragraphs and a
// signature — the shape of a letter, read before any word of it.
function CoverLetter() {
  return (
    <Paper>
      <rect x={72} y={18} width={32} height={3} rx={1.5} className="spec-body" />
      <rect x={64} y={26} width={40} height={3} rx={1.5} className="spec-body" />
      <rect x={80} y={34} width={24} height={3} rx={1.5} className="spec-body" />

      <Line x={16} y={52} w={0.4} measure={88} weight="head" />

      {[0, 1].map((p) => (
        <g key={p}>
          <Line x={16} y={68 + p * 30} w={0.95} />
          <Line x={16} y={77 + p * 30} w={0.88} />
          <Line x={16} y={86 + p * 30} w={p === 1 ? 0.5 : 0.72} />
        </g>
      ))}

      {/* The mark: the closing paragraph re-pitched — the one that has to land. */}
      <g className="spec-mark spec-mark-close">
        <rect x={16} y={128} width={70} height={3} rx={1.5} className="spec-written" />
        <path d="M16 142 c6 -7 10 5 15 -1 c4 -5 9 4 14 -2" className="spec-signature" />
      </g>
    </Paper>
  );
}

const SPECIMENS = {
  university: Transcript,
  internship: Resume,
  essay: Essay,
  coverLetter: CoverLetter,
};

export default function DocumentSpecimen({ type }) {
  const Component = SPECIMENS[type];
  return Component ? <Component /> : null;
}
