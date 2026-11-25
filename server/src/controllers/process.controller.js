import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  res.json(await prisma.process.findMany({ orderBy: { name: 'asc' } }));
});

export const create = ah(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  res.status(201).json(await prisma.process.create({ data: { name } }));
});

export const update = ah(async (req, res) => {
  res.json(
    await prisma.process.update({
      where: { id: req.params.id },
      data: { name: req.body.name },
    })
  );
});

export const remove = ah(async (req, res) => {
  await prisma.process.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
