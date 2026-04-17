import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

export default function LoginPage({ showToast }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!phone || !pin) return showToast('Enter phone and PIN', 'error');
    setLoading(true);
    try {
      await login(phone, pin);
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>

      {/* ── Hero Section ── */}
      <div style={{
        background: 'linear-gradient(155deg, var(--primary) 0%, var(--primary-dim) 60%, #1a0080 100%)',
        padding: '4rem 1.5rem 3.5rem',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-30px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="mi mi-lg" style={{ color: 'var(--on-primary)' }}>currency_rupee</span>
            </div>
            <span className="t-title" style={{ color: 'var(--on-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.875rem' }}>Kubera</span>
          </div>

          <h1 className="t-h1" style={{ color: 'var(--on-primary)', marginBottom: '0.75rem', lineHeight: 1.15 }}>
            The Kubera Standard<br />of Wealth
          </h1>
          <p className="t-body" style={{ color: 'rgba(246,240,255,0.75)', lineHeight: 1.6 }}>
            Military-grade encryption for your<br />digital sovereign assets.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['🛡️ AES-256', '⚡ Instant UPI', '🌱 Auto-Invest'].map(t => (
              <span key={t} className="chip chip-glass" style={{ fontSize: '0.6875rem' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Login Form ── */}
      <div style={{ flex: 1, padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="t-h2" style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
          <p className="t-body-sm c-muted">Access your private banking dashboard and UPI services.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-wrap">
            <label className="input-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span className="mi" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>phone</span>
              <input className="input" type="tel" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} style={{ paddingLeft: '3rem' }} />
            </div>
          </div>

          <div className="input-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">PIN</label>
              <span className="t-label c-primary" style={{ cursor: 'pointer' }}>Forgot PIN?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="mi" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>lock</span>
              <input className="input" type="password" placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} style={{ paddingLeft: '3rem', letterSpacing: '0.5em' }} />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <><span className="mi mi-sm">hourglass_empty</span> Signing in…</> : <><span className="mi mi-sm">lock_open</span> Sign In</>}
          </button>
        </form>

        {/* Biometric hint */}
        <div className="card-tonal" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <div className="icon-container ic-primary">
            <span className="mi mi-sm">fingerprint</span>
          </div>
          <div>
            <p className="t-label" style={{ color: 'var(--on-surface)' }}>Biometric Login Enabled</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Securely access via FaceID or TouchID</p>
          </div>
        </div>

        <p className="t-body-sm" style={{ marginTop: 'auto', paddingTop: '1.5rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          New to the Kubera Standard?{' '}
          <span className="c-primary" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/register')}>Create Account</span>
        </p>
      </div>
    </div>
  );
}
