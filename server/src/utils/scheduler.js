import { prisma } from '../prisma.js';
import { ymd, monthDays } from './dates.js';

export const OPERATING_RULES = [
  'ALL_365',
  'DAILY_EXCEPT_PUBLIC_HOLIDAYS',
  'NO_SUNDAYS_AND_HOLIDAYS',
];

/** Does a brand/process operate on this date? */
export function operatesOn(rule, date, isHoliday) {
  const dow = new Date(date).getUTCDay();
  if (rule === 'ALL_365') return true;
  if (rule === 'DAILY_EXCEPT_PUBLIC_HOLIDAYS') return !isHoliday;
  if (rule === 'NO_SUNDAYS_AND_HOLIDAYS') return !isHoliday && dow !== 0;
  return true;
}

function buildLeaveMap(leaves) {
  const map = new Map();
  for (const lv of leaves) {
    const cur = new Date(lv.startDate);
    const end = new Date(lv.endDate);
    const bucket = map.get(lv.employeeId) || new Map();
    while (cur <= end) {
      bucket.set(ymd(cur), lv.type === 'COMP_OFF' ? 'COMP_OFF' : 'LEAVE');
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    map.set(lv.employeeId, bucket);
  }
  return map;
}

/**
 * Deterministic greedy scheduler.
 */
export async function buildRoster({ month, year }) {
  const [brandProcesses, holidays, leaves, employees] = await Promise.all([
    prisma.brandProcess.findMany({
      include: {
        brand: true,
        process: true,
        assignments: { include: { employee: true } },
      },
    }),
    prisma.publicHoliday.findMany(),
    prisma.leave.findMany({ where: { status: 'APPROVED' } }),
    prisma.employee.findMany({ where: { isActive: true } }),
  ]);

  const holidaySet = new Set(holidays.map((h) => ymd(h.date)));
  const leaveMap = buildLeaveMap(leaves);
  const workload = new Map(employees.map((e) => [e.id, 0]));

  const days = monthDays(month, year);
  const entries = [];

  for (const date of days) {
    const key = ymd(date);
    const dow = date.getUTCDay();
    const isHoliday = holidaySet.has(key);

    const onLeave = (empId) => leaveMap.get(empId)?.has(key) || false;
    const leaveStatus = (empId) =>
      leaveMap.get(empId)?.get(key) === 'COMP_OFF' ? 'COMP_OFF' : 'LEAVE';

    // Build today's demand list
    const demand = [];
    for (const bp of brandProcesses) {
      const rule = bp.operatingRule || bp.brand.operatingRule;
      if (!operatesOn(rule, date, isHoliday)) continue;

      const candidates = bp.assignments
        .map((a) => a.employee)
        .filter((e) => e && e.isActive);

      if (candidates.length === 0) continue;

      demand.push({ bp, candidates });
    }

    demand.sort((a, b) => a.candidates.length - b.candidates.length);

    // Greedy allocation
    const assignedToday = new Set();
    const todayEntries = [];

    for (const { bp, candidates } of demand) {
      const available = candidates.filter(
        (e) => !assignedToday.has(e.id) && !onLeave(e.id)
      );

      available.sort((a, b) => {
        const aOff = a.weeklyOffDay === dow ? 1 : 0;
        const bOff = b.weeklyOffDay === dow ? 1 : 0;
        if (aOff !== bOff) return aOff - bOff;
        return workload.get(a.id) - workload.get(b.id);
      });

      for (const emp of available.slice(0, bp.minCoverage)) {
        assignedToday.add(emp.id);
        workload.set(emp.id, workload.get(emp.id) + 1);
        todayEntries.push({
          date,
          employeeId: emp.id,
          brandProcessId: bp.id,
          status: 'WORKING',
        });
      }
    }

    // Everyone else gets an off status
    for (const emp of employees) {
      if (assignedToday.has(emp.id)) continue;

      let status = 'WEEKLY_OFF';
      if (onLeave(emp.id)) status = leaveStatus(emp.id);
      else if (emp.weeklyOffDay === dow) status = 'WEEKLY_OFF';
      else if (isHoliday) status = 'PUBLIC_HOLIDAY';

      todayEntries.push({
        date,
        employeeId: emp.id,
        brandProcessId: null,
        status,
      });
    }

    entries.push(...todayEntries);
  }

  return entries;
}

/**
 * Recomputes conflicts from stored roster entries.
 */
export async function computeConflicts(rosterId) {
  const roster = await prisma.roster.findUnique({
    where: { id: rosterId },
    include: {
      entries: {
        include: {
          employee: true,
          brandProcess: { include: { brand: true, process: true } },
        },
      },
    },
  });

  if (!roster) return null;
  if (roster.entries.length === 0) return [];

  const [brandProcesses, holidays, leaves] = await Promise.all([
    prisma.brandProcess.findMany({
      include: { brand: true, process: true, assignments: true },
    }),
    prisma.publicHoliday.findMany(),
    prisma.leave.findMany({ where: { status: 'APPROVED' } }),
  ]);

  const holidaySet = new Set(holidays.map((h) => ymd(h.date)));
  const leaveSet = new Set();

  for (const lv of leaves) {
    const cur = new Date(lv.startDate);
    const end = new Date(lv.endDate);
    while (cur <= end) {
      leaveSet.add(`${ymd(cur)}|${lv.employeeId}`);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  // date|brandProcessId -> working count
  const coverage = new Map();
  for (const e of roster.entries) {
    if (e.status === 'WORKING' && e.brandProcessId) {
      const k = `${ymd(e.date)}|${e.brandProcessId}`;
      coverage.set(k, (coverage.get(k) || 0) + 1);
    }
  }

  const conflicts = [];
  const days = monthDays(roster.month, roster.year);

  for (const bp of brandProcesses) {
    const label = `${bp.brand.name} – ${bp.process.name}`;
    if (bp.assignments.length === 0) {
      conflicts.push({
        type: 'NO_EMPLOYEES_ASSIGNED',
        severity: 'critical',
        brandProcessId: bp.id,
        message: `${label} has no employees assigned.`,
      });
      continue;
    }

    const rule = bp.operatingRule || bp.brand.operatingRule;

    for (const date of days) {
      const key = ymd(date);
      if (!operatesOn(rule, date, holidaySet.has(key))) continue;

      const have = coverage.get(`${key}|${bp.id}`) || 0;
      if (have < bp.minCoverage) {
        conflicts.push({
          type: 'COVERAGE_GAP',
          severity: 'critical',
          date: key,
          brandProcessId: bp.id,
          message: `${label}: needs ${bp.minCoverage}, has ${have} on ${key}.`,
        });
      }
    }
  }

  for (const e of roster.entries) {
    const key = ymd(e.date);
    if (e.status === 'WORKING' && leaveSet.has(`${key}|${e.employeeId}`)) {
      conflicts.push({
        type: 'LEAVE_CONFLICT',
        severity: 'critical',
        date: key,
        employeeId: e.employeeId,
        message: `${e.employee.name} is scheduled to work on ${key} but has approved leave.`,
      });
    }

    if (e.status === 'WORKING') {
      const dow = new Date(e.date).getUTCDay();
      if (dow === e.employee.weeklyOffDay) {
        conflicts.push({
          type: 'WEEKLY_OFF_OVERRIDE',
          severity: 'warning',
          date: key,
          employeeId: e.employeeId,
          message: `${e.employee.name} is working on their preferred weekly off (${key}).`,
        });
      }
    }
  }

  return conflicts;
}
