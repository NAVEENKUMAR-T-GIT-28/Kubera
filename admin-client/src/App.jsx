import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Activity, TrendingUp, Users, Wallet, PiggyBank,
  ShieldCheck, LayoutDashboard, ArrowUpRight, ArrowDownRight,
  DollarSign, BarChart3, Clock, CreditCard, Search
} from 'lucide-react';

const ASSET_COLORS = {
  gold: '#F7B731',
  etf: '#9c6cff',
  indexFund: '#00f098',
  debtFund: '#00BFFF'
};

const CATEGORY_COLORS = ['#9c6cff', '#00f098', '#F7B731', '#00BFFF', '#ff4d6d', '#facc15'];

// Custom tooltip for Recharts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(20, 15, 38, 0.95)', border: '1px solid rgba(163, 145, 255, 0.3)',
      borderRadius: '0.75rem', padding: '0.75rem 1rem', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
}

// --- Tab Navigation ---
function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard size={16} /> },
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
  ];
  return (
    <div className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────
function OverviewTab({ data, onSelectUserForTransactions }) {
  const { globalStats, systemHoldings, chartDailyVolume, categoryData, userAnalytics } = data;
  const [selectedUser, setSelectedUser] = useState('all');
  const [activeMetricDetail, setActiveMetricDetail] = useState(null);

  // Compute chart data based on selectedUser
  const displayChartData = React.useMemo(() => {
    if (selectedUser === 'all') {
      // Aggregate by date for system-wide view
      const grouped = {};
      chartDailyVolume.forEach(d => {
        if (!grouped[d.date]) {
          grouped[d.date] = { date: d.date, volume: 0, spare: 0, count: 0 };
        }
        grouped[d.date].volume += d.volume;
        grouped[d.date].spare += d.spare;
        grouped[d.date].count += d.count;
      });
      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      // Filter by selected user
      return chartDailyVolume.filter(d => d.accountNumber === selectedUser);
    }
  }, [chartDailyVolume, selectedUser]);

  const holdingsPie = [
    { name: 'Sovereign Gold', value: systemHoldings.gold, color: ASSET_COLORS.gold },
    { name: 'Nifty 50 ETF', value: systemHoldings.etf, color: ASSET_COLORS.etf },
    { name: 'Global Index', value: systemHoldings.indexFund, color: ASSET_COLORS.indexFund },
    { name: 'Govt Debt', value: systemHoldings.debtFund, color: ASSET_COLORS.debtFund },
  ].filter(d => d.value > 0);

  const totalHeld = holdingsPie.reduce((s, d) => s + d.value, 0);

  if (activeMetricDetail) {
    return <MetricDetailView metric={activeMetricDetail} data={data} onBack={() => setActiveMetricDetail(null)} onSelectUserForTransactions={onSelectUserForTransactions} />;
  }

  return (
    <>
      {/* Hero Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          icon={<DollarSign size={20} />}
          label="System Balance"
          value={`₹${globalStats.totalSystemBalance.toLocaleString('en-IN')}`}
          trend="Total across all accounts"
          trendDir="up"
          onClick={() => setActiveMetricDetail('balance')}
        />
        <MetricCard
          icon={<PiggyBank size={20} />}
          label="Spare Collected"
          value={`₹${globalStats.totalSpareEverCollected.toLocaleString('en-IN')}`}
          trend="Lifetime round-ups"
          trendDir="up"
          onClick={() => setActiveMetricDetail('spare')}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Total Invested"
          value={`₹${globalStats.totalInvested.toLocaleString('en-IN')}`}
          trend={`₹${globalStats.totalPending} pending`}
          trendDir="up"
          onClick={() => setActiveMetricDetail('invested')}
        />
        <MetricCard
          icon={<Activity size={20} />}
          label="Transactions"
          value={globalStats.totalTransactions}
          trend={`${globalStats.userCount} users · ${globalStats.merchantCount} merchants`}
          trendDir="neutral"
          onClick={() => setActiveMetricDetail('transactions')}
        />
      </div>

      {/* Charts Row */}
      <div className="chart-row">
        {/* Daily Volume Area Chart */}
        <div className="card chart-card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} /> Daily Transaction Volume
            </div>
            <select 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
              style={{ background: 'var(--surface-container-low)', color: 'var(--text-main)', border: '1px solid rgba(163,145,255,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', outline: 'none' }}
            >
              <option value="all" style={{ background: '#140f26', color: '#f6f0ff' }}>Total (All Users)</option>
              {userAnalytics.map(u => (
                <option key={u.accountNumber} value={u.accountNumber} style={{ background: '#140f26', color: '#f6f0ff' }}>{u.name}</option>
              ))}
            </select>
          </div>
          {displayChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9c6cff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#9c6cff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f098" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00f098" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,145,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#a391ff', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#a391ff', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="volume" name="Volume" stroke="#9c6cff" fill="url(#volGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="spare" name="Spare Collected" stroke="#00f098" fill="url(#spareGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No transaction data for this selection</div>
          )}
        </div>

        {/* Asset Distribution Pie */}
        <div className="card chart-card">
          <div className="card-title"><Wallet size={18} /> System-Wide Asset Holdings</div>
          {holdingsPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={holdingsPie}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {holdingsPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {holdingsPie.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, boxShadow: `0 0 6px ${d.color}66` }} />
                      <span style={{ fontSize: '0.85rem' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      ₹{d.value.toFixed(0)} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>({totalHeld > 0 ? ((d.value/totalHeld)*100).toFixed(1) : 0}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No investments yet</div>
          )}
        </div>
      </div>

      {/* Category Spending Bar Chart */}
      {categoryData.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-title"><Activity size={18} /> Spending By Category</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(163,145,255,0.08)" />
              <XAxis dataKey="category" tick={{ fill: '#a391ff', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#a391ff', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total" name="Total Spent" radius={[6, 6, 0, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}

// ─── TRANSACTIONS TAB ────────────────────────
function TransactionsTab({ transactions, initialSearch = '' }) {
  const [search, setSearch] = useState(initialSearch);
  const filtered = transactions.filter(t =>
    (t.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.from || '').includes(search) ||
    (t.to || '').includes(search)
  );

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CreditCard size={18} /> Transaction Ledger ({transactions.length})
        </div>
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search merchant or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>From</th>
              <th>To / Merchant</th>
              <th>Amount</th>
              <th>Round-Up</th>
              <th>Total Debited</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t._id}>
                  <td><span className="mono-text">{new Date(t.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></td>
                  <td className="mono-text">{t.from}</td>
                  <td>{t.merchant || t.to}</td>
                  <td style={{ fontWeight: 600 }}>₹{t.amount}</td>
                  <td style={{ color: t.roundUp > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {t.roundUp > 0 ? `+₹${t.roundUp}` : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--brand)' }}>₹{t.totalDebited}</td>
                  <td><span className="badge">{t.category || 'other'}</span></td>
                  <td><span className={`badge ${t.status === 'success' ? 'badge-success' : 'badge-warn'}`}>{t.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── USERS TAB ───────────────────────────────
function UsersTab({ users }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.accountNumber || '').includes(search)
  );

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={18} /> User Database & Portfolio Analytics ({users.length})
        </div>
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search user or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Balance</th>
              <th>Transactions</th>
              <th>Money Flow</th>
              <th>Spare Collected</th>
              <th>Invested</th>
              <th>Portfolio Value</th>
              <th>Return</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                      <div className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>A/C: {u.accountNumber}</div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{u.balance?.toLocaleString('en-IN')}</td>
                  <td>{u.txCount}</td>
                  <td>₹{u.totalDebited?.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--success)' }}>₹{u.spareCollected}</td>
                  <td style={{ color: 'var(--brand)', fontWeight: 600 }}>₹{u.invested}</td>
                  <td style={{ fontWeight: 700 }}>₹{u.currentPortfolioValue?.toLocaleString('en-IN')}</td>
                  <td style={{ color: u.mockReturn >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {u.mockReturn >= 0 ? '+' : ''}₹{u.mockReturn}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Metric Detail Drill-down Component ──────
function MetricDetailView({ metric, data, onBack, onSelectUserForTransactions }) {
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const filteredUsers = data.userAnalytics.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.accountNumber || '').includes(search)
  );

  let title = '';
  let columns = [];
  let renderRow = () => {};

  if (metric === 'balance') {
    title = 'System Balance Details';
    columns = ['User', 'Account Number', 'Balance', 'Total Transaction Volume'];
    renderRow = (u) => (
      <tr key={u._id}>
        <td><div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div></td>
        <td className="mono-text">{u.accountNumber}</td>
        <td style={{ fontWeight: 600 }}>₹{u.balance?.toLocaleString('en-IN')}</td>
        <td>₹{u.totalDebited?.toLocaleString('en-IN')}</td>
      </tr>
    );
  } else if (metric === 'spare') {
    title = 'Spare Collected Details';
    columns = ['User', 'Account Number', 'Spare Collected', 'Total Round-Up from Txns'];
    const { recentTransactions } = data;
    renderRow = (u) => {
      const isExpanded = expandedRows[u._id];
      const userTxns = recentTransactions.filter(t => t.from === u.name && t.roundUp > 0);
      return (
        <React.Fragment key={u._id}>
          <tr onClick={() => toggleExpand(u._id)} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(163, 145, 255, 0.1)' : 'transparent' }}>
            <td><div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.7em', color: 'var(--brand)' }}>{isExpanded ? '▼' : '▶'}</span> {u.name}
            </div></td>
            <td className="mono-text">{u.accountNumber}</td>
            <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{u.spareCollected?.toLocaleString('en-IN')}</td>
            <td>₹{u.totalRoundUp?.toLocaleString('en-IN')}</td>
          </tr>
          {isExpanded && (
            <tr>
              <td colSpan={4} style={{ padding: 0, borderBottom: '1px solid rgba(163,145,255,0.08)' }}>
                <div style={{ background: 'rgba(5, 1, 13, 0.4)', padding: '1rem' }}>
                  <h5 style={{ marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-muted)' }}>Round-up Transaction History</h5>
                  {userTxns.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'gray' }}>No recent round-up transactions.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr><th style={{ textAlign: 'left', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>Date</th><th style={{ textAlign: 'left', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>Merchant</th><th style={{ textAlign: 'left', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>Amount</th><th style={{ textAlign: 'left', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>Round-Up</th></tr>
                      </thead>
                      <tbody>
                        {userTxns.map(t => (
                          <tr key={t._id}>
                            <td style={{ padding: '0.4rem 0', color: 'var(--text-main)' }}>{new Date(t.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '0.4rem 0', color: 'var(--text-main)' }}>{t.merchant || t.to}</td>
                            <td style={{ padding: '0.4rem 0', color: 'var(--text-main)' }}>₹{t.amount}</td>
                            <td style={{ padding: '0.4rem 0', color: 'var(--success)', fontWeight: 600 }}>+₹{t.roundUp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    };
  } else if (metric === 'invested') {
    title = 'Total Invested Details';
    columns = ['User', 'Account Number', 'Invested', 'Pending', 'Current Portfolio Value', 'Return'];
    renderRow = (u) => {
      const isExpanded = expandedRows[u._id];
      const h = u.holdings || { gold: 0, etf: 0, indexFund: 0, debtFund: 0 };
      return (
        <React.Fragment key={u._id}>
          <tr onClick={() => toggleExpand(u._id)} style={{ cursor: 'pointer', background: isExpanded ? 'rgba(163, 145, 255, 0.1)' : 'transparent' }}>
            <td><div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.7em', color: 'var(--brand)' }}>{isExpanded ? '▼' : '▶'}</span> {u.name}
            </div></td>
            <td className="mono-text">{u.accountNumber}</td>
            <td style={{ color: 'var(--brand)', fontWeight: 600 }}>₹{u.invested?.toLocaleString('en-IN')}</td>
            <td style={{ color: 'var(--warning)' }}>₹{u.pending?.toLocaleString('en-IN')}</td>
            <td style={{ fontWeight: 700 }}>₹{u.currentPortfolioValue?.toLocaleString('en-IN')}</td>
            <td style={{ color: u.mockReturn >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {u.mockReturn >= 0 ? '+' : ''}₹{u.mockReturn}
            </td>
          </tr>
          {isExpanded && (
            <tr>
              <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid rgba(163,145,255,0.08)' }}>
                <div style={{ background: 'rgba(5, 1, 13, 0.4)', padding: '1rem' }}>
                  <h5 style={{ marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-muted)' }}>Portfolio Holding Breakdown</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(20,15,38,0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(247, 183, 49, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#F7B731', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 600 }}>Sovereign Gold</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{h.gold?.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: 'rgba(20,15,38,0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(156, 108, 255, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#9c6cff', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 600 }}>Nifty 50 ETF</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{h.etf?.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: 'rgba(20,15,38,0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0, 240, 152, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#00f098', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 600 }}>Global Index</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{h.indexFund?.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: 'rgba(20,15,38,0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(0, 191, 255, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: '#00BFFF', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 600 }}>Govt Debt Fund</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{h.debtFund?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    };
  } else if (metric === 'transactions') {
    title = 'Transactions Details (Click User to view Ledger)';
    columns = ['User', 'Account Number', 'Transaction Count', 'Total Debited'];
    renderRow = (u) => (
      <tr key={u._id} onClick={() => onSelectUserForTransactions(u.name)} style={{ cursor: 'pointer' }} title={`View transactions for ${u.name}`}>
        <td><div style={{ fontWeight: 600, color: 'var(--brand)' }}>{u.name} <ArrowUpRight size={12} style={{ marginLeft: '4px', opacity: 0.7 }} /></div></td>
        <td className="mono-text">{u.accountNumber}</td>
        <td style={{ fontWeight: 600 }}>{u.txCount}</td>
        <td>₹{u.totalDebited?.toLocaleString('en-IN')}</td>
      </tr>
    );
  }

  return (
    <div className="card drill-down-card">
      <div className="card-title" style={{ justifyContent: 'space-between', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(163,145,255,0.3)', color: 'var(--text-main)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            ← Back
          </button>
          <span style={{ fontSize: '0.9rem', color: '#fff', marginLeft: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</span>
        </div>
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search username or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
            ) : (
              filteredUsers.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Metric Card Component ───────────────────
function MetricCard({ icon, label, value, trend, trendDir, onClick }) {
  return (
    <div className="card metric-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="metric-icon">{icon}</div>
      <div className="card-title" style={{ marginBottom: '0.75rem' }}>{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-trend ${trendDir === 'up' ? 'up' : trendDir === 'down' ? 'down' : ''}`}>
        {trendDir === 'up' && <ArrowUpRight size={14} />}
        {trendDir === 'down' && <ArrowDownRight size={14} />}
        {trendDir === 'neutral' && <ShieldCheck size={14} />}
        {trend}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────
function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [txnSearchPrefix, setTxnSearchPrefix] = useState('');

  const navigateToTransactionsForUser = (userName) => {
    setTxnSearchPrefix(userName);
    setActiveTab('transactions');
  };

  useEffect(() => {
    fetch('/api/admin/deep-analytics')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="loading-screen">Loading Kubera Sovereign Intelligence...</div>;
  }

  return (
    <div className="admin-container">
      <div className="header">
        <div>
          <h1>Kubera Banking Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Full-access banking intelligence & analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="live-badge">
            <span className="live-dot" /> LIVE
          </div>
          <button className="btn-premium">
            <LayoutDashboard size={18} /> Export Report
          </button>
        </div>
      </div>

      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab data={data} onSelectUserForTransactions={navigateToTransactionsForUser} />}
      {activeTab === 'transactions' && <TransactionsTab transactions={data.recentTransactions} initialSearch={txnSearchPrefix} />}
      {activeTab === 'users' && <UsersTab users={data.userAnalytics} />}
    </div>
  );
}

export default App;
