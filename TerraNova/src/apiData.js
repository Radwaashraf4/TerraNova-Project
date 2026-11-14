const PALETTE = ['#2a1410', '#8a4a2b', '#d9925c'];

const number = (value, digits = 2) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : 'Not available';

export function mapDiscovery(record) {
  const id = String(record.discovery_id || '');
  const rank = Number(record.position_in_ranking) || Number(id.match(/(\d+)$/)?.[1]) || 0;
  const features = record.terrain_features || {};
  const score = Number(record.similarity_score);
  const descriptors = Array.isArray(record.descriptor_facts) ? record.descriptor_facts : [];
  const featureSummary = [
    `elevation ${number(features.elevation_m, 1)} m`,
    `slope ${number(features.slope_deg, 2)}°`,
    `local relief ${number(features.local_relief_m, 1)} m`,
    `roughness ${number(features.roughness_m, 2)} m`
  ].join(', ');
  const shareSummary = descriptors
    .filter((item) => Number.isFinite(Number(item.share_of_distance_percent)))
    .map((item) => `${item.descriptor}: ${number(item.share_of_distance_percent, 1)}% of the calculated distance`)
    .join('; ');

  return {
    id: id.toLowerCase(),
    discoveryId: id,
    name: `Terrain candidate ${String(rank).padStart(2, '0')}`,
    country: 'Coordinates only (no place name in the data)',
    flag: '📍',
    lat: Number(record.latitude),
    lon: Number(record.longitude),
    type: 'mars',
    status: 'candidate',
    terrain: 'Terrain metrics computed from the project feature dataset',
    climate: 'Not analysed',
    mineral: 'Not analysed',
    feature: `Ranked ${rank} of ${record.candidates_listed || 20} by computational similarity to the average Mars terrain profile`,
    why: `${id} is ranked ${rank} with a similarity score of ${number(score, 4)}. The analysed terrain values are ${featureSummary}.${shareSummary ? ` Feature contributions reported by the project: ${shareSummary}.` : ''} These results are computational candidates and require independent geological review.`,
    line: `Ranked ${rank} of ${record.candidates_listed || 20}: similarity ${number(score, 4)} to the average Mars terrain profile.`,
    stats: [
      `${number(features.elevation_m, 1)} m`,
      'Not analysed',
      `Slope ${number(features.slope_deg, 2)}°, relief ${number(features.local_relief_m, 1)} m`
    ],
    source: `${record.source_file || 'Project feature dataset'}; NASADEM Earth terrain compared with the Mars MOLA reference profile`,
    palette: PALETTE,
    similarity: Number.isFinite(score) ? score : null,
    distance: Number(record.distance_to_mars_profile),
    rank,
    terrainFeatures: features,
    descriptorFacts: descriptors,
    verificationStatus: record.verification_status || 'Independent geological validation pending',
    disclaimer: record.disclaimer || 'Computational terrain-similarity candidate; not a confirmed discovery.'
  };
}

export function mapDiscoveries(payload) {
  if (!payload || !Array.isArray(payload.discoveries)) {
    throw new Error('The API returned an unexpected discoveries response.');
  }
  return payload.discoveries.map(mapDiscovery).filter((item) =>
    item.discoveryId && Number.isFinite(item.lat) && Number.isFinite(item.lon)
  );
}


const MOON_PALETTE = ['#11141d', '#555b6b', '#b7c0d2'];

export function mapMoonDiscovery(record) {
  const features = record.terrain_features || {};
  const rank = Number(record.rank) || 0;
  const index = Number(record.similarity_index);
  const coords = `${Number(record.latitude).toFixed(4)}, ${Number(record.longitude).toFixed(4)}`;
  return {
    id: String(record.discovery_id || '').toLowerCase(),
    discoveryId: String(record.discovery_id || ''),
    name: `Moon terrain candidate ${String(rank).padStart(2, '0')}`,
    country: 'Coordinates only · Earth sample',
    flag: '🌕', lat: Number(record.latitude), lon: Number(record.longitude),
    type: 'moon', status: 'candidate',
    terrain: 'Earth terrain sample screened against the supplied lunar south-polar slope reference',
    climate: 'Not analysed', mineral: 'Not analysed',
    feature: `Exploratory Moon-terrain index ${Number.isFinite(index) ? index.toFixed(1) : 'not available'} / 100`,
    why: `${record.discovery_id} is ranked ${rank}. Coordinates: ${coords}. Earth slope is ${features.slope_deg}°, compared with a lunar south-polar slope median of about 7.69°. The index combines slope fit (80%) with a within-Earth roughness-percentile balance term (20%). Earth local relief and roughness are shown as context, not as direct lunar matches.`,
    line: `Moon analog screening candidate ${rank}, with an exploratory index of ${Number.isFinite(index) ? index.toFixed(1) : 'not available'} out of 100.`,
    stats: [`${features.elevation_m} m`, 'Not analysed', `Slope ${features.slope_deg}° · relief ${features.local_relief_m} m`],
    source: `${record.source_file || 'Earth feature table'}; NASA LOLA south-polar slope and roughness reference`,
    palette: MOON_PALETTE, similarity: Number.isFinite(index) ? index : null,
    similarityScale: 100, rank, totalEvaluated: Number(record.total_evaluated) || 6000, terrainFeatures: features,
    roughnessPercentile: record.earth_roughness_percentile,
    slopeFitScore: record.slope_fit_score,
    roughnessBalanceScore: record.earth_roughness_balance_score,
    verificationStatus: 'Exploratory heuristic; independent geological validation pending',
    disclaimer: record.disclaimer || 'Exploratory computational candidate; not a confirmed lunar analog.'
  };
}

export function mapMoonDiscoveries(payload) {
  if (!payload || !Array.isArray(payload.discoveries)) {
    throw new Error('The Moon API returned an unexpected discoveries response.');
  }
  return payload.discoveries.map(mapMoonDiscovery).filter((item) =>
    item.discoveryId && Number.isFinite(item.lat) && Number.isFinite(item.lon)
  );
}
