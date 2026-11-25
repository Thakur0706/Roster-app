import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const items = await prisma.assignment.findMany({
    include: {
      employee: { select: { id: true, name: true } },
      brandProcess: { include: { brand: true, process: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

export const create = ah(async (req, res) => {
  const { employeeId, brandProcessId, isPrimary } = req.body;
  if (!employeeId || !brandProcessId) {
    return res.status(400).json({ error: 'employeeId and brandProcessId are required' });
  }

  const item = await prisma.assignment.create({
    data: { employeeId, brandProcessId, isPrimary: isPrimary !== false },
    include: {
      employee: { select: { id: true, name: true } },
      brandProcess: { include: { brand: true, process: true } },
    },
  });
  res.status(201).json(item);
});

export const remove = ah(async (req, res) => {
  await prisma.assignment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
