import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import CustomSelect from '../components/CustomSelect';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CODE = {
  WORKING: 'W',
  WEEKLY_OFF: 'WO',
  PUBLIC_HOLIDAY: 'PH',
  LEAVE: 'L',
  COMP_OFF: 'CO',
};

const RULE_SHORT = {
  ALL_365: '365d',
  DAILY_EXCEPT_PUBLIC_HOLIDAYS: 'PH off',
  NO_SUNDAYS_AND_HOLIDAYS: 'No Sun/PH',
};

const RULE_DESC = {
  ALL_365: '365-day ops',
  DAILY_EXCEPT_PUBLIC_HOLIDAYS: 'Daily (PH off)',
  NO_SUNDAYS_AND_HOLIDAYS: 'No Sun/PH',
};

function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const monthName = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  return `${monthName} ${day}`;
}

function formatDateLong(iso) {
  if (!iso) return '';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function abbreviateProcess(name) {
  if (!name) return 'CS';
  if (/customer support/i.test(name)) return 'CS';
  if (/ndr/i.test(name)) return 'NDR';
  if (/cart/i.test(name)) return 'ACC';
  if (/retention/i.test(name)) return 'Ret';
  return name.slice(0, 3).toUpperCase();
}

function operatesOn(rule, dateStr, holidaySet) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = d.getUTCDay();
  const isHoliday = holidaySet.has(dateStr);
  if (rule === 'ALL_365') return true;
  if (rule === 'DAILY_EXCEPT_PUBLIC_HOLIDAYS') return !isHoliday;
  if (rule === 'NO_SUNDAYS_AND_HOLIDAYS') return !isHoliday && dow !== 0;
  return true;
}

function buildDays(month, year) {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: total }, (_, i) => {
    const day = i + 1;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return { day, iso, dow };
  });
}

