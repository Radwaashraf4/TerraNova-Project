import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { RESOURCES } from '../data.js';
import { D } from '../motion.js';

export function Resources() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.rg', { y: 40, autoAlpha: 0, duration: D(1), stagger: 0.12, scrollTrigger: { trigger: '.res__grid', start: 'top 80%' } });
    }, root);
    return () => ctx.revert();
  }, []);
  return (
    <section className="res" id="resources" ref={root}>
      <header className="res__head">
        <p className="eyebrow">Resources</p>
        <h2>The science behind the journey.</h2>
      </header>
      <div className="res__grid">
        {RESOURCES.map((g) => (
          <div className="rg" key={g.group}>
            <h3>{g.group}</h3>
            {g.items.map(([name, desc, src, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                <b>{name}</b><span className="src">{src}</span>
                <span className="d">{desc}</span><span className="ar" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__brand">PLANETARY EXPLORERS</div>
      <p>Built for the NASA Space Apps Challenge · © {new Date().getFullYear()}</p>
      <p className="foot__note">An independent project, not affiliated with or endorsed by NASA.</p>
    </footer>
  );
}
