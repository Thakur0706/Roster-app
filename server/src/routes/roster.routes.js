import { Router } from 'express';
import * as c from '../controllers/roster.controller.js';

const r = Router();

r.get('/', c.getByMonth);
r.post('/generate', c.generate);
r.get('/:id', c.getOne);
r.get('/:id/conflicts', c.getConflicts);
r.get('/:id/suggestions', c.suggestions);
r.patch('/entries/:entryId', c.updateEntry);
r.post('/:id/publish', c.publish);
r.post('/:id/unpublish', c.unpublish);

export default r;
