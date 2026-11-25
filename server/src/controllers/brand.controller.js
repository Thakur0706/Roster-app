import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const brands = await prisma.brand.findMany({
    include: {
      brandProcesses: {
        include: {
          process: true,
          assignments: { include: { employee: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json(brands);
});

export const create = ah(async (req, res) => {
  const { name, operatingRule } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const brand = await prisma.brand.create({
    data: { name, operatingRule: operatingRule || 'DAILY_EXCEPT_PUBLIC_HOLIDAYS' },
  });
  res.status(201).json(brand);
});

export const update = ah(async (req, res) => {
  const { name, operatingRule } = req.body;
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: { name, operatingRule },
  });
  res.json(brand);
});

export const remove = ah(async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
