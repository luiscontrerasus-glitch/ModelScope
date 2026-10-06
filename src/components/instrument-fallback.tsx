import type { Instrument } from './instrument-scene';
export function InstrumentFallback({ kind, failed = false }: { kind: Instrument; failed?: boolean }) {
  return <div className="instrument-fallback" role="img" aria-label={`${kind} illustration`}>
    <svg viewBox="0 0 600 360" aria-hidden="true"><defs><linearGradient id={`metal-${kind}`}><stop stopColor="#818890" /><stop offset=".35" stopColor="#e6e9eb" /><stop offset=".6" stopColor="#4c5663" /><stop offset="1" stopColor="#adb5bd" /></linearGradient></defs>
      {kind === 'spring' ? <><path d="M80 80V280" stroke={`url(#metal-${kind})`} strokeWidth="25" /><path d={'M92 180' + Array.from({ length: 10 }, () => 'c0-130 60-130 60 0c0 130-16 130-16 0').join('')} fill="none" stroke={`url(#metal-${kind})`} strokeWidth="9" /><path d="M532 180h45" stroke={`url(#metal-${kind})`} strokeWidth="9" /></> : kind === 'pendulum' ? <><path d="M260 30L365 265" stroke={`url(#metal-${kind})`} strokeWidth="5" /><circle cx="370" cy="280" r="42" fill={`url(#metal-${kind})`} /></> : kind === 'beer' ? <><path d="M235 60h125v240H235Z" fill="#96c8e333" stroke="#8fa9bd" strokeWidth="2" /><path d="M238 125h119v172H238Z" fill="#187ac880" /><path d="M120 190h360" stroke="#53a4ff" strokeWidth="4" /></> : <><path d="M255 100h90v185h-90Z" fill={`url(#metal-${kind})`} /><path d="M290 40h20v60h-20Z" fill="#717a84" /><path d="M255 180h90" stroke="#368de2" strokeWidth="7" /></>}
    </svg>{failed && <p>3D is unavailable on this device. Use the controls to explore the model.</p>}
  </div>;
}


