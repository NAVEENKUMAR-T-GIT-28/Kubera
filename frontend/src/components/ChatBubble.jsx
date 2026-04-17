import { useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm Kubera AI 🤖 Ask me anything about your investments, portfolio, or round-up savings!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "Couldn't reach AI server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Styles
  const fabStyle = {
    position: 'fixed', bottom: '5.5rem', right: '1.25rem',
    width: '3.25rem', height: '3.25rem', borderRadius: '50%',
    background: 'linear-gradient(135deg, #5b2ef2, #4f15e6)',
    color: '#fff', border: 'none', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(91,46,242,0.4)',
    cursor: 'pointer', zIndex: 150,
    transition: 'transform 0.2s', fontSize: '1.5rem'
  };

  const panelStyle = {
    position: 'fixed', bottom: '9.5rem', right: '1rem',
    width: '320px', maxHeight: '420px',
    background: '#fff', borderRadius: '1.25rem',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
    zIndex: 150, overflow: 'hidden',
    animation: 'chatSlideUp 0.3s ease'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #5b2ef2, #4f15e6)',
    color: '#fff', padding: '0.875rem 1rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
    fontSize: '0.9rem'
  };

  const bodyStyle = {
    flex: 1, overflowY: 'auto', padding: '0.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    maxHeight: '280px', background: '#f5f7f9'
  };

  const inputBarStyle = {
    display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem',
    borderTop: '1px solid #eee', background: '#fff'
  };

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Chat Panel */}
      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <span>Kubera AI Assistant</span>
            <span style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.8, fontSize: '1.1rem' }} onClick={() => setOpen(false)}>✕</span>
          </div>

          <div style={bodyStyle}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#5b2ef2' : '#fff',
                color: m.role === 'user' ? '#fff' : '#2c2f31',
                padding: '0.5rem 0.75rem',
                borderRadius: m.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                maxWidth: '85%', fontSize: '0.825rem', lineHeight: '1.45',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', background: '#fff',
                padding: '0.5rem 0.75rem', borderRadius: '1rem 1rem 1rem 0.25rem',
                fontSize: '0.825rem', color: '#999', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}>
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={inputBarStyle}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your portfolio..."
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                border: '1px solid #e0e0e0', fontSize: '0.825rem',
                fontFamily: "'Manrope', sans-serif", outline: 'none'
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                background: input.trim() ? '#5b2ef2' : '#ddd',
                color: '#fff', border: 'none', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'background 0.2s', fontSize: '1rem'
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        style={fabStyle}
        onClick={() => setOpen(!open)}
        title="Chat with Kubera AI"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  );
}
