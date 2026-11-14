/** Entries from mlCandidates.js are model output (ranked similarity), not curated sample locations. */
export const isModelCandidate = (loc) => /^mars-earth-\d+$/i.test(loc?.id ?? '');
