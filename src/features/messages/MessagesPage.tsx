import { useState, type FC, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INITIAL_SEED_LOTS } from '../listings/seedData';
import { Send, User, Sprout } from 'lucide-react';

interface LocalMessage {
  id: string;
  sender: 'me' | 'keeper';
  text: string;
  time: string;
}

export const MessagesPage: FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');

  const selectedSeed = listingId
    ? INITIAL_SEED_LOTS.find((s) => s.id === listingId)
    : INITIAL_SEED_LOTS[0];

  const [activeThreadId, setActiveThreadId] = useState<string>(selectedSeed?.id || 'seed-001');
  const [inputText, setInputText] = useState('');

  const [threads, setThreads] = useState<Record<string, LocalMessage[]>>({
    'seed-001': [
      {
        id: 'm1',
        sender: 'keeper',
        text: 'Assalam-o-Alaikum! Basmati 370 seed lot is cleaned and stored in dry jute bags.',
        time: '10:15 AM',
      },
    ],
    'seed-002': [
      {
        id: 'm2',
        sender: 'keeper',
        text: 'Desi cotton seeds are available for barter swap with pulses.',
        time: 'Yesterday',
      },
    ],
  });

  const activeMessages = threads[activeThreadId] || [];

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: LocalMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
    }));

    setInputText('');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: '0.4rem' }}>
          {t('messages.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {t('messages.subtitle')}
        </p>
      </div>

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          padding: 0,
          overflow: 'hidden',
          minHeight: '520px',
        }}
      >
        {/* Left Sidebar: Threads List */}
        <div
          style={{
            borderRight: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-main)',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
            Active Conversations
          </div>

          <div>
            {INITIAL_SEED_LOTS.slice(0, 3).map((seed) => (
              <button
                key={seed.id}
                type="button"
                onClick={() => setActiveThreadId(seed.id)}
                style={{
                  width: '100%',
                  textAlign: 'inherit',
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: activeThreadId === seed.id ? '#ffffff' : 'transparent',
                  borderLeft: activeThreadId === seed.id ? '4px solid var(--primary-700)' : '4px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  <User size={20} aria-hidden="true" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                    {seed.sellerName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {seed.varietyName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Sprout size={20} style={{ color: 'var(--primary-700)' }} aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                {INITIAL_SEED_LOTS.find((s) => s.id === activeThreadId)?.varietyName || 'Seed Inquiry'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Direct Keeper Verification Channel
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {activeMessages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Start a conversation regarding this seed lot.
              </div>
            ) : (
              activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    backgroundColor: msg.sender === 'me' ? 'var(--primary-800)' : 'var(--bg-subtle)',
                    color: msg.sender === 'me' ? '#ffffff' : 'var(--text-main)',
                    padding: '0.65rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.925rem',
                  }}
                >
                  <p>{msg.text}</p>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      opacity: 0.75,
                      display: 'block',
                      textAlign: 'right',
                      marginTop: '0.2rem',
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('messages.typeMessage')}
              aria-label={t('messages.typeMessage')}
              className="form-input"
              style={{ flex: 1, minHeight: '44px' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              aria-label={t('messages.send')}
              id="message-send-btn"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
