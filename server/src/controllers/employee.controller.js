import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const employees = await prisma.employee.findMany({
    include: {
      pod: { select: { id: true, name: true } },
      assignments: {
        include: {
          brandProcess: {
            include: {
              brand: { select: { id: true, name: true } },
              process: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json(employees);
});

export const create = ah(async (req, res) => {
  const { name, email, podId, weeklyOffDay, isActive } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      email,
      podId: podId || null,
      weeklyOffDay: Number.isInteger(weeklyOffDay) ? weeklyOffDay : 0,
      isActive: isActive !== undefined ? isActive : true,
    },
  });
  res.status(201).json(employee);
});

export const update = ah(async (req, res) => {
  const { name, email, podId, weeklyOffDay, isActive } = req.body;
  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: {
      name,
      email,
      podId: podId === undefined ? undefined : podId || null,
      weeklyOffDay: weeklyOffDay === undefined ? undefined : Number(weeklyOffDay),
      isActive,
    },
  });
  res.json(employee);
});

export const remove = ah(async (req, res) => {
  await prisma.employee.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
