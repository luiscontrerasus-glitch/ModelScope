/** A conceptual exhibition graphic, never detector output. */
export function ConceptPlot() {
  const samples = Array.from({ length: 20 }, (_, i) => {
    const x = 55 + i * 24; const baseline = 330 - i * 11;
    const departure = i < 10 ? 0 : (i - 9) ** 1.5 * 2.7;
    return { x, y: baseline - departure, residual: 436 - departure * .8 };
  });
  return <figure className="concept-plot"><svg viewBox="0 0 600 560" role="img" aria-label="Conceptual model departure: measurements follow a reference initially, then diverge; residuals move away from zero.">
    <defs><linearGradient id="concept-shade"><stop stopColor="#ba813c" stopOpacity=".11" /><stop offset="1" stopColor="#ba813c" stopOpacity="0" /></linearGradient></defs>
    <path d="M55 350H545M55 436H545" stroke="#3a454e" strokeWidth="1" />
    <rect x="283" y="76" width="130" height="424" fill="url(#concept-shade)" />
    <path d="M283 65V500" stroke="#a3a9ad" strokeWidth=".8" />
    <text x="302" y="72" fill="#e4e8ec" fontSize="12">Candidate transition</text>
    <path d="M55 330L511 121" stroke="#b0bfcc" strokeWidth="1.2" strokeDasharray="6 6" />
    <polyline points={samples.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6fb7ee" strokeWidth="1.2" />
    <polyline points={samples.map(p => `${p.x},${p.residual}`).join(' ')} fill="none" stroke="#c5894d" strokeWidth="1.2" />
    {samples.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="4" fill={i < 10 ? '#58a9ef' : '#dba066'} /><circle cx={p.x} cy={p.residual} r="3" fill={i < 10 ? '#9aa6b0' : '#dba066'} /></g>)}
    <text x="55" y="385" fill="#8e9ba7" fontSize="11">REFERENCE RESIDUALS</text>
    <text x="550" y="440" fill="#8e9ba7" fontSize="11">0</text>
  </svg><figcaption>Conceptual illustration · not an analysis result.</figcaption></figure>;
}
