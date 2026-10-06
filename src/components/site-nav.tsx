import Link from 'next/link';
export function SiteNav({ dark = false, page }: { dark?: boolean; page?: 'home' | 'explore' | 'methodology' }) {
  return <header className={`home-nav public-nav${dark ? ' dark-nav' : ''}`}><Link href="/" className="home-brand">ModelScope</Link><nav aria-label="Main navigation"><Link href="/explore" aria-current={page === 'explore' ? 'page' : undefined}>Explore</Link><Link href="/workspace?experiment=custom">Analyze</Link><Link href="/methodology" aria-current={page === 'methodology' ? 'page' : undefined}>Methodology</Link><a href="https://github.com/luiscontrerasus-glitch/ModelScope" target="_blank" rel="noreferrer">GitHub</a></nav><Link className="home-button nav-action" href="/workspace?experiment=spring-hooke">Open ModelScope <span aria-hidden="true">→</span></Link></header>;
}
export function SiteFooter() {
  return <footer className="home-footer"><Link href="/">ModelScope</Link><span>Scientific models. Visible limits.</span><Link href="/methodology">Read the methodology →</Link></footer>;
}
