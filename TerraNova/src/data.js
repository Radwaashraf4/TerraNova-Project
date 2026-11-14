// SAMPLE DATA. Replace LOCATIONS with the output of your own analysis.
// status: 'verified'  = established, published analog site
//         'candidate' = identified by analysis, field validation pending
// Optional media per location: assets/loc/<id>.jpg (or .mp4) is picked up automatically.

export const LOCATIONS = [
  {
    id: 'atacama', name: 'Atacama Desert', country: 'Chile', flag: '🇨🇱',
    lat: -24.1, lon: -69.9, type: 'mars', status: 'verified',
    terrain: 'Salt flats, dry alluvial fans', climate: 'Hyperarid, intense UV',
    mineral: 'Sulfates, perchlorate-bearing soils', feature: 'Some zones go years without rain',
    why: 'Its soils hold almost no organic matter, much like Martian regolith. Teams use it to test life-detection instruments and rover drills before they fly.',
    line: 'Dry. Salty. Basically Mars with better coffee nearby.',
    stats: ['1,000–4,000 m', 'Hyperarid', 'Salt & sulfate crust'],
    source: 'NASA / peer-reviewed field studies',
    palette: ['#2a1410', '#8a4a2b', '#d9925c']
  },
  {
    id: 'devon', name: 'Haughton Crater, Devon Island', country: 'Canada', flag: '🇨🇦',
    lat: 75.4, lon: -89.8, type: 'mars', status: 'verified',
    terrain: 'Impact crater, polar desert', climate: 'Cold, dry, long daylight in summer',
    mineral: 'Carbonate breccia, impact melt', feature: 'About 23 km wide impact structure',
    why: 'A cold, dry, crater-scarred polar desert. Researchers rehearse Mars surface operations here, from navigation to sample handling.',
    line: 'An impact crater on a polar desert. Mars would feel right at home.',
    stats: ['≈ 0–400 m', 'Polar desert', 'Impact breccia'],
    source: 'Haughton-Mars Project research',
    palette: ['#0b1a2a', '#51708a', '#cfdbe4']
  },
  {
    id: 'riotinto', name: 'Río Tinto', country: 'Spain', flag: '🇪🇸',
    lat: 37.7, lon: -6.55, type: 'mars', status: 'verified',
    terrain: 'Acidic river, iron-rich banks', climate: 'Mediterranean',
    mineral: 'Iron oxides, jarosite', feature: 'Water as acidic as pH ~2',
    why: 'Jarosite, a mineral that forms in acidic water, was found on Mars. Río Tinto shows how life can survive in such chemistry.',
    line: 'A river the colour of rust. Mars approves.',
    stats: ['≈ 100–500 m', 'Acidic waters', 'Iron & jarosite'],
    source: 'NASA astrobiology field research',
    palette: ['#1d0d0a', '#9c3b22', '#e08a4a']
  },
  {
    id: 'maunakea', name: 'Mauna Kea', country: 'United States (Hawaii)', flag: '🇺🇸',
    lat: 19.82, lon: -155.47, type: 'moon', status: 'verified',
    terrain: 'Volcanic cinder and ash slopes', climate: 'Cold, thin air at altitude',
    mineral: 'Basaltic ash, glassy particles', feature: 'Summit at about 4,200 m',
    why: 'Its fine volcanic ash resembles lunar soil, so engineers test excavation and resource-extraction hardware here.',
    line: 'Dusty basalt and thin air. Great rehearsal for lunar digging.',
    stats: ['2,000–4,200 m', 'Cold, thin air', 'Basaltic ash'],
    source: 'NASA in-situ resource utilization field tests',
    palette: ['#0c0e14', '#3b3f4d', '#9aa0b4']
  },
  {
    id: 'askja', name: 'Askja Caldera', country: 'Iceland', flag: '🇮🇸',
    lat: 65.03, lon: -16.75, type: 'moon', status: 'verified',
    terrain: 'Volcanic caldera, lava fields', climate: 'Cold, windy',
    mineral: 'Basalt, tephra', feature: 'Apollo astronauts trained nearby in the 1960s',
    why: 'Barren volcanic terrain that looked enough like the Moon for Apollo crews to practise geology here.',
    line: 'Apollo astronauts trained here. Walk in their footsteps.',
    stats: ['≈ 1,000 m', 'Cold, windy', 'Basalt & tephra'],
    source: 'NASA Apollo-era training records',
    palette: ['#0a0d12', '#2d3a44', '#8da0ad']
  },
  {
    id: 'danakil', name: 'Danakil Depression', country: 'Ethiopia', flag: '🇪🇹',
    lat: 14.24, lon: 40.3, type: 'mars', status: 'verified',
    terrain: 'Salt plains, hot springs, volcanoes', climate: 'Among the hottest places on Earth',
    mineral: 'Sulfur, salts, iron', feature: 'Colourful acidic hydrothermal pools',
    why: 'Hot, acidic, salty pools that mimic ancient hydrothermal settings where scientists look for traces of past life on Mars.',
    line: 'Neon pools and boiling ground. Mars in its wilder days.',
    stats: ['−125 m', 'Extremely hot', 'Sulfur & salts'],
    source: 'Astrobiology field studies',
    palette: ['#1c1208', '#b9852a', '#f0d36a']
  },
  {
    id: 'wadirum', name: 'Wadi Rum', country: 'Jordan', flag: '🇯🇴',
    lat: 29.58, lon: 35.42, type: 'mars', status: 'candidate',
    terrain: 'Red sandstone valleys, dunes', climate: 'Hot, arid',
    mineral: 'Iron-stained sandstone', feature: 'Rust-red desert corridors',
    why: 'Red, iron-stained terrain that visually resembles Martian landscapes. Our data flags it as a promising candidate.',
    line: 'Red sand, towering rock. A candidate worth a closer look.',
    stats: ['≈ 900–1,700 m', 'Hot, arid', 'Iron-stained sandstone'],
    source: 'Project analysis. Field validation pending.',
    palette: ['#2a1209', '#b4542f', '#f0a56e']
  },
  {
    id: 'blackdesert', name: 'Black Desert', country: 'Egypt', flag: '🇪🇬',
    lat: 27.9, lon: 28.9, type: 'moon', status: 'candidate',
    terrain: 'Dark basalt-capped hills over pale sand', climate: 'Hot, extremely dry',
    mineral: 'Basalt, dolerite', feature: 'Dark volcanic scatter across the ground',
    why: 'Basalt-covered ground is chemically similar to lunar mare regions. Our analysis flags it as a possible Moon analog for surface mobility tests.',
    line: 'Dark basalt everywhere. Could be a lunar stand-in. Needs proof!',
    stats: ['≈ 300–600 m', 'Hyperarid', 'Basalt'],
    source: 'Project analysis. Field validation pending.',
    palette: ['#0a0a0d', '#34363f', '#a7a79a']
  }
];

