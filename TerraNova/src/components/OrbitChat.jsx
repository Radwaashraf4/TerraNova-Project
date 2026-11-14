import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../orbitApi.js';
import './orbitChat.css';

const MAX_LEN = 500;

const ERRORS = {
  network: "I couldn't reach ORBIT's server. Check your connection, or that the API is running, then try again.",
  timeout: 'ORBIT took too long to answer. Please try again.',
  server: "ORBIT's server had a problem answering that.",
  client: "ORBIT couldn't use that question."
};

/** Tiny ORBIT face (flat colours so it never clashes with the gradient ids in Robot.jsx). */
const Mark = () => (
  <svg className="orbit__mark" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="3" y="6" width="34" height="26" rx="11" fill="#E4E9F6" />
    <rect x="7" y="10" width="26" height="18" rx="8" fill="#070B1A" />
    <rect x="13" y="15" width="5" height="8" rx="2.5" fill="#4FD8FF" />
    <rect x="22" y="15" width="5" height="8" rx="2.5" fill="#4FD8FF" />
    <circle cx="20" cy="3.5" r="2.5" fill="#FF7A3D" />
  </svg>
);

/** Plain-text renderer: paragraphs and "- " bullets only. Never injects HTML. */
function Text({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line, i) => {
    const bullet = /^\s*[-•]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!list) { list = []; blocks.push({ list, key: i }); }
      list.push(bullet[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ p: line, key: i });
    }
  });
  return blocks.map((b) => (b.list
    ? <ul key={b.key}>{b.list.map((li, j) => <li key={j}>{li}</li>)}</ul>
    : <p key={b.key}>{b.p}</p>));
}

