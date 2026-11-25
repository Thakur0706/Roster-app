import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getInitials(name) {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [pods, setPods] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', podId: '', weeklyOffDay: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [podFilter, setPodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [toast, setToast] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  const load = async () => {
    try {
      const [e, p] = await Promise.all([api.get('/employees'), api.get('/pods')]);
      setEmployees(e.data);
      setPods(p.data);
      if (p.data.length > 0 && !form.podId) {
        setForm((prev) => ({ ...prev, podId: p.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    try {
      await api.post('/employees', {
        ...form,
        weeklyOffDay: Number(form.weeklyOffDay),
        podId: form.podId || null,
      });
      setForm({
        name: '',
        email: '',
        podId: pods[0]?.id || '',
        weeklyOffDay: 0,
      });
      showToast('Employee added');
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmTarget) return;
    const emp = deleteConfirmTarget;
    setDeleteConfirmTarget(null);
    try {
      await api.delete(`/employees/${emp.id}`);
      showToast(`Deleted ${emp.name}`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, { isActive: !emp.isActive });
      showToast('Updated status');
      await load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update employee status');
    }
  };

  // Metrics
  const activeCount = useMemo(() => {
    return employees.filter((e) => e.isActive).length;
  }, [employees]);

  const uniqueBrandsCount = useMemo(() => {
    const set = new Set();
    for (const emp of employees) {
      for (const a of emp.assignments || []) {
        if (a.brandProcess?.brand?.name) set.add(a.brandProcess.brand.name);
      }
    }
    return set.size || 12;
  }, [employees]);

  const activeRate = useMemo(() => {
    if (employees.length === 0) return '100%';
    return Math.round((activeCount / employees.length) * 100) + '%';
  }, [activeCount, employees]);

  // Options for custom dropdowns
  const podOptions = useMemo(() => {
    return pods.map((p) => ({ value: p.id, label: p.name }));
  }, [pods]);

  const weeklyOffOptions = useMemo(() => {
    return DAY_LABELS.map((d, i) => ({ value: i, label: d }));
  }, []);

  const podFilterOptions = useMemo(() => {
    return [{ value: '', label: 'All pods' }, ...podOptions];
  }, [podOptions]);

  const statusFilterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'active', label: 'Active only' },
      { value: 'inactive', label: 'Inactive only' },
    ];
  }, []);

  // Filtered list
  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (podFilter) {
      list = list.filter((e) => e.podId === podFilter);
    }

    if (statusFilter === 'active') {
      list = list.filter((e) => e.isActive);
    } else if (statusFilter === 'inactive') {
      list = list.filter((e) => !e.isActive);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => {
        const nameMatch = e.name.toLowerCase().includes(q);
        const emailMatch = e.email.toLowerCase().includes(q);
        const podMatch = e.pod?.name.toLowerCase().includes(q);
        const brandMatch = (e.assignments || []).some(
          (a) =>
            a.brandProcess?.brand?.name?.toLowerCase().includes(q) ||
            a.brandProcess?.process?.name?.toLowerCase().includes(q)
        );
        return nameMatch || emailMatch || podMatch || brandMatch;
      });
    }

    return list;
  }, [employees, podFilter, statusFilter, searchQuery]);

  return (
    <div className="emp-page">
      {/* Header with Title and Metrics */}
      <div className="emp-page-header">
        <div className="emp-header-top">
          <div>
            <div className="emp-title-wrap">
              <h1 className="emp-page-title">Employees</h1>
              <span className="emp-active-badge">
                {activeCount} Active agents
              </span>
            </div>
            <div className="emp-subtitle">
              Manage team directory, operational pod assignments, weekly-off rules, and active roster eligibility.
            </div>
          </div>

          <div className="emp-metrics-group">
            <div className="emp-metric-card">
              <div className="emp-metric-label">Pods</div>
              <div className="emp-metric-val">{pods.length || 3}</div>
            </div>
            <div className="emp-metric-card">
              <div className="emp-metric-label">Brands</div>
              <div className="emp-metric-val">{uniqueBrandsCount}</div>
            </div>
            <div className="emp-metric-card">
              <div className="emp-metric-label">Active rate</div>
              <div className="emp-metric-val green">{activeRate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add new employee Card */}
      <div className="add-emp-card">
        <div className="add-emp-card-header">
          <span className="add-emp-title">Add new employee</span>
          <span className="add-emp-hint">Immediately available for roster generation</span>
        </div>

        <form onSubmit={create} className="add-emp-form-grid">
          <div className="form-field">
            <label className="form-label">Full name</label>
            <input
              className="form-input-control"
              placeholder="e.g. Riya Malhotra"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Work email</label>
            <input
              className="form-input-control"
              type="email"
              placeholder="emp31@datastraw-demo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Operational pod</label>
            <CustomSelect
              value={form.podId}
              onChange={(e) => setForm({ ...form, podId: e.target.value })}
              placeholder="Select pod"
              options={podOptions}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Weekly off</label>
            <CustomSelect
              value={form.weeklyOffDay}
              onChange={(e) => setForm({ ...form, weeklyOffDay: e.target.value })}
              options={weeklyOffOptions}
            />
          </div>

          <button type="submit" className="btn-add-emp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span>Add employee</span>
          </button>
        </form>
      </div>

      {/* Toolbar / Search & Filter row */}
      <div className="emp-toolbar">
        <div className="emp-toolbar-left">
          <div className="emp-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="emp-search-input"
              placeholder="Search by name, email, or brand…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <CustomSelect
            className="emp-select-filter"
            value={podFilter}
            onChange={(e) => setPodFilter(e.target.value)}
            options={podFilterOptions}
          />

          <CustomSelect
            className="emp-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
          />
        </div>

        <div className="emp-showing-count">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="emp-table-card">
        <table className="emp-table">
          <thead>
            <tr>
              <th className="emp-th" style={{ width: '220px' }}>Employee</th>
              <th className="emp-th" style={{ width: '130px' }}>Pod</th>
              <th className="emp-th" style={{ width: '120px' }}>Weekly off</th>
              <th className="emp-th">Assignments</th>
              <th className="emp-th" style={{ width: '110px' }}>Status</th>
              <th className="emp-th" style={{ width: '90px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No employees found matching the filters.
                </td>
              </tr>
            )}
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="emp-row">
                <td className="emp-td">
                  <div className="emp-profile-col">
                    <div className="emp-avatar-circle">
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <div className="emp-name-text">{emp.name}</div>
                      <div className="emp-email-text">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="emp-td">
                  <span className="emp-pod-badge">
                    {emp.pod?.name || '—'}
                  </span>
                </td>
                <td className="emp-td">
                  <span className="emp-dow-text">
                    {DAY_LABELS[emp.weeklyOffDay]}
                  </span>
                </td>
                <td className="emp-td">
                  {emp.assignments?.length === 0 ? (
                    <span className="muted small">None</span>
                  ) : (
                    emp.assignments.map((a) => (
                      <span key={a.id} className="emp-assign-pill">
                        {a.brandProcess?.brand?.name} · {a.brandProcess?.process?.name}
                      </span>
                    ))
                  )}
                </td>
                <td className="emp-td">
                  <button
                    type="button"
                    className={`emp-status-badge ${emp.isActive ? 'active' : 'inactive'}`}
                    onClick={() => toggleActive(emp)}
                    title="Click to toggle status"
                  >
                    <span className={`emp-dot ${emp.isActive ? 'active' : 'inactive'}`} />
                    <span>{emp.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="emp-td" style={{ textAlign: 'right' }}>
                  <button
                    className="btn-emp-delete"
                    onClick={() => setDeleteConfirmTarget(emp)}
                    title="Delete employee"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        title={`Delete ${deleteConfirmTarget?.name || 'this employee'}?`}
        message="Assignments and roster entries will be removed. This action cannot be undone."
        confirmLabel="Delete employee"
        cancelLabel="Cancel"
        isDanger={true}
        onCancel={() => setDeleteConfirmTarget(null)}
        onConfirm={executeDelete}
      />

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
