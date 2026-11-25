import { useEffect, useState, useMemo } from 'react';
import api from '../api';
import CustomSelect from '../components/CustomSelect';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    type: 'PLANNED_LEAVE',
    status: 'APPROVED',
    reason: '',
  });
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '' });
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const [l, h, e] = await Promise.all([
        api.get('/leaves'),
        api.get('/holidays'),
        api.get('/employees'),
      ]);
      setLeaves(l.data || []);
      setHolidays(h.data || []);
      setEmployees(e.data || []);
    } catch (err) {
      console.error('Failed to load leaves & holidays:', err);
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

  // Header Metrics
  const plannedLeaveCount = useMemo(() => {
    return leaves.filter((l) => l.type === 'PLANNED_LEAVE').length;
  }, [leaves]);

  const compOffCount = useMemo(() => {
    return leaves.filter((l) => l.type === 'COMP_OFF').length;
  }, [leaves]);

  const pendingCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'PENDING').length;
  }, [leaves]);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  // Dropdown options
  const employeeOptions = useMemo(() => {
    return employees.map((e) => ({
      value: e.id,
      label: `${e.name} (${e.pod?.name || 'No Pod'})`,
    }));
  }, [employees]);

  const leaveTypeOptions = [
    { value: 'PLANNED_LEAVE', label: 'Planned leave' },
    { value: 'COMP_OFF', label: 'Comp-off' },
    { value: 'SICK_LEAVE', label: 'Sick leave' },
  ];

  const statusOptions = [
    { value: 'APPROVED', label: 'APPROVED' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'REJECTED', label: 'REJECTED' },
  ];

  const createLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      setToast('Please select an employee and dates');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      await api.post('/leaves', leaveForm);
      setLeaveForm({
        employeeId: '',
        startDate: '',
        endDate: '',
        type: 'PLANNED_LEAVE',
        status: 'APPROVED',
        reason: '',
      });
      setToast('Leave entry created');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to create leave');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const setLeaveStatus = async (leave, status) => {
    try {
      await api.put(`/leaves/${leave.id}`, { status });
      setToast(`Leave status updated to ${status}`);
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to update leave status');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const deleteLeave = async (id) => {
    try {
      await api.delete(`/leaves/${id}`);
      setToast('Leave entry deleted');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to delete leave');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const createHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name.trim()) {
      setToast('Please provide a date and holiday name');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      await api.post('/holidays', holidayForm);
      setHolidayForm({ date: '', name: '' });
      setToast('Public holiday added');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to add holiday');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const deleteHoliday = async (id) => {
    try {
      await api.delete(`/holidays/${id}`);
      setToast('Public holiday deleted');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to delete holiday');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderTypeBadge = (type) => {
    if (type === 'COMP_OFF') {
      return <span className="leave-type-badge comp-off">COMP_OFF</span>;
    }
    if (type === 'PLANNED_LEAVE') {
      return <span className="leave-type-badge planned">PLANNED_LEAVE</span>;
    }
    if (type === 'SICK_LEAVE') {
      return <span className="leave-type-badge sick">SICK_LEAVE</span>;
    }
    return <span className="leave-type-badge planned">{type}</span>;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="leaves-page-header">
        <div className="leaves-header-top">
          <div>
            <div className="leaves-title-wrap">
              <h1 className="leaves-page-title">Leaves & public holidays</h1>
              <span className="leaves-badge">
                {leaves.length} Leaves · {holidays.length} Holidays
              </span>
            </div>
            <div className="leaves-subtitle">
              Manage approved planned leaves, comp-offs, and company public holidays that trigger roster coverage validation.
            </div>
          </div>

          <div className="leaves-metrics-group">
            <div className="leaves-metric-card">
              <div className="leaves-metric-label">Planned leave</div>
              <div className="leaves-metric-val">{plannedLeaveCount}</div>
            </div>
            <div className="leaves-metric-card">
              <div className="leaves-metric-label">Comp-off</div>
              <div className="leaves-metric-val">{compOffCount}</div>
            </div>
            <div className="leaves-metric-card">
              <div className="leaves-metric-label">Pending</div>
              <div className="leaves-metric-val">{pendingCount}</div>
            </div>
            <div className="leaves-metric-card">
              <div className="leaves-metric-label">{currentYear} Holidays</div>
              <div className="leaves-metric-val">{holidays.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 1: Employee leaves & comp-offs */}
      <div className="leaves-card">
        <div className="leaves-card-header">
          <div>
            <div className="leaves-card-title">Employee leaves & comp-offs</div>
            <div className="leaves-card-sub">Approved entries automatically flag impacted brands in the Monthly Roster.</div>
          </div>
          <div className="leaves-card-count">{leaves.length} entries</div>
        </div>

        <form className="leave-form-grid" onSubmit={createLeave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Employee</label>
            <CustomSelect
              value={leaveForm.employeeId}
              onChange={(e, val) =>
                setLeaveForm((prev) => ({ ...prev, employeeId: val !== undefined ? val : e.target.value }))
              }
              options={employeeOptions}
              placeholder="Select employee..."
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>From date</label>
            <input
              type="date"
              className="leave-input"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>To date</label>
            <input
              type="date"
              className="leave-input"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Type</label>
            <CustomSelect
              value={leaveForm.type}
              onChange={(e, val) =>
                setLeaveForm((prev) => ({ ...prev, type: val !== undefined ? val : e.target.value }))
              }
              options={leaveTypeOptions}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Reason</label>
            <input
              type="text"
              className="leave-input"
              placeholder="Optional note"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn-add-leave">
            Add
          </button>
        </form>

        <div className="leaves-table-wrap">
          <table className="leaves-table">
            <thead>
              <tr>
                <th className="leaves-th" style={{ width: '30%' }}>Employee</th>
                <th className="leaves-th" style={{ width: '15%' }}>From</th>
                <th className="leaves-th" style={{ width: '15%' }}>To</th>
                <th className="leaves-th" style={{ width: '15%' }}>Type</th>
                <th className="leaves-th" style={{ width: '15%' }}>Status</th>
                <th className="leaves-th" style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No leave entries recorded.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => {
                  const empObj = employeeMap.get(l.employeeId || l.employee?.id) || l.employee;
                  const empName = empObj?.name || l.employee?.name || 'Unknown';
                  const empPod = empObj?.pod?.name || l.employee?.pod?.name;
                  const reason = l.reason;

                  const subline = [empPod, reason].filter(Boolean).join(' · ');

                  return (
                    <tr key={l.id} className="leaves-row">
                      {/* Employee Column */}
                      <td className="leaves-td">
                        <div className="leave-emp-cell">
                          <div className="leave-avatar">{getInitials(empName)}</div>
                          <div>
                            <div className="leave-emp-name">{empName}</div>
                            {subline && <div className="leave-emp-sub">{subline}</div>}
                          </div>
                        </div>
                      </td>

                      {/* From Date */}
                      <td className="leaves-td">
                        <span className="leave-date-text">{l.startDate ? l.startDate.slice(0, 10) : '—'}</span>
                      </td>

                      {/* To Date */}
                      <td className="leaves-td">
                        <span className="leave-date-text">{l.endDate ? l.endDate.slice(0, 10) : '—'}</span>
                      </td>

                      {/* Type Badge */}
                      <td className="leaves-td">
                        {renderTypeBadge(l.type)}
                      </td>

                      {/* Status Custom Select */}
                      <td className="leaves-td">
                        <CustomSelect
                          value={l.status}
                          onChange={(e, val) => setLeaveStatus(l, val !== undefined ? val : e.target.value)}
                          options={statusOptions}
                          className="leave-status-select"
                        />
                      </td>

                      {/* Action */}
                      <td className="leaves-td" style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <button className="btn-delete-row" onClick={() => deleteLeave(l.id)}>
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
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Public holidays */}
      <div className="leaves-card">
        <div className="leaves-card-header">
          <div>
            <div className="leaves-card-title">Public holidays</div>
            <div className="leaves-card-sub">Applies PH schedule code to brands configured with Public Holidays off.</div>
          </div>
          <div className="leaves-card-count">{holidays.length} holidays</div>
        </div>

        <form className="holiday-form-grid" onSubmit={createHoliday}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Date</label>
            <input
              type="date"
              className="leave-input"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Holiday name</label>
            <input
              type="text"
              className="leave-input"
              placeholder="e.g. Guru Nanak Jayanti"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn-add-holiday">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Add holiday
          </button>
        </form>

        <div className="leaves-table-wrap">
          <table className="leaves-table">
            <thead>
              <tr>
                <th className="leaves-th" style={{ width: '20%' }}>Date</th>
                <th className="leaves-th" style={{ width: '32%' }}>Holiday name</th>
                <th className="leaves-th" style={{ width: '36%' }}>Roster impact</th>
                <th className="leaves-th" style={{ width: '12%', textAlign: 'right', paddingRight: '24px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No public holidays registered.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="leaves-row">
                    <td className="leaves-td">
                      <span className="leave-date-text">{h.date ? h.date.slice(0, 10) : '—'}</span>
                    </td>
                    <td className="leaves-td">
                      <div className="holiday-name-text">{h.name}</div>
                    </td>
                    <td className="leaves-td">
                      <div className="holiday-impact-text">Applies PH to non-365d brands</div>
                    </td>
                    <td className="leaves-td" style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <button className="btn-delete-row" onClick={() => deleteHoliday(h.id)}>
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
