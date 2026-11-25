import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import CustomSelect from '../components/CustomSelect';

const RULES = [
  { value: 'DAILY_EXCEPT_PUBLIC_HOLIDAYS', label: 'Daily except public holidays' },
  { value: 'ALL_365', label: '365 days (incl. Sundays & PH)' },
  { value: 'NO_SUNDAYS_AND_HOLIDAYS', label: 'Sundays & public holidays off' },
];

const RULE_OVERRIDE_OPTIONS = [
  { value: '', label: 'Inherit from brand' },
  ...RULES,
];

const CALENDAR_FILTER_OPTIONS = [
  { value: '', label: 'All operating calendars' },
  ...RULES,
];

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarFilter, setCalendarFilter] = useState('');
  const [toast, setToast] = useState('');

  const [brandForm, setBrandForm] = useState({
    name: '',
    operatingRule: 'DAILY_EXCEPT_PUBLIC_HOLIDAYS',
  });
  const [processForm, setProcessForm] = useState({ name: '' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  const load = async () => {
    try {
      const [b, p] = await Promise.all([api.get('/brands'), api.get('/processes')]);
      setBrands(b.data);
      setProcesses(p.data);
    } catch (err) {
      console.error('Failed to load brands & processes:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBrand = async (e) => {
    e.preventDefault();
    if (!brandForm.name) return;
    try {
      await api.post('/brands', brandForm);
      setBrandForm({ name: '', operatingRule: 'DAILY_EXCEPT_PUBLIC_HOLIDAYS' });
      showToast('Brand added');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add brand');
    }
  };

  const createProcess = async (e) => {
    e.preventDefault();
    if (!processForm.name) return;
    try {
      await api.post('/processes', processForm);
      setProcessForm({ name: '' });
      showToast('Process added');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add process');
    }
  };

  const updateBrandRule = async (brand, operatingRule) => {
    try {
      await api.put(`/brands/${brand.id}`, { operatingRule });
      showToast('Updated');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update brand rule');
    }
  };

  const addBrandProcess = async (brandId, processId, minCoverage, operatingRule) => {
    try {
      await api.post('/brand-processes', {
        brandId,
        processId,
        minCoverage: Number(minCoverage),
        operatingRule: operatingRule || null,
      });
      showToast('Process added to brand');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add process to brand');
    }
  };

  const updateBrandProcess = async (bp, minCoverage, operatingRule) => {
    try {
      await api.put(`/brand-processes/${bp.id}`, {
        minCoverage: Number(minCoverage),
        operatingRule: operatingRule || null,
      });
      showToast('Updated');
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update process');
    }
  };

  // Metrics
  const metric365 = useMemo(() => {
    return brands.filter((b) => b.operatingRule === 'ALL_365').length;
  }, [brands]);

  const metricDaily = useMemo(() => {
    return brands.filter((b) => b.operatingRule === 'DAILY_EXCEPT_PUBLIC_HOLIDAYS').length;
  }, [brands]);

  const metricNoSun = useMemo(() => {
    return brands.filter((b) => b.operatingRule === 'NO_SUNDAYS_AND_HOLIDAYS').length;
  }, [brands]);

  const metricUnassigned = useMemo(() => {
    return brands.reduce((acc, b) => {
      const unassignedProcesses = (b.brandProcesses || []).filter(
        (bp) => !bp.assignments || bp.assignments.length === 0
      );
      return acc + (unassignedProcesses.length > 0 ? 1 : 0);
    }, 0);
  }, [brands]);

  const filteredBrands = useMemo(() => {
    let list = brands;

    if (calendarFilter) {
      list = list.filter((b) => b.operatingRule === calendarFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((brand) => {
        const nameMatch = brand.name.toLowerCase().includes(q);
        const processMatch = (brand.brandProcesses || []).some((bp) =>
          bp.process?.name?.toLowerCase().includes(q)
        );
        return nameMatch || processMatch;
      });
    }

    return list;
  }, [brands, calendarFilter, searchQuery]);

  return (
    <div className="bp-page">
      {/* Header */}
      <div className="bp-page-header">
        <div className="bp-header-top">
          <div>
            <div className="bp-title-wrap">
              <h1 className="bp-page-title">Brands & processes</h1>
              <span className="bp-badge">
                {brands.length} Brands · {processes.length} Processes
              </span>
            </div>
            <div className="bp-subtitle">
              Configure client operating calendars, process-level rule overrides, and minimum daily staffing thresholds.
            </div>
          </div>

          <div className="bp-metrics-group">
            <div className="bp-metric-card">
              <div className="bp-metric-label">365-day ops</div>
              <div className="bp-metric-val">{metric365}</div>
            </div>
            <div className="bp-metric-card">
              <div className="bp-metric-label">Daily (PH off)</div>
              <div className="bp-metric-val">{metricDaily}</div>
            </div>
            <div className="bp-metric-card">
              <div className="bp-metric-label">No Sun / PH</div>
              <div className="bp-metric-val">{metricNoSun}</div>
            </div>
            <div className="bp-metric-card">
              <div className="bp-metric-label">Unassigned</div>
              <div className="bp-metric-val red">{metricUnassigned}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Creation Cards Row */}
      <div className="bp-creation-row">
        {/* Add new brand Card */}
        <div className="bp-creation-card">
          <div className="bp-card-title">Add new brand</div>
          <form onSubmit={createBrand} className="bp-brand-form">
            <div className="form-field">
              <label className="form-label">Brand name</label>
              <input
                className="form-input-control"
                placeholder="e.g. NovaSkin"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Operating calendar</label>
              <CustomSelect
                value={brandForm.operatingRule}
                onChange={(e) => setBrandForm({ ...brandForm, operatingRule: e.target.value })}
                options={RULES}
              />
            </div>

            <button type="submit" className="btn-add-brand">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span>Add brand</span>
            </button>
          </form>
        </div>

        {/* Add global process Card */}
        <div className="bp-creation-card">
          <div className="bp-card-title">Add global process</div>
          <form onSubmit={createProcess} className="bp-process-form">
            <div className="form-field">
              <label className="form-label">Process name</label>
              <input
                className="form-input-control"
                placeholder="e.g. Order Verification"
                value={processForm.name}
                onChange={(e) => setProcessForm({ name: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-add-process">
              <span>+ Add process</span>
            </button>
          </form>
        </div>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bp-toolbar">
        <div className="bp-toolbar-left">
          <div className="emp-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="bp-search-input"
              placeholder="Search brands or processes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <CustomSelect
            className="emp-select-filter"
            value={calendarFilter}
            onChange={(e) => setCalendarFilter(e.target.value)}
            options={CALENDAR_FILTER_OPTIONS}
            style={{ minWidth: '200px' }}
          />
        </div>

        <div className="bp-showing-count">
          Showing {filteredBrands.length} of {brands.length} brands
        </div>
      </div>

      {/* Brands Cards List */}
      {filteredBrands.length === 0 && (
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
          No brands match the selected criteria.
        </div>
      )}

      {filteredBrands.map((brand) => (
        <BrandCardItem
          key={brand.id}
          brand={brand}
          processes={processes}
          onRuleChange={updateBrandRule}
          onAddBrandProcess={addBrandProcess}
          onUpdateBrandProcess={updateBrandProcess}
        />
      ))}

      {/* Floating Toast Notification */}
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

function BrandCardItem({
  brand,
  processes,
  onRuleChange,
  onAddBrandProcess,
  onUpdateBrandProcess,
}) {
  const [newProcessId, setNewProcessId] = useState('');
  const [minCoverage, setMinCoverage] = useState(1);

  // Compute unique agents assigned across this brand's processes
  const assignedAgentsCount = useMemo(() => {
    const set = new Set();
    for (const bp of brand.brandProcesses || []) {
      for (const a of bp.assignments || []) {
        if (a.employeeId || a.employee?.id) {
          set.add(a.employeeId || a.employee?.id);
        }
      }
    }
    return set.size;
  }, [brand]);

  // Unassigned processes
  const hasUnassignedProcess = useMemo(() => {
    return (brand.brandProcesses || []).some(
      (bp) => !bp.assignments || bp.assignments.length === 0
    );
  }, [brand]);

  // Filter processes not yet added to this brand
  const availableProcessOptions = useMemo(() => {
    const existing = new Set((brand.brandProcesses || []).map((bp) => bp.processId || bp.process?.id));
    const available = processes.filter((p) => !existing.has(p.id));
    return [
      { value: '', label: 'Select process…' },
      ...available.map((p) => ({ value: p.id, label: p.name })),
    ];
  }, [processes, brand]);

  return (
    <div className="brand-card-item">
      {/* Brand Header */}
      <div className="brand-card-header">
        <div className="brand-name-group">
          <span className="brand-name-text">{brand.name}</span>
          {assignedAgentsCount >= 2 ? (
            <span className="brand-agent-badge multi">
              Multi-agent ({assignedAgentsCount} agents)
            </span>
          ) : assignedAgentsCount === 1 ? (
            <span className="brand-agent-badge dedicated">
              Dedicated (1 agent)
            </span>
          ) : (
            <span className="brand-agent-badge unassigned">
              No agents assigned
            </span>
          )}
        </div>

        <div className="brand-rule-group">
          <span className="brand-rule-label">Operating rule:</span>
          <CustomSelect
            value={brand.operatingRule}
            onChange={(e) => onRuleChange(brand, e.target.value)}
            options={RULES}
            style={{ minWidth: '230px' }}
          />
        </div>
      </div>

      {/* Table of Processes */}
      <table className="brand-table">
        <thead>
          <tr>
            <th className="brand-th" style={{ width: '220px' }}>Process</th>
            <th className="brand-th" style={{ width: '110px' }}>Min coverage</th>
            <th className="brand-th" style={{ width: '200px' }}>Rule override</th>
            <th className="brand-th">Assigned employees</th>
            <th className="brand-th" style={{ width: '80px', textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {(brand.brandProcesses || []).length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '16px', color: '#94a3b8', textAlign: 'center' }}>
                No processes assigned to this brand yet.
              </td>
            </tr>
          ) : (
            brand.brandProcesses.map((bp) => (
              <BrandProcessRowItem
                key={bp.id}
                bp={bp}
                onUpdate={onUpdateBrandProcess}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Add Process to Brand Footer */}
      <div className="add-bp-footer">
        <CustomSelect
          value={newProcessId}
          onChange={(e) => setNewProcessId(e.target.value)}
          options={availableProcessOptions}
          placeholder="Select process…"
          style={{ minWidth: '180px' }}
        />

        <input
          type="number"
          min="1"
          className="min-cov-input"
          value={minCoverage}
          onChange={(e) => setMinCoverage(Math.max(1, Number(e.target.value) || 1))}
          style={{ width: '56px' }}
        />

        <button
          type="button"
          className="btn-add-bp"
          onClick={() => {
            if (!newProcessId) return;
            onAddBrandProcess(brand.id, newProcessId, minCoverage, null);
            setNewProcessId('');
            setMinCoverage(1);
          }}
          disabled={!newProcessId}
        >
          <span>+ Add process to brand</span>
        </button>
      </div>
    </div>
  );
}

function BrandProcessRowItem({ bp, onUpdate }) {
  const [minCoverage, setMinCoverage] = useState(bp.minCoverage || 1);
  const [rule, setRule] = useState(bp.operatingRule || '');

  return (
    <tr>
      <td className="brand-td">
        <span className="process-name-text">{bp.process?.name}</span>
      </td>
      <td className="brand-td">
        <input
          type="number"
          min="1"
          className="min-cov-input"
          value={minCoverage}
          onChange={(e) => setMinCoverage(Math.max(1, Number(e.target.value) || 1))}
        />
      </td>
      <td className="brand-td">
        <CustomSelect
          value={rule}
          onChange={(e) => setRule(e.target.value)}
          options={RULE_OVERRIDE_OPTIONS}
          style={{ minWidth: '180px' }}
        />
      </td>
      <td className="brand-td">
        {!bp.assignments || bp.assignments.length === 0 ? (
          <span className="emp-pill-none">
            <span>⚠</span> None assigned
          </span>
        ) : (
          bp.assignments.map((a) => (
            <span key={a.id} className="emp-pill-assigned">
              {a.employee?.name}
            </span>
          ))
        )}
      </td>
      <td className="brand-td" style={{ textAlign: 'right' }}>
        <button
          type="button"
          className="btn-save-bp"
          onClick={() => onUpdate(bp, minCoverage, rule || null)}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
