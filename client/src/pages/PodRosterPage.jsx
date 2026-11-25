import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CODE = {
  WORKING: 'W',
  WEEKLY_OFF: 'WO',
  PUBLIC_HOLIDAY: 'PH',
  LEAVE: 'L',
  COMP_OFF: 'CO',
};

function buildDays(month, year) {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: total }, (_, i) => {
    const day = i + 1;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return { day, iso, dow };
  });
}

export default function PodRosterPage() {
  const { podId } = useParams();
  const [searchParams] = useSearchParams();
  const today = new Date();
  const month = Number(searchParams.get('month')) || today.getMonth() + 1;
  const year = Number(searchParams.get('year')) || today.getFullYear();

  const [pod, setPod] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [roster, setRoster] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => buildDays(month, year), [month, year]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/pods'),
      api.get('/employees'),
      api.get('/rosters', { params: { month, year } }),
      api.get('/holidays'),
    ])
      .then(([podRes, empRes, rosterRes, holidayRes]) => {
        const foundPod = podRes.data.find((p) => p.id === podId);
        setPod(foundPod);

        const podEmployees = empRes.data.filter((e) => e.podId === podId);
        setEmployees(podEmployees);

        setRoster(rosterRes.data.roster);
        setHolidays(holidayRes.data);

        if (rosterRes.data.roster) {
          return api.get(`/rosters/${rosterRes.data.roster.id}/conflicts`);
        }
        return { data: [] };
      })
      .then((conflictRes) => {
        setConflicts(conflictRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [podId, month, year]);

  const entryIndex = useMemo(() => {
    const map = new Map();
    if (roster) {
      for (const e of roster.entries) {
        map.set(`${e.date.slice(0, 10)}|${e.employeeId}`, e);
      }
    }
    return map;
  }, [roster]);

  const podStats = useMemo(() => {
    if (!roster) return { working: 0, weeklyOff: 0, leave: 0, publicHoliday: 0 };

    const podEmpIds = new Set(employees.map((e) => e.id));
    const entries = roster.entries.filter((e) => podEmpIds.has(e.employeeId));

    return {
      working: entries.filter((e) => e.status === 'WORKING').length,
      weeklyOff: entries.filter((e) => e.status === 'WEEKLY_OFF').length,
      leave: entries.filter((e) => e.status === 'LEAVE' || e.status === 'COMP_OFF').length,
      publicHoliday: entries.filter((e) => e.status === 'PUBLIC_HOLIDAY').length,
    };
  }, [roster, employees]);

  const podConflicts = useMemo(() => {
    const podEmpIds = new Set(employees.map((e) => e.id));
    return conflicts.filter((c) => {
      if (c.employeeId && podEmpIds.has(c.employeeId)) return true;
      return false;
    });
  }, [conflicts, employees]);

  if (loading) return <div className="muted">Loading…</div>;

  if (!pod) return <div className="notice">Pod not found</div>;

  const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            {pod.name} Roster — {monthName} {year}
          </h2>
          <div className="muted small">Lead: {pod.lead?.name || 'Not assigned'}</div>
        </div>
        <Link to={`/roster?month=${month}&year=${year}`}>
          <button className="btn">← Back to company view</button>
        </Link>
      </div>

      <div className="notice">Read-only. Edit from the company roster view.</div>

      {!roster && (
        <div className="card">
          No roster generated for this month yet.
        </div>
      )}

      {roster && (
        <>
          <div className="card mb">
            <h3>Pod Coverage Summary</h3>
            <div className="row gap mt">
              <div className="pill">Working days: <b>{podStats.working}</b></div>
              <div className="pill">Weekly offs: <b>{podStats.weeklyOff}</b></div>
              <div className="pill">Leaves: <b>{podStats.leave}</b></div>
              <div className="pill">Public holidays: <b>{podStats.publicHoliday}</b></div>
            </div>
          </div>

          <div className="card mb">
            <div className="table-scroll">
              <table className="grid">
                <thead>
                  <tr>
                    <th className="sticky-col">Employee</th>
                    {days.map((d) => (
                      <th key={d.iso} className="day-head">
                        <div>{d.day}</div>
                        <div className="dow">{DAY_LABELS[d.dow]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="sticky-col">
                        <div className="emp-name">{emp.name}</div>
                        <div className="muted small">Off {DAY_LABELS[emp.weeklyOffDay]}</div>
                      </td>
                      {days.map((d) => {
                        const entry = entryIndex.get(`${d.iso}|${emp.id}`);
                        const status = entry?.status;
                        return (
                          <td
                            key={d.iso}
                            className={`cell status-${status || 'none'}`}
                            title={
                              entry?.brandProcess
                                ? `${entry.brandProcess.brand.name} – ${entry.brandProcess.process.name}`
                                : status || 'No entry'
                            }
                          >
                            {CODE[status] || '–'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Conflicts ({podConflicts.length})</h3>
            {podConflicts.length === 0 && <p className="muted">No conflicts for this pod.</p>}
            <div className="conflict-list">
              {podConflicts.map((c, i) => (
                <div key={i} className={`conflict ${c.severity}`}>
                  <span className="tag">{c.type}</span>
                  <span>{c.message}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
