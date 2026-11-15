import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ApiError, apiRequest } from '../../services/apiClient';

interface ChatMessage { id: string; text: string; role: 'user' | 'assistant'; }
interface ChatSession { sessionId: string; sessionToken: string; }
interface StoredChatSession extends ChatSession { title: string; updatedAt?: string; }
interface BackendChatMessage { sender?: string; role?: string; text?: string; suggestions?: string[]; }
const HISTORY_STORAGE_KEY = 'tfarhida-chat-sessions';
const ACTIVE_SESSION_STORAGE_KEY = 'tfarhida-chat-session';
const MAX_STORED_SESSIONS = 20;

function readStoredSessions(): StoredChatSession[] {
  try {
    const records = JSON.parse(sessionStorage.getItem(HISTORY_STORAGE_KEY) || '[]') as StoredChatSession[];
    return Array.isArray(records) ? records.filter((record) => record?.sessionId && record?.sessionToken).slice(0, MAX_STORED_SESSIONS) : [];
  } catch { return []; }
}

function readActiveSession(): ChatSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || 'null') as ChatSession | null;
    return value?.sessionId && value?.sessionToken ? value : null;
  } catch { return null; }
}

function mapMessages(items: BackendChatMessage[] = []): ChatMessage[] {
  return items.map((item, index) => ({
    id: `${index}-${item.sender || item.role || 'bot'}`,
    text: item.text || '',
    role: (item.sender === 'user' || item.role === 'user' ? 'user' : 'assistant') as ChatMessage['role'],
  })).filter((item) => item.text);
}

export function ChatConversation({ inputId, autoFocus = false }: { inputId: string; autoFocus?: boolean }) {
  const { t, language } = useLanguage();
  const [session, setSession] = useState<ChatSession | null>(() => {
    return readActiveSession();
  });
  const [storedSessions, setStoredSessions] = useState<StoredChatSession[]>(readStoredSessions);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saveSessionToHistory = (nextSession: ChatSession, title?: string) => {
    setStoredSessions((current) => {
      const previous = current.find((item) => item.sessionId === nextSession.sessionId);
      const entry: StoredChatSession = {
        ...nextSession,
        title: previous?.title || title || '',
        updatedAt: new Date().toISOString(),
      };
      const next = [entry, ...current.filter((item) => item.sessionId !== nextSession.sessionId)].slice(0, MAX_STORED_SESSIONS);
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const historyItems = useMemo(() => session && !storedSessions.some((item) => item.sessionId === session.sessionId)
    ? [{ ...session, title: '' }, ...storedSessions]
    : storedSessions, [session, storedSessions]);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    apiRequest<{ messages?: BackendChatMessage[] }>(`/chat/history/${encodeURIComponent(session.sessionId)}`, {
      headers: { 'X-Chat-Session-Token': session.sessionToken },
    }).then((result) => { if (alive) setMessages(mapMessages(result.messages)); }).catch(() => {
      if (alive) { sessionStorage.removeItem('tfarhida-chat-session'); setSession(null); }
    });
    return () => { alive = false; };
  }, [session]);

  const ensureSession = async () => {
    if (session) return session;
    const result = await apiRequest<{ session?: { sessionId?: string; messages?: BackendChatMessage[] }; sessionToken?: string }>('/chat/session', {
      method: 'POST', body: JSON.stringify({ roleContext: 'anonyme', language }),
    });
    if (!result.session?.sessionId || !result.sessionToken) throw new Error(t('assistant.error'));
    const created: ChatSession = { sessionId: result.session.sessionId, sessionToken: result.sessionToken };
    sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(created));
    saveSessionToHistory(created);
    setSession(created);
    setMessages(mapMessages(result.session.messages));
    return created;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    const text = draft.trim(); setDraft(''); setError(''); setBusy(true);
    try {
      const current = await ensureSession();
      const response = await apiRequest<{ reply?: BackendChatMessage }>('/chat/send', {
        method: 'POST', headers: { 'X-Chat-Session-Token': current.sessionToken },
        body: JSON.stringify({ sessionId: current.sessionId, text, language }),
      });
      if (!response.reply?.text) throw new Error(t('assistant.error'));
      saveSessionToHistory(current, text.slice(0, 64));
      setMessages((items) => [...items, { id: `${Date.now()}-u`, text, role: 'user' }, ...mapMessages([response.reply as BackendChatMessage]).map((message) => ({ ...message, id: `${Date.now()}-a` }))]);
    } catch (cause) {
      setDraft(text);
      if (cause instanceof ApiError && cause.status === 404) {
        sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        setSession(null); setMessages([]); setError(t('assistant.sessionExpired'));
        return;
      }
      setError(cause instanceof Error ? cause.message : t('assistant.error'));
    } finally { setBusy(false); }
  };

  const reset = () => {
    if (session) saveSessionToHistory(session, messages.find((message) => message.role === 'user')?.text.slice(0, 64));
    sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setSession(null); setMessages([]); setDraft(''); setError(''); setShowHistory(false);
  };

  const resumeSession = (record: StoredChatSession) => {
    sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify({ sessionId: record.sessionId, sessionToken: record.sessionToken }));
    setSession({ sessionId: record.sessionId, sessionToken: record.sessionToken });
    setMessages([]); setError(''); setShowHistory(false);
  };

  const formattedDate = (date?: string) => date
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
    : '';

  return <>
    <div className="chat-toolbar">
      <button type="button" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}>{showHistory ? t('assistant.backToChat') : `${t('assistant.history')} (${historyItems.length})`}</button>
      <button type="button" onClick={reset}>{t('assistant.newChat')}</button>
    </div>
    {showHistory ? <div className="chat-history" aria-label={t('assistant.history')}>
      {!historyItems.length && <p className="chat-empty-hint">{t('assistant.emptyHistory')}</p>}
      {historyItems.map((record) => <button type="button" className="chat-history-item" key={record.sessionId} onClick={() => resumeSession(record)}>
        <strong>{record.title || t('assistant.untitledConversation')}</strong>{record.updatedAt && <time dateTime={record.updatedAt}>{formattedDate(record.updatedAt)}</time>}
      </button>)}
    </div> : <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
      {messages.map((message) => <p key={message.id} className={`chat-message chat-message-${message.role}`}>{message.text}</p>)}
      {busy && <p role="status">{t('assistant.thinking')}</p>}
      {!messages.length && !busy && <p className="chat-empty-hint">{t('assistant.placeholder')}</p>}
    </div>}
    {error && <p role="alert" className="chat-error">{error}</p>}
    <form className="chat-composer" onSubmit={submit}>
      <label className="sr-only" htmlFor={inputId}>{t('assistant.placeholder')}</label>
      <input id={inputId} autoFocus={autoFocus} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('assistant.placeholder')} />
      <button type="submit" disabled={busy || !draft.trim()}>{t('assistant.send')}</button>
    </form>
  </>;
}
