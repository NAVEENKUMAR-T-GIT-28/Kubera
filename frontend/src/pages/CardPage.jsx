import { useState, useEffect } from 'react';
import { getCards, toggleCard, getDashboard } from '../api';

export default function CardPage({ showToast }) {
  const [cards, setCards] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState({});

  useEffect(() => { fetchCardsAndData(); }, []);

  async function fetchCardsAndData() {
    try {
      const [cardsRes, dashRes] = await Promise.all([
        getCards(),
        getDashboard()
      ]);
      setCards(cardsRes.cards || []);
      setDashboard(dashRes.dashboard);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleToggle(cardNumber) {
    try {
      const res = await toggleCard(cardNumber);
      showToast(res.message);
      fetchCardsAndData();
    } catch (err) { showToast(err.message, 'error'); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="t-h2">My Cards</h1>
        <span className="chip chip-primary">
          <span className="mi mi-sm">credit_card</span> Kubera
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 1.25rem' }}>
        {/* ── Round-offs Saved Card ── */}
        {!loading && dashboard && (
          <div className="card-earn shadow-float" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
             <div className="icon-container ic-earn" style={{ width: '3rem', height: '3rem', fontSize: '1.5rem' }}>
                <span className="mi mi-lg">savings</span>
             </div>
             <div style={{ flex: 1 }}>
                <p className="t-label-sm" style={{ color: 'var(--on-secondary-container)', opacity: 0.8 }}>TOTAL SAVED ITEMS (ROUND-OFFS)</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.125rem' }}>
                   <span className="amount-currency" style={{ color: 'var(--on-secondary-container)' }}>₹</span>
                   <span className="t-h2" style={{ color: 'var(--on-secondary-container)' }}>{dashboard.sparePool?.totalSpare || 0}</span>
                </div>
             </div>
          </div>
        )}

        {loading ? (
          <>
            <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--r-xl)' }} />
            <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--r-xl)' }} />
          </>
        ) : cards.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="mi" style={{ fontSize: '3rem', color: 'var(--outline)', display: 'block', marginBottom: '0.75rem' }}>credit_card_off</span>
            <p className="t-title" style={{ marginBottom: '0.25rem' }}>No cards yet</p>
            <p className="t-body-sm c-muted">Your virtual cards will appear here</p>
          </div>
        ) : cards.map(card => (
          <div key={card.cardNumber}>
            {/* ── Card Visual ── */}
            <div style={{
              background: card.status === 'active'
                ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 50%, #1a0080 100%)'
                : 'linear-gradient(135deg, #595c5e 0%, #2c2f31 100%)',
              borderRadius: 'var(--r-xl)',
              padding: '1.75rem',
              color: 'var(--on-primary)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: card.status === 'active'
                ? '0 16px 48px rgba(91,46,242,0.25)'
                : '0 8px 24px rgba(44,47,49,0.15)'
            }}>
              {/* Decorative orbs */}
              <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '20%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div>
                  <p className="t-label-sm" style={{ color: 'rgba(246,240,255,0.6)', marginBottom: '0.25rem' }}>
                    {card.cardType?.toUpperCase()} CARD
                  </p>
                  <p className="t-title" style={{ color: 'var(--on-primary)' }}>{card.cardName}</p>
                </div>
                <div style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 'var(--r-full)',
                  background: card.status === 'active' ? 'var(--secondary-container)' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem'
                }}>
                  <span className="mi" style={{ fontSize: '0.875rem', color: card.status === 'active' ? 'var(--secondary)' : 'rgba(255,255,255,0.7)' }}>
                    {card.status === 'active' ? 'check_circle' : 'block'}
                  </span>
                  <span className="t-label-sm" style={{ color: card.status === 'active' ? 'var(--on-secondary-container)' : 'rgba(255,255,255,0.7)', textTransform: 'capitalize', letterSpacing: '0.03em' }}>
                    {card.status}
                  </span>
                </div>
              </div>

              {/* Card number & chip */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* NFC chip */}
                <div style={{ width: '2.25rem', height: '1.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="mi" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>wifi</span>
                </div>

                <p className="t-mono" style={{ letterSpacing: '0.18em', fontSize: '1.125rem', color: 'var(--on-primary)', marginBottom: '1rem' }}>
                  {card.cardNumber}
                </p>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.5625rem', opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--on-primary)' }}>EXPIRES</p>
                    <p className="t-label" style={{ color: 'var(--on-primary)' }}>{card.expiry}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.5625rem', opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--on-primary)' }}>CVV</p>
                    <p className="t-label" style={{ color: 'var(--on-primary)' }}>•••</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span className="mi" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)' }}>credit_card</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card Controls ── */}
            <div className="card" style={{ marginTop: '0.75rem', border: 'none' }}>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { icon: 'contactless', label: 'Tap to Pay', val: card.status === 'active' ? 'Enabled' : 'Disabled' },
                  { icon: 'public', label: 'Online Use', val: 'Enabled' },
                  { icon: 'atm', label: 'ATM', val: 'Enabled' },
                ].map(s => (
                  <div key={s.label} className="stat-cell" style={{ textAlign: 'center' }}>
                    <span className="mi mi-md c-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>{s.icon}</span>
                    <p className="t-label-sm c-muted">{s.label}</p>
                    <p className="t-label" style={{ color: 'var(--on-surface)', marginTop: '0.125rem', textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>{s.val}</p>
                  </div>
                ))}
              </div>

              <button
                className={`btn ${card.status === 'active' ? 'btn-surface' : 'btn-primary'}`}
                onClick={() => handleToggle(card.cardNumber)}
                style={{ gap: '0.5rem' }}
              >
                <span className="mi mi-sm">{card.status === 'active' ? 'lock' : 'lock_open'}</span>
                {card.status === 'active' ? 'Block Card' : 'Unblock Card'}
              </button>
            </div>
          </div>
        ))}

        {/* ── Security Info ── */}
        <div className="card-tonal" style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <div className="icon-container ic-primary">
            <span className="mi mi-md">shield</span>
          </div>
          <div>
            <p className="t-label" style={{ color: 'var(--on-surface)', marginBottom: '0.125rem' }}>Kubera Security Shield</p>
            <p className="t-body-sm c-muted">Military-grade encryption on all card transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
