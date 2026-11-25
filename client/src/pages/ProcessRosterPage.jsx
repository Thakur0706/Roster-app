import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';

const RULE_LABEL = {
  ALL_365: '365 days',
  DAILY_EXCEPT_PUBLIC_HOLIDAYS: 'Daily (PH off)',
  NO_SUNDAYS_AND_HOLIDAYS: 'No Sun/PH',
};

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

export default function ProcessRosterPage() {
  const { processId } = useParams();
  const [searchParams] = useSearchParams();
  const today = new Date();
  const month = Number(searchParams.get('month')) || today.getMonth() + 1;
  const year = Number(searchParams.get('year')) || today.getFullYear();

  const [process, setProcess] = useState(null);
  const [brandProcesses, setBrandProcesses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roster, setRoster] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => buildDays(month, year), [month, year]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/processes'),
      api.get('/brand-processes'),
      api.get('/employees'),
      api.get('/rosters', { params: { month, year } }),
    ])
      .then(([procRes, bpRes, empRes, rosterRes]) => {
        const foundProcess = procRes.data.find((p) => p.id === processId);
        setProcess(foundProcess);

        const relevantBPs = bpRes.data.filter((bp) => bp.process.id === processId);
        setBrandProcesses(relevantBPs);

        setEmployees(empRes.data);
        setRoster(rosterRes.data.roster);

        if (rosterRes.data.roster) {
          return api.get(`/rosters/${rosterRes.data.roster.id}/conflicts`);
        }
        return { data: [] };
      })
      .then((conflictRes) => {
        setConflicts(conflictRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [processId, month, year]);

  const processEmployees = useMemo(() => {
    const empIds = new Set();
    brandProcesses.forEach((bp) => {
      bp.assignments.forEach((a) => empIds.add(a.employee.id));
    });
    return employees.filter((e) => empIds.has(e.id));
  }, [brandProcesses, employees]);

  const entryIndex = useMemo(() => {
    const map = new Map();
    if (roster) {
      for (const e of roster.entries) {
        map.set(`${e.date.slice(0, 10)}|${e.employeeId}`, e);
      }
    }
    return map;
  }, [roster]);

  const coverageGaps = useMemo(() => {
    const bpIds = new Set(brandProcesses.map((bp) => bp.id));
    return conflicts.filter(
      (c) => c.type === 'COVERAGE_GAP' && c.brandProcessId && bpIds.has(c.brandProcessId)
    );
  }, [conflicts, brandProcesses]);

  if (loading) return <div className="muted">Loading…</div>;

  if (!process) return <div className="notice">Process not found</div>;

  const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            {process.name} — {monthName} {year}
          </h2>
          <div className="muted small">Across {brandProcesses.length} brand(s)</div>
        </div>
        <Link to={`/roster?month=${month}&year=${year}`}>
          <button className="btn">← Back to roster</button>
        </Link>
      </div>

      <div className="notice">Read-only. Edit from the company roster view.</div>

      <div className="card mb">
        <h3>Brands using this process</h3>
        <table className="table mt">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Operating rule</th>
              <th>Min coverage</th>
              <th>Assigned employees</th>
            </tr>
          </thead>
          <tbody>
            {brandProcesses.map((bp) => (
              <tr key={bp.id}>
                <td>{bp.brand.name}</td>
                <td>{RULE_LABEL[bp.operatingRule || bp.brand.operatingRule]}</td>
                <td>{bp.minCoverage}</td>
                <td className="small">
                  {bp.assignments.length === 0 && <span className="muted">None</span>}
                  {bp.assignments.map((a) => a.employee.name).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roster && (
        <div className="card mb">
          <h3>Employee schedule grid (this process)</h3>
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
                {processEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="sticky-col">
                      <div className="emp-name">{emp.name}</div>
                    </td>
                    {days.map((d) => {
                      const entry = entryIndex.get(`${d.iso}|${emp.id}`);
                      if (
                        entry &&
                        entry.status === 'WORKING' &&
                        entry.brandProcess &&
                        entry.brandProcess.process.id === processId
                      ) {
                        const brandShort = entry.brandProcess.brand.name.slice(0, 6);
                        return (
                          <td
                            key={d.iso}
                            className="cell status-WORKING"
                            title={`${entry.brandProcess.brand.name} – ${entry.brandProcess.process.name}`}
                          >
                            {brandShort}
                          </td>
                        );
                      } else if (entry) {
                        return (
                          <td key={d.iso} className={`cell status-${entry.status}`}>
                            {CODE[entry.status] || '–'}
                          </td>
                        );
                      } else {
                        return <td key={d.iso} className="cell">–</td>;
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Coverage gaps for this process</h3>
        {coverageGaps.length === 0 && (
          <p className="muted">No coverage gaps for this process.</p>
        )}
        <div className="conflict-list">
          {coverageGaps.map((c, i) => (
            <div key={i} className="conflict critical">
              <span className="tag">{c.type}</span>
              <span>{c.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
