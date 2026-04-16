import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function RegisterPage({ showToast }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !phone || !pin) return showToast('Fill all required fields', 'error');
    if (pin !== confirmPin) return showToast('PINs do not match', 'error');
    if (pin.length !== 4) return showToast('PIN must be 4 digits', 'error');
    setLoading(true);
    try {
      await register(name, phone, pin);
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dim))',
        padding: '3rem 1.25rem 2rem',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', top:'-40px', right:'-30px', width:'180px', height:'180px', background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <button onClick={() => navigate('/login')} style={{ display:'flex', alignItems:'center', gap:'0.25rem', color:'rgba(246,240,255,0.75)', marginBottom:'1.25rem', fontSize:'0.875rem', fontWeight:600, fontFamily:'var(--font-display)' }}>
          <span className="mi mi-sm">arrow_back</span> Back
        </button>
        <h1 className="t-h2" style={{ color:'var(--on-primary)' }}>Join Kubera</h1>
        <p className="t-body-sm" style={{ color:'rgba(246,240,255,0.75)', marginTop:'0.25rem' }}>Start building sovereign wealth today</p>
      </div>

      {/* Form */}
      <div style={{ flex:1, padding:'2rem 1.25rem' }}>
        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="input-wrap">
            <label className="input-label">Full Name</label>
            <input className="input" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-wrap">
            <label className="input-label">Phone Number</label>
            <input className="input" type="tel" placeholder="10-digit mobile number" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="input-wrap">
              <label className="input-label">Set PIN</label>
              <input className="input" type="password" placeholder="4 digits" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} style={{ letterSpacing:'0.3em' }} />
            </div>
            <div className="input-wrap">
              <label className="input-label">Confirm PIN</label>
              <input className="input" type="password" placeholder="Re-enter" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={4} style={{ letterSpacing:'0.3em' }} />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop:'0.5rem' }}>
            {loading ? '⏳ Creating…' : <><span className="mi mi-sm">auto_awesome</span> Create Account</>}
          </button>
        </form>

        <p className="t-body-sm" style={{ marginTop:'1.5rem', textAlign:'center', color:'var(--on-surface-variant)' }}>
          Already a member?{' '}
          <span className="c-primary" style={{ fontWeight:700, cursor:'pointer' }} onClick={() => navigate('/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
}
