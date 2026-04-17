import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics, getPortfolio, getInvestment } from '../api';

// --- Premium SVG Donut Chart ---
export function PremiumDonut({ data }) {
  if (!data || data.length === 0) return <div style={{height:'200px', display:'flex', alignItems:'center', justifyContent:'center'}} className="c-muted">No Data</div>;
  
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
        {data.map((slice, i) => {
           const slicePercent = slice.value / total;
           const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
           cumulativePercent += slicePercent;
           const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
           const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
           
           const pathData = [
             `M ${startX} ${startY}`,
             `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`
           ].join(' ');

           // Add gap for donut
           return (
             <path 
               key={slice.name} 
               d={pathData} 
               fill="none" 
               stroke={slice.color} 
               strokeWidth="0.35" 
               strokeLinecap="round"
             />
           );
        })}
      </svg>
      {/* Center Label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
         <span className="t-label-sm c-muted">TOTAL ASSETS</span>
         <span className="t-h2" style={{ marginTop: '0.25rem' }}>₹{total.toFixed(0)}</span>
      </div>
    </div>
  );
}

// --- Premium SVG Area Chart ---
export function PremiumAreaChart({ historyCurve }) {
  if (!historyCurve || historyCurve.length === 0) return null;

  const validData = historyCurve.filter(h => h.value !== undefined);
  if (validData.length < 2) return null;

  const minVal = Math.min(...validData.map(d => d.value)) * 0.95;
  const maxVal = Math.max(...validData.map(d => d.value)) * 1.05;
  const range = (maxVal - minVal) || 1;

  const pts = validData.map((d, i) => {
    const x = (i / (validData.length - 1)) * 100;
    const y = 95 - ((d.value - minVal) / range) * 90;
    return `${x},${y}`;
  });

  const path = `M ${pts.join(' L ')}`;
  const filledPath = `${path} L 100,100 L 0,100 Z`;

  return (
    <div style={{ width: '100%', height: '180px', position: 'relative' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
         <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
         </defs>

         {/* Background Grid Lines */}
         <line x1="0" y1="20" x2="100" y2="20" stroke="var(--surface-container-high)" strokeWidth="0.5" />
         <line x1="0" y1="50" x2="100" y2="50" stroke="var(--surface-container-high)" strokeWidth="0.5" />
         <line x1="0" y1="80" x2="100" y2="80" stroke="var(--surface-container-high)" strokeWidth="0.5" />

         <path d={filledPath} fill="url(#areaGrad)" />
         <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
         
         <circle cx="100" cy={95 - ((validData[validData.length-1].value - minVal) / range) * 90} r="3" fill="#fff" stroke="var(--primary)" strokeWidth="1.5" />
      </svg>
      {/* X-Axis labels mapping */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0 0.25rem' }}>
         <span className="t-label-sm c-muted" style={{ textTransform: 'none' }}>{validData[0].date}</span>
         <span className="t-label-sm c-muted" style={{ textTransform: 'none' }}>{validData[Math.floor(validData.length/2)].date}</span>
         <span className="t-label-sm c-primary" style={{ textTransform: 'none' }}>Live Market</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage({ showToast }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [investmentData, setInvestmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.all([
      getAnalytics(),
      getPortfolio(),
      getInvestment()
    ])
      .then(([aData, pData, iData]) => {
        setData(aData);
        setPortfolio(pData.portfolio || []);
        setInvestmentData(iData.investment || null);
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading || !data) return (
    <div className="page" style={{ padding: '1.25rem' }}>
      <div className="skeleton" style={{ height: '300px' }} />
      <div className="skeleton" style={{ height: '200px', marginTop: '1rem' }} />
    </div>
  );

  const { stats, distribution, historyCurve } = data;
  const plDiff = stats.totalCurrentVal - stats.totalInvested;
  const plPercent = stats.totalInvested > 0 ? ((plDiff / stats.totalInvested) * 100).toFixed(2) : 0;

  // Remap distribution colors to match UI theme BUCKETS exactly:
  // Gold: #F7B731, ETF: #5b2ef2, Index: #006945, Debt: #3f6600
  const themeColors = {
    'Sovereign Gold': '#F7B731',
    'Nifty 50 ETF': '#5b2ef2',
    'Global Index': '#006945',
    'Govt Debt Fund': '#3f6600'
  };
  const themeDistribution = distribution.map(d => ({ ...d, color: themeColors[d.name] || d.color }));

  return (
    <div className="page" style={{ paddingBottom: '7rem', paddingTop: '1.25rem' }}>
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <button className="btn-icon ic-surface" onClick={() => navigate(-1)} style={{ width: '2.5rem', height: '2.5rem' }}>
             <span className="mi">arrow_back</span>
           </button>
           <h1 className="t-h2">Deep Analytics</h1>
        </div>
      </div>

      <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
           <div className="card-tonal">
              <div className="icon-container ic-primary" style={{ marginBottom: '0.75rem' }}>
                 <span className="mi mi-sm">account_balance_wallet</span>
              </div>
              <p className="t-label-sm c-muted">Spare Collected</p>
              <p className="t-h3" style={{ marginTop: '0.2rem' }}>₹{stats.totalSpareCollected.toFixed(0)}</p>
           </div>
           
           <div className="card-tonal">
              <div className="icon-container" style={{ marginBottom: '0.75rem', background: plDiff >= 0 ? 'var(--secondary-container)' : 'var(--error-container)', color: plDiff >= 0 ? 'var(--secondary)' : 'var(--on-error)' }}>
                 <span className="mi mi-sm">{plDiff >= 0 ? 'trending_up' : 'trending_down'}</span>
              </div>
              <p className="t-label-sm c-muted">Lifetime P/L</p>
              <p className="t-h3" style={{ marginTop: '0.2rem', color: plDiff >= 0 ? 'var(--secondary)' : 'var(--error)' }}>
                 {plDiff >= 0 ? '+' : '-'}₹{Math.abs(plDiff).toFixed(1)}
              </p>
           </div>
        </div>

        {/* Growth Curve Chart */}
        <div className="card">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                 <h3 className="t-title">Portfolio Growth</h3>
                 <p className="t-label-sm c-muted" style={{ marginTop: '0.2rem', textTransform: 'none' }}>Cumulative Value Over Time</p>
              </div>
           </div>
           
           <PremiumAreaChart historyCurve={historyCurve} />
        </div>

        {/* Allocation Donut Chart */}
        <div className="card">
           <h3 className="t-title" style={{ marginBottom: '1.5rem' }}>Asset Distribution</h3>
           
           <PremiumDonut data={themeDistribution} />

           <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {themeDistribution.map(d => (
                 <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: d.color }} />
                       <span className="t-body" style={{ fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span className="t-h3" style={{ fontSize: '1.1rem' }}>{((d.value / Math.max(stats.totalCurrentVal, 1)) * 100).toFixed(1)}%</span>
                 </div>
              ))}
              {themeDistribution.length === 0 && <div className="t-label-sm c-muted text-center" style={{marginTop:'1rem'}}>No investments yet</div>}
           </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="card">
           <h3 className="t-title" style={{ marginBottom: '1rem' }}>Detailed Metrics</h3>
           <p className="t-label-sm c-muted" style={{ marginBottom: '1rem', textTransform: 'none' }}>Tap a fund to see history</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {portfolio.map(p => {
                const pDiff = p.currentVal - p.invested;
                const pPercent = p.invested > 0 ? ((pDiff / p.invested) * 100).toFixed(2) : 0;
                const isExpanded = expandedId === p.id;
                
                // Get history for this fund
                const fundHistory = investmentData?.history?.filter(h => h[p.id] > 0) || [];

                return (
                  <div key={p.id} style={{ background: 'var(--surface-container)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <p className="t-body" style={{ fontWeight: 600 }}>{p.name}</p>
                        <p className="t-label-sm c-muted" style={{ marginTop: '0.2rem' }}>Invested: ₹{p.invested.toFixed(0)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="t-h3" style={{ fontSize: '1.1rem' }}>₹{p.currentVal.toFixed(0)}</p>
                        <p className="t-label-sm" style={{ color: pDiff >= 0 ? 'var(--secondary)' : 'var(--error)' }}>
                          {pDiff >= 0 ? '+' : '-'}₹{Math.abs(pDiff).toFixed(1)} ({pPercent}%)
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                       <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                         {fundHistory.length > 0 ? (
                           <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                             <p className="t-label-sm c-muted">TRANSACTION HISTORY</p>
                             {fundHistory.map((h, i) => (
                               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--surface-container-lowest)', borderRadius: 'var(--r-sm)' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="mi mi-sm" style={{ color: 'var(--secondary)' }}>call_received</span>
                                    <span className="t-body-sm">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                 </div>
                                 <span className="t-body-sm" style={{ fontWeight: 600, color: 'var(--secondary)' }}>+₹{h[p.id].toFixed(2)}</span>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <p className="t-body-sm c-muted" style={{ marginTop: '0.75rem', textAlign: 'center' }}>No recent history</p>
                         )}
                       </div>
                    )}
                  </div>
                );
             })}
             {portfolio.length === 0 && <div className="t-label-sm c-muted text-center" style={{padding:'1rem'}}>No detailed data available</div>}
           </div>
        </div>

      </div>
    </div>
  );
}
