# TerraNova — Data Sources and Provenance

## Earth

- **NASADEM_HGT — NASADEM Merged DEM Global 1 arc second V001**, NASA LP DAAC. DOI: https://doi.org/10.5067/MEASURES/NASADEM/NASADEM_HGT.001
- Earth terrain feature table: `backend/data/features/earth_features.csv` (6,000 sampled rows from six source tiles). The `source` column preserves the NASADEM tile filename for each row.

## Mars

- **MOLA MEGDR — Mars Orbiter Laser Altimeter Mission Experiment Gridded Data Record**, NASA Planetary Data System Geosciences Node: https://pds-geosciences.wustl.edu/missions/mgs/megdr.html
- Mars feature table: `backend/data/features/mars_features.csv`.
- The original saved Mars model bundle and ranked results remain unchanged.

## Moon

- **NASA GSFC PGDA — A New View of the Lunar South Pole from LOLA**: https://pgda.gsfc.nasa.gov/products/90
- Supplied lunar slope raster: `backend/data/raw/moon/LDRM_80S_1000MPP_ADJ_SLP_400M.tiff` (slope in degrees; 1 km pixel spacing; 400 m baseline).
- Supplied lunar roughness raster: `backend/data/raw/moon/LDRM_80S_1000MPP_ADJ_ROUGH_400M.tiff` (roughness in metres; 1 km pixel spacing; 400 m baseline).
- Data DOI: https://doi.org/10.60903/gsfcpgda-lola-spole
- Barker et al. (2023), *Planetary Science Journal*, 4, 183. DOI: https://doi.org/10.3847/PSJ/acf3e1

The Moon screening is limited to the supplied south-polar raster coverage. The Moon roughness and Earth roughness features use different baselines and methods, so the application does not claim a direct physical roughness match. The score is an exploratory hackathon index, not a trained Moon model or a probability.