export const WORLDS = {
  earth: {
    name: 'Earth', tag: 'EARTH · HOME', mood: 'speaking',
    intro: [
      "Greetings, human! I'm ORBIT, your guide. This is Earth: 71% water, 100% drama.",
      "Plot twist: some corners of Earth look suspiciously like Mars and the Moon. Scientists test rovers there!",
      "See the glowing rings? Tap one to start a discovery."
    ]
  },
  mars: {
    name: 'Mars', tag: 'MARS · THE RED PLANET', mood: 'intro',
    intro: [
      "Welcome to Mars! It's red because its dust is rusty. Literally iron oxide.",
      "A day lasts about 24 hours 37 minutes, so jet lag is mild. The commute is months, though.",
      "The air is mostly carbon dioxide and under 1% as thick as ours. Bring oxygen. And snacks."
    ]
  },
  moon: {
    name: 'Moon', tag: 'MOON · OUR NEIGHBOUR', mood: 'intro',
    intro: [
      "The Moon! About a quarter of Earth's width, and our only natural satellite.",
      "No air, no weather, so footprints last a very long time. Temperatures swing from above 100°C to below −150°C.",
      "Fun fact: it drifts away from Earth about 3.8 cm every year. Clingy no more."
    ]
  }
};

export const RESOURCES = [
  { group: 'NASA Data Sources', items: [
    ['NASADEM_HGT · 1 arc-second DEM', 'Earth elevation tiles used for the project’s sampled terrain features.', 'NASA LP DAAC', 'https://doi.org/10.5067/MEASURES/NASADEM/NASADEM_HGT.001'],
    ['NASA Earthdata', 'Open access to NASA Earth observation data.', 'NASA', 'https://www.earthdata.nasa.gov/'],
    ['NASA Worldview', 'Browse near-real-time satellite imagery of Earth.', 'NASA', 'https://worldview.earthdata.nasa.gov/'],
    ['Planetary Data System', 'Archive of data from NASA planetary missions.', 'NASA', 'https://pds.nasa.gov/']
  ]},
  { group: 'Scientific Datasets', items: [
    ['MOLA MEGDR', 'Global Mars topographic maps derived from Mars Global Surveyor laser-altimeter observations; the PDS page identifies the maintained PDS4 archive.', 'NASA PDS Geosciences Node', 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html'],
    ['LOLA South Polar Terrain Products', 'Lunar south-polar slope and roughness GeoTIFF products used for the exploratory Moon screening.', 'NASA GSFC Planetary Geodesy and Altimetry', 'https://pgda.gsfc.nasa.gov/products/90'],
    ['Moon Trek', 'Interactive lunar maps and datasets.', 'NASA JPL', 'https://trek.nasa.gov/moon/'],
    ['Mars Trek', 'Interactive Martian maps and datasets.', 'NASA JPL', 'https://trek.nasa.gov/mars/'],
    ['HiRISE', 'High-resolution Mars images from the Reconnaissance Orbiter.', 'UArizona', 'https://www.uahirise.org/']
  ]},
  { group: 'Research References', items: [
    ['NASA Astrophysics Data System', 'Search peer-reviewed planetary science papers.', 'SAO/NASA', 'https://ui.adsabs.harvard.edu/'],
    ['NASA Astrobiology', 'Research on habitability and life in extreme places.', 'NASA', 'https://astrobiology.nasa.gov/'],
    ['Mars Desert Research Station', 'Human-factors analog research on Earth.', 'Mars Society', 'https://mdrs.marssociety.org/']
  ]},
  { group: 'Planetary Science Resources', items: [
    ['USGS Astrogeology', 'Planetary mapping and geologic research.', 'USGS', 'https://www.usgs.gov/centers/astrogeology-science-center'],
    ['Lunar & Planetary Institute', 'Education and research on solar system science.', 'LPI', 'https://www.lpi.usra.edu/'],
    ['LROC', 'Lunar Reconnaissance Orbiter Camera imagery.', 'ASU / NASA', 'https://www.lroc.asu.edu/']
  ]},
  { group: 'Technologies & Tools Used', items: [
    ['Three.js', 'WebGL engine behind the 3D worlds.', 'OPEN SOURCE', 'https://threejs.org/'],
    ['GSAP', 'Animation engine for cinematic transitions.', 'GSAP', 'https://gsap.com/'],
    ['OpenStreetMap', 'Map preview in discovery panels.', 'OPEN DATA', 'https://www.openstreetmap.org/']
  ]}
];
