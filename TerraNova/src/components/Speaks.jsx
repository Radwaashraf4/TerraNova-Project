import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LINE_1 =
  "Well, obviously you can't just leave me and run off to another planet before learning everything about me!";

const LINE_2 =
  "And guess what? There are things about me that you haven't even noticed yet!";

const Words = ({ text }) =>
  text.split(' ').map((w, i) => (
    <span className="w" key={i}>
      {w}{' '}
    </span>
  ));

export default function Speaks() {
  const root = useRef(null);
  const video = useRef(null);
  const ready = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captions, setCaptions] = useState(true);

  const play = () => {
    const currentVideo = video.current;

    if (!currentVideo) return;

    currentVideo.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const pause = () => {
    if (video.current) {
      video.current.pause();
    }

    setPlaying(false);
  };

  useEffect(() => {
    const section = root.current;

    if (!section) return undefined;

    const ctx = gsap.context(() => {
      const stage = section.querySelector('.speaks__stage');

      const sub1 = section.querySelectorAll('#sub1 .w');
      const sub2 = section.querySelectorAll('#sub2 .w');

      if (stage) {
        gsap.to(stage, {
          clipPath: 'circle(78% at 50% 50%)',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 15%',
            scrub: 0.6
          }
        });

        ScrollTrigger.create({
          trigger: stage,
          start: 'top 60%',
          end: 'bottom 20%',
          onEnter: () => {
            if (ready.current) play();
          },
          onEnterBack: () => {
            if (ready.current) play();
          },
          onLeave: pause,
          onLeaveBack: pause
        });
      }

      if (sub1.length || sub2.length) {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 10%',
            end: 'bottom 85%',
            scrub: 0.5
          }
        });

        if (sub1.length) {
          timeline.to(sub1, {
            opacity: 1,
            stagger: 0.06,
            ease: 'none'
          });
        }

        if (sub2.length) {
          timeline.to(
            sub2,
            {
              opacity: 1,
              stagger: 0.06,
              ease: 'none'
            },
            '+=0.2'
          );
        }
      }
    }, section);

    return () => {
      pause();
      ctx.revert();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (video.current?.paused) {
      play();
    } else {
      pause();
    }
  };

  return (
    <section
      className="speaks"
      id="speaks"
      ref={root}
    >
      <div className="speaks__stage">
        <div
          className="speaks__earth"
          aria-hidden="true"
        />

        <video
          ref={video}
          className={isReady ? 'is-ready' : ''}
          playsInline
          muted={muted}
          loop
          preload="metadata"
          onLoadedData={() => {
            ready.current = true;
            setIsReady(true);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={toggle}
        >
          <source
            src={`${import.meta.env.BASE_URL}assets/earth-speaks.mp4`}
            type="video/mp4"
          />
        </video>

        {!isReady && (
          <div className="speaks__slot">
            AI VIDEO SLOT · public/assets/earth-speaks.mp4
          </div>
        )}

        <div
          className="speaks__vig"
          aria-hidden="true"
        />

        <button
          className={'playring' + (playing ? ' is-hidden' : '')}
          aria-label="Play video"
          onClick={play}
        >
          <i />
        </button>

        <div className="speaks__ctrl">
          <button
            className="link"
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>

          <button
            className="link"
            aria-pressed={captions}
            onClick={() => setCaptions((c) => !c)}
          >
            {captions ? 'Captions on' : 'Captions off'}
          </button>
        </div>
      </div>

      <div
        className={
          'speaks__copy' + (captions ? '' : ' no-cap')
        }
      >
        <p className="eyebrow">
          A word from Earth
        </p>

        <p className="sub" id="sub1">
          <Words text={LINE_1} />
        </p>

        <p className="sub sub--2" id="sub2">
          <Words text={LINE_2} />
        </p>
      </div>
    </section>
  );
}
