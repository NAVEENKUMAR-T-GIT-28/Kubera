import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings, clearAuth, getUser } from '../api';

export default function SettingsPage({ showToast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await getSettings();
      setSettings(res.settings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        enabled: settings.enabled,
        roundLevel: settings.roundLevel,
        minAmount: settings.minAmount,
        maxAmount: settings.maxAmount,
        threshold: settings.threshold,
        cycle: settings.cycle,
      });
      showToast('Royal settings updated!');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  function upd(key, val) { setSettings(prev => ({ ...prev, [key]: val })); }

  if (loading) return (
    <div className="page" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[80, 300, 200].map((h, i) => <div key={i} className="skeleton" style={{ height: `${h}px` }} />)}
    </div>
  );

  const previewRoundUp = settings.roundLevel
    ? Math.ceil(187 / settings.roundLevel) * settings.roundLevel - 187
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="t-h2">Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1.25rem' }}>

        {/* ── Profile Card ── */}
        <div className="card shadow-float">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3.75rem', height: '3.75rem', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.625rem', color: 'var(--on-primary)',
              boxShadow: '0 4px 16px rgba(91,46,242,0.25)'
            }}>
              {user?.name?.[0]?.toUpperCase() || '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <p className="t-title">{user?.name || 'Royal Member'}</p>
              <p className="t-body-sm c-muted">{user?.phone}</p>
              <p className="t-label-sm c-muted" style={{ marginTop: '0.125rem' }}>A/C {user?.accountNumber}</p>
            </div>
            <span className="chip chip-primary">
              <span className="mi mi-sm">verified</span> Royal
            </span>
          </div>
        </div>

        {/* ── Round-Up Engine ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 className="t-title">Smart Round-Off Engine</h3>
              <p className="t-body-sm c-muted" style={{ marginTop: '0.125rem' }}>Auto-save every transaction's spare change</p>
            </div>
            {/* Toggle */}
            <button
              className={`toggle-track ${settings.enabled ? 'on' : 'off'}`}
              onClick={() => upd('enabled', !settings.enabled)}
            >
              <div className="toggle-thumb" />
            </button>
          </div>

          {/* Round Level */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="t-label-sm c-muted" style={{ marginBottom: '0.625rem' }}>ROUND-OFF LEVEL</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[5, 10, 20, 50, 100].map(l => (
                <button
                  key={l}
                  className={`chip ${settings.roundLevel === l ? 'chip-primary' : 'chip-surface'}`}
                  style={{ cursor: 'pointer', fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
                  onClick={() => upd('roundLevel', l)}
                >
                  ₹{l}
                </button>
              ))}
            </div>

            {/* Live preview */}
            <div className="card-earn" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="t-label-sm" style={{ color: 'var(--on-secondary-container)' }}>PREVIEW: ₹187 → ₹{Math.ceil(187 / (settings.roundLevel || 1)) * (settings.roundLevel || 1)}</p>
                <p className="t-body-sm" style={{ color: 'var(--secondary)' }}>Round-off: ₹{previewRoundUp} saved</p>
              </div>
              <span className="mi mi-xl" style={{ color: 'var(--secondary)', opacity: 0.5 }}>savings</span>
            </div>
          </div>

          {/* Threshold */}
          <div className="input-wrap" style={{ marginBottom: '1rem' }}>
            <label className="input-label">Auto-invest threshold (₹)</label>
            <div style={{ position: 'relative' }}>
              <span className="mi" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>currency_rupee</span>
              <input className="input" type="number" value={settings.threshold} onChange={e => upd('threshold', Number(e.target.value))} style={{ paddingLeft: '3rem' }} />
            </div>
          </div>

          {/* Min / Max */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="input-wrap">
              <label className="input-label">Min spare (₹)</label>
              <input className="input" type="number" value={settings.minAmount} onChange={e => upd('minAmount', Number(e.target.value))} />
            </div>
            <div className="input-wrap">
              <label className="input-label">Max spare (₹)</label>
              <input className="input" type="number" value={settings.maxAmount} onChange={e => upd('maxAmount', Number(e.target.value))} />
            </div>
          </div>

          {/* Cycle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="t-label-sm c-muted" style={{ marginBottom: '0.625rem' }}>INVESTMENT CYCLE</p>
            <div className="seg-control">
              {['weekly', 'monthly'].map(c => (
                <button
                  key={c}
                  className={`seg-item ${settings.cycle === c ? 'active' : ''}`}
                  onClick={() => upd('cycle', c)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="mi mi-sm">hourglass_empty</span> Saving…</>
              : <><span className="mi mi-sm">save</span> Save Royal Settings</>
            }
          </button>
        </div>

        {/* ── Security ── */}
        <div className="card">
          <h3 className="t-label c-muted" style={{ letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Security</h3>
          {[
            { icon: 'fingerprint', label: 'Biometric Auth', sub: 'FaceID / TouchID enabled', ic: 'ic-primary' },
            { icon: 'shield',      label: 'AES-256 Encryption', sub: 'Military-grade protection', ic: 'ic-earn' },
            { icon: 'verified',    label: 'Royal Certification', sub: 'Sovereign account verified', ic: 'ic-lime' },
          ].map(s => (
            <div key={s.label} className="txn-row">
              <div className={`icon-container ${s.ic}`}>
                <span className="mi mi-md">{s.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p className="txn-name">{s.label}</p>
                <p className="txn-sub">{s.sub}</p>
              </div>
              <span className="mi mi-sm c-muted">chevron_right</span>
            </div>
          ))}
        </div>

        {/* ── Sign Out ── */}
        <button
          className="btn btn-surface"
          style={{ color: 'var(--error)', gap: '0.5rem' }}
          onClick={() => { clearAuth(); navigate('/login'); }}
        >
          <span className="mi mi-sm">logout</span> Sign Out of Royal Account
        </button>

        <p className="t-label-sm c-muted" style={{ textAlign: 'center', paddingBottom: '0.5rem' }}>
          Kubera v1.0 · The Royal Standard of Wealth
        </p>
      </div>
    </div>
  );
}
