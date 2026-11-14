
import * as THREE from 'three';
import gsap from 'gsap';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { WORLDS } from './data.js';
import { D, reduce } from './motion.js';

// ------------------------------------------------------------
// MODEL PATHS
// ------------------------------------------------------------

const MODEL_PATHS = {
  earth: '/models/Earth/Earth.glb',
  mars: '/models/Mars/Mars.glb',
  moon: '/models/Moon/Moon.glb'
};

const COLORS = {
  mars: 0xff7a3d,
  moon: 0x4fd8ff
};

const BASE_SPIN = {
  earth: 0.02,
  mars: 0.018,
  moon: 0.006
};

const LIGHT = {
  none: { color: '#fff4e6', i: 2.3 },
  earth: { color: '#fff4e6', i: 2.3 },
  mars: { color: '#ffc59a', i: 2.2 },
  moon: { color: '#ffffff', i: 3.0 }
};

// ------------------------------------------------------------
// MODEL HELPERS
// ------------------------------------------------------------

function normalizeModel(object) {
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);

  if (box.isEmpty()) {
    throw new Error('The loaded 3D model has no geometry.');
  }

  const center = new THREE.Vector3();
  box.getCenter(center);

  object.position.sub(center);
  object.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(object);
  const sphere = normalizedBox.getBoundingSphere(new THREE.Sphere());

  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) {
    throw new Error('Invalid 3D model dimensions.');
  }

  object.scale.multiplyScalar(1 / sphere.radius);
  object.updateMatrixWorld(true);

  return object;
}

function prepareModel(object, key, meshList) {
  object.traverse((child) => {
    if (!child.isMesh) return;

    child.userData.planet = key;
    child.castShadow = true;
    child.receiveShadow = true;

    if (child.geometry) {
      child.geometry.computeBoundingSphere();
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => {
        mat.needsUpdate = true;
      });
    } else if (child.material) {
      child.material.needsUpdate = true;
    }

    meshList.push(child);
  });

  return object;
}

function latLon(lat, lon, r = 1) {
  const phi = THREE.MathUtils.degToRad(lat);
  const lam = THREE.MathUtils.degToRad(lon);

  return new THREE.Vector3(
      r * Math.cos(phi) * Math.cos(lam),
      r * Math.sin(phi),
      -r * Math.cos(phi) * Math.sin(lam)
  );
}

// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------