export default function OrbitChat({ open, onOpen, onClose, chat, context }) {
  // context: { id: 'MARS-EARTH-03' | null, name: string | null } for the location open on the site
  const { messages, loading, send, retry, clear } = chat;
  const [draft, setDraft] = useState('');
  const [ctxOff, setCtxOff] = useState(false);
  const [slow, setSlow] = useState(false);
  const root = useRef(null);
  const log = useRef(null);
  const input = useRef(null);
  const opener = useRef(null);
  const ctxKey = context?.name ?? '';

  useEffect(() => { setCtxOff(false); }, [ctxKey]);

  /* keep the closed sheet out of the tab order / accessibility tree */
  useEffect(() => { if (root.current) root.current.inert = !open; }, [open]);

  /* Escape closes the chat first (the topmost layer), wherever focus is, without also closing the discovery panel */
  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); } };
    window.addEventListener('keydown', onEsc, true);
    return () => window.removeEventListener('keydown', onEsc, true);
  }, [open, onClose]);

  /* focus handling */
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 80);
      return () => clearTimeout(t);
    }
    const el = opener.current;
    if (el && document.contains(el) && typeof el.focus === 'function') el.focus({ preventScroll: true });
    return undefined;
  }, [open]);

  /* follow the visual viewport so the on-screen keyboard never hides the input (mobile) */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return undefined;
    const fit = () => root.current?.style.setProperty('--orbit-vh', `${vv.height}px`);
    fit(); vv.addEventListener('resize', fit);
    return () => { vv.removeEventListener('resize', fit); root.current?.style.removeProperty('--orbit-vh'); };
  }, [open]);

  /* scroll to the newest message */
  useEffect(() => {
    const el = log.current;
    if (!el) return;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // a new answer is read from its first line; everything else (your question, the typing dots) follows the bottom
    const last = el.lastElementChild;
    const top = !loading && last?.classList.contains('orbit__msg--bot') && messages.length ? Math.max(0, last.offsetTop - 10) : el.scrollHeight;
    el.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' });
  }, [messages.length, loading, open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* reassure the user if an answer is slow (AI mode can take a while) */
  useEffect(() => {
    setSlow(false);
    if (!loading) return undefined;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  const ctxId = context?.id && !ctxOff ? context.id : null;
  const ids = ctxId ? [ctxId] : [];

  const ask = async (text) => {
    if (!text.trim() || loading) return;
    setDraft('');
    await send(text, ids);
    input.current?.focus({ preventScroll: true });
  };

  const moonContext = context?.type === 'moon' || String(ctxId || '').startsWith('MOON-EARTH-');
  const other = moonContext
    ? (ctxId === 'MOON-EARTH-01' ? 'MOON-EARTH-02' : 'MOON-EARTH-01')
    : (ctxId === 'MARS-EARTH-01' ? 'MARS-EARTH-02' : 'MARS-EARTH-01');
  const suggestions = ctxId
    ? ['Why is this ranked high?', 'What are the limitations?', 'What does the similarity score mean?', `Compare this with ${other}`]
    : ['Show the top Mars candidates', 'Show the top Moon candidates', 'What are the limitations?', 'Is this a confirmed discovery?'];

  /* Enter sends, Shift+Enter adds a line (textarea only, so Enter on buttons keeps its normal meaning) */
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(draft); }
  };

  return (
    <>
      {!open && (
        <button type="button" className="orbit-fab" onClick={onOpen} aria-label="Ask ORBIT a question">
          <Mark /><span>Ask ORBIT</span>
        </button>
      )}
      <section ref={root} className={'orbit' + (open ? ' is-open' : '')} role="dialog" aria-label="Chat with ORBIT, science guide"
        aria-hidden={!open}>
        <div className="orbit__grip" aria-hidden="true" />
        <header className="orbit__head">
          <Mark />
          <div className="orbit__title">
            <b>ORBIT</b>
            <span>Science guide</span>
          </div>
          {messages.length > 0 && (
            <button type="button" className="orbit__btn" onClick={clear} title="Clear this conversation">New chat</button>
          )}
          <button type="button" className="orbit__x" onClick={onClose} aria-label="Close chat">✕</button>
        </header>
        <p className="orbit__note">
          Ranked computational terrain-similarity candidates, not confirmed discoveries. Similarity is not proof of geological equivalence.
        </p>

        <div className="orbit__log" ref={log} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with ORBIT">
          {messages.length === 0 && (
            <div className="orbit__msg orbit__msg--bot">
              <p>Hi, I'm ORBIT. I can explain how the ranked terrain candidates were scored, what the numbers mean, and what this data cannot tell us.</p>
              <p>I only use the project's real numbers. Locations have coordinates only, with no place names.</p>
            </div>
          )}
          {messages.map((m) => {
            if (m.role === 'user') return <div key={m.id} className="orbit__msg orbit__msg--me"><p>{m.content}</p></div>;
            if (m.role === 'error') {
              return (
                <div key={m.id} className="orbit__msg orbit__msg--err" role="alert">
                  <p>{ERRORS[m.kind] || ERRORS.server}</p>
                  {m.kind !== 'network' && m.content && <small>{m.content}</small>}
                  {m.kind === 'network' && <small>API: {API_URL}</small>}
                  {m.retry && <button type="button" className="orbit__btn orbit__btn--go" onClick={() => retry(m.id)} disabled={loading}>Try again</button>}
                </div>
              );
            }
            return (
              <div key={m.id} className="orbit__msg orbit__msg--bot">
                <Text text={m.content} />
                <small className="orbit__src">{m.mode === 'ai' ? 'AI-written, numbers checked against the project data' : 'Answered directly from the project data'}</small>
              </div>
            );
          })}
          {loading && (
            <div className="orbit__msg orbit__msg--bot orbit__msg--wait" role="status">
              <span className="orbit__dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="sr-only">ORBIT is thinking</span>
              {slow && <small>Still working on it…</small>}
            </div>
          )}
        </div>

        <div className="orbit__foot">
          {context && (
            <p className={'orbit__ctx' + (ctxId ? ' is-on' : '')}>
              {ctxId
                ? <><span>Asking about <b className="mono">{ctxId}</b></span><button type="button" onClick={() => setCtxOff(true)} aria-label="Stop using this location as context">✕</button></>
                : context.id
                  ? <span>General questions (no location selected)</span>
                  : <span>“{context.name}” is a sample location and is not scored by the model. I can still answer about the ranked candidates.</span>}
            </p>
          )}
          <div className="orbit__chips" role="group" aria-label="Suggested questions">
            {suggestions.map((s) => (
              <button key={s} type="button" disabled={loading} onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
          <form className="orbit__form" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
            <label className="sr-only" htmlFor="orbit-input">Your question for ORBIT</label>
            <textarea id="orbit-input" ref={input} rows={1} value={draft} maxLength={MAX_LEN} enterKeyHint="send"
              placeholder="Ask about the candidates…" onKeyDown={onKey} onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" className="orbit__send" disabled={loading || !draft.trim()} aria-label="Send question">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" /></svg>
            </button>
          </form>
          {draft.length > MAX_LEN - 80 && <small className="orbit__count">{draft.length}/{MAX_LEN}</small>}
        </div>
      </section>
    </>
  );
}
