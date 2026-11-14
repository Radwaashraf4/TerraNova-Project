const DOCK = [['earth', 'Earth'], ['mars', 'Mars'], ['moon', 'Moon']];

export default function Hero({ world, onSelect, onBack, tagRef, children }) {
  return (
    <section className="hero" id="home">
      <div className={'hero__copy' + (world ? ' is-hidden' : '')}>
        <svg className="logo" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
          <circle cx="24" cy="24" r="8" fill="none" stroke="#EAF1FF" strokeWidth="1.5" />
          <ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(-24 24 24)" fill="none" stroke="#4FD8FF" strokeWidth="1.2" />
          <circle cx="41" cy="16" r="2.4" fill="#FF7A3D" />
        </svg>
        <p className="eyebrow">NASA Space Apps Challenge</p>
        <h1><span>Three worlds.</span> <span>One question:</span> <span>could we live there?</span></h1>
        <p className="lede">Explore Earth, Mars and the Moon, then discover places on our own planet that mimic them.</p>
        <p className="choose"><i />Choose a world to explore</p>
      </div>

      <div className="hover-tag" ref={tagRef} aria-hidden="true" />

      <ul className="legend" aria-label="Marker legend">
        <li><b className="lg lg--moon" />Moon analog</li>
        <li><b className="lg lg--mars" />Mars analog</li>
        <li><b className="lg lg--solid" />Verified</li>
        <li><b className="lg lg--dash" />Candidate</li>
      </ul>

      <div className="dock" role="group" aria-label="Choose a world">
        {DOCK.map(([key, label]) => (
          <button key={key} aria-pressed={world === key} onClick={() => onSelect(key)}>
            <i className={'orb orb--' + key} /><span>{label}</span>
          </button>
        ))}
        <button className="dock__back" aria-label="Back to all worlds" onClick={onBack}><span>↺ All worlds</span></button>
      </div>

      <p className="hints"><span>Click a world</span><span>Drag to rotate</span><span>Scroll to continue</span></p>

      {children}
    </section>
  );
}
