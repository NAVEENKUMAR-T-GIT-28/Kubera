import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolio, sellAsset } from '../api';

// Live Olymp-Trade style Graph component per asset
function LiveOlympChart({ assetId, name, initialInvested, initialVal, onTick, onSell, selling }) {
  const [data, setData] = useState([]);
  const [currentVal, setCurrentVal] = useState(initialVal);
  const [trend, setTrend] = useState('up'); 

  useEffect(() => {
    let pts = [];
    let start = initialVal * 0.98; 
    for(let i=0; i<39; i++) {
        let rand = Math.random();
        let drift = rand > 0.90 ? -(Math.random() * 0.15) : (Math.random() * 0.4) + 0.02;
        start = start * (1 + (drift/100));
        pts.push(start);
    }
    pts.push(initialVal);
    setData(pts);
    setCurrentVal(initialVal);
  }, [initialVal]);

  useEffect(() => {
    if (data.length === 0) return;
    const interval = setInterval(() => {
      setData(prev => {
        let last = prev[prev.length - 1];
        
        // Hard to find negative drops: 90% chance to go UP, 10% chance for a minor dip
        let rand = Math.random();
        let drift = rand > 0.90 ? -(Math.random() * 0.15) : (Math.random() * 0.4) + 0.02;
        
        let next = last * (1 + (drift/100));
        setTrend(next >= last ? 'up' : 'down');
        setCurrentVal(next);
        onTick(assetId, next, initialInvested); 
        
        return [...prev.slice(1), next];
      });
    }, 3000); // 3 seconds per update

    return () => clearInterval(interval);
  }, [data.length, assetId, initialInvested, onTick]);

  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  // Map points slightly inside to leave room for the cursor
  const pts = data.map((d, i) => `${(i/39)*90},${90 - ((d-min)/range)*80}`);
  const path = `M ${pts.join(' L ')}`;
  
  const isUp = trend === 'up';
  const color = isUp ? '#00e676' : '#ff3b30'; // Neon Green / Neon Red
  const gradId = `grad_${assetId}`;

  const pl = currentVal - initialInvested;
  const plPercent = initialInvested > 0 ? ((pl/initialInvested)*100).toFixed(2) : 0;
  
  // Current dot position
  const currentY = 90 - ((currentVal-min)/range)*80;

  return (
    <div style={{
       background: '#12121a',
       borderRadius: 'var(--r-lg)',
       border: '1px solid rgba(255,255,255,0.05)',
       overflow: 'hidden',
       position: 'relative',
       marginBottom: '1.25rem',
       boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
       color: '#fff'
    }}>
      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '15px 15px', zIndex: 0 }} />

      <div style={{ padding: '1.25rem 1.25rem 0.5rem', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
           <p className="t-h3" style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>{name}</p>
           <p className="t-label-sm" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
             MARKET LIVE <span className="mi mi-sm" style={{ color, fontSize: '1rem' }}>{isUp ? 'trending_up' : 'trending_down'}</span>
           </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p className="t-label-sm" style={{ color: isUp ? '#00e676' : '#ff3b30', fontWeight: 600 }}>
             {pl >= 0 ? '+' : ''}₹{pl.toFixed(2)} ({plPercent}%)
           </p>
        </div>
      </div>

      <div style={{ height: '90px', width: '100%', position: 'relative', zIndex: 1 }}>
         <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
            <defs>
               <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                 <stop offset="100%" stopColor={color} stopOpacity="0" />
               </linearGradient>
            </defs>
            <path d={`${path} L 90,100 L 0,100 Z`} fill={`url(#${gradId})`} style={{ transition: 'd 0.5s linear, fill 0.5s' }} />
            <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.5s linear, stroke 0.5s' }} />
            
            {/* Live pulsing dot */}
            <circle cx="90" cy={currentY} r="2" fill="#fff" style={{ transition: 'cy 0.5s linear' }}>
               <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Horizontal crosshair to the price axis */}
            <line x1="90" y1={currentY} x2="100" y2={currentY} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2,2" style={{ transition: 'y1 0.5s linear, y2 0.5s linear' }} />
            <rect x="80" y={currentY - 6} width="20" height="12" fill={color} rx="2" style={{ transition: 'y 0.5s linear' }} />
            <text x="90" y={currentY + 2} fill="#000" fontSize="6" fontWeight="bold" textAnchor="middle" style={{ transition: 'y 0.5s linear' }}>
               {currentVal.toFixed(2)}
            </text>
         </svg>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
           className={`btn btn-sm ${initialInvested <= 0 ? 'btn-ghost' : (isUp ? 'btn-primary' : 'btn-danger')}`} 
           style={{ width: '100%', opacity: initialInvested <= 0 ? 0.5 : 1, transition: 'background 0.3s', background: isUp && initialInvested > 0 ? '#00e676' : undefined, color: isUp && initialInvested > 0 ? '#000' : undefined }}
           disabled={initialInvested <= 0 || selling === assetId}
           onClick={() => onSell(assetId, currentVal)}
        >
           {selling === assetId ? 'Liquidating...' : (initialInvested <= 0 ? 'No Holdings to Sell' : `Execute Sell @ ₹${currentVal.toFixed(2)}`)}
        </button>
      </div>
    </div>
  );
}

