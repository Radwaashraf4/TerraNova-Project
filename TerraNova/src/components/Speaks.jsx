import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LINE_1 = "Well, obviously you can't just leave me and run off to another planet before learning everything about me!";
const LINE_2 = "And guess what? There are things about me that you haven't even noticed yet!";
const Words = ({ text }) => text.split(' ').map((w, i) => <span className="w" key={i}>{w} </span>);

export default function Speaks() {
  const root = useRef(null);
  const video = useRef(null);
  const ready = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captions, setCaptions] = useState(true);

  const play = () => video.current?.play().then(() => setPlaying(true)).catch(() => {});
  const pause = () => { video.current?.pause(); setPlaying(false); };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.speaks__stage', {
        clipPath: 'circle(78% at 50% 50%)', ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 15%', scrub: 0.6 }
      });
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 10%', end: 'bottom 85%', scrub: 0.5 } })
        .to('#sub1 .w', { opacity: 1, stagger: 0.06, ease: 'none' })
        .to('#sub2 .w', { opacity: 1, stagger: 0.06, ease: 'none' }, '+=0.2');
      ScrollTrigger.create({
        trigger: '.speaks__stage', start: 'top 60%', end: 'bottom 20%',
        onEnter: () => ready.current && play(), onEnterBack: () => ready.current && play(),
        onLeave: pause, onLeaveBack: pause
      });
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => (video.current?.paused ? play() : pause());

  return (
    <section className="speaks" id="speaks" ref={root}>
      <div className="speaks__stage">
        <div className="speaks__earth" aria-hidden="true" />
        <video
          ref={video} className={isReady ? 'is-ready' : ''} playsInline muted={muted} loop preload="metadata"
          poster={`${import.meta.env.BASE_URL}assets/earth-speaks.jpg`}
          onLoadedData={() => { ready.current = true; setIsReady(true); }}
          onClick={toggle}
        >
          <source src={`${import.meta.env.BASE_URL}assets/earth-speaks.mp4`} type="video/mp4" />
        </video>
        {!isReady && <div className="speaks__slot">AI VIDEO SLOT · public/assets/earth-speaks.mp4</div>}
        <div className="speaks__vig" aria-hidden="true" />
        <button className={'playring' + (playing ? ' is-hidden' : '')} aria-label="Play video" onClick={play}><i /></button>
        <div className="speaks__ctrl">
          <button className="link" onClick={() => setMuted((m) => !m)}>{muted ? 'Sound off' : 'Sound on'}</button>
          <button className="link" aria-pressed={captions} onClick={() => setCaptions((c) => !c)}>{captions ? 'Captions on' : 'Captions off'}</button>
        </div>
      </div>
      <div className={'speaks__copy' + (captions ? '' : ' no-cap')}>
        <p className="eyebrow">A word from Earth</p>
        <p className="sub" id="sub1"><Words text={LINE_1} /></p>
        <p className="sub sub--2" id="sub2"><Words text={LINE_2} /></p>
      </div>
    </section>
  );
}