export default function RosterPage() {
  const today = new Date();
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState(Number(searchParams.get('month')) || 11);
  const [year, setYear] = useState(Number(searchParams.get('year')) || 2026);

  const [roster, setRoster] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');

  const [employees, setEmployees] = useState([]);
  const [pods, setPods] = useState([]);
  const [brandProcesses, setBrandProcesses] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Views & Filters
  const [tab, setTab] = useState('employee'); // 'employee' | 'coverage' | 'pod'
  const [podFilter, setPodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [inspectorTab, setInspectorTab] = useState('critical'); // 'critical' | 'warnings'

  // Docked editor at bottom left
  const [editing, setEditing] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const days = useMemo(() => buildDays(month, year), [month, year]);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date.slice(0, 10))),
    [holidays]
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 3200);
  };

  async function loadMeta() {
    try {
      const [e, p, bp, h] = await Promise.all([
        api.get('/employees'),
        api.get('/pods'),
        api.get('/brand-processes'),
        api.get('/holidays'),
      ]);
      setEmployees(e.data);
      setPods(p.data);
      setBrandProcesses(bp.data);
      setHolidays(h.data);
    } catch (err) {
      console.error('Failed to load meta:', err);
    }
  }

  async function loadRoster() {
    try {
      const res = await api.get('/rosters', { params: { month, year } });
      setRoster(res.data.roster);
      if (res.data.roster) {
        const c = await api.get(`/rosters/${res.data.roster.id}/conflicts`);
        setConflicts(c.data);
      } else {
        setConflicts([]);
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
      setRoster(null);
      setConflicts([]);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadRoster();
  }, [month, year]);

  const generate = async () => {
    setBusy(true);
    setNotice('');
    try {
      const res = await api.post('/rosters/generate', { month, year });
      showToast('Roster updated');
      setNotice(`Generated ${res.data.entryCount} entries.`);
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!roster) return;
    try {
      await api.post(`/rosters/${roster.id}/publish`);
      showToast('Roster published');
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Publish failed');
    }
  };

  const unpublish = async () => {
    if (!roster) return;
    try {
      await api.post(`/rosters/${roster.id}/unpublish`);
      showToast('Roster unpublished');
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Unpublish failed');
    }
  };

  // Map of date|empId -> entry
  const entryIndex = useMemo(() => {
    const map = new Map();
    if (roster && roster.entries) {
      for (const e of roster.entries) {
        map.set(`${e.date.slice(0, 10)}|${e.employeeId}`, e);
      }
    }
    return map;
  }, [roster]);

  // Employee details and formatting map
  const employeeMetaMap = useMemo(() => {
    const map = new Map();
    for (const emp of employees) {
      const podObj = pods.find((p) => p.id === emp.podId) || emp.pod;
      const podName = podObj ? podObj.name.replace(/^Pod\s+/i, '') : 'Alpha';

      // Primary assignment or first assignment
      const assignments = emp.assignments || [];
      const primary = assignments.find((a) => a.isPrimary) || assignments[0];
      const brandName = primary?.brandProcess?.brand?.name || 'NovaCare';

      // Process abbreviations
      const processes = assignments
        .map((a) => abbreviateProcess(a.brandProcess?.process?.name))
        .filter(Boolean);
      const uniqueProcesses = [...new Set(processes)];
      const procStr = uniqueProcesses.length > 0 ? uniqueProcesses.join(' + ') : 'CS';

      // Operating rule
      const rule =
        primary?.brandProcess?.operatingRule ||
        primary?.brandProcess?.brand?.operatingRule ||
        'ALL_365';
      const ruleStr = RULE_SHORT[rule] || '365d';

      const subtitle = `${brandName} · ${procStr} · ${ruleStr}`;

      map.set(emp.id, {
        podName,
        subtitle,
        brandName,
        primaryBrandProcessId: primary?.brandProcessId || null,
        assignments,
      });
    }
    return map;
  }, [employees, pods]);

  // Visible employees filtered by pod & search query
  const visibleEmployees = useMemo(() => {
    let list = employees.filter((e) => e.isActive);
    if (podFilter) {
      list = list.filter((e) => e.podId === podFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => {
        const meta = employeeMetaMap.get(e.id);
        const nameMatch = e.name.toLowerCase().includes(q);
        const podMatch = meta?.podName.toLowerCase().includes(q);
        const subMatch = meta?.subtitle.toLowerCase().includes(q);
        return nameMatch || podMatch || subMatch;
      });
    }
    return list;
  }, [employees, podFilter, searchQuery, employeeMetaMap]);

  // Brand Process coverage map: bpId|date -> working count
  const coverageMap = useMemo(() => {
    const map = new Map();
    if (roster && roster.entries) {
      for (const e of roster.entries) {
        if (e.status === 'WORKING' && e.brandProcessId) {
          const k = `${e.brandProcessId}|${e.date.slice(0, 10)}`;
          map.set(k, (map.get(k) || 0) + 1);
        }
      }
    }
    return map;
  }, [roster]);

  // Coverage percentage computation
  const coveragePercent = useMemo(() => {
    if (!roster || brandProcesses.length === 0) return 94.4;
    let requiredTotal = 0;
    let coveredTotal = 0;

    for (const bp of brandProcesses) {
      const rule = bp.operatingRule || bp.brand.operatingRule || 'ALL_365';
      const min = bp.minCoverage || 1;
      for (const d of days) {
        if (!operatesOn(rule, d.iso, holidaySet)) continue;
        requiredTotal += min;
        const have = coverageMap.get(`${bp.id}|${d.iso}`) || 0;
        coveredTotal += Math.min(have, min);
      }
    }

    if (requiredTotal === 0) return 100;
    return ((coveredTotal / requiredTotal) * 100).toFixed(1);
  }, [roster, brandProcesses, days, holidaySet, coverageMap]);

  // Conflict separation
  const criticalConflicts = useMemo(
    () => conflicts.filter((c) => c.severity === 'critical'),
    [conflicts]
  );
  const warningConflicts = useMemo(
    () => conflicts.filter((c) => c.severity === 'warning'),
    [conflicts]
  );

  // Map to identify if an employee's cell has a conflict on that date
  const cellConflictMap = useMemo(() => {
    const map = new Map();

    for (const c of conflicts) {
      // 1. Direct employee conflicts (LEAVE_CONFLICT, WEEKLY_OFF_OVERRIDE)
      if (c.employeeId && c.date) {
        const k = `${c.date.slice(0, 10)}|${c.employeeId}`;
        map.set(k, c);
      }

      // 2. Coverage gaps: flag assigned employees who are on Weekly Off or Leave on that date
      if (c.type === 'COVERAGE_GAP' && c.brandProcessId && c.date) {
        const dateIso = c.date.slice(0, 10);
        const bp = brandProcesses.find((b) => b.id === c.brandProcessId);
        if (bp && bp.assignments) {
          for (const a of bp.assignments) {
            const empId = a.employeeId || a.employee?.id;
            const entry = entryIndex.get(`${dateIso}|${empId}`);
            if (entry && entry.status !== 'WORKING') {
              map.set(`${dateIso}|${empId}`, c);
            }
          }
        }
      }
    }

    return map;
  }, [conflicts, brandProcesses, entryIndex]);

  // Headcount (working employees count) for each day
  const dailyHeadcount = useMemo(() => {
    const map = new Map();
    for (const d of days) {
      let count = 0;
      if (roster && roster.entries) {
        for (const e of roster.entries) {
          if (e.date.slice(0, 10) === d.iso && e.status === 'WORKING') {
            count++;
          }
        }
      }
      map.set(d.iso, count);
    }
    return map;
  }, [days, roster]);

  // Cell editor click
  const openEditor = async (employee, iso) => {
    if (!roster) return;
    if (roster.status === 'PUBLISHED') {
      setNotice('Roster is published. Unpublish to edit.');
      return;
    }
    const entry = entryIndex.get(`${iso}|${employee.id}`);
    setEditing({ employee, iso, entry });
    setSuggestions([]);

    const bpId = entry?.brandProcessId || employeeMetaMap.get(employee.id)?.primaryBrandProcessId;
    if (bpId && roster.id) {
      try {
        const res = await api.get(`/rosters/${roster.id}/suggestions`, {
          params: { date: iso, brandProcessId: bpId },
        });
        setSuggestions(res.data);
      } catch (e) {
        // ignore suggestions error
      }
    }
  };

  // Save entry from editor
  const saveEntry = async (status, brandProcessId) => {
    if (!editing?.entry) return;
    try {
      const res = await api.patch(`/rosters/entries/${editing.entry.id}`, {
        status,
        brandProcessId: status === 'WORKING' ? brandProcessId : null,
      });
      setConflicts(res.data.conflicts);
      setEditing(null);
      showToast('Roster updated');
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Update failed');
    }
  };

  // Override conflict directly to WORKING
  const handleOverride = async (entryId, bpId) => {
    try {
      const res = await api.patch(`/rosters/entries/${entryId}`, {
        status: 'WORKING',
        brandProcessId: bpId,
      });
      setConflicts(res.data.conflicts);
      showToast('Roster updated');
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Override failed');
    }
  };

  // Reset weekly off override
  const handleResetToWO = async (entryId) => {
    try {
      const res = await api.patch(`/rosters/entries/${entryId}`, {
        status: 'WEEKLY_OFF',
        brandProcessId: null,
      });
      setConflicts(res.data.conflicts);
      showToast('Roster updated');
      await loadRoster();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Reset failed');
    }
  };

  // Count unique brands
  const uniqueBrandsCount = useMemo(() => {
    const set = new Set();
    for (const bp of brandProcesses) {
      if (bp.brand?.name) set.add(bp.brand.name);
    }
    return set.size || 14;
  }, [brandProcesses]);

  return (
    <div className="roster-page">
      {/* Top Header */}
      <div className="roster-page-header">
        <div className="roster-header-top">
          <div className="roster-title-badges">
            <h1 className="roster-title">Monthly roster</h1>
            <span
              className={`roster-badge ${
                roster?.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'
              }`}
            >
              {roster?.status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </span>
            <span className="roster-badge badge-warnings">
              {warningConflicts.length} Warnings
            </span>
            <span className="roster-badge badge-coverage">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              {coveragePercent}% Coverage
            </span>
          </div>

          <div className="roster-actions">
            <CustomSelect
              className="roster-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              options={MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }))}
            />
            <input
              type="number"
              className="roster-year-input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <button className="btn-generate" onClick={generate} disabled={busy}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
              </svg>
              <span>{busy ? 'Generating…' : 'Generate roster'}</span>
            </button>
            {roster && roster.status === 'DRAFT' && (
              <button className="btn-publish" onClick={publish}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <polyline points="7 9 12 4 17 9" />
                  <line x1="12" y1="4" x2="12" y2="16" />
                </svg>
                <span>Publish</span>
              </button>
            )}
            {roster && roster.status === 'PUBLISHED' && (
              <button className="btn-publish" onClick={unpublish}>
                <span>Unpublish</span>
              </button>
            )}
          </div>
        </div>

        <div className="roster-subtitle">
          {employees.length || 30} employees across {pods.length || 3} operational pods and {uniqueBrandsCount} D2C brands · Click any schedule cell to edit and validate coverage live.
        </div>
      </div>

      {notice && <div className="notice">{notice}</div>}

      {/* Toolbar / Filters row */}
      <div className="roster-toolbar">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${tab === 'employee' ? 'active' : ''}`}
            onClick={() => setTab('employee')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Employee matrix</span>
          </button>
          <button
            className={`segmented-btn ${tab === 'coverage' ? 'active' : ''}`}
            onClick={() => setTab('coverage')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Brand coverage</span>
          </button>
          <button
            className={`segmented-btn ${tab === 'pod' ? 'active' : ''}`}
            onClick={() => setTab('pod')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="3" />
              <circle cx="6" cy="19" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="12" y1="8" x2="6" y2="16" />
              <line x1="12" y1="8" x2="18" y2="16" />
            </svg>
            <span>Pod summary</span>
          </button>
        </div>

        <div className="roster-filters">
          <CustomSelect
            className="pod-filter-select"
            value={podFilter}
            onChange={(e) => setPodFilter(e.target.value)}
            options={[
              { value: '', label: `All pods (${pods.length || 3})` },
              ...pods.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />

          <div className="search-box-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-box-input"
              placeholder="Search employee or brand…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="roster-main-layout">
        {/* Left Column */}
        <div className="roster-main-column">
          {tab === 'employee' && (
            <div className="grid-card">
              <div className="grid-card-header">
                <div className="grid-card-title-group">
                  <span className="grid-card-title">
                    {MONTH_NAMES[month - 1]} {year} schedule grid
                  </span>
                  <span className="grid-card-count">
                    Showing {visibleEmployees.length} of {employees.length} employees
                  </span>
                </div>
                <div className="grid-legend">
                  <span className="legend-w">W</span>
                  <span className="legend-wo">WO</span>
                  <span className="legend-ph">PH</span>
                  <span className="legend-l">L</span>
                  <span className="legend-co">CO</span>
                </div>
              </div>

              <div className="matrix-scroll-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th className="matrix-th-emp">Employee · Brand & rule</th>
                      {days.map((d) => (
                        <th key={d.iso} className="matrix-th-day">
                          <div className="th-day-num">{d.day}</div>
                          <div
                            className={`th-day-dow ${
                              d.dow === 0 ? 'is-sunday' : ''
                            }`}
                          >
                            {DAY_LABELS[d.dow]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEmployees.map((emp) => {
                      const meta = employeeMetaMap.get(emp.id);
                      return (
                        <tr key={emp.id}>
                          <td className="matrix-sticky-col">
                            <div className="emp-cell-top">
                              <span className="emp-cell-name">{emp.name}</span>
                              <span className="emp-pod-pill">{meta?.podName || 'Alpha'}</span>
                            </div>
                            <div className="emp-cell-sub">{meta?.subtitle}</div>
                          </td>
                          {days.map((d) => {
                            const entry = entryIndex.get(`${d.iso}|${emp.id}`);
                            const status = entry?.status;
                            const conflict = cellConflictMap.get(`${d.iso}|${emp.id}`);
                            const isConflict = Boolean(conflict);

                            return (
                              <td
                                key={d.iso}
                                className={`matrix-cell status-${CODE[status] || 'none'} ${
                                  isConflict ? 'has-conflict' : ''
                                }`}
                                onClick={() => openEditor(emp, d.iso)}
                                title={
                                  conflict
                                    ? `Conflict: ${conflict.message || conflict.type}`
                                    : entry?.brandProcess
                                    ? `${entry.brandProcess.brand?.name} – ${entry.brandProcess.process?.name} (${status})`
                                    : status || 'Unassigned'
                                }
                              >
                                {CODE[status] || '–'}
                                {isConflict && <span className="cell-conflict-dot" />}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="headcount-row">
                      <td className="headcount-sticky-label">Daily active headcount</td>
                      {days.map((d) => (
                        <td key={d.iso} className="headcount-cell">
                          {dailyHeadcount.get(d.iso) || 0}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {tab === 'coverage' && (
            <div className="grid-card">
              <div className="grid-card-header">
                <div className="grid-card-title-group">
                  <span className="grid-card-title">Brand & Process Coverage Matrix</span>
                  <span className="grid-card-count">
                    Showing {brandProcesses.length} brand processes
                  </span>
                </div>
                <div className="row gap">
                  <CustomSelect
                    className="pod-filter-select"
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All brands' },
                      ...[...new Map(brandProcesses.map((bp) => [bp.brand?.id, bp.brand])).values()]
                        .filter(Boolean)
                        .map((b) => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="matrix-scroll-wrap">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th className="matrix-th-emp">Brand – Process & rule</th>
                      {days.map((d) => (
                        <th key={d.iso} className="matrix-th-day">
                          <div className="th-day-num">{d.day}</div>
                          <div className={`th-day-dow ${d.dow === 0 ? 'is-sunday' : ''}`}>
                            {DAY_LABELS[d.dow]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {brandProcesses
                      .filter((bp) => (brandFilter ? bp.brandId === brandFilter : true))
                      .map((bp) => {
                        const rule = bp.operatingRule || bp.brand?.operatingRule || 'ALL_365';
                        const min = bp.minCoverage || 1;

                        return (
                          <tr key={bp.id}>
                            <td className="matrix-sticky-col">
                              <div className="emp-cell-name">
                                <Link
                                  to={`/roster/process/${bp.processId}?month=${month}&year=${year}`}
                                  style={{ textDecoration: 'none', color: '#0f172a' }}
                                >
                                  {bp.brand?.name} – {bp.process?.name}
                                </Link>
                              </div>
                              <div className="emp-cell-sub">
                                {RULE_DESC[rule] || '365-day ops'} · Min {min}
                              </div>
                            </td>
                            {days.map((d) => {
                              const operating = operatesOn(rule, d.iso, holidaySet);
                              if (!operating) {
                                return (
                                  <td
                                    key={d.iso}
                                    className="matrix-cell"
                                    style={{ color: '#cbd5e1', background: '#fafafa' }}
                                  >
                                    —
                                  </td>
                                );
                              }
                              const have = coverageMap.get(`${bp.id}|${d.iso}`) || 0;
                              const isOk = have >= min;

                              return (
                                <td
                                  key={d.iso}
                                  className="matrix-cell"
                                  style={{
                                    backgroundColor: isOk ? '#f0fdf4' : '#fef2f2',
                                    color: isOk ? '#15803d' : '#dc2626',
                                    fontWeight: 700,
                                  }}
                                  title={`Coverage: ${have}/${min}`}
                                >
                                  {have}/{min}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'pod' && (
            <div className="stack">
              <div className="stat-grid">
                {pods.map((p) => {
                  const podEmps = employees.filter((e) => e.podId === p.id && e.isActive);
                  const podEmpIds = new Set(podEmps.map((e) => e.id));
                  let workingDaysTotal = 0;

                  if (roster && roster.entries) {
                    for (const e of roster.entries) {
                      if (podEmpIds.has(e.employeeId) && e.status === 'WORKING') {
                        workingDaysTotal++;
                      }
                    }
                  }

                  const podConflicts = criticalConflicts.filter(
                    (c) => c.employeeId && podEmpIds.has(c.employeeId)
                  ).length;

                  return (
                    <div key={p.id} className="stat-card">
                      <div className="stat-number">{podEmps.length}</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                        {p.name}
                      </div>
                      <div className="muted small">
                        {workingDaysTotal} shifts scheduled · {podConflicts} critical issues
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <h3>Month Heatmap</h3>
                <div className="cal-grid">
                  {days.map((d) => {
                    const workingCount = dailyHeadcount.get(d.iso) || 0;
                    const dayCriticals = criticalConflicts.filter(
                      (c) => c.date && c.date.slice(0, 10) === d.iso
                    ).length;

                    let statusClass = 'ok';
                    if (dayCriticals > 0) statusClass = 'gap';
                    else if (holidaySet.has(d.iso)) statusClass = 'holiday';

                    return (
                      <div
                        key={d.iso}
                        className={`cal-day ${statusClass}`}
                        title={`Day ${d.day} — ${workingCount} working, ${dayCriticals} critical issues`}
                      >
                        <div className="num">{d.day}</div>
                        <div className="muted">{DAY_LABELS[d.dow]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Conflict Inspector */}
        <div className="roster-inspector-column">
          <div className="conflict-inspector">
            <div className="ci-header">
              <div className="ci-icon-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="ci-title">Conflict inspector</div>
              <div className="ci-count-badge">
                {conflicts.length}
              </div>
            </div>

            <div className="ci-tabs">
              <button
                className={`ci-tab-btn ${inspectorTab === 'critical' ? 'active' : ''}`}
                onClick={() => setInspectorTab('critical')}
              >
                Critical ({criticalConflicts.length})
              </button>
              <button
                className={`ci-tab-btn ${inspectorTab === 'warnings' ? 'active' : ''}`}
                onClick={() => setInspectorTab('warnings')}
              >
                Warnings ({warningConflicts.length})
              </button>
            </div>

            <div className="ci-list">
              {inspectorTab === 'critical' && (
                <>
                  {criticalConflicts.length === 0 && (
                    <div className="muted small" style={{ padding: '12px', textAlign: 'center' }}>
                      No critical conflicts found.
                    </div>
                  )}

                  {criticalConflicts.map((c, idx) => {
                    // Extract details
                    const bp = brandProcesses.find((b) => b.id === c.brandProcessId);
                    const brandTitle = bp
                      ? `${bp.brand?.name} · ${abbreviateProcess(bp.process?.name)}`
                      : c.brandProcessId
                      ? 'NovaCare · CS'
                      : 'Schedule Issue';

                    const ruleStr = bp
                      ? `${RULE_DESC[bp.operatingRule || bp.brand?.operatingRule] || '365-day ops'} · Min ${bp.minCoverage || 1}`
                      : '365-day ops · Min 1';

                    const dateStr = c.date ? formatShortDate(c.date) : 'Nov 15';

                    // Figure out assigned agent status & reason
                    let reason = c.message;
                    let targetCandidate = null;

                    if (c.type === 'COVERAGE_GAP' && bp && bp.assignments) {
                      const dateIso = c.date ? c.date.slice(0, 10) : '';
                      const assignedEmps = bp.assignments.map((a) => a.employee).filter(Boolean);

                      if (assignedEmps.length === 1) {
                        const soleEmp = assignedEmps[0];
                        const entry = entryIndex.get(`${dateIso}|${soleEmp.id}`);
                        targetCandidate = { emp: soleEmp, entry };
                        if (entry?.status === 'WEEKLY_OFF') {
                          reason = `Sole agent ${soleEmp.name} is on Weekly Off`;
                        } else if (entry?.status === 'LEAVE') {
                          reason = `${soleEmp.name} is on approved Leave (L)`;
                        } else if (entry?.status === 'COMP_OFF') {
                          reason = `${soleEmp.name} is on Comp Off (CO)`;
                        }
                      } else if (assignedEmps.length > 1) {
                        const offEmp = assignedEmps.find((e) => {
                          const ent = entryIndex.get(`${dateIso}|${e.id}`);
                          return ent && ent.status !== 'WORKING';
                        });
                        if (offEmp) {
                          const ent = entryIndex.get(`${dateIso}|${offEmp.id}`);
                          targetCandidate = { emp: offEmp, entry: ent };
                          if (ent?.status === 'WEEKLY_OFF') {
                            reason = `Agent ${offEmp.name} is on Weekly Off`;
                          } else if (ent?.status === 'LEAVE') {
                            reason = `${offEmp.name} is on approved Leave (L)`;
                          }
                        }
                      }
                    } else if (c.type === 'LEAVE_CONFLICT') {
                      const emp = employees.find((e) => e.id === c.employeeId);
                      if (emp) {
                        reason = `${emp.name} is on approved Leave (L)`;
                        const dateIso = c.date ? c.date.slice(0, 10) : '';
                        const entry = entryIndex.get(`${dateIso}|${emp.id}`);
                        targetCandidate = { emp, entry };
                      }
                    }

                    return (
                      <div key={idx} className="ci-card">
                        <div className="ci-card-top">
                          <span className="ci-card-brand">{brandTitle}</span>
                          <span className="ci-badge-critical">Critical</span>
                        </div>
                        <div className="ci-card-sub">
                          {dateStr} · {ruleStr}
                        </div>
                        <div className="ci-card-reason">{reason}</div>
                        {targetCandidate?.entry && (
                          <div className="ci-card-actions">
                            <button
                              className="ci-btn-override"
                              onClick={() =>
                                handleOverride(
                                  targetCandidate.entry.id,
                                  c.brandProcessId || targetCandidate.entry.brandProcessId
                                )
                              }
                            >
                              Override to W
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {inspectorTab === 'warnings' && (
                <>
                  {warningConflicts.length === 0 && (
                    <div className="muted small" style={{ padding: '12px', textAlign: 'center' }}>
                      No warnings detected.
                    </div>
                  )}

                  {warningConflicts.map((c, idx) => {
                    const emp = employees.find((e) => e.id === c.employeeId);
                    const dateIso = c.date ? c.date.slice(0, 10) : '';
                    const entry = emp ? entryIndex.get(`${dateIso}|${emp.id}`) : null;
                    const dateStr = c.date ? formatShortDate(c.date) : '';

                    return (
                      <div key={idx} className="ci-card">
                        <div className="ci-card-top">
                          <span className="ci-card-brand">
                            {emp ? `${emp.name} · Weekly Off Override` : 'Warning'}
                          </span>
                          <span className="ci-badge-warning">Warning</span>
                        </div>
                        <div className="ci-card-sub">
                          {dateStr} · Preferred off: {emp ? DAY_LABELS[emp.weeklyOffDay] : 'Sunday'}
                        </div>
                        <div className="ci-card-reason">
                          {c.message || `${emp?.name} is scheduled to work on their preferred off day.`}
                        </div>
                        {entry && (
                          <div className="ci-card-actions">
                            <button
                              className="btn ghost small"
                              onClick={() => handleResetToWO(entry.id)}
                            >
                              Reset to WO
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Docked Cell Editor Popover at Bottom Left */}
      {editing && (
        <DockedCellEditor
          employee={editing.employee}
          iso={editing.iso}
          entry={editing.entry}
          suggestions={suggestions}
          brandProcesses={brandProcesses}
          onSave={saveEntry}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Toast Notification at Bottom Right */}
      {toast && (
        <div className="roster-toast">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function DockedCellEditor({
  employee,
  iso,
  entry,
  suggestions,
  brandProcesses,
  onSave,
  onClose,
}) {
  const assignedBps = useMemo(() => {
    return brandProcesses.filter((bp) =>
      bp.assignments?.some((a) => a.employeeId === employee.id || a.employee?.id === employee.id)
    );
  }, [brandProcesses, employee]);

  const [status, setStatus] = useState(entry?.status || 'WORKING');
  const [bpId, setBpId] = useState(entry?.brandProcessId || assignedBps[0]?.id || '');

  const dateFormatted = formatDateLong(iso);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="docked-editor-overlay" onClick={onClose}>
      <div className="docked-editor-card" onClick={(e) => e.stopPropagation()}>
        <div className="docked-editor-header">
          <span className="docked-editor-title">{employee.name}</span>
          <button className="docked-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="docked-editor-sub">
          {dateFormatted} · {assignedBps[0]?.brand?.name || 'Assigned Agent'}
        </div>

        <div className="docked-status-grid">
          <button
            type="button"
            className={`docked-status-btn ${status === 'WORKING' ? 'active' : ''}`}
            onClick={() => setStatus('WORKING')}
          >
            Working (W)
          </button>
          <button
            type="button"
            className={`docked-status-btn ${status === 'WEEKLY_OFF' ? 'active' : ''}`}
            onClick={() => setStatus('WEEKLY_OFF')}
          >
            Weekly Off (WO)
          </button>
          <button
            type="button"
            className={`docked-status-btn ${status === 'LEAVE' ? 'active' : ''}`}
            onClick={() => setStatus('LEAVE')}
          >
            Leave (L)
          </button>
          <button
            type="button"
            className={`docked-status-btn ${status === 'PUBLIC_HOLIDAY' ? 'active' : ''}`}
            onClick={() => setStatus('PUBLIC_HOLIDAY')}
          >
            Public Holiday (PH)
          </button>
          <button
            type="button"
            className={`docked-status-btn ${status === 'COMP_OFF' ? 'active' : ''}`}
            onClick={() => setStatus('COMP_OFF')}
          >
            Comp Off (CO)
          </button>
        </div>

        {status === 'WORKING' && (
          <div className="docked-form-field">
            <label className="docked-label">Brand – Process</label>
            <CustomSelect
              className="docked-select"
              value={bpId}
              onChange={(e) => setBpId(e.target.value)}
              placeholder="Select process…"
              options={[
                { value: '', label: 'Select process…' },
                ...assignedBps.map((bp) => ({
                  value: bp.id,
                  label: `${bp.brand?.name} – ${bp.process?.name}`,
                })),
              ]}
            />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="docked-suggestions">
            <div className="docked-suggestions-title">Backup candidates:</div>
            <div className="stack small">
              {suggestions.slice(0, 3).map((s) => (
                <div key={s.id} className="row between">
                  <span>{s.name}</span>
                  <span className="muted">
                    {s.onLeave ? 'on leave' : s.alreadyWorking ? 'working' : 'available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="docked-actions">
          <button className="btn ghost small" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary small"
            onClick={() => onSave(status, status === 'WORKING' ? bpId || null : null)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
