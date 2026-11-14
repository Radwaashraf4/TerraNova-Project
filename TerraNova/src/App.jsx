import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createEngine } from './engine.js';
import { WORLDS } from './data.js';
import { getDiscoveries, getModelInfo, getMoonDiscoveries, getMoonModelInfo } from './orbitApi.js';
import { mapDiscoveries, mapMoonDiscoveries } from './apiData.js';
import { useOrbitChat } from './useOrbitChat.js';
import { reduce, D } from './motion.js';
import { Nav, Rail } from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Robot from './components/Robot.jsx';
import Panel from './components/Panel.jsx';
import Speaks from './components/Speaks.jsx';
import Discoveries from './components/Discoveries.jsx';
import MoonDiscoveries from './components/MoonDiscoveries.jsx';
import OrbitChat from './components/OrbitChat.jsx';
import { Resources, Footer } from './components/Resources.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const canvasRef = useRef(null);
  const tagRef = useRef(null);
  const engine = useRef(null);
  const timers = useRef([]);
  const [ready, setReady] = useState(false);
  const [world, setWorld] = useState(null);
  const [locIdx, setLocIdx] = useState(null);
  const [locations, setLocations] = useState([]);
  const [moonLocations, setMoonLocations] = useState([]);
  const [moonInfo, setMoonInfo] = useState(null);
  const [moonError, setMoonError] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const chat = useOrbitChat();

  const allLocations = useMemo(() => [...locations, ...moonLocations], [locations, moonLocations]);
  const selectedLocation = locIdx == null ? null : (allLocations[locIdx] || null);

  // The ranked candidates displayed in the app always come from the live API.
  useEffect(() => {
    const controller = new AbortController();
    getModelInfo({ signal: controller.signal })
      .then(setModelInfo)
      .catch(() => {
        if (!controller.signal.aborted) setModelInfo(null);
      });

    const marsRequest = getDiscoveries(undefined, { signal: controller.signal })
      .then((payload) => {
        const rows = mapDiscoveries(payload);
        setLocations(rows);
        setDataError(rows.length ? null : 'No valid Mars candidate records were returned.');
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setDataError(error?.message || 'Unable to load Mars candidates.');
        setLocations([]);
      });
    const moonRequest = Promise.all([
      getMoonDiscoveries(20, { signal: controller.signal }),
      getMoonModelInfo({ signal: controller.signal })
    ]).then(([payload, info]) => {
      setMoonLocations(mapMoonDiscoveries(payload));
      setMoonInfo(info);
      setMoonError(null);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setMoonLocations([]);
      setMoonError(error?.message || 'Unable to load Moon candidates.');
    });
    Promise.all([marsRequest, moonRequest]).finally(() => {
      if (!controller.signal.aborted) setDataReady(true);
    });
    return () => controller.abort();
  }, []);

  // Create the 3D engine once the API has either returned data or failed.
  useEffect(() => {
    if (!dataReady) return undefined;
    engine.current = createEngine(canvasRef.current, {
      tagEl: tagRef.current,
      locations: allLocations,
      onReady: () => setReady(true),
      onSelectWorld: (key) => { setWorld(key); setLocIdx(null); },
      onOpenLocation: (idx) => setLocIdx(idx)
    });
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, [dataReady, allLocations]);

  useEffect(() => { engine.current?.setWorld(world); }, [world]);
  useEffect(() => { engine.current?.focusLocation(locIdx); }, [locIdx]);
  useEffect(() => { document.body.dataset.world = world ?? 'none'; }, [world]);
  useEffect(() => {
    document.body.classList.toggle('panel-open', locIdx != null);
    return () => document.body.classList.remove('panel-open');
  }, [locIdx]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !chatOpen) setLocIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '#home',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => engine.current?.setScroll(self.progress)
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.hero__copy > *', {
        y: 26, autoAlpha: 0, duration: D(1), stagger: 0.12,
        delay: 0.7, ease: 'power3.out'
      });
    });
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [ready]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const selectWorld = useCallback((key) => {
    setWorld(key);
    setLocIdx(null);
  }, []);

  const reset = useCallback(() => {
    setWorld(null);
    setLocIdx(null);
  }, []);

  const explore = useCallback((idx) => {
    if (!allLocations[idx]) return;
    timers.current.forEach(clearTimeout);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    engine.current?.setScroll(0);
    timers.current = [
      setTimeout(() => setWorld('earth'), reduce ? 0 : 700),
      setTimeout(() => setLocIdx(idx), reduce ? 50 : 1900)
    ];
  }, [allLocations]);

  const script = useMemo(() => {
    if (selectedLocation) {
      return {
        lines: [
          selectedLocation.line,
          selectedLocation.type === 'moon'
            ? 'This is an exploratory Moon-terrain screening candidate, not a confirmed lunar analog.'
            : 'This is a computational Mars-terrain similarity candidate. Independent geological review is still required.'
        ],
        during: 'discovery',
        after: 'explaining'
      };
    }
    if (world) {
      const selectedWorld = WORLDS[world];
      return {
        lines: selectedWorld.intro,
        during: selectedWorld.mood,
        after: world === 'earth' ? 'explaining' : 'speaking'
      };
    }
    return null;
  }, [world, selectedLocation]);

  const chatContext = selectedLocation
    ? { id: selectedLocation.discoveryId, name: selectedLocation.name, type: selectedLocation.type }
    : null;

  return (
    <>
      <canvas id="scene" ref={canvasRef} aria-hidden="true" />
      <div className={'boot' + (ready ? ' is-off' : '')}>
        <span>PLANETARY EXPLORERS</span>
      </div>
      <Nav />
      <Rail />
      <main>
        <Hero world={world} onSelect={selectWorld} onBack={reset} tagRef={tagRef}>
          <Robot script={script} scriptKey={`${world}:${locIdx}`} />
        </Hero>
        <Speaks />
        <Discoveries locations={locations} loading={!dataReady} error={dataError} modelInfo={modelInfo} onExplore={explore} />
        <MoonDiscoveries locations={moonLocations} loading={!dataReady} error={moonError} modelInfo={moonInfo} onExplore={(idx) => explore(locations.length + idx)} />
        <Resources />
      </main>
      <Footer />
      <Panel loc={selectedLocation} idx={locIdx} total={selectedLocation?.type === 'moon' ? (selectedLocation.totalEvaluated || 6000) : locations.length} onClose={() => setLocIdx(null)} />
      <OrbitChat
        open={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        chat={chat}
        context={chatContext}
      />
    </>
  );
}
