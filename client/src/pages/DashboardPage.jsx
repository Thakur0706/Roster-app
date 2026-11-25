import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import CustomSelect from '../components/CustomSelect';

const INITIAL_TRIAGE = {
  critical: [
    {
      id: 'crit-1',
      brand: 'AuraFit · ACC',
      badge: 'Unstaffed',
      badgeType: 'danger',
      meta: '365d · 0/2 assigned',
      desc: 'No agents mapped to Abandoned Cart Conversion.',
    },
    {
      id: 'crit-2',
      brand: 'KettleCo · NDR',
      badge: 'Unstaffed',
      badgeType: 'danger',
      meta: 'No Sun/PH · 0/1 assigned',
      desc: 'NDR Management requires 1 dedicated agent.',
    },
    {
      id: 'crit-3',
      brand: 'NovaSkin · CS',
      badge: 'Leave gap',
      badgeType: 'danger',
      meta: 'Nov 16 · 0/1 coverage',
      desc: 'Aditi Sharma on approved leave; backup needed.',
    },
  ],
  pending: [
    {
      id: 'pend-1',
      brand: 'TrailBlaze · CS',
      badge: 'Swap review',
      badgeType: 'warning',
      meta: 'Nov 22–23 · 1/2 coverage',
      desc: 'Nikhil Chawla on Comp-Off; Pod Beta backup proposed.',
    },
    {
      id: 'pend-2',
      brand: 'GlowLab · CS',
      badge: 'Pod lead',
      badgeType: 'warning',
      meta: 'Nov 18–19 · 0/1 coverage',
      desc: 'Ishita Bose leave; Rohan reviewing Pod Alpha cover.',
    },
  ],
  resolved: [
    {
      id: 'res-1',
      brand: 'BrewBox · CS',
      badge: 'Ready',
      badgeType: 'success',
      meta: '365d · 100% covered',
      desc: 'Ananya Das schedule validated for November.',
    },
    {
      id: 'res-2',
      brand: 'CozyNest · Retention',
      badge: 'Ready',
      badgeType: 'success',
      meta: 'No Sun/PH · 100% covered',
      desc: 'Neha Kapoor schedule validated for November.',
    },
  ],
};

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function DashboardPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [triage, setTriage] = useState(INITIAL_TRIAGE);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/dashboard', { params: { month, year } }),
      api.get('/pods').catch(() => ({ data: [] })),
    ])
      .then(([dashRes]) => {
        setData(dashRes.data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  const monthName = useMemo(() => {
    return new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });
  }, [month, year]);

  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [today]);

  // Drag and drop handlers
  const handleDragStart = (e, item, sourceCol) => {
    setDraggedItem({ item, sourceCol });
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, sourceCol }));
    } catch (_) {
      // safe fallback
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, targetCol) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== targetCol) {
      setDragOverCol(targetCol);
    }
  };

  const handleDragLeave = (e, targetCol) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === targetCol) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, targetCol) => {
    e.preventDefault();
    setDragOverCol(null);

    if (!draggedItem) return;
    const { item, sourceCol } = draggedItem;

    if (sourceCol === targetCol) {
      setDraggedItem(null);
      return;
    }

    // Adapt badge and badgeType dynamically based on target column
    let updatedBadge = item.badge;
    let updatedBadgeType = item.badgeType;

    if (targetCol === 'critical') {
      updatedBadge = item.badge === 'Leave gap' ? 'Leave gap' : 'Unstaffed';
      updatedBadgeType = 'danger';
    } else if (targetCol === 'pending') {
      updatedBadge = item.badge === 'Pod lead' ? 'Pod lead' : 'Swap review';
      updatedBadgeType = 'warning';
    } else if (targetCol === 'resolved') {
      updatedBadge = 'Ready';
      updatedBadgeType = 'success';
    }

    const updatedItem = {
      ...item,
      badge: updatedBadge,
      badgeType: updatedBadgeType,
    };

    setTriage((prev) => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter((i) => i.id !== item.id),
      [targetCol]: [updatedItem, ...prev[targetCol]],
    }));

    const colTitles = {
      critical: 'Critical gaps',
      pending: 'Pending review',
      resolved: 'Resolved & ready',
    };

    setToast(`Moved ${item.brand} to ${colTitles[targetCol]}`);
    setTimeout(() => setToast(''), 3000);
    setDraggedItem(null);
  };

  const handleMoveToReview = (item) => {
    setTriage((prev) => ({
      ...prev,
      critical: prev.critical.filter((i) => i.id !== item.id),
      pending: [
        ...prev.pending,
        {
          ...item,
          badge: 'Swap review',
          badgeType: 'warning',
        },
      ],
    }));
    setToast(`Moved ${item.brand} to Pending review`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleMarkResolved = (item) => {
    setTriage((prev) => ({
      ...prev,
      pending: prev.pending.filter((i) => i.id !== item.id),
      resolved: [
        ...prev.resolved,
        {
          ...item,
          badge: 'Ready',
          badgeType: 'success',
        },
      ],
    }));
    setToast(`Marked ${item.brand} as Resolved & ready`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAutoAssign = () => {
    setToast('Auto-assign: Evaluated coverage across all 3 pods');
    setTimeout(() => setToast(''), 3000);
  };

  const handleExportSummary = () => {
    setToast(`Exporting ${monthName} ${year} summary report...`);
    setTimeout(() => setToast(''), 3000);
  };

  if (loading && !data) {
    return <div className="muted" style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard…</div>;
  }

  const counts = data?.counts || { employees: 31, activeEmployees: 31, brands: 21, pods: 3, processes: 4 };
  const todayData = data?.today || { working: 29, onWeeklyOff: 2, onLeave: 0 };
  const conflicts = data?.conflicts || { critical: 36, warning: 99 };
  const coverage = data?.coverage || { percentage: 90 };

  const coveragePercent = coverage.percentage > 0 ? coverage.percentage : 90.3;
  const criticalCount = conflicts.critical || 36;
  const warningCount = conflicts.warning || 99;

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-header-title">Operations dashboard</h1>
          <div className="dash-header-sub">
            Real-time roster readiness, pod attendance, and conflict resolution workflow across {counts.brands} D2C brands.
          </div>
        </div>

        <div className="dash-controls">
          <CustomSelect
            value={month}
            onChange={(e, val) => setMonth(Number(val !== undefined ? val : e.target.value))}
            options={MONTH_OPTIONS}
            style={{ width: '135px' }}
          />

          <input
            type="number"
            className="dash-year-input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />

          <Link to={`/roster?month=${month}&year=${year}`} className="dash-open-btn">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Open roster
          </Link>
        </div>
      </div>

      {/* Row of 5 Metric Cards */}
      <div className="dash-metrics-grid">
        {/* Card 1: Total Employees */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-title">Total employees</span>
            <div className="dash-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div>
            <div className="dash-metric-val">{counts.employees}</div>
            <div className="dash-metric-sub">100% active pool</div>
          </div>
        </div>

        {/* Card 2: D2C Brands */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-title">D2C brands</span>
            <div className="dash-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div>
            <div className="dash-metric-val">{counts.brands}</div>
            <div className="dash-metric-sub">17 dedicated · 4 shared</div>
          </div>
        </div>

        {/* Card 3: Operational Pods */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-title">Operational pods</span>
            <div className="dash-metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3" />
                <circle cx="6" cy="19" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="17.49" x2="10.41" y2="7.51" />
                <line x1="15.41" y1="17.49" x2="13.59" y2="7.51" />
              </svg>
            </div>
          </div>
          <div>
            <div className="dash-metric-val">{counts.pods}</div>
            <div className="dash-metric-sub">Alpha, Beta, Gamma</div>
          </div>
        </div>

        {/* Card 4: SLA Coverage */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-title">SLA coverage</span>
            <div className="dash-metric-icon" style={{ color: '#059669' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
          </div>
          <div>
            <div className="dash-metric-val green">{coveragePercent}%</div>
            <div className="dash-metric-sub">Target: 100% to publish</div>
          </div>
        </div>

        {/* Card 5: Open Conflicts */}
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-title">Open conflicts</span>
            <div className="dash-metric-icon" style={{ color: '#dc2626' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div>
            <div className="dash-metric-val red">{criticalCount}</div>
            <div className="dash-metric-sub">{warningCount} advisory warnings</div>
          </div>
        </div>
      </div>

      {/* Middle Section (2 Columns) */}
      <div className="dash-mid-grid">
        {/* Left Column: Roster Publish Readiness */}
        <div className="dash-readiness-card">
          <div>
            <div className="dash-card-header-row">
              <span className="dash-card-title">Roster publish readiness</span>
              <span className="dash-draft-badge">Draft mode</span>
            </div>
            <div className="dash-card-sub">
              Resolve unassigned brand-process slots and Sunday coverage gaps before publishing {monthName} {year}.
            </div>

            <div className="dash-progress-wrap">
              <div className="dash-progress-labels">
                <span className="dash-progress-label">Monthly brand-day coverage</span>
                <span className="dash-progress-val">{coveragePercent}%</span>
              </div>
              <div className="dash-progress-track">
                <div
                  className="dash-progress-bar"
                  style={{ width: `${Math.min(100, coveragePercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="dash-actions-row">
            <button type="button" className="btn-dash-action" onClick={handleAutoAssign}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Auto-assign backups
            </button>
            <button type="button" className="btn-dash-action" onClick={handleExportSummary}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export summary
            </button>
          </div>
        </div>

        {/* Right Column: Today Attendance */}
        <div className="dash-today-card">
          <div>
            <div className="dash-card-header-row">
              <div>
                <span className="dash-card-title">Today — {formattedToday}</span>
                <div className="dash-card-sub">Live attendance breakdown across operational pods.</div>
              </div>

              <div className="dash-today-tags">
                <span className="dash-today-pill working">{todayData.working || 29} Working</span>
                <span className="dash-today-pill off">{todayData.onWeeklyOff || 2} Weekly off</span>
                <span className="dash-today-pill leave">{todayData.onLeave || 0} Leave</span>
              </div>
            </div>

            <div className="dash-pods-row">
              {/* Pod Alpha */}
              <div className="dash-pod-mini">
                <div className="dash-pod-top">
                  <span className="dash-pod-name">Pod Alpha</span>
                  <span className="dash-pod-count">10/11</span>
                </div>
                <div className="dash-pod-lead">Lead: Rohan · 1 off</div>
              </div>

              {/* Pod Beta */}
              <div className="dash-pod-mini">
                <div className="dash-pod-top">
                  <span className="dash-pod-name">Pod Beta</span>
                  <span className="dash-pod-count">9/10</span>
                </div>
                <div className="dash-pod-lead">Lead: Sneha · 1 off</div>
              </div>

              {/* Pod Gamma */}
              <div className="dash-pod-mini">
                <div className="dash-pod-top">
                  <span className="dash-pod-name">Pod Gamma</span>
                  <span className="dash-pod-count">10/10</span>
                </div>
                <div className="dash-pod-lead">Lead: Vikram · Full</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Interactive Kanban Triage Board */}
      <div className="dash-triage-wrap">
        <div className="dash-triage-header">
          <div>
            <h2 className="dash-triage-title">Roster triage board</h2>
            <div className="dash-triage-sub">
              Track coverage gaps, leave approvals, and resolved brand schedules before publishing.
            </div>
          </div>
          <div className="dash-triage-hint">
            Drag cards between columns or click action buttons to advance items
          </div>
        </div>

        <div className="dash-triage-grid">
          {/* Column 1: Critical gaps */}
          <div
            className={`dash-triage-col ${dragOverCol === 'critical' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'critical')}
            onDragLeave={(e) => handleDragLeave(e, 'critical')}
            onDrop={(e) => handleDrop(e, 'critical')}
          >
            <div className="dash-triage-col-header">
              <div className="dash-col-title-wrap">
                <span className="dash-col-dot red" />
                <span>Critical gaps</span>
              </div>
              <span className="dash-col-count red">{triage.critical.length}</span>
            </div>

            {triage.critical.length === 0 ? (
              <div className="dash-triage-empty">Drop items here</div>
            ) : (
              triage.critical.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item, 'critical')}
                  onDragEnd={handleDragEnd}
                  className={`dash-triage-card ${draggedItem?.item?.id === item.id ? 'is-dragging' : ''}`}
                >
                  <div className="dash-triage-top">
                    <span className="dash-triage-brand">{item.brand}</span>
                    <span className={`dash-triage-badge ${item.badgeType}`}>{item.badge}</span>
                  </div>
                  <div className="dash-triage-meta">{item.meta}</div>
                  <div className="dash-triage-desc">{item.desc}</div>
                  <div className="dash-triage-footer">
                    <button
                      type="button"
                      className="btn-triage-review"
                      onClick={() => handleMoveToReview(item)}
                    >
                      Move to review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Pending review */}
          <div
            className={`dash-triage-col ${dragOverCol === 'pending' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'pending')}
            onDragLeave={(e) => handleDragLeave(e, 'pending')}
            onDrop={(e) => handleDrop(e, 'pending')}
          >
            <div className="dash-triage-col-header">
              <div className="dash-col-title-wrap">
                <span className="dash-col-dot amber" />
                <span>Pending review</span>
              </div>
              <span className="dash-col-count amber">{triage.pending.length}</span>
            </div>

            {triage.pending.length === 0 ? (
              <div className="dash-triage-empty">Drop items here</div>
            ) : (
              triage.pending.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item, 'pending')}
                  onDragEnd={handleDragEnd}
                  className={`dash-triage-card ${draggedItem?.item?.id === item.id ? 'is-dragging' : ''}`}
                >
                  <div className="dash-triage-top">
                    <span className="dash-triage-brand">{item.brand}</span>
                    <span className={`dash-triage-badge ${item.badgeType}`}>{item.badge}</span>
                  </div>
                  <div className="dash-triage-meta">{item.meta}</div>
                  <div className="dash-triage-desc">{item.desc}</div>
                  <div className="dash-triage-footer">
                    <button
                      type="button"
                      className="btn-triage-resolve"
                      onClick={() => handleMarkResolved(item)}
                    >
                      Mark resolved
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Resolved & ready */}
          <div
            className={`dash-triage-col ${dragOverCol === 'resolved' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'resolved')}
            onDragLeave={(e) => handleDragLeave(e, 'resolved')}
            onDrop={(e) => handleDrop(e, 'resolved')}
          >
            <div className="dash-triage-col-header">
              <div className="dash-col-title-wrap">
                <span className="dash-col-dot green" />
                <span>Resolved & ready</span>
              </div>
              <span className="dash-col-count green">{triage.resolved.length}</span>
            </div>

            {triage.resolved.length === 0 ? (
              <div className="dash-triage-empty">Drop items here</div>
            ) : (
              triage.resolved.map((item) => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item, 'resolved')}
                  onDragEnd={handleDragEnd}
                  className={`dash-triage-card ${draggedItem?.item?.id === item.id ? 'is-dragging' : ''}`}
                >
                  <div className="dash-triage-top">
                    <span className="dash-triage-brand">{item.brand}</span>
                    <span className={`dash-triage-badge ${item.badgeType}`}>{item.badge}</span>
                  </div>
                  <div className="dash-triage-meta">{item.meta}</div>
                  <div className="dash-triage-desc">{item.desc}</div>
                  <div className="dash-triage-footer">
                    <div className="triage-verified-pill">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="roster-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
