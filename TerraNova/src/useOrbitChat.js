import { useCallback, useEffect, useRef, useState } from 'react';
import { askOrbit, OrbitError } from './orbitApi.js';

const KEY = 'orbit-chat-v1';
const MAX_KEPT = 60;      // messages kept in the session
const MAX_SENT = 8;       // most recent turns sent to the API as history

const load = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    // never restore half-finished state: only settled user/assistant/error messages
    return Array.isArray(raw) ? raw.filter((m) => m && typeof m.content === 'string' && ['user', 'assistant', 'error'].includes(m.role)) : [];
  } catch { return []; }
};
const save = (messages) => { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_KEPT))); } catch { /* storage unavailable */ } };

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq += 1)}`;

/**
 * Conversation state for ORBIT. Lives in App so the thread survives closing the chat,
 * switching locations and re-opening the panel. Persists in sessionStorage (current tab session only).
 * messages: { id, role: 'user'|'assistant'|'error', content, mode?, ids?, kind?, retry? }
 */
export function useOrbitChat() {
  const [messages, setMessages] = useState(load);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading'
  const ctrl = useRef(null);
  const live = useRef(messages);
  live.current = messages;

  useEffect(() => { save(messages); }, [messages]);
  useEffect(() => () => ctrl.current?.abort(), []);

  const send = useCallback(async (text, discoveryIds = []) => {
    const content = text.trim();
    if (!content || ctrl.current) return false; // one request at a time
    const history = live.current
      .filter((m) => m.role !== 'error')
      .slice(-MAX_SENT)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { id: uid(), role: 'user', content, ids: discoveryIds }]);
    setStatus('loading');
    const mine = new AbortController();
    ctrl.current = mine;
    try {
      const res = await askOrbit(content, { discoveryIds, history, signal: mine.signal });
      if (mine.signal.aborted) return false;
      setMessages((m) => [...m, { id: uid(), role: 'assistant', content: String(res.answer ?? ''), mode: res.mode, ids: res.discovery_ids ?? [] }]);
      return true;
    } catch (err) {
      if (mine.signal.aborted) return false;
      const kind = err instanceof OrbitError ? err.kind : 'network';
      const detail = err instanceof OrbitError ? err.message : 'Something went wrong.';
      setMessages((m) => [...m, { id: uid(), role: 'error', content: detail, kind, retry: { text: content, ids: discoveryIds } }]);
      return false;
    } finally {
      if (ctrl.current === mine) { ctrl.current = null; setStatus('idle'); }
    }
  }, []);

  /** Remove a failed attempt (error + the question it belongs to) and ask again. */
  const retry = useCallback((errorId) => {
    const err = live.current.find((m) => m.id === errorId);
    if (!err?.retry || ctrl.current) return;
    const { text, ids } = err.retry;
    const at = live.current.findIndex((m) => m.id === errorId);
    const dropFrom = at > 0 && live.current[at - 1].role === 'user' ? at - 1 : at;
    live.current = live.current.filter((_, i) => i < dropFrom || i > at);
    setMessages(live.current);
    send(text, ids);
  }, [send]);

  const clear = useCallback(() => {
    ctrl.current?.abort(); ctrl.current = null;
    setStatus('idle'); setMessages([]);
  }, []);

  return { messages, status, loading: status === 'loading', send, retry, clear };
}
