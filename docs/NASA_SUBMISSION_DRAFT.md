# TerraNova — NASA Space Apps 2026 Submission Draft

## Project title

TerraNova — Exploring Earth Terrain Analogs for Mars and the Moon

## High-level project summary

TerraNova is an interactive 3D exploration platform that helps users investigate how selected Earth terrain measurements compare with planetary terrain. Its saved machine-learning model ranks 6,000 sampled Earth terrain points by their computational similarity to an average Mars terrain profile derived from MOLA topography. Users can explore the Earth, Mars, and Moon in 3D, inspect ranked candidate coordinates and terrain measurements, compare candidates, and ask ORBIT to explain the model's results using project data. The rankings are research candidates—not confirmed analog sites or evidence of geological equivalence.

## Detailed project description

TerraNova combines a React and Three.js planetary interface with a Python FastAPI backend. The backend loads the project's saved scikit-learn preprocessing pipeline and nearest-neighbour model. Terrain features in the supplied artifact include elevation, slope, local relief, roughness, and a duplicated elevation-spread field (`elev_std`) that equals roughness in the supplied feature export. The model rescales and standardises those features, calculates Euclidean distance from the average Mars terrain profile, and converts distance to similarity using `1 / (1 + distance)`.

The ranked output includes 20 leading Earth candidates from a search of 6,000 sampled points drawn from six NASADEM tiles. The frontend retrieves those records from the API and visualises their coordinates as interactive Earth markers. The candidate panel shows the measured terrain fields and ranking information. ORBIT explains the model, candidate values, comparisons, and limitations from the backend's project records and metadata. When an Anthropic API key is configured, an optional Claude response path is available; otherwise the project uses a rule-based, data-grounded fallback.

A separate Moon Analog Screening section has now been added using the supplied NASA LOLA south-polar slope and roughness rasters. It evaluates the same 6,000 Earth samples and creates an exploratory heuristic ranking. This is deliberately not presented as a trained Moon ML model: slope fit contributes 80%, and a within-Earth roughness-percentile balance proxy contributes 20%. The roughness proxy is not a direct physical Moon-to-Earth roughness match because spatial baselines and processing definitions differ. The Moon candidates are therefore hackathon screening candidates, not confirmed geological analogs or landing-site recommendations.

## Data and scientific sources

### Primary data used by the supplied terrain model

- **NASADEM_HGT — NASADEM Merged DEM Global 1 arc second V001**, NASA Land Processes Distributed Active Archive Center (LP DAAC): https://doi.org/10.5067/MEASURES/NASADEM/NASADEM_HGT.001
- **MOLA MEGDR — Mars Orbiter Laser Altimeter Mission Experiment Gridded Data Record**, NASA Planetary Data System Geosciences Node: https://pds-geosciences.wustl.edu/missions/mgs/megdr.html

The included candidate CSV records the NASADEM tile filename associated with each candidate. The project metadata identifies MOLA as the Mars reference. The team should confirm the exact MOLA map resolution and preprocessing granules from the original source feature-generation workflow before adding them to a methods appendix.

### Additional Moon data sources

- **NASA GSFC PGDA — A New View of the Lunar South Pole from LOLA**, product definitions and source files: https://pgda.gsfc.nasa.gov/products/90
- Barker et al. (2023), *Planetary Science Journal*, 4, 183: https://doi.org/10.3847/PSJ/acf3e1
- LOLA south-pole data DOI: https://doi.org/10.60903/gsfcpgda-lola-spole

### Additional reference and interface resources

- NASA Planetary Data System: https://pds.nasa.gov/
- NASA Moon Trek: https://trek.nasa.gov/moon/
- NASA Mars Trek: https://trek.nasa.gov/mars/
- OpenStreetMap: https://www.openstreetmap.org/ (coordinate map previews only)

## Scientific limitations

- The model's 6,000 Earth samples come from six NASADEM tiles; this is not a global search of Earth.
- The reference is an average Mars terrain profile, not a specific Mars landing site.
- The Moon screening is a simple heuristic, not a trained Moon ML model. It uses a south-polar reference raster, not the entire Moon.
- The saved model contains `elev_std`, which duplicates `roughness`; roughness is therefore counted twice.
- Earth and Mars elevation reference systems and source spatial scales differ.
- Climate, temperature, illumination, permanently shadowed regions, water ice, mineralogy, lithology, radiation, and operational base-construction constraints are not included in either ranking.
- Similarity is a distance-derived score, not a probability, confidence, or measure of scientific accuracy.
- Independent geological validation and literature screening are still required.

## AI tool disclosure

The ORBIT chatbot is designed to explain project data and model results. The source includes an optional Anthropic Claude API integration, with the API key stored only on the backend. The chatbot also has a deterministic fallback response mode. The terrain ranking itself is generated by the saved scikit-learn model, not by the LLM. In the final submission, disclose Anthropic Claude only if the external Claude path was enabled or used during the project/demo, and list any additional AI tools actually used by the team.

## Demo outline (30 seconds maximum)

1. **0–5 s:** Open TerraNova and show the 3D Earth, Mars, and Moon experience.
2. **5–12 s:** Select Earth and show the ranked terrain candidate markers.
3. **12–19 s:** Open a candidate and show its coordinates, similarity score, and terrain metrics.
4. **19–24 s:** Switch to Moon Analog Screening and show the LOLA-based top Earth candidates.
5. **24–28 s:** Ask ORBIT why a Moon candidate ranks highly.
6. **28–30 s:** Show the disclaimer: exploratory index, not a confirmed geological analog or landing-site assessment.

## Links to fill in on the official portal

- Final project/demo URL: `[INSERT PUBLIC DEPLOYED PROJECT URL]`
- Existing public frontend/project repository remote: https://github.com/Radwaashraf4/testing
- Existing public backend repository remote: https://github.com/Radwaashraf4/backend
- Important: the supplied archive has these as separate Git repositories. The repaired unified source ZIP has **not** been pushed to either remote. Update one unified public repository (or synchronize both repositories) before submitting a repository link.
- Demo video (30 seconds or less) or slide presentation (up to 7 slides): `[INSERT PUBLIC DEMO URL]`

Before submitting, open all three links in a private/incognito browser window to verify public access without sign-in or permission requests.
