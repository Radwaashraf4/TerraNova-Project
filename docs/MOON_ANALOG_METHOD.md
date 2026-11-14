# TerraNova Moon Analog Screening — Hackathon Method

## Purpose

Add a first-pass Earth-to-Moon terrain screening beside the existing saved Mars model without modifying the Mars model or its ranked outputs.

## Supplied data used

- `backend/data/features/earth_features.csv`: 6,000 Earth samples from six NASADEM tiles.
- `backend/data/raw/moon/LDRM_80S_1000MPP_ADJ_SLP_400M.tiff`: lunar south-polar slope raster.
- `backend/data/raw/moon/LDRM_80S_1000MPP_ADJ_ROUGH_400M.tiff`: lunar south-polar roughness raster.

The lunar rasters are 608 × 608 pixels with 1,000 m pixel spacing and a 400 m calculation baseline. The supplied slope raster's median is 7.686965°; 369,664 pixels are valid. The roughness raster's median is 1.839766 m; 369,664 pixels are valid. NASA's PGDA product page describes LOLA slope in degrees and roughness in metres; roughness is the spread of height residuals about a fitted plane over a selected baseline.

## Ranking formula

The Moon screening is deliberately a transparent heuristic, not a trained model:

```text
slope_fit = 100 * exp(-0.5 * ((Earth slope - lunar slope median) / lunar slope standard deviation)^2)
roughness_balance = 100 * (1 - abs(Earth roughness percentile - 50) / 50)
Moon index = 0.8 * slope_fit + 0.2 * roughness_balance
```

The roughness balance term only favours Earth samples near the middle of the Earth roughness distribution. It is **not** a physical roughness match to the Moon. Earth roughness and lunar LOLA roughness are both in metres, but the Earth feature table uses a much larger analysis scale (about 27.8 km) and a different calculation method, while the lunar product uses a 400 m baseline and 1 km pixel spacing.

## Top five current results

| Rank | Candidate | Latitude | Longitude | Index / 100 | Earth slope |
|---:|---|---:|---:|---:|---:|
| 1 | MOON-EARTH-01 | 30.970964 | 50.004029 | 97.616 | 8.5974° |
| 2 | MOON-EARTH-02 | 30.245763 | 50.995971 | 96.450 | 8.2408° |
| 3 | MOON-EARTH-03 | 10.904279 | -69.995971 | 96.361 | 6.4942° |
| 4 | MOON-EARTH-04 | 30.995971 | 50.229091 | 96.007 | 6.1635° |
| 5 | MOON-EARTH-05 | -29.104057 | -69.637538 | 94.436 | 7.1602° |

These are the top outputs of this particular six-tile sample, not globally best Earth sites. The index is not a probability or a model confidence.

## Not assessed

No lunar DEM was supplied, so lunar elevation and local relief were not computed. Climate, temperature, illumination, permanently shadowed regions, water ice, radiation, geology, mineralogy, resources, mission logistics, and engineering suitability are not part of this ranking. This is not a landing-site selection or a habitability assessment.

## Rebuild

The precomputed JSON and CSV are bundled, so the backend does not need rasterio at runtime. To rebuild, install `numpy`, `pandas`, and `rasterio` in a build environment and run `python build_moon_candidates.py` from `backend/`.

## References

- NASA GSFC Planetary Geodesy and Altimetry: [A New View of the Lunar South Pole from LOLA](https://pgda.gsfc.nasa.gov/products/90).
- Barker et al. (2023), *Planetary Science Journal* 4, 183. [https://doi.org/10.3847/PSJ/acf3e1](https://doi.org/10.3847/PSJ/acf3e1).
- NASA data DOI: [https://doi.org/10.60903/gsfcpgda-lola-spole](https://doi.org/10.60903/gsfcpgda-lola-spole).
