import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { buildRoster, computeConflicts } from '../utils/scheduler.js';
import { ymd, utcDate } from '../utils/dates.js';

const rosterInclude = {
  entries: {
    include: {
      employee: { select: { id: true, name: true, weeklyOffDay: true, podId: true } },
      brandProcess: {
        include: {
          brand: { select: { id: true, name: true } },
          process: { select: { id: true, name: true } },
        },
      },
    },
  },
};

export const getByMonth = ah(async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

  const roster = await prisma.roster.findUnique({
    where: { month_year: { month, year } },
    include: rosterInclude,
  });

  res.json({ roster: roster || null });
});

export const generate = ah(async (req, res) => {
  const month = Number(req.body.month);
  const year = Number(req.body.year);

  if (!month || month < 1 || month > 12 || !year) {
    return res.status(400).json({ error: 'Valid month (1-12) and year are required' });
  }

  let roster = await prisma.roster.findUnique({ where: { month_year: { month, year } } });

  if (roster && roster.status === 'PUBLISHED') {
    return res.status(400).json({ error: 'Roster is published. Unpublish before regenerating.' });
  }

  if (!roster) {
    roster = await prisma.roster.create({ data: { month, year } });
  } else {
    await prisma.rosterEntry.deleteMany({ where: { rosterId: roster.id } });
  }

  const entries = await buildRoster({ month, year });

  await prisma.rosterEntry.createMany({
    data: entries.map((e) => ({ rosterId: roster.id, ...e })),
  });

  const conflicts = await computeConflicts(roster.id);

  res.json({ rosterId: roster.id, entryCount: entries.length, conflicts });
});

export const getOne = ah(async (req, res) => {
  const roster = await prisma.roster.findUnique({
    where: { id: req.params.id },
    include: rosterInclude,
  });

  if (!roster) return res.status(404).json({ error: 'Roster not found' });

  res.json(roster);
});

export const getConflicts = ah(async (req, res) => {
  const conflicts = await computeConflicts(req.params.id);
  if (conflicts === null) return res.status(404).json({ error: 'Roster not found' });

  res.json(conflicts);
});

export const updateEntry = ah(async (req, res) => {
  const { status, brandProcessId } = req.body;

  if (status === 'WORKING' && !brandProcessId) {
    return res.status(400).json({ error: 'brandProcessId is required when status is WORKING' });
  }

  const entry = await prisma.rosterEntry.update({
    where: { id: req.params.entryId },
    data: {
      status,
      brandProcessId: status === 'WORKING' ? brandProcessId : null,
    },
    include: {
      employee: { select: { id: true, name: true } },
      brandProcess: { include: { brand: true, process: true } },
    },
  });

  const conflicts = await computeConflicts(entry.rosterId);

  res.json({ entry, conflicts });
});

export const suggestions = ah(async (req, res) => {
  const { date, brandProcessId } = req.query;

  if (!date || !brandProcessId) {
    return res.status(400).json({ error: 'date and brandProcessId are required' });
  }

  const roster = await prisma.roster.findUnique({ where: { id: req.params.id } });
  if (!roster) return res.status(404).json({ error: 'Roster not found' });

  const day = utcDate(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)),
    Number(date.slice(8, 10))
  );

  const [assignments, dayEntries, leaves] = await Promise.all([
    prisma.assignment.findMany({
      where: { brandProcessId },
      include: { employee: true },
    }),
    prisma.rosterEntry.findMany({
      where: { rosterId: roster.id, date: day },
      include: { employee: true },
    }),
    prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: day },
        endDate: { gte: day },
      },
    }),
  ]);

  const workingIds = new Set(
    dayEntries.filter((e) => e.status === 'WORKING').map((e) => e.employeeId)
  );

  const leaveIds = new Set(leaves.map((l) => l.employeeId));

  const dow = day.getUTCDay();

  const candidates = assignments
    .map((a) => a.employee)
    .filter((emp) => emp && emp.isActive)
    .map((emp) => ({
      id: emp.id,
      name: emp.name,
      weeklyOffDay: emp.weeklyOffDay,
      alreadyWorking: workingIds.has(emp.id),
      onLeave: leaveIds.has(emp.id),
      onPreferredOff: emp.weeklyOffDay === dow,
    }))
    .sort((a, b) => {
      const score = (x) => (x.onLeave ? 3 : 0) + (x.alreadyWorking ? 2 : 0) + (x.onPreferredOff ? 1 : 0);
      return score(a) - score(b);
    });

  res.json(candidates);
});

export const publish = ah(async (req, res) => {
  const conflicts = await computeConflicts(req.params.id);
  const critical = (conflicts || []).filter((c) => c.severity === 'critical');

  if (critical.length > 0) {
    return res.status(400).json({
      error: `Cannot publish: ${critical.length} critical conflict(s) remain.`,
      conflicts: critical,
    });
  }

  const roster = await prisma.roster.update({
    where: { id: req.params.id },
    data: { status: 'PUBLISHED' },
  });

  res.json(roster);
});

export const unpublish = ah(async (req, res) => {
  const roster = await prisma.roster.update({
    where: { id: req.params.id },
    data: { status: 'DRAFT' },
  });

  res.json(roster);
});
