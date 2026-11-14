import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { D } from '../motion.js';

function MoonCard({ loc, onExplore }) {
  return (
    <article className="gcard moon-card" key={loc.id}>
      <div className="moon-card__orb" aria-hidden="true"><span /></div>
      <div className="chap__txt">
        <div className="badges"><span className="chip chip--moon">Moon terrain candidate</span><span className="tag tag--c">Exploratory heuristic</span></div>
        <h3>{loc.name}</h3>
        <p className="ctry">{loc.flag} {loc.country} · Rank {loc.rank}</p>
        <p className="d">{loc.why}</p>
        <div className="strip">
          <div>Index<b>{loc.similarity == null ? 'N/A' : `${loc.similarity.toFixed(1)} / 100`}</b></div>
          <div>Slope<b>{loc.terrainFeatures.slope_deg.toFixed(2)}°</b></div>
          <div>Relief<b>{loc.terrainFeatures.local_relief_m.toFixed(0)} m</b></div>
          <small>Source · {loc.source}</small>
        </div>
        <button className="btn" onClick={onExplore}>Explore candidate →</button>
      </div>
    </article>
  );
}

export default function MoonDiscoveries({ locations = [], loading = false, error = null, modelInfo = null, onExplore }) {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.moon-card', { y: 28, autoAlpha: 0, duration: D(0.8), stagger: 0.08, scrollTrigger: { trigger: '.moon-results-grid', start: 'top 85%' } });
    }, root);
    return () => ctx.revert();
  }, [locations.length, loading, error]);

  return (
    <section className="moon-results" id="moon-analogs" ref={root}>
      <header className="disc__head">
        <p className="eyebrow">LOLA · Moon analog screening</p>
        <h2>Earth terrain candidates compared with the Moon.</h2>
        <p className="lede">A quick hackathon heuristic using the supplied lunar south-polar slope and roughness rasters and 6,000 Earth samples. It is separate from the saved Mars model and is not a trained Moon ML model.</p>
        {modelInfo && <div className="model-summary">
          <p><b>Lunar reference:</b> {modelInfo.reference_region}</p>
          <p><b>Slope median:</b> {Number(modelInfo.lunar_slope?.median).toFixed(2)}° · <b>Valid lunar pixels:</b> {Number(modelInfo.lunar_slope?.valid_pixels).toLocaleString()}</p>
          <p><b>Ranking:</b> 80% lunar slope fit + 20% Earth roughness-percentile balance proxy.</p>
        </div>}
      </header>
      {loading && <p className="lede" role="status">Loading Moon analog candidates…</p>}
      {!loading && error && <p className="lede" role="alert">Moon candidates could not be loaded: {error}. The Mars results remain available.</p>}
      {!loading && !error && locations.length === 0 && <p className="lede">No Moon candidate records were returned.</p>}
      {locations.length > 0 && <div className="moon-results-grid">
        {locations.map((loc, idx) => <MoonCard key={loc.id} loc={loc} onExplore={() => onExplore(idx)} />)}
      </div>}
      <p className="moon-caveat">Important: Earth features were computed at about 27.8 km scale; the lunar reference rasters use 1 km pixels and a 400 m calculation baseline. Roughness units are metres in the lunar product, but the baselines differ. The roughness term is therefore only a relative Earth-sample balance proxy, not a direct Moon-to-Earth match. Local relief, climate, illumination, temperature, water ice, geology and engineering suitability are not assessed. Scores are not probabilities.</p>
    </section>
  );
}
