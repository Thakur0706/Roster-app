import { Router } from 'express';
import * as c from '../controllers/leave.controller.js';

const r = Router();

r.get('/', c.list);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

export default r;
