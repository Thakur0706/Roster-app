import { useEffect, useState, useMemo } from 'react';
import api from '../api';
import CustomSelect from '../components/CustomSelect';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brandProcesses, setBrandProcesses] = useState([]);
  const [form, setForm] = useState({
    employeeId: '',
    brandProcessId: '',
    allocation: 'primary',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const [a, e, bp] = await Promise.all([
        api.get('/assignments'),
        api.get('/employees'),
        api.get('/brand-processes'),
      ]);
      setAssignments(a.data || []);
      setEmployees(e.data || []);
      setBrandProcesses(bp.data || []);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Metric 1: Assigned agents (unique count of assigned employees)
  const assignedAgentsCount = useMemo(() => {
    return new Set(assignments.map((a) => a.employeeId || a.employee?.id).filter(Boolean)).size;
  }, [assignments]);

  // Metric 2: Multi-brand (employees assigned to > 1 brand)
  const multiBrandCount = useMemo(() => {
    const empBrands = {};
    assignments.forEach((a) => {
      const empId = a.employeeId || a.employee?.id;
      const brandId = a.brandProcess?.brandId || a.brandProcess?.brand?.id || a.brandProcess?.brand?.name;
      if (empId && brandId) {
        if (!empBrands[empId]) empBrands[empId] = new Set();
        empBrands[empId].add(brandId);
      }
    });
    return Object.values(empBrands).filter((set) => set.size > 1).length;
  }, [assignments]);

  // Metric 3: Active brands (unique brands assigned)
  const activeBrandsCount = useMemo(() => {
    return new Set(
      assignments
        .map((a) => a.brandProcess?.brandId || a.brandProcess?.brand?.id || a.brandProcess?.brand?.name)
        .filter(Boolean)
    ).size;
  }, [assignments]);

  // Metric 4: Open slots (deficits where bp.minCoverage > assigned)
  const openSlotsCount = useMemo(() => {
    const counts = {};
    assignments.forEach((a) => {
      const bpid = a.brandProcessId || a.brandProcess?.id;
      if (bpid) counts[bpid] = (counts[bpid] || 0) + 1;
    });

    return brandProcesses.reduce((acc, bp) => {
      const assigned = counts[bp.id] || 0;
      const minCov = bp.minCoverage !== undefined ? bp.minCoverage : 1;
      return acc + Math.max(0, minCov - assigned);
    }, 0);
  }, [brandProcesses, assignments]);

  // Form options
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: e.id,
      label: `${e.name} (${e.pod?.name || 'No Pod'})`,
    }));
  }, [employees]);

  const bpOptions = useMemo(() => {
    const counts = {};
    assignments.forEach((a) => {
      const bpid = a.brandProcessId || a.brandProcess?.id;
      if (bpid) counts[bpid] = (counts[bpid] || 0) + 1;
    });

    return brandProcesses.map((bp) => {
      const count = counts[bp.id] || 0;
      const isGap = count < (bp.minCoverage || 1);
      const brandName = bp.brand?.name || 'Unknown';
      const procName = bp.process?.name || 'Unknown';
      return {
        value: bp.id,
        label: `${brandName} – ${procName}${isGap ? ' (Gap)' : ''}`,
      };
    });
  }, [brandProcesses, assignments]);

  const allocationOptions = [
    { value: 'primary', label: 'Primary' },
    { value: 'shared', label: 'Shared' },
  ];

  // Filter options
  const brandFilterOptions = useMemo(() => {
    const brandNames = Array.from(
      new Set(brandProcesses.map((bp) => bp.brand?.name).filter(Boolean))
    ).sort();
    return [
      { value: '', label: 'All brands' },
      ...brandNames.map((name) => ({ value: name, label: name })),
    ];
  }, [brandProcesses]);

  const processFilterOptions = useMemo(() => {
    const procNames = Array.from(
      new Set(brandProcesses.map((bp) => bp.process?.name).filter(Boolean))
    ).sort();
    return [
      { value: '', label: 'All processes' },
      ...procNames.map((name) => ({ value: name, label: name })),
    ];
  }, [brandProcesses]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const empName = a.employee?.name || '';
      const brandName = a.brandProcess?.brand?.name || '';
      const procName = a.brandProcess?.process?.name || '';

      if (brandFilter && brandName !== brandFilter) return false;
      if (processFilter && procName !== processFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          empName.toLowerCase().includes(q) ||
          brandName.toLowerCase().includes(q) ||
          procName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assignments, brandFilter, processFilter, searchQuery]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.brandProcessId) {
      setToast('Please select both an employee and a brand process');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      await api.post('/assignments', {
        employeeId: form.employeeId,
        brandProcessId: form.brandProcessId,
        isPrimary: form.allocation === 'primary',
      });
      setForm({ employeeId: '', brandProcessId: '', allocation: 'primary' });
      setToast('Assignment created successfully');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to create assignment');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      setToast('Assignment removed');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to remove assignment');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatRule = (bp) => {
    const rule = bp?.operatingRule || bp?.brand?.operatingRule;
    if (rule === 'ALL_365') return '365d ops';
    if (rule === 'DAILY_EXCEPT_PUBLIC_HOLIDAYS') return 'Daily (PH off)';
    if (rule === 'NO_SUNDAYS_AND_HOLIDAYS') return 'No Sun/PH';
    return rule || 'Daily (PH off)';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="assign-page-header">
        <div className="assign-header-top">
          <div>
            <div className="assign-title-wrap">
              <h1 className="assign-page-title">Assignments</h1>
              <span className="assign-badge">{assignments.length} Active mappings</span>
            </div>
            <div className="assign-subtitle">
              Map employees to brand-process pairs for dedicated 80% accounts and shared multi-agent operations.
            </div>
          </div>

          <div className="assign-metrics-group">
            <div className="assign-metric-card">
              <div className="assign-metric-label">Assigned agents</div>
              <div className="assign-metric-val">{assignedAgentsCount}</div>
            </div>
            <div className="assign-metric-card">
              <div className="assign-metric-label">Multi-brand</div>
              <div className="assign-metric-val">{multiBrandCount}</div>
            </div>
            <div className="assign-metric-card">
              <div className="assign-metric-label">Active brands</div>
              <div className="assign-metric-val">{activeBrandsCount}</div>
            </div>
            <div className="assign-metric-card">
              <div className="assign-metric-label">Open slots</div>
              <div className="assign-metric-val red">{openSlotsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Form Card */}
      <div className="assign-card">
        <div className="assign-card-header">
          <div className="assign-card-title">Assign employee to brand process</div>
          <div className="assign-card-hint">Updates roster eligibility immediately</div>
        </div>
        <form className="assign-form-grid" onSubmit={create}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Employee</label>
            <CustomSelect
              value={form.employeeId}
              onChange={(e, val) =>
                setForm((prev) => ({ ...prev, employeeId: val !== undefined ? val : e.target.value }))
              }
              options={employeeOptions}
              placeholder="Select employee..."
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Brand – process</label>
            <CustomSelect
              value={form.brandProcessId}
              onChange={(e, val) =>
                setForm((prev) => ({ ...prev, brandProcessId: val !== undefined ? val : e.target.value }))
              }
              options={bpOptions}
              placeholder="Select brand – process..."
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Allocation</label>
            <CustomSelect
              value={form.allocation}
              onChange={(e, val) =>
                setForm((prev) => ({ ...prev, allocation: val !== undefined ? val : e.target.value }))
              }
              options={allocationOptions}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn-assign-action">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Assign
          </button>
        </form>
      </div>

      {/* Toolbar */}
      <div className="assign-toolbar">
        <div className="assign-toolbar-left">
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '11px', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="assign-search-input"
              placeholder="Search employee, brand, or process..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <CustomSelect
            value={brandFilter}
            onChange={(e, val) => setBrandFilter(val !== undefined ? val : e.target.value)}
            options={brandFilterOptions}
            style={{ minWidth: '130px' }}
          />

          <CustomSelect
            value={processFilter}
            onChange={(e, val) => setProcessFilter(val !== undefined ? val : e.target.value)}
            options={processFilterOptions}
            style={{ minWidth: '145px' }}
          />
        </div>

        <div className="assign-showing-count">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </div>
      </div>

      {/* Assignments Table */}
      <div className="assign-table-card">
        <table className="assign-table">
          <thead>
            <tr>
              <th className="assign-th" style={{ width: '28%' }}>Employee</th>
              <th className="assign-th" style={{ width: '20%' }}>Brand</th>
              <th className="assign-th" style={{ width: '24%' }}>Process</th>
              <th className="assign-th" style={{ width: '16%' }}>Allocation</th>
              <th className="assign-th" style={{ width: '12%', textAlign: 'right', paddingRight: '24px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  {searchQuery || brandFilter || processFilter
                    ? 'No assignments match the selected filters.'
                    : 'No assignments found.'}
                </td>
              </tr>
            ) : (
              filteredAssignments.map((a) => {
                const empObj = employeeMap.get(a.employeeId || a.employee?.id) || a.employee;
                const empName = empObj?.name || a.employee?.name || 'Unknown';
                const empPod = empObj?.pod?.name;
                const brand = a.brandProcess?.brand;
                const process = a.brandProcess?.process;
                const isPrimary = a.isPrimary !== false;

                return (
                  <tr key={a.id} className="assign-row">
                    {/* Employee column */}
                    <td className="assign-td">
                      <div className="assign-emp-cell">
                        <div className="assign-avatar">{getInitials(empName)}</div>
                        <span className="assign-emp-name">{empName}</span>
                        {empPod && <span className="assign-pod-pill">{empPod}</span>}
                      </div>
                    </td>

                    {/* Brand column */}
                    <td className="assign-td">
                      <div className="assign-brand-name">{brand?.name || '—'}</div>
                      <div className="assign-brand-sub">{formatRule(a.brandProcess)}</div>
                    </td>

                    {/* Process column */}
                    <td className="assign-td">
                      <span className="assign-process-badge">{process?.name || '—'}</span>
                    </td>

                    {/* Allocation column */}
                    <td className="assign-td">
                      <span className={`assign-alloc-pill ${isPrimary ? 'primary' : 'shared'}`}>
                        {isPrimary ? 'Primary' : 'Shared'}
                      </span>
                    </td>

                    {/* Action column */}
                    <td className="assign-td" style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <button className="btn-remove-assign" onClick={() => remove(a.id)}>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          <line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