export default function PortfolioPage({ showToast }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellingAsset, setSellingAsset] = useState(null);

  // Track live totals fed up from children charts
  const [liveTotals, setLiveTotals] = useState({});

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const res = await getPortfolio();
      setData(res);
      
      // Initialize live totals
      let init = {};
      res.portfolio.forEach(p => {
         init[p.id] = { currentVal: p.currentVal, invested: p.invested };
      });
      setLiveTotals(init);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleTick = (assetId, currentVal, invested) => {
     setLiveTotals(prev => ({
        ...prev,
        [assetId]: { currentVal, invested }
     }));
  };

  async function handleSell(assetId, currentVal) {
    if (!window.confirm(`Execute market sell for your total holding at ₹${currentVal.toFixed(2)}?`)) {
      return;
    }
    setSellingAsset(assetId);
    try {
      // Pass the exact ticked value frontend sees to the backend!
      const res = await sellAsset(assetId, currentVal.toFixed(2));
      showToast(res.message, 'success');
      fetchData(); // Refresh portfolio from DB completely to zero out
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSellingAsset(null);
    }
  }

  if (loading || !data) return (
    <div className="page" style={{ padding: '1.25rem' }}>
      <div className="skeleton" style={{ height: '300px' }} />
    </div>
  );

  const { portfolio, totalInvested } = data;

  // Calculate live global stats
  const totalLiveVal = Object.values(liveTotals).reduce((sum, item) => sum + item.currentVal, 0);
  const plDiff = totalLiveVal - totalInvested;
  const plPercent = totalInvested > 0 ? ((plDiff / totalInvested) * 100).toFixed(2) : 0;
  
  const totalValueFmt = new Intl.NumberFormat('en-IN').format(totalLiveVal.toFixed(2));
  const plDiffFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(plDiff));

  return (
    <div className="page" style={{ paddingBottom: '7rem', paddingTop: '1.25rem' }}>
      <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <span className="mi">arrow_back</span>
        </button>
        <h1 className="t-h2">Live Markets</h1>
      </div>

      <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Global Stats Board */}
        <div style={{
          background: 'linear-gradient(135deg, #0e0e14 0%, #1a1a24 100%)',
          borderRadius: 'var(--r-xl)', padding: '2rem 1.25rem 1.5rem', color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Subtle grid background for trading feel */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '15px 15px', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="t-label-sm" style={{ color: 'var(--muted)', letterSpacing: '1px' }}>GLOBAL PORTFOLIO</p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0' }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>₹</span>
              <span className="t-display" style={{ fontSize: '2.8rem', textShadow: '0px 0px 15px rgba(0,255,152,0.3)' }}>{totalValueFmt}</span>
            </div>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: '#1c2128', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: 'var(--r-full)', color: plDiff >= 0 ? '#00e676' : '#ff3b30', transition: 'all 0.3s' }}>
              <span className="mi mi-sm">{plDiff >= 0 ? 'trending_up' : 'trending_down'}</span>
              <span style={{ fontWeight: 600 }}>{plDiff >= 0 ? '+' : '-'}₹{plDiffFmt} ({plPercent}%)</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', marginTop: '1.5rem', textAlign: 'left' }}>
              <div>
                <p className="t-label-sm" style={{ color: 'var(--muted)' }}>CASH DEPOSITED</p>
                <p className="t-h3" style={{ fontSize: '1.1rem' }}>₹{new Intl.NumberFormat('en-IN').format(totalInvested.toFixed(2))}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ width: '8px', height: '8px', background: '#00e676', borderRadius: '50%', display: 'inline-block', marginRight:'6px', boxShadow: '0 0 8px #00e676' }}><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></div>
                 <span className="t-label-sm" style={{ color: '#00e676' }}>MARKETS OPEN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Market Streams */}
        <div>
          <h3 className="t-title" style={{ marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span className="mi mi-sm">query_stats</span> Live Trading Assets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {portfolio.map(p => (
               <LiveOlympChart 
                 key={p.id}
                 assetId={p.id}
                 name={p.name}
                 initialInvested={p.invested}
                 initialVal={p.currentVal}
                 onTick={handleTick}
                 onSell={handleSell}
                 selling={sellingAsset}
               />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
