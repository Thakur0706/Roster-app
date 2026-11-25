import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { utcDate } from '../utils/dates.js';

function toDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return utcDate(y, m, d);
}

export const list = ah(async (req, res) => {
  const items = await prisma.leave.findMany({
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { startDate: 'desc' },
  });
  res.json(items);
});

export const create = ah(async (req, res) => {
  const { employeeId, startDate, endDate, type, status, reason } = req.body;
  if (!employeeId || !startDate || !endDate) {
    return res.status(400).json({ error: 'employeeId, startDate and endDate are required' });
  }

  const item = await prisma.leave.create({
    data: {
      employeeId,
      startDate: toDate(startDate),
      endDate: toDate(endDate),
      type: type || 'PLANNED_LEAVE',
      status: status || 'PENDING',
      reason: reason || null,
    },
    include: { employee: { select: { id: true, name: true } } },
  });
  res.status(201).json(item);
});

export const update = ah(async (req, res) => {
  const { startDate, endDate, type, status, reason } = req.body;
  const item = await prisma.leave.update({
    where: { id: req.params.id },
    data: {
      startDate: startDate ? toDate(startDate) : undefined,
      endDate: endDate ? toDate(endDate) : undefined,
      type,
      status,
      reason,
    },
  });
  res.json(item);
});

export const remove = ah(async (req, res) => {
  await prisma.leave.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
