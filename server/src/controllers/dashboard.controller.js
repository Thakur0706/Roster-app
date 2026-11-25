import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { computeConflicts, operatesOn } from '../utils/scheduler.js';
import { ymd, monthDays } from '../utils/dates.js';

export const getStats = ah(async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!month || !year) {
    return res.status(400).json({ error: 'month and year are required' });
  }

  // Fetch counts
  const [employees, brands, pods, processes] = await Promise.all([
    prisma.employee.findMany(),
    prisma.brand.findMany(),
    prisma.pod.findMany(),
    prisma.process.findMany(),
  ]);

  const counts = {
    employees: employees.length,
    activeEmployees: employees.filter((e) => e.isActive).length,
    brands: brands.length,
    pods: pods.length,
    processes: processes.length,
  };

  // Roster status
  const roster = await prisma.roster.findUnique({
    where: { month_year: { month, year } },
    select: { id: true, status: true },
  });

  const rosterInfo = {
    exists: !!roster,
    status: roster?.status || null,
    rosterId: roster?.id || null,
  };

  // Today's breakdown
  const today = new Date();
  const todayStr = ymd(today);
  const todayMonth = today.getUTCMonth() + 1;
  const todayYear = today.getUTCFullYear();

  let todayData = {
    date: todayStr,
    working: 0,
    onLeave: 0,
    onWeeklyOff: 0,
    onPublicHoliday: 0,
    notInRoster: 0,
  };

  if (roster && todayMonth === month && todayYear === year) {
    const entries = await prisma.rosterEntry.findMany({
      where: { rosterId: roster.id, date: new Date(`${todayStr}T00:00:00Z`) },
    });

    const entryMap = new Map(entries.map((e) => [e.employeeId, e]));

    todayData.working = entries.filter((e) => e.status === 'WORKING').length;
    todayData.onLeave = entries.filter((e) => e.status === 'LEAVE' || e.status === 'COMP_OFF').length;
    todayData.onWeeklyOff = entries.filter((e) => e.status === 'WEEKLY_OFF').length;
    todayData.onPublicHoliday = entries.filter((e) => e.status === 'PUBLIC_HOLIDAY').length;
    todayData.notInRoster = employees.filter((e) => e.isActive && !entryMap.has(e.id)).length;
  }

  // Conflicts
  let conflictsData = { critical: 0, warning: 0 };
  if (roster) {
    const conflicts = await computeConflicts(roster.id);
    conflictsData.critical = conflicts.filter((c) => c.severity === 'critical').length;
    conflictsData.warning = conflicts.filter((c) => c.severity === 'warning').length;
  }

  // Coverage calculation
  let coverageData = { requiredSlots: 0, coveredSlots: 0, percentage: 0 };

  if (roster) {
    const [brandProcesses, holidays, entries] = await Promise.all([
      prisma.brandProcess.findMany({
        include: { brand: true },
      }),
      prisma.publicHoliday.findMany(),
      prisma.rosterEntry.findMany({
        where: { rosterId: roster.id, status: 'WORKING' },
      }),
    ]);

    const holidaySet = new Set(holidays.map((h) => ymd(h.date)));
    const days = monthDays(month, year);

    for (const bp of brandProcesses) {
      const rule = bp.operatingRule || bp.brand.operatingRule;
      for (const date of days) {
        if (operatesOn(rule, date, holidaySet.has(ymd(date)))) {
          coverageData.requiredSlots += bp.minCoverage;
        }
      }
    }

    coverageData.coveredSlots = entries.filter((e) => e.brandProcessId !== null).length;
    coverageData.percentage = coverageData.requiredSlots > 0
      ? Math.min(100, Math.round((coverageData.coveredSlots / coverageData.requiredSlots) * 100))
      : 0;
  }

  res.json({
    counts,
    roster: rosterInfo,
    today: todayData,
    conflicts: conflictsData,
    coverage: coverageData,
  });
});
