import { useEffect, useRef, useState } from 'react';

const fmtCoords = (lat, lon) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

export default function Panel({ loc, idx, total = 0, onClose }) {
  const open = Boolean(loc);
  const lastLoc = useRef(loc);
  if (loc) lastLoc.current = loc;
  const shown = lastLoc.current;
  const [more, setMore] = useState(false);

  useEffect(() => setMore(false), [loc?.id]);

  if (!shown) return null;

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${shown.lon - 0.7},${shown.lat - 0.45},${shown.lon + 0.7},${shown.lat + 0.45}&layer=mapnik`;
  const features = shown.terrainFeatures || {};

  return (
    <aside className={'panel' + (open ? ' is-open' : '')} aria-label="Discovery details" aria-hidden={!open}>
      <div className="panel__grip" aria-hidden="true" />
      <div className="panel__top">
        <span className="mono">Candidate {String(shown.rank || idx + 1).padStart(2, '0')} / {String(shown.type === 'moon' ? (shown.totalEvaluated || 6000) : total).padStart(2, '0')}</span>
        <span className="tag tag--c">Candidate</span>
        <button className="x" onClick={onClose} aria-label="Close discovery" tabIndex={open ? 0 : -1}>✕</button>
      </div>
      <h3>{shown.name}</h3>
      <p className="panel__sub">{shown.flag} {shown.country} · <span className="mono">{fmtCoords(shown.lat, shown.lon)}</span></p>
      <span className={shown.type === 'moon' ? "chip chip--moon" : "chip chip--mars"}>{shown.type === 'moon' ? "Moon terrain screening" : "Mars terrain similarity"}</span>
      <dl className="spec">
        <div><dt>{shown.type === 'moon' ? 'Exploratory index' : 'Similarity score'}</dt><dd>{shown.similarity == null ? 'Not available' : shown.type === 'moon' ? `${shown.similarity.toFixed(1)} / 100` : shown.similarity.toFixed(4)}</dd></div>
        <div><dt>Terrain</dt><dd>{shown.terrain}</dd></div>
        <div><dt>Climate</dt><dd>Not analysed</dd></div>
        <div><dt>Mineralogy</dt><dd>Not analysed</dd></div>
        <div><dt>Ranking</dt><dd>{shown.rank} of {shown.type === 'moon' ? (shown.totalEvaluated || 6000) : total} listed candidates</dd></div>
      </dl>
      <h4>What the model compared</h4>
      <p id="pWhy">{shown.why}</p>
      <p className="note">{shown.type === 'moon' ? 'Exploratory Moon screening only. The score is not a probability or a landing-site suitability assessment.' : 'This is a computational terrain-similarity candidate, not a confirmed discovery or verified geological analog. Independent geological review is pending.'}</p>
      <div className="map">
        <iframe title="Candidate coordinate map" src={mapSrc} loading="lazy" referrerPolicy="no-referrer" />
        <i className="map__pin" />
      </div>
      <div className="panel__act">
        <a className="btn" target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}
          href={`https://www.openstreetmap.org/?mlat=${shown.lat}&mlon=${shown.lon}#map=8/${shown.lat}/${shown.lon}`}>Explore on map ↗</a>
        <button className="link link--cy" aria-expanded={more} onClick={() => setMore((value) => !value)}>More details</button>
      </div>
      {more && (
        <div className="more">
          {[
            ['Elevation', `${features.elevation_m ?? 'Not available'} m`],
            ['Slope', `${features.slope_deg ?? 'Not available'}°`],
            ['Local relief', `${features.local_relief_m ?? 'Not available'} m`],
            ['Roughness', `${features.roughness_m ?? 'Not available'} m`],
            ['Distance', shown.distance == null ? 'Not used' : shown.distance.toFixed(4)],
            ...(shown.type === 'moon' ? [['Slope-fit component', `${shown.slopeFitScore ?? 'N/A'} / 100`], ['Earth roughness percentile', `${shown.roughnessPercentile ?? 'N/A'}%`]] : []),
            ['Source', shown.source],
            ['Validation', shown.verificationStatus]
          ].map(([label, value]) => (
            <div key={label}><span>{label}</span><span>{value}</span></div>
          ))}
        </div>
      )}
    </aside>
  );
}
