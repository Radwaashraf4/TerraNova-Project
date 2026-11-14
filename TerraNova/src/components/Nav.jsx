import { useEffect, useState } from 'react';

const SECTIONS = [
  ['home', 'Home'],
  ['speaks', 'Earth speaks'],
  ['discoveries', 'Mars analogs'],
  ['moon-analogs', 'Moon analogs'],
  ['resources', 'Resources']
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={'nav' + (scrolled ? ' is-scrolled' : '')}>
      <a className="nav__link nav__link--left" href="#home">Home</a>
      <a className="nav__brand" href="#home" aria-label="Planetary Explorers, home">TerraNova</a>
      <a className="nav__link nav__link--right" href="#resources">Resources</a>
    </header>
  );
}

export function Rail() {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="rail" aria-label="Sections">
      {SECTIONS.map(([id, label]) => (
        <a key={id} href={'#' + id} data-label={label} className={active === id ? 'is-active' : ''} aria-label={label} />
      ))}
    </nav>
  );
}
