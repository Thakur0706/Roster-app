import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const pods = await prisma.pod.findMany({
    include: {
      lead: { select: { id: true, name: true } },
      employees: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(pods);
});

export const create = ah(async (req, res) => {
  const { name, leadId } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const pod = await prisma.pod.create({
    data: { name, leadId: leadId || null },
  });
  res.status(201).json(pod);
});

export const update = ah(async (req, res) => {
  const { name, leadId } = req.body;
  const pod = await prisma.pod.update({
    where: { id: req.params.id },
    data: { name, leadId: leadId === undefined ? undefined : leadId || null },
  });
  res.json(pod);
});

export const remove = ah(async (req, res) => {
  await prisma.pod.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
