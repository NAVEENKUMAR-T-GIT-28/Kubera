import { useLocation, useNavigate } from 'react-router-dom';

const LEFT_TABS = [
  { path: '/',        icon: 'home',        label: 'Home' },
  { path: '/invest',   icon: 'trending_up',  label: 'Invest' },
];
const RIGHT_TABS = [
  { path: '/history', icon: 'history',     label: 'History' },
  { path: '/settings', icon: 'settings',     label: 'Settings' },
  
];

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <nav className="bottom-nav">
      {LEFT_TABS.map(tab => {
        const active = loc.pathname === tab.path;
        return (
          <button key={tab.path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => nav(tab.path)}>
            <div className="nav-pill">
              <span className="mi mi-md">{tab.icon}</span>
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Centre FAB — QR Scanner (exact Stitch nav icon: qr_code_scanner) */}
      <button className="nav-scan" onClick={() => nav('/pay')}>
        <div className="fab" style={{ cursor: 'pointer' }}>
          <span className="mi" style={{ fontSize: '1.5rem' }}>qr_code_scanner</span>
        </div>
        <span style={{
          color: 'var(--on-surface-variant)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.02em'
        }}>Scanner</span>
      </button>

      {RIGHT_TABS.map(tab => {
        const active = loc.pathname === tab.path;
        return (
          <button key={tab.path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => nav(tab.path)}>
            <div className="nav-pill">
              <span className="mi mi-md">{tab.icon}</span>
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
