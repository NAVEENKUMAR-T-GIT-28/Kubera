import { useState, useEffect } from 'react';
import { getInvestment, updateAllocation, investNow } from '../api';
import ChatBubble from '../components/ChatBubble';

const BUCKETS = [
  { key: 'gold',      label: 'Sovereign Gold',   icon: '🥇', color: '#F7B731' },
  { key: 'etf',       label: 'Nifty 50 ETF',     icon: '📊', color: '#5b2ef2' },
  { key: 'indexFund', label: 'Global Index',     icon: '📈', color: '#006945' },
  { key: 'debtFund',  label: 'Govt Debt Fund',   icon: '🏦', color: '#3f6600' },
];

function SparklineChart({ color }) {
  const [data] = useState(() => {
    let pts = [50];
    for (let i = 1; i < 30; i++) {
      let r = (Math.random() - 0.42) * 12; // slight upward bias
      pts.push(pts[i-1] + r);
    }
    return pts;
  });

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - ((d - min) / range) * 40;
    return `${x},${y}`;
  });

  const linePath = `M ${pts.join(' L ')}`;
  const fillPath = `${linePath} L 100,45 L 0,45 Z`;

  // Random positive growth for the label
  const [metric] = useState((Math.random() * 6 + 7).toFixed(2));

  return (
    <div style={{ padding: '1rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--r-lg)', marginTop: '0.75rem', border: `1px solid ${color}22` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className="t-label-sm c-muted">Livetrading 30d perf.</span>
        <span className="t-label-sm" style={{ color }}>+{metric}%</span>
      </div>
      <svg viewBox="0 0 100 45" style={{ width: '100%', height: '70px', overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#grad-${color.replace('#','')})`} />
        {/* Glow */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.3" style={{ filter: 'blur(2px)' }} />
        {/* Main Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* End pulse dot */}
        <circle cx="100" cy={40 - ((data[data.length-1] - min) / range) * 40} r="1.5" fill="#fff" stroke={color} strokeWidth="1" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>1 Mo ago</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Now</span>
      </div>
    </div>
  );
}

export default function InvestmentPage({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [alloc, setAlloc] = useState({ gold:25, etf:25, indexFund:25, debtFund:25 });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const res = await getInvestment();
      setData(res.investment);
      if (res.investment?.allocation) setAlloc(res.investment.allocation);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    const total = BUCKETS.reduce((s, b) => s + (alloc[b.key] || 0), 0);
    if (total !== 100) return showToast(`Must equal 100% (currently ${total}%)`, 'error');
    try {
      await updateAllocation(alloc);
      showToast('Strategic allocation updated!');
      setEditing(false);
      fetchData();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function handleInvestNow() {
    try {
      const res = await investNow();
      showToast(res.message || 'Investment deployed!');
      fetchData();
    } catch (err) { showToast(err.message, 'error'); }
  }

  function upd(key, val) {
    setAlloc(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, Number(val) || 0)) }));
  }

  if (loading) return (
    <div className="page" style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div className="page-header"><h1 className="t-h2">Investments</h1></div>
      <div className="skeleton" style={{ height:'300px' }} />
      <div className="skeleton" style={{ height:'200px' }} />
      <div className="skeleton" style={{ height:'200px' }} />
    </div>
  );

  const d = data;
  const total = BUCKETS.reduce((s, b) => s + (alloc[b.key] || 0), 0);
  const totalInvested = d?.totalInvested || 0;
  
  // Mock returns calculation
  const mockReturnRate = 0.142; // +14.2% mock return
  const mockReturnAmount = Math.round(totalInvested * mockReturnRate);
  const totalValue = totalInvested + mockReturnAmount;

  const totalInvestedFmt = new Intl.NumberFormat('en-IN').format(totalInvested);
  const mockReturnFmt = new Intl.NumberFormat('en-IN').format(mockReturnAmount);
  const totalValueFmt = new Intl.NumberFormat('en-IN').format(totalValue);

  return (
    <div className="page" style={{ paddingBottom:'7rem' }}>
      <div className="page-header">
        <h1 className="t-h2">Investments</h1>
        <span className="chip chip-earn"><span className="mi mi-sm">trending_up</span> Growing</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', padding:'0 1.25rem' }}>

        {/* ─── Hero: Portfolio Value & Mock Returns ─── */}
        <div style={{
          background:'linear-gradient(135deg, #1a0050 0%, #2d0072 100%)',
          borderRadius:'var(--r-xl)', padding:'2rem 1.25rem', color:'#fff', position:'relative', overflow:'hidden',
          boxShadow:'0 16px 48px rgba(91,46,242,0.25)', textAlign: 'center'
        }}>
          {/* Decorative Orbs */}
          <div style={{ position:'absolute', top:'-40px', right:'-30px', width:'180px', height:'180px', background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
          
          <div style={{ position:'relative', zIndex:1 }}>
            <p className="t-label-sm c-on-primary" style={{ opacity:0.8, marginBottom:'0.5rem', letterSpacing: '0.1em' }}>PORTFOLIO VALUE</p>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'baseline', gap:'0.25rem', marginBottom:'0.5rem' }}>
              <span className="amount-currency c-on-primary" style={{ fontSize: '2rem' }}>₹</span>
              <span className="t-display c-on-primary" style={{ fontSize: '3rem' }}>{totalValueFmt}</span>
            </div>

            <div style={{ display:'inline-block', background: 'rgba(144,247,194,0.15)', padding: '0.5rem 1rem', borderRadius: 'var(--r-full)', marginBottom: '0.5rem' }}>
              <p style={{ color: 'var(--secondary)', fontWeight: 600, display:'flex', alignItems:'center', gap:'0.375rem' }}>
                <span className="mi mi-sm">arrow_upward</span>
                ₹{mockReturnFmt} (+14.2% Return)
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
               <button 
                  onClick={() => window.location.href = '/portfolio'} 
                  className="btn btn-sm" 
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem' }}
               >
                  <span className="mi mi-sm">insights</span> Live Portfolio
               </button>
               <button 
                  onClick={() => window.location.href = '/analytics'} 
                  className="btn btn-sm" 
                  style={{ background: '#00BFFF22', color: '#00BFFF', border: '1px solid #00BFFF55', padding: '0.4rem 1rem' }}
               >
                  <span className="mi mi-sm">donut_large</span> Deep Analytics
               </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'left' }}>
               <div>
                  <p className="t-label-sm" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>TOTAL INVESTED</p>
                  <p className="t-h3">₹{totalInvestedFmt}</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                 {d?.pendingInvestment > 0 ? (
                   <>
                     <p className="t-label-sm" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>SPARE CHANGE TO INVEST</p>
                     <p className="t-h3">₹{d.pendingInvestment}</p>
                     <button className="btn btn-glass btn-sm" onClick={handleInvestNow} style={{ width:'auto', background:'rgba(255,255,255,0.2)', color:'#fff', marginTop:'0.5rem', marginLeft:'auto', padding:'0.25rem 0.5rem' }}>Deploy <span className="mi" style={{fontSize:'0.875rem'}}>rocket_launch</span></button>
                   </>
                 ) : (
                   <>
                     <p className="t-label-sm" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>ACTIVE YIELD</p>
                     <p className="t-h3" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>🥇 Sov. Gold</p>
                   </>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* ─── Strategic Allocation Editor ─── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h3 className="t-title">Investment Options</h3>
            <button className="t-label c-primary" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : <><span className="mi mi-sm">edit</span> Edit Rules</>}
            </button>
          </div>

          <p className="t-body-sm c-muted" style={{ marginBottom:'1rem' }}>Control how your round-offs are automatically split when deployed into the market.</p>

          {/* Allocation bar */}
          <div className="alloc-bar" style={{ marginBottom:'1.25rem' }}>
            {BUCKETS.map(b => (
              <div key={b.key} className="alloc-seg" style={{ width:`${alloc[b.key]}%`, background:b.color }} />
            ))}
          </div>

          {/* Buckets */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {BUCKETS.map((b, i) => {
              const share = alloc[b.key];
              const deployedMock = Math.round((share / 100) * totalValue);
              const isExpanded = expandedId === b.key;
              
              return (
                <div key={b.key}>
                  {i > 0 && <div className="divider" />}
                  <div 
                    onClick={() => !editing && setExpandedId(isExpanded ? null : b.key)}
                    style={{ 
                      padding:'0.75rem 0', cursor: editing ? 'default' : 'pointer', transition: 'all 0.2s',
                      background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: 'var(--r-md)'
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                      <div style={{ width:'2.75rem', height:'2.75rem', borderRadius:'50%', background:'var(--surface-container-low)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>
                        {b.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <p className="t-label" style={{ color:'var(--on-surface)' }}>{b.label}</p>
                        <p className="t-label-sm c-muted" style={{ textTransform:'none', letterSpacing:0 }}>₹{new Intl.NumberFormat('en-IN').format(deployedMock)}</p>
                      </div>
                      {editing ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                          <button className="btn-icon ic-surface" style={{ width:'2rem', height:'2rem' }} onClick={(e) => { e.stopPropagation(); upd(b.key, share - 5); }}>
                            <span className="mi" style={{ fontSize:'1rem' }}>remove</span>
                          </button>
                          <span className="t-h3" style={{ width:'3rem', textAlign:'center', color:b.color }}>{share}%</span>
                          <button className="btn-icon ic-surface" style={{ width:'2rem', height:'2rem' }} onClick={(e) => { e.stopPropagation(); upd(b.key, share + 5); }}>
                            <span className="mi" style={{ fontSize:'1rem' }}>add</span>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="t-h3" style={{ color:b.color }}>{share}%</span>
                          <span className="mi mi-sm c-muted" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>expand_more</span>
                        </div>
                      )}
                    </div>
                    {isExpanded && !editing && <SparklineChart color={b.color} />}
                  </div>
                </div>
              );
            })}
          </div>

          {editing && (
            <div style={{ marginTop:'1.25rem', background:'var(--surface-container-lowest)', padding:'1rem', borderRadius:'var(--r-lg)' }}>
              <p className={`t-label-sm ${total === 100 ? 'c-secondary' : 'c-error'}`} style={{ textAlign:'center', marginBottom:'0.75rem' }}>
                {total === 100 ? 'All 100% accounted for' : `Total: ${total}% (must be exactly 100%)`}
              </p>
              <button className="btn btn-primary" onClick={handleSave} disabled={total !== 100}>
                <span className="mi mi-sm">save</span> Apply Smart Changes
              </button>
            </div>
          )}
        </div>

        {/* ─── Recent Deployments ─── */}
        {d?.history?.length > 0 && (
          <div>
            <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'0.75rem', marginTop:'0.5rem' }}>Investment Logs</h3>
            <div className="card">
              {d.history.slice(0, 3).map((h, i) => (
                <div key={i} className="txn-row">
                  <div className="icon-container ic-earn">
                    <span className="mi mi-sm" style={{ color:'var(--secondary)' }}>rocket_launch</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <p className="txn-name">Auto-Invest Executed</p>
                    <p className="txn-sub">Smart Round-off deploy · {new Date(h.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="txn-amt in">+₹{new Intl.NumberFormat('en-IN').format(h.amount)}</p>
                    <p className="txn-spare" style={{ color:'var(--secondary)' }}>Success</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <ChatBubble />
    </div>
  );
}