export function createEngine(
    canvas,
    { tagEl, onSelectWorld, onOpenLocation, onReady, locations = [] }
) {
  const lowPower = matchMedia('(max-width: 767px)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(
      Math.min(devicePixelRatio, lowPower ? 1.5 : 2)
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
  camera.position.set(0, 0, 14);

  // ----------------------------------------------------------
  // LIGHTING
  // ----------------------------------------------------------

  scene.add(new THREE.AmbientLight(0x6f86c9, 0.22));

  const sun = new THREE.DirectionalLight(0xfff4e6, 2.3);
  sun.position.set(7, 3.5, 6);
  scene.add(sun);

  // Neutral rim light instead of blue rim light.
  const rim = new THREE.DirectionalLight(0xffffff, 0.12);
  rim.position.set(-6, -2, -4);
  scene.add(rim);

  // ----------------------------------------------------------
  // STARS
  // ----------------------------------------------------------

  const starLayers = [];

  [[1400, 0.9, 120], [700, 1.3, 90], [250, 1.9, 60]]
      .forEach(([n, size, r], i) => {
        const pos = new Float32Array(n * 3);

        for (let k = 0; k < n; k++) {
          const u = Math.random() * 2 - 1;
          const t = Math.random() * Math.PI * 2;
          const s = Math.sqrt(1 - u * u);
          const rr = r * (0.8 + Math.random() * 0.4);

          pos.set([
            rr * s * Math.cos(t),
            rr * u,
            -Math.abs(rr * s * Math.sin(t)) - 10
          ], k * 3);
        }

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(pos, 3)
        );

        const material = new THREE.PointsMaterial({
          color: i === 2 ? 0xbfe6ff : 0xffffff,
          size,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.55 + i * 0.15,
          depthWrite: false
        });

        const points = new THREE.Points(geometry, material);

        starLayers.push(points);
        scene.add(points);
      });

  // ----------------------------------------------------------
  // NEBULAE
  // ----------------------------------------------------------

  function nebula(color, x, y, size, opacity) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;

    const ctx = c.getContext('2d');

    const gradient = ctx.createRadialGradient(
        128, 128, 0,
        128, 128, 128
    );

    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(c);

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
    );

    sprite.position.set(x, y, -60);
    sprite.scale.set(size, size, 1);

    scene.add(sprite);

    return sprite;
  }

  const nebulae = [
    nebula('rgba(107,78,255,1)', -30, 14, 90, 0.16),
    nebula('rgba(47,107,255,1)', 36, -12, 110, 0.14)
  ];

  // ----------------------------------------------------------
  // MODEL LOADING
  // ----------------------------------------------------------

  let bootDone = false;
  let destroyed = false;

  const manager = new THREE.LoadingManager();
  const gltfLoader = new GLTFLoader(manager);

  const modelMeshes = [];

  const hideBoot = () => {
    if (bootDone || destroyed) return;

    bootDone = true;
    onReady?.();
    intro();
  };

  manager.onLoad = hideBoot;

  manager.onError = (url) => {
    console.error('Failed to load asset:', url);
  };

  const bootTimer = setTimeout(hideBoot, 7000);

  // ----------------------------------------------------------
  // PLANET GROUPS
  // ----------------------------------------------------------

  const world = new THREE.Group();
  scene.add(world);

  const planets = {};

  function makePlanet(key) {
    const root = new THREE.Group();
    const spin = new THREE.Group();
    const modelRoot = new THREE.Group();

    spin.add(modelRoot);
    root.add(spin);

    // No atmosphere mesh: removes the colored glow.

    world.add(root);

    planets[key] = {
      key,
      root,
      spin,
      modelRoot,
      meshes: [],
      loaded: false
    };

    return planets[key];
  }

  const earth = makePlanet('earth');
  const mars = makePlanet('mars');
  const moon = makePlanet('moon');

  // ----------------------------------------------------------
  // LOAD GLB MODELS
  // ----------------------------------------------------------

  function loadGLB(planet) {
    gltfLoader.load(
        MODEL_PATHS[planet.key],

        (gltf) => {
          if (destroyed) {
            gltf.scene.traverse((obj) => {
              obj.geometry?.dispose?.();

              if (obj.material) {
                const materials = Array.isArray(obj.material)
                    ? obj.material
                    : [obj.material];

                materials.forEach((mat) => {
                  mat.map?.dispose?.();
                  mat.dispose();
                });
              }
            });

            return;
          }

          const model = gltf.scene;

          normalizeModel(model);

          prepareModel(
              model,
              planet.key,
              planet.meshes
          );

          planet.modelRoot.add(model);
          modelMeshes.push(...planet.meshes);

          planet.loaded = true;
        },

        undefined,

        (error) => {
          console.error(
              `${planet.key} GLB loading error:`,
              error
          );
        }
    );
  }

  loadGLB(earth);
  loadGLB(mars);
  loadGLB(moon);

  // ----------------------------------------------------------
  // INITIAL PLANET ROTATIONS
  // ----------------------------------------------------------

  earth.spin.rotation.set(0.25, 1.2, 0);
  mars.spin.rotation.set(0.15, 0.4, 0);
  moon.spin.rotation.set(0.05, 2.2, 0);

  // ----------------------------------------------------------
  // EARTH LOCATION MARKERS
  // ----------------------------------------------------------

  const markerGroup = new THREE.Group();

  earth.spin.add(markerGroup);
  markerGroup.visible = false;

  const markers = [];
  const hitMeshes = [];

  locations.forEach((loc, idx) => {
    const g = new THREE.Group();

    const n = latLon(loc.lat, loc.lon, 1).normalize();

    g.position.copy(n.clone().multiplyScalar(1.006));

    g.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        n
    );

    const col = COLORS[loc.type];
    const verified = loc.status === 'verified';

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.026, 0.031, 40),

        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        })
    );

    g.add(ring);

    let core;

    if (verified) {
      core = new THREE.Mesh(
          new THREE.CircleGeometry(0.014, 24),

          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            depthWrite: false
          })
      );

    } else {
      const pts = [];

      for (let k = 0; k <= 48; k++) {
        const a = (k / 48) * Math.PI * 2;

        pts.push(
            new THREE.Vector3(
                Math.cos(a) * 0.016,
                Math.sin(a) * 0.016,
                0
            )
        );
      }

      core = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),

          new THREE.LineDashedMaterial({
            color: 0xffffff,
            dashSize: 0.008,
            gapSize: 0.006,
            transparent: true
          })
      );

      core.computeLineDistances();
    }

    g.add(core);

    const pulse = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.033, 40),

        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        })
    );

    g.add(pulse);

    const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),

        new THREE.MeshBasicMaterial({
          visible: false
        })
    );

    hit.userData.loc = loc;
    hit.userData.idx = idx;

    g.add(hit);
    hitMeshes.push(hit);

    g.userData = {
      ring,
      core,
      pulse,
      hit,
      normal: n,
      phase: idx * 0.37
    };

    markerGroup.add(g);
    markers.push(g);
  });

  // ----------------------------------------------------------
  // STATE AND LAYOUT
  // ----------------------------------------------------------

  const state = {
    selected: null,
    panel: false,
    focusLock: false
  };

  function computeLayout() {
    const a = camera.aspect;
    const hw = 4.4 * a;
    const u = Math.min(1, hw / 7);

    const sel = state.selected;
    const L = {};

    if (a >= 0.95) {
      if (!sel) {
        // Initial view: larger planets.

        L.earth = [-0.1 * hw, 0, 2.5 * u];
        L.mars = [0.47 * hw, 0.3, 1.05 * u];
        L.moon = [0.76 * hw, 0.9, 0.7 * u];

      } else if (sel === 'earth') {
        if (state.panel) {
          // Earth grows when its information panel opens.

          L.earth = [-0.3 * hw, 0, 2.8 * u];
          L.mars = [0.55 * hw, 2.5, 0.3 * u];
          L.moon = [0.7 * hw, 2.0, 0.2 * u];

        } else {
          L.earth = [0.02 * hw, 0, 2.7 * u];
          L.mars = [0.78 * hw, 1.7, 0.7 * u];
          L.moon = [0.78 * hw, 0.3, 0.48 * u];
        }

      } else if (sel === 'mars') {
        L.mars = [0.02 * hw, 0, 2.5 * u];
        L.earth = [-0.78 * hw, 0.9, 0.95 * u];
        L.moon = [0.78 * hw, 0.6, 0.6 * u];

      } else {
        L.moon = [0.02 * hw, 0, 2.25 * u];
        L.earth = [-0.78 * hw, 0.9, 0.95 * u];
        L.mars = [0.78 * hw, 0.6, 0.7 * u];
      }

    } else {
      // Mobile layout.

      const main = Math.min(2.7, hw * 0.95);
      const s = hw * 0.2;

      if (!sel) {
        L.earth = [0, 1.15, main];
        L.mars = [-0.5 * hw, -2.5, hw * 0.3];
        L.moon = [0.5 * hw, -2.5, hw * 0.22];

      } else {
        const others = ['earth', 'mars', 'moon']
            .filter((k) => k !== sel);

        const y = state.panel && sel === 'earth' ? 2.5 : 1.3;

        L[sel] = [
          0,
          y,
          state.panel
              ? Math.min(1.8, hw * 0.78)
              : main
        ];

        L[others[0]] = [-0.45 * hw, -2.7, s];
        L[others[1]] = [0.45 * hw, -2.7, s];
      }
    }

    return L;
  }

  function layout(instant = false) {
    const L = computeLayout();
    const d = D(1.6);

    Object.keys(planets).forEach((k) => {
      const [x, y, r] = L[k];
      const p = planets[k];

      if (instant) {
        gsap.killTweensOf([
          p.root.position,
          p.root.scale
        ]);

        gsap.set(p.root.position, { x, y });

        gsap.set(p.root.scale, {
          x: r,
          y: r,
          z: r
        });

      } else {
        gsap.to(p.root.position, {
          x,
          y,
          duration: d,
          ease: 'power3.inOut',
          overwrite: true
        });

        gsap.to(p.root.scale, {
          x: r,
          y: r,
          z: r,
          duration: d,
          ease: 'power3.inOut',
          overwrite: true
        });
      }
    });
  }

  // ----------------------------------------------------------
  // LIGHTING TRANSITIONS
  // ----------------------------------------------------------

  function setLight(key) {
    const d = D(1.6);
    const l = LIGHT[key || 'none'];
    const c = new THREE.Color(l.color);

    gsap.to(sun.color, {
      r: c.r,
      g: c.g,
      b: c.b,
      duration: d
    });

    gsap.to(sun, {
      intensity: l.i,
      duration: d
    });

    gsap.to(nebulae[0].material, {
      opacity: key === 'moon' ? 0.05 : 0.16,
      duration: d
    });

    gsap.to(nebulae[1].material, {
      opacity: key === 'moon' ? 0.05 : 0.14,
      duration: d
    });

    gsap.to(camera.position, {
      z: key ? 12.8 : 14,
      duration: d,
      ease: 'power2.inOut'
    });
  }

  // ----------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------

  function setWorld(key) {
    if (!planets[key] || state.selected === key) return;

    state.selected = key;
    state.panel = false;
    state.focusLock = false;

    layout();
    setLight(key);

    markerGroup.visible = key === 'earth';

    if (key === 'earth') {
      gsap.to(earth.spin.rotation, {
        x: 0.25,
        duration: D(1.2)
      });
    }
  }

  function focusLocation(idx) {
    if (idx == null) {
      if (!state.panel) return;

      state.panel = false;
      state.focusLock = false;

      gsap.to(camera.position, {
        z: state.selected ? 12.8 : 14,
        duration: D(1.2),
        ease: 'power2.inOut'
      });

      gsap.to(earth.spin.rotation, {
        x: 0.25,
        duration: D(1.2)
      });

      layout();
      return;
    }

    const loc = locations[idx];

    if (!loc) return;

    state.panel = true;
    state.focusLock = true;

    const lam = THREE.MathUtils.degToRad(loc.lon);
    const phi = THREE.MathUtils.degToRad(loc.lat);

    let target = -Math.PI / 2 - lam;

    target +=
        Math.round(
            (earth.spin.rotation.y - target) /
            (Math.PI * 2)
        ) * Math.PI * 2;

    gsap.to(earth.spin.rotation, {
      x: phi,
      y: target,
      duration: D(1.6),
      ease: 'expo.inOut'
    });

    gsap.to(camera.position, {
      z: 11.2,
      duration: D(1.6),
      ease: 'expo.inOut'
    });

    layout();
  }

  // ----------------------------------------------------------
  // INTRO ANIMATION
  // ----------------------------------------------------------

  let running = true;

  function setScroll(progress) {
    canvas.style.opacity = String(
        1 - Math.min(1, progress * 1.15)
    );

    running = progress < 1;
  }

  function intro() {
    Object.values(planets).forEach((p, i) => {
      const s = p.root.scale.x;

      p.root.scale.setScalar(0.001);

      gsap.to(p.root.scale, {
        x: s,
        y: s,
        z: s,
        duration: D(2.2),
        delay: 0.2 + i * 0.25,
        ease: 'power3.out'
      });
    });
  }

  // ----------------------------------------------------------
  // POINTER INTERACTION
  // ----------------------------------------------------------

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  let down = null;
  let dragging = false;

  const mouse = { x: 0, y: 0 };

  function pick(e) {
    const r = canvas.getBoundingClientRect();

    if (!r.width || !r.height) return null;

    ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
    );

    ray.setFromCamera(ndc, camera);

    const targets = modelMeshes.filter(
        (mesh) => mesh.visible
    );

    if (state.selected === 'earth') {
      targets.push(...hitMeshes);
    }

    return ray.intersectObjects(targets, true)[0] || null;
  }

  const overUI = (e) =>
      e.target !== canvas &&
      !e.target.classList.contains('hero') &&
      e.target.id !== 'home';

  const showTag = (text, e) => {
    if (!tagEl) return;

    tagEl.textContent = text;
    tagEl.style.opacity = 1;

    tagEl.style.transform =
        `translate(${e.clientX + 16}px, ${e.clientY + 12}px)`;

    document.body.style.cursor = 'pointer';
  };

  const hideTag = () => {
    if (tagEl) tagEl.style.opacity = 0;

    document.body.style.cursor = '';
  };

  function onMove(e) {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;

    if (scrollY > innerHeight * 0.8) return;

    if (down) {
      if (
          Math.abs(e.clientX - down.x) +
          Math.abs(e.clientY - down.y) > 6
      ) {
        dragging = true;
      }

      if (dragging && state.selected && !state.panel) {
        const p = planets[state.selected];

        p.spin.rotation.y +=
            (e.clientX - down.lx) * 0.006;

        p.spin.rotation.x = THREE.MathUtils.clamp(
            p.spin.rotation.x +
            (e.clientY - down.ly) * 0.004,
            -1.2,
            1.2
        );

        state.focusLock = true;
      }

      down.lx = e.clientX;
      down.ly = e.clientY;

      return;
    }

    if (overUI(e)) {
      hideTag();
      return;
    }

    const h = pick(e);

    if (
        h &&
        h.object.userData.planet &&
        h.object.userData.planet !== state.selected
    ) {
      showTag(
          WORLDS[h.object.userData.planet].tag,
          e
      );

    } else if (h && h.object.userData.loc) {
      showTag(h.object.userData.loc.name, e);

    } else {
      hideTag();
    }
  }

  function onDown(e) {
    if (
        scrollY > innerHeight * 0.8 ||
        overUI(e)
    ) return;

    down = {
      x: e.clientX,
      y: e.clientY,
      lx: e.clientX,
      ly: e.clientY
    };

    dragging = false;
  }

  function onUp(e) {
    if (!down) return;

    const wasDrag = dragging;

    down = null;
    dragging = false;

    if (wasDrag) return;

    const h = pick(e);

    if (!h) return;

    if (h.object.userData.loc) {
      onOpenLocation?.(h.object.userData.idx);
      return;
    }

    const k = h.object.userData.planet;

    if (k && k !== state.selected) {
      onSelectWorld?.(k);
    }
  }

  addEventListener('pointermove', onMove);
  addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);

  // ----------------------------------------------------------
  // RENDER LOOP
  // ----------------------------------------------------------

  const clock = new THREE.Clock();

  const camDir = new THREE.Vector3();
  const wn = new THREE.Vector3();
  const wp = new THREE.Vector3();

  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!running || document.hidden) return;

    Object.values(planets).forEach((p) => {
      if (!(p.key === 'earth' && state.focusLock)) {
        p.spin.rotation.y +=
            dt * BASE_SPIN[p.key] * (reduce ? 0 : 1);
      }
    });

    camera.position.x +=
        (mouse.x * 0.35 - camera.position.x) * 0.04;

    camera.position.y +=
        (-mouse.y * 0.2 - camera.position.y) * 0.04;

    camera.lookAt(0, 0, 0);

    starLayers.forEach((s, i) => {
      s.position.x = -mouse.x * (0.6 + i * 0.7);
      s.position.y = mouse.y * (0.4 + i * 0.5);
    });

    if (markerGroup.visible && earth.loaded) {
      markerGroup.getWorldPosition(wp);

      markers.forEach((m) => {
        wn.copy(m.userData.normal)
            .transformDirection(earth.spin.matrixWorld);

        camDir.copy(camera.position)
            .sub(wp)
            .normalize();

        const f = THREE.MathUtils.smoothstep(
            wn.dot(camDir),
            0.05,
            0.3
        );

        const k =
            1 + 0.8 * ((t * 0.42 + m.userData.phase) % 1);

        m.userData.pulse.scale.setScalar(k);

        m.userData.pulse.material.opacity =
            (1 - (k - 1) / 0.8) * 0.8 * f;

        m.userData.ring.material.opacity = f;
        m.userData.core.material.opacity = f;

        m.userData.hit.visible = f > 0.2;
      });
    }

    renderer.render(scene, camera);
  }

  // ----------------------------------------------------------
  // RESIZE
  // ----------------------------------------------------------

  function resize() {
    const w = innerWidth;
    const h = innerHeight;

    renderer.setSize(w, h, false);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    layout(true);
  }

  addEventListener('resize', resize);

  resize();
  frame();

  // ----------------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------------

  function destroy() {
    if (destroyed) return;

    destroyed = true;

    cancelAnimationFrame(raf);
    clearTimeout(bootTimer);

    removeEventListener('pointermove', onMove);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp);
    removeEventListener('resize', resize);

    gsap.killTweensOf([
      camera.position,
      sun,
      sun.color,
      nebulae[0].material,
      nebulae[1].material,
      ...Object.values(planets).flatMap((p) => [
        p.root.position,
        p.root.scale,
        p.spin.rotation
      ])
    ]);

    scene.traverse((o) => {
      o.geometry?.dispose?.();

      const materials = Array.isArray(o.material)
          ? o.material
          : o.material
              ? [o.material]
              : [];

      materials.forEach((mat) => {
        Object.values(mat).forEach((value) => {
          if (value?.isTexture) value.dispose();
        });

        mat.dispose();
      });
    });

    renderer.dispose();

    document.body.style.cursor = '';
  }

  return {
    setWorld,
    focusLocation,
    setScroll,
    destroy
  };
}
