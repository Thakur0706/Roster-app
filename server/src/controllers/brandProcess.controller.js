import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const items = await prisma.brandProcess.findMany({
    include: {
      brand: true,
      process: true,
      assignments: { include: { employee: { select: { id: true, name: true } } } },
    },
    orderBy: [{ brand: { name: 'asc' } }],
  });
  res.json(items);
});

export const create = ah(async (req, res) => {
  const { brandId, processId, minCoverage, operatingRule } = req.body;
  if (!brandId || !processId) {
    return res.status(400).json({ error: 'brandId and processId are required' });
  }

  const item = await prisma.brandProcess.create({
    data: {
      brandId,
      processId,
      minCoverage: minCoverage ? Number(minCoverage) : 1,
      operatingRule: operatingRule || null,
    },
    include: { brand: true, process: true },
  });
  res.status(201).json(item);
});

export const update = ah(async (req, res) => {
  const { minCoverage, operatingRule } = req.body;
  const item = await prisma.brandProcess.update({
    where: { id: req.params.id },
    data: {
      minCoverage: minCoverage === undefined ? undefined : Number(minCoverage),
      operatingRule: operatingRule === undefined ? undefined : operatingRule || null,
    },
    include: { brand: true, process: true },
  });
  res.json(item);
});

export const remove = ah(async (req, res) => {
  await prisma.brandProcess.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
