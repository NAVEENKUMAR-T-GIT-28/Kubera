import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContacts, lookupAccount, paymentPreview, paymentPay } from '../api';

export default function PayPage({ showToast }) {
  const [step, setStep] = useState('SELECT'); // SELECT | AMOUNT | ROUNDUP | PIN | SUCCESS
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [activeRoundUp, setActiveRoundUp] = useState(null);
  const [roundUpOptions, setRoundUpOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchContacts(); }, []);

  const scannerRef = useRef(null);
  const initRef = useRef(false);

  // Initialize QR Scanner when showScanner toggles
  useEffect(() => {
    if (showScanner && step === 'SELECT' && !initRef.current) {
      initRef.current = true;
      const html5QrCode = new window.Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch((err) => {
          console.error("Camera start failed:", err);
          showToast("Camera access denied or unavailable", "error");
          setShowScanner(false);
          initRef.current = false;
          scannerRef.current = null;
        });
    }

    return () => {
      if ((!showScanner || step !== 'SELECT') && scannerRef.current) {
        const scanner = scannerRef.current;
        initRef.current = false;
        scannerRef.current = null;
        if (scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(e => console.error(e));
        } else {
          scanner.clear();
        }
      }
    };
  }, [showScanner, step]);

  async function fetchContacts() {
    try {
      const res = await getContacts();
      setContacts(res.contacts || []);
    } catch {}
  }

  async function handleSearch(queryOverride) {
    const q = (typeof queryOverride === 'string' ? queryOverride : search).trim();
    if (!q) return;
    try {
      const res = await lookupAccount(q);
      if (res.account) { select(res.account); }
    } catch { showToast('Account not found', 'error'); }
  }

  function onScanSuccess(decodedText) {
    let extracted = decodedText;
    try {
      const data = JSON.parse(decodedText);
      if (data.app === 'kubera' || data.accountNumber) {
        extracted = data.accountNumber || data.phone || data.id;
      }
    } catch (e) {
      const phoneMatch = decodedText.match(/\b\d{10}\b/);
      if (phoneMatch) {
         extracted = phoneMatch[0];
      } else {
         extracted = decodedText; 
      }
    }
    setShowScanner(false);
    setSearch(extracted);
    handleSearch(extracted);
  }

  function onScanFailure(error) { }

  function select(c) { setSelected(c); setStep('AMOUNT'); setShowScanner(false); }

  async function handleAmountNext() {
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    setLoading(true);
    try {
      const amt = Number(amount);
      const res = await paymentPreview(amt, selected.accountNumber);
      setPreview(res.preview);
      
      const defSpare = res.preview.roundUpAmount;
      const opts = [{ label: '+₹' + defSpare, val: defSpare, type: 'default', badge: 'Smart' }];
      
      if (amt % 50 !== 0) {
        const next50 = Math.ceil(amt / 50) * 50;
        if (next50 - amt > defSpare) opts.push({ label: '+₹' + (next50 - amt), val: next50 - amt, type: 'extra', badge: 'Boost' });
      }
      if (amt % 100 !== 0) {
        const next100 = Math.ceil(amt / 100) * 100;
        if (next100 - amt > defSpare && !opts.find(o => o.val === next100 - amt)) {
          opts.push({ label: '+₹' + (next100 - amt), val: next100 - amt, type: 'extra', badge: 'Max' });
        }
      }
      opts.push({ label: 'Opt-Out', val: 0, type: 'none' });
      
      setRoundUpOptions(opts);
      setActiveRoundUp(defSpare);
      setStep('ROUNDUP');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  async function handlePay() {
    if (pin.length !== 4) return showToast('Enter 4-digit PIN', 'error');
    setLoading(true);
    try {
      const res = await paymentPay(selected.accountNumber, Number(amount), pin, 'other', '', activeRoundUp);
      setResult(res);
      setStep('SUCCESS');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  function pinKey(k) {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin(p => p + k);
  }

  // ── SELECT ────────────────────────────────────────
  if (step === 'SELECT') return (
    <div style={{ minHeight:'100dvh', background:'var(--surface)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg, var(--primary), var(--primary-dim))',
        padding:'3rem 1.25rem 2rem', position:'relative', overflow:'hidden'
      }}>
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'160px', height:'160px', background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'0.25rem', color:'rgba(246,240,255,0.75)', marginBottom:'1.25rem', fontSize:'0.875rem', fontWeight:600, fontFamily:'var(--font-display)' }}>
          <span className="mi mi-sm">arrow_back</span> Back
        </button>
        <h1 className="t-h2 c-on-primary">Royal Pay</h1>
        <p style={{ color:'rgba(246,240,255,0.7)', fontSize:'0.875rem', marginTop:'0.25rem' }}>Scan any UPI QR to experience kubera transactions</p>
      </div>

      <div style={{ flex:1, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        
        {/* Real-time Camera Scanner UI */}
        {showScanner ? (
          <div>
             <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'0.75rem' }}>Scan QR Code</h3>
             <div id="qr-reader" style={{ width: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}></div>
             <button className="btn btn-surface" onClick={() => setShowScanner(false)} style={{ marginTop: '1rem' }}>
               Cancel Scan
             </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowScanner(true)} style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="mi mi-md">qr_code_scanner</span> Scan with Camera
          </button>
        )}

        {/* Search */}
        {!showScanner && (
          <div style={{ display:'flex', gap:'0.625rem' }}>
            <div style={{ flex:1, position:'relative' }}>
              <span className="mi" style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'var(--outline)', fontSize:'1.25rem' }}>search</span>
              <input className="input" placeholder="Phone or account number" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ paddingLeft:'3rem' }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleSearch()}>Find</button>
          </div>
        )}

        {/* Recent People */}
        {!showScanner && (
          <div>
            <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'0.75rem', marginTop:'0.5rem' }}>Recent People</h3>
            <div style={{ display:'flex', gap:'1rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
              {contacts.map((c, i) => (
                <button key={i} onClick={() => select(c)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem', flexShrink:0 }}>
                  <div style={{
                    width:'3.25rem', height:'3.25rem', borderRadius:'50%',
                    background:'linear-gradient(135deg, var(--primary-container), rgba(163,145,255,0.4))',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem',
                    boxShadow:'0 4px 12px rgba(91,46,242,0.15)'
                  }}>
                    {c.avatar || '🏪'}
                  </div>
                  <span className="t-label-sm c-muted" style={{ maxWidth:'3.75rem', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.name?.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Merchants list */}
        {!showScanner && (
          <div>
            <h3 className="t-label c-muted" style={{ letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'0.75rem' }}>All Merchants</h3>
            <div className="card">
              {contacts.map((c, i) => (
                <button key={i} className="txn-row" style={{ width:'100%', background:'none', cursor:'pointer', textAlign:'left' }} onClick={() => select(c)}>
                  <div className="icon-container ic-primary" style={{ fontSize:'1.25rem' }}>{c.avatar || '🏪'}</div>
                  <div style={{ flex:1 }}>
                    <div className="txn-name">{c.name}</div>
                    <div className="txn-sub">{c.phone} · {c.role}</div>
                  </div>
                  <span className="mi mi-sm c-muted">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── AMOUNT ────────────────────────────────────────
  if (step === 'AMOUNT') return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--surface)' }}>
      <div className="page-header">
        <button onClick={() => setStep('SELECT')} className="btn-icon ic-surface"><span className="mi mi-md">arrow_back</span></button>
        <span className="t-title">Enter Amount</span>
        <div style={{ width:'2.75rem' }} />
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'0 1.25rem' }}>
        {/* Recipient pill */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', background:'var(--surface-container-lowest)', borderRadius:'var(--r-full)', padding:'0.75rem 1.25rem', width:'100%', marginBottom:'2.5rem', boxShadow:'0 2px 8px rgba(44,47,49,0.06)' }}>
          <div style={{ width:'2.5rem', height:'2.5rem', borderRadius:'50%', background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem' }}>
            {selected?.avatar || '👤'}
          </div>
          <div>
            <p className="t-label" style={{ color:'var(--on-surface)' }}>{selected?.name}</p>
            <p className="t-label-sm c-muted">A/C {selected?.accountNumber}</p>
          </div>
        </div>

        {/* Amount display */}
        <p className="t-label-sm c-muted" style={{ marginBottom:'0.5rem' }}>PAYING TO: {selected?.name?.toUpperCase()}</p>
        <div style={{ display:'flex', alignItems:'baseline', gap:'0.25rem', marginBottom:'2rem' }}>
          <span className="amount-currency c-muted">₹</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            autoFocus
            style={{
              background:'none', border:'none', outline:'none',
              fontFamily:'var(--font-display)', fontSize:'3.5rem', fontWeight:800,
              color:'var(--on-surface)', width:'200px', textAlign:'center', letterSpacing:'-0.02em'
            }}
          />
        </div>

        {/* Quick amounts */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2.5rem', flexWrap:'wrap', justifyContent:'center' }}>
          {[50, 100, 200, 500, 1000, 2000].map(a => (
            <button key={a} className="chip chip-primary" style={{ cursor:'pointer', fontSize:'0.75rem' }} onClick={() => setAmount(String(a))}>₹{a}</button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleAmountNext} disabled={loading || !amount} style={{ maxWidth:'340px' }}>
          {loading ? <><span className="mi mi-sm">hourglass_empty</span> Calculating…</> : <>Continue <span className="mi mi-sm">arrow_forward</span></>}
        </button>
      </div>
    </div>
  );

  // ── ROUNDUP ────────────────────────────────────────
  if (step === 'ROUNDUP') return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--surface)' }}>
      <div className="page-header">
        <button onClick={() => setStep('AMOUNT')} className="btn-icon ic-surface"><span className="mi mi-md">arrow_back</span></button>
        <span className="t-title">Payment Summary</span>
        <div style={{ width:'2.75rem' }} />
      </div>

      <div style={{ flex:1, padding:'0 1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        {/* Paying To */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', background:'var(--surface-container-lowest)', borderRadius:'var(--r-xl)', padding:'1.25rem', boxShadow:'0 4px 16px rgba(44,47,49,0.06)' }}>
          <div style={{ width:'3rem', height:'3rem', borderRadius:'50%', background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.375rem' }}>
            {selected?.avatar || '👤'}
          </div>
          <div>
            <p className="t-label-sm c-muted">PAYING TO</p>
            <p className="t-title">{selected?.name}</p>
            <p className="t-label-sm c-muted">{selected?.phone}</p>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <span className="t-body c-muted">Payment Amount</span>
            <span className="t-h3">₹{preview?.amount}</span>
          </div>

          {/* ⭐ Smart Round-off Choices */}
          {roundUpOptions.length > 0 && (
            <div style={{
              background: activeRoundUp === 0 ? 'var(--surface-container)' : 'linear-gradient(135deg, var(--secondary-container) 0%, rgba(144,247,194,0.5) 100%)',
              borderRadius:'var(--r-xl)', padding:'1.25rem', marginBottom:'1rem', position:'relative', overflow:'hidden',
              transition: 'all 0.3s ease',
              opacity: activeRoundUp === 0 ? 0.6 : 1
            }}>
              <div style={{ position:'absolute', right:'-10px', top:'-10px', fontSize:'4rem', opacity:0.15 }}>{activeRoundUp === 0 ? '🚫' : '🏆'}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '1rem', position:'relative', zIndex: 1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.375rem' }}>
                    <span className="mi mi-sm" style={{ color: activeRoundUp === 0 ? 'var(--muted)' : 'var(--secondary)' }}>auto_awesome</span>
                    <span className="t-label c-muted" style={{ color: activeRoundUp === 0 ? 'var(--muted)' : 'var(--on-secondary-container)' }}>SMART ROUND-OFF</span>
                  </div>
                  <p className="t-h3" style={{ color: activeRoundUp === 0 ? 'var(--muted)' : 'var(--on-secondary-container)', textDecoration: activeRoundUp === 0 ? 'line-through' : 'none' }}>
                    +₹{activeRoundUp}
                  </p>
                  <p className="t-body-sm" style={{ color: activeRoundUp === 0 ? 'var(--muted)' : 'var(--secondary)', marginTop:'0.25rem' }}>
                    {activeRoundUp === 0 ? 'Round-off skipped for this transaction.' : `The round-off amount of ₹${activeRoundUp}.00 will be instantly directed to your Royal Gold Reserve portfolio.`}
                  </p>
                </div>
              </div>
              
              {/* Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                {roundUpOptions.map((opt, i) => (
                  <button key={i} onClick={() => setActiveRoundUp(opt.val)} style={{
                    background: activeRoundUp === opt.val ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                    color: activeRoundUp === opt.val ? 'var(--on-primary)' : 'var(--on-surface)',
                    border: 'none', padding: '0.5rem 0.75rem', borderRadius: 'var(--r-md)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '4.5rem', flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.875rem'
                  }}>
                    <span>{opt.label}</span>
                    {opt.badge && <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{opt.badge}</span>}
                  </button>
                ))}
              </div>

              {activeRoundUp > 0 && (
                <div style={{ marginTop:'0.75rem', background:'rgba(0,105,69,0.1)', borderRadius:'var(--r-lg)', padding:'0.5rem 0.75rem', position:'relative', zIndex: 1 }}>
                  <p className="t-label-sm" style={{ color:'var(--secondary)' }}>
                    <span className="mi mi-sm">lock</span> Authenticated via Biometric ID · Royal Account ✱✱✱✱{preview?.accountNumber || '9801'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px dashed var(--surface-container)', paddingTop:'1rem' }}>
            <span className="t-title">Total Debit</span>
            <span className="t-h2 c-primary">₹{preview?.amount + activeRoundUp}</span>
          </div>
        </div>

        {(!preview?.sufficientBalance && activeRoundUp > 0 && preview?.amount <= preview?.currentBalance) && (
           <div style={{ background:'var(--error-container)', borderRadius:'var(--r-lg)', padding:'1rem', display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'1rem' }}>
              <span className="mi mi-md" style={{ color:'var(--on-error)' }}>info</span>
              <p className="t-body-sm" style={{ color:'var(--on-error)' }}>You have enough for the payment, but not the round-up. Please Opt-Out to proceed.</p>
           </div>
        )}

        {(!preview?.sufficientBalance && (activeRoundUp === 0 || preview?.amount > preview?.currentBalance)) && (
          <div style={{ background:'var(--error-container)', borderRadius:'var(--r-lg)', padding:'1rem', display:'flex', gap:'0.5rem', alignItems:'center', marginBottom:'1rem' }}>
            <span className="mi mi-md" style={{ color:'var(--on-error)' }}>warning</span>
            <p className="t-body-sm" style={{ color:'var(--on-error)' }}>Insufficient balance (₹{preview?.currentBalance} available)</p>
          </div>
        )}

        <button className="btn btn-primary" onClick={() => setStep('PIN')} disabled={!(preview?.amount + activeRoundUp <= preview?.currentBalance)} style={{ marginTop:'auto', marginBottom:'1.25rem' }}>
          <span className="mi mi-sm">lock</span> Enter PIN to Authorise
        </button>
      </div>
    </div>
  );

  // ── PIN ───────────────────────────────────────────
  if (step === 'PIN') return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.25rem', background:'var(--surface)' }}>
      <div style={{ width:'4.5rem', height:'4.5rem', borderRadius:'50%', background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
        <span className="mi mi-xl c-primary">lock</span>
      </div>
      <h2 className="t-h2" style={{ marginBottom:'0.25rem' }}>Enter Royal PIN</h2>
      <p className="t-body-sm c-muted">Authorising ₹{preview?.amount + activeRoundUp} to {selected?.name}</p>

      <div className="pin-dots" style={{ gap:'1.25rem' }}>
        {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${i < pin.length ? 'active' : ''}`} />)}
      </div>

      <div className="pin-grid" style={{ width:'100%' }}>
        {[1,2,3,4,5,6,7,8,9,null,0,'del'].map((k, i) =>
          k === null ? <div key={i} /> :
          <button key={i} className="pin-key" onClick={() => pinKey(String(k))}>
            {k === 'del' ? <span className="mi mi-md">backspace</span> : k}
          </button>
        )}
      </div>

      <button className="btn btn-primary" onClick={handlePay} disabled={pin.length !== 4 || loading} style={{ marginTop:'1.5rem', maxWidth:'300px' }}>
        {loading ? <><span className="mi mi-sm">hourglass_empty</span> Processing…</> : <><span className="mi mi-sm">verified</span> Confirm Payment</>}
      </button>
      <button className="t-label c-muted" style={{ marginTop:'1rem' }} onClick={() => { setPin(''); setStep('ROUNDUP'); }}>Cancel</button>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────
  if (step === 'SUCCESS') return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.25rem', background:'var(--surface)', gap:'1rem' }}>
      <div className="success-ring">
        <span className="mi" style={{ fontSize:'2.5rem', color:'var(--secondary)' }}>check_circle</span>
      </div>

      <div style={{ textAlign:'center' }}>
        <h2 className="t-h2" style={{ marginBottom:'0.25rem' }}>Payment Authorised</h2>
        <p className="t-body c-muted">₹{result?.transaction?.amount} sent to {result?.transaction?.to}</p>
      </div>

      {result?.roundUp > 0 && (
        <div className="card-earn" style={{ width:'100%', textAlign:'center' }}>
          <span className="mi mi-lg" style={{ color:'var(--secondary)', display:'block', marginBottom:'0.5rem' }}>savings</span>
          <p className="t-label-sm" style={{ color:'var(--on-secondary-container)', marginBottom:'0.25rem' }}>ROUND-OFF TO GOLD RESERVE</p>
          <p className="t-h2" style={{ color:'var(--on-secondary-container)' }}>+₹{result.roundUp}</p>
          <p className="t-body-sm c-muted" style={{ marginTop:'0.25rem' }}>Rounded to ₹{result.roundedTo}</p>
          {result.investmentTriggered && (
            <div style={{ marginTop:'0.75rem' }}>
              <span className="chip chip-earn">🎉 Auto-invested ₹{result.investmentAmount}!</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', gap:'0.75rem', width:'100%' }}>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ flex:1 }}>
          <span className="mi mi-sm">home</span> Home
        </button>
        <button className="btn btn-surface" onClick={() => { setStep('SELECT'); setAmount(''); setPin(''); setSelected(null); setPreview(null); setResult(null); setShowScanner(false); }} style={{ flex:1 }}>
          New Payment
        </button>
      </div>
    </div>
  );
}
