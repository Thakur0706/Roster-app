import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';
import { utcDate } from '../utils/dates.js';

export const list = ah(async (req, res) => {
  res.json(await prisma.publicHoliday.findMany({ orderBy: { date: 'asc' } }));
});

export const create = ah(async (req, res) => {
  const { date, name } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'date and name are required' });

  const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
  const item = await prisma.publicHoliday.create({
    data: { date: utcDate(y, m, d), name },
  });
  res.status(201).json(item);
});

export const remove = ah(async (req, res) => {
  await prisma.publicHoliday.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
