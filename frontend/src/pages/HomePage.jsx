import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getMyQR, getUser, clearAuth } from '../api';

export default function HomePage({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(false);
  const [qr, setQR] = useState(null);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => { fetchDashboard(); }, []);

  async function fetchDashboard() {
    try {
      const res = await getDashboard();
      setData(res.dashboard);
    } catch (err) {
      if (err.message?.includes('token') || err.message?.includes('denied')) { clearAuth(); navigate('/login'); }
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  }

  async function handleQR() {
    try {
      const res = await getMyQR();
      setQR(res.qr);
      setQrModal(true);
    } catch (err) { showToast(err.message, 'error'); }
  }

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';

  const categoryIcon = c => ({ food:'🍕', shopping:'🛍️', transport:'🚗', bills:'📄', entertainment:'🎬' })[c] || '💳';

  if (loading) return (
    <div className="page" style={{ padding:'1.25rem' }}>
      <div className="skeleton" style={{ height:'200px', marginBottom:'1rem' }} />
      <div className="skeleton" style={{ height:'140px', marginBottom:'1rem' }} />
      <div className="skeleton" style={{ height:'240px' }} />
    </div>
  );

  const d = data;
  const balFmt = new Intl.NumberFormat('en-IN').format(d?.account?.balance || 0);
  const totalSpare = d?.sparePool?.totalSpare || 0;
  const pending = d?.sparePool?.pendingInvestment || 0;
  const invested = d?.sparePool?.investedTotal || 0;
  const threshold = d?.sparePool?.threshold || 100;

  return (
    <div className="page">
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <p className="t-label-sm c-muted">{greeting.toUpperCase()}</p>
          <h1 className="t-h3" style={{ marginTop:'0.125rem' }}>{d?.account?.name || user?.name || 'User'}</h1>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn-icon ic-surface" onClick={handleQR} title="My QR">
            <span className="mi mi-md">qr_code</span>
          </button>
          <button className="btn-icon ic-surface" onClick={() => { clearAuth(); navigate('/login'); }} title="Sign out">
            <span className="mi mi-md">logout</span>
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1rem', padding:'0 1.25rem' }}>

        {/* ─── Balance Hero Card ─── */}
        <div className="card-hero shadow-float">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
            <div>
              <p className="t-label-sm" style={{ color:'rgba(246,240,255,0.65)', marginBottom:'0.25rem' }}>TOTAL BALANCE</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:'0.125rem' }}>
                <span className="amount-currency c-on-primary">₹</span>
                <span className="t-display c-on-primary">{balFmt}</span>
              </div>
            </div>
            <span className="chip chip-glass">
              <span className="mi" style={{ fontSize:'0.875rem' }}>verified</span>
              Royal
            </span>
          </div>

          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'var(--r-lg)', padding:'0.75rem', marginBottom:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}>
              <span className="t-label-sm c-on-primary" style={{ opacity:0.7 }}>GOLD RESERVE (auto-invest)</span>
              <span className="t-label c-on-primary">₹{pending} / ₹{threshold}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width:`${Math.min((pending / threshold) * 100, 100)}%` }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button className="btn btn-glass" style={{ flex:1 }} onClick={() => navigate('/pay')}>
              <span className="mi mi-sm">qr_code_scanner</span> Scan & Pay
            </button>
            <button className="btn btn-glass" style={{ flex:1 }} onClick={handleQR}>
              <span className="mi mi-sm">download</span> Receive
            </button>
          </div>
        </div>

        {/* ─── Spare Change / Digital Gold Reserve ─── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <div className="card-earn">
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <span className="mi mi-sm" style={{ color:'var(--secondary)' }}>savings</span>
              <p className="t-label-sm" style={{ color:'var(--on-secondary-container)' }}>SPARE SAVED</p>
            </div>
            <p className="t-h2" style={{ color:'var(--on-secondary-container)' }}>₹{totalSpare}</p>
            <span className="chip chip-earn" style={{ marginTop:'0.5rem', fontSize:'0.6rem' }}>🌱 Accumulating</span>
          </div>

          <div className="card-lime">
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <span className="mi mi-sm" style={{ color:'var(--tertiary)' }}>trending_up</span>
              <p className="t-label-sm" style={{ color:'var(--on-tertiary-container)' }}>DEPLOYED</p>
            </div>
            <p className="t-h2" style={{ color:'var(--on-tertiary-container)' }}>₹{invested}</p>
            <span className="chip chip-lime" style={{ marginTop:'0.5rem', fontSize:'0.6rem' }}>📈 Growing</span>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div>
          <div className="section-title">
            <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase' }}>Quick Access</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.625rem' }}>
            {[
              { icon:'qr_code_scanner', label:'Scan', path:'/pay', ic:'ic-primary' },
              { icon:'trending_up',     label:'Invest', path:'/invest', ic:'ic-earn' },
              { icon:'credit_card',     label:'Cards', path:'/cards', ic:'ic-lime' },
              { icon:'settings',        label:'Settings', path:'/settings', ic:'ic-surface' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', padding:'0.875rem 0.5rem', background:'var(--surface-container-lowest)', borderRadius:'var(--r-xl)', boxShadow:'0 2px 8px rgba(44,47,49,0.05)' }}>
                <div className={`icon-container ${a.ic}`}>
                  <span className="mi mi-md">{a.icon}</span>
                </div>
                <span className="t-label-sm c-muted">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Digital Gold Reserves Banner ─── */}
        <div style={{
          background:'linear-gradient(135deg, #1a0050 0%, #3b0070 50%, #5b0e8f 100%)',
          borderRadius:'var(--r-xl)', padding:'1.25rem', position:'relative', overflow:'hidden'
        }}>
          <div style={{ position:'absolute', right:'-10px', bottom:'-10px', fontSize:'5rem', opacity:0.15 }}>🏆</div>
          <p className="t-label-sm" style={{ color:'var(--tertiary-container)', marginBottom:'0.375rem' }}>SOVEREIGN WEALTH</p>
          <h3 className="t-h3" style={{ color:'#fff', marginBottom:'0.375rem' }}>Digital Gold Reserves</h3>
          <p style={{ fontSize:'0.8125rem', color:'rgba(255,255,255,0.65)', marginBottom:'1rem' }}>
            Secure your wealth with 24K 99.9% pure sovereign gold.
          </p>
          <button className="btn btn-lime btn-sm" onClick={() => navigate('/invest')} style={{ width:'auto' }}>
            <span className="mi mi-sm">arrow_forward</span> Allocate Now
          </button>
        </div>

        {/* ─── Recent People (from Stitch) ─── */}
        {d?.contacts?.length > 0 && (
          <div>
            <div className="section-title">
              <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase' }}>Recent People</h3>
              <button className="section-see-all" onClick={() => navigate('/pay')}>Pay →</button>
            </div>
            <div style={{ display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
              {(d.contacts || []).slice(0, 5).map((c, i) => (
                <button key={i} onClick={() => navigate('/pay')} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', flexShrink:0 }}>
                  <div style={{
                    width:'3rem', height:'3rem', borderRadius:'50%',
                    background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'1.375rem'
                  }}>
                    {c.avatar || '🏪'}
                  </div>
                  <span className="t-label-sm c-muted" style={{ maxWidth:'3.5rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.name?.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Activity ─── */}
        <div>
          <div className="section-title">
            <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase' }}>Recent Activity</h3>
            <button className="section-see-all" onClick={() => navigate('/history')}>See All →</button>
          </div>
          <div className="card">
            {d?.recentTransactions?.length > 0 ? d.recentTransactions.slice(0, 5).map((txn, i) => (
              <div className="txn-row" key={i}>
                <div className="icon-container ic-surface" style={{ fontSize:'1.25rem', background:'var(--surface-container-low)' }}>
                  {categoryIcon(txn.category)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="txn-name">{txn.peerName || txn.merchantName}</div>
                  <div className="txn-sub">
                    {new Date(txn.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    {txn.note ? ` · ${txn.note}` : ''}
                  </div>
                </div>
                <div>
                  <div className={`txn-amt ${txn.direction === 'sent' ? 'out' : 'in'}`}>{txn.displayAmount}</div>
                  {txn.roundUpAmount > 0 && <div className="txn-spare">+₹{txn.roundUpAmount} saved</div>}
                </div>
              </div>
            )) : (
              <div style={{ padding:'2rem', textAlign:'center' }}>
                <span className="mi" style={{ fontSize:'2.5rem', color:'var(--outline)', display:'block', marginBottom:'0.5rem' }}>receipt_long</span>
                <p className="t-body-sm c-muted">No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── QR Modal ─── */}
      {qrModal && qr && (
        <div className="modal-backdrop" onClick={() => setQrModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ textAlign:'center' }}>
              <h3 className="t-h3" style={{ marginBottom:'0.25rem' }}>Scan to Pay Me</h3>
              <p className="t-body-sm c-muted" style={{ marginBottom:'1.5rem' }}>Share your QR code to receive payments</p>
              <div className="qr-wrapper" style={{ marginBottom:'1rem' }}>
                <div className="qr-box">
                  <img src={qr} alt="My QR Code" />
                </div>
                <p className="t-title c-on-primary">{d?.account?.name}</p>
                <p className="t-label-sm c-on-primary" style={{ opacity:0.7 }}>A/C {d?.account?.accountNumber}</p>
              </div>
              <button className="btn btn-surface" onClick={() => setQrModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
