import { useEffect, useRef, useState } from 'react';
import { reduce } from '../motion.js';

/**
 * script: { lines: string[], during: mood, after: mood } | null
 * scriptKey changes whenever a new script starts, which restarts the dialogue.
 */
export default function Robot({ script, scriptKey }) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [typing, setTyping] = useState(false);
  const [closed, setClosed] = useState(false);
  const [prevKey, setPrevKey] = useState(scriptKey);
  const timer = useRef(null);
  const lines = script?.lines ?? [];

  if (prevKey !== scriptKey) { setPrevKey(scriptKey); setI(0); setClosed(false); }

  useEffect(() => {
    if (!lines.length) return undefined;
    const line = lines[i] ?? '';
    clearInterval(timer.current);
    if (reduce) { setTyped(line); setTyping(false); return undefined; }
    setTyping(true); setTyped('');
    let k = 0;
    timer.current = setInterval(() => {
      k += 1; setTyped(line.slice(0, k));
      if (k >= line.length) { clearInterval(timer.current); setTyping(false); }
    }, 22);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptKey, i]);

  const last = i >= lines.length - 1;
  const mood = !script || closed ? 'idle' : typing ? script.during : script.after;

  const next = () => {
    if (typing) { clearInterval(timer.current); setTyped(lines[i]); setTyping(false); return; }
    if (!last) setI(i + 1); else setClosed(true);
  };
  const skip = () => { clearInterval(timer.current); setTyping(false); setClosed(true); };

  return (
    <aside className={'robot' + (script ? ' is-on' : '')} data-mood={mood} aria-label="ORBIT, science guide">
      <div className={'speech' + (closed ? ' is-closed' : '')}>
        <div className="speech__tag">ORBIT · SCIENCE GUIDE</div>
        <p className="speech__text" aria-hidden="true">{typed}</p>
        <span className="sr-only" aria-live="polite">{lines[i]}</span>
        <div className="speech__actions">
          <button className="link" onClick={skip}>Skip</button>
          <button className="link link--cy" onClick={next}>{last && !typing ? 'Done' : 'Next ›'}</button>
        </div>
      </div>
      <svg className="bot" viewBox="0 0 160 200" aria-hidden="true">
        <defs>
          <linearGradient id="shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F7FF" /><stop offset="1" stopColor="#C5CCDD" /></linearGradient>
          <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0B1226" /><stop offset="1" stopColor="#050813" /></linearGradient>
          <radialGradient id="flame" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#9BE8FF" /><stop offset="1" stopColor="#2F6BFF" stopOpacity="0" /></radialGradient>
        </defs>
        <g className="bot__float">
          <ellipse className="bot__flame" cx="80" cy="186" rx="16" ry="14" fill="url(#flame)" />
          <line x1="80" y1="22" x2="80" y2="8" stroke="#8EA0C4" strokeWidth="2.5" strokeLinecap="round" />
          <circle className="bot__ant" cx="80" cy="6" r="4.5" fill="#4FD8FF" />
          <g className="bot__arm bot__arm--l"><rect x="22" y="104" width="14" height="40" rx="7" fill="url(#shell)" /><circle cx="29" cy="104" r="8" fill="#6C7690" /></g>
          <g className="bot__arm bot__arm--r"><rect x="124" y="104" width="14" height="40" rx="7" fill="url(#shell)" /><circle cx="131" cy="104" r="8" fill="#6C7690" /><circle className="bot__holo" cx="150" cy="132" r="9" fill="none" stroke="#4FD8FF" strokeWidth="1.5" strokeDasharray="3 3" /></g>
          <rect x="42" y="96" width="76" height="76" rx="34" fill="url(#shell)" />
          <rect x="58" y="116" width="44" height="26" rx="8" fill="#2A3350" />
          <circle className="bot__chest" cx="80" cy="129" r="5.5" fill="#FF7A3D" />
          <path d="M46 150 l10 4" stroke="#99A3BC" strokeWidth="2" strokeLinecap="round" />
          <rect x="68" y="88" width="24" height="12" rx="4" fill="#8E97AE" />
          <rect x="26" y="24" width="108" height="70" rx="32" fill="url(#shell)" />
          <rect x="36" y="34" width="88" height="50" rx="24" fill="url(#visor)" />
          <rect className="eye eye--l" x="52" y="48" width="16" height="22" rx="8" fill="#4FD8FF" />
          <rect className="eye eye--r" x="92" y="48" width="16" height="22" rx="8" fill="#4FD8FF" />
        </g>
      </svg>
    </aside>
  );
}
