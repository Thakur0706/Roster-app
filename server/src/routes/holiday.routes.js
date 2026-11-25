import { Router } from 'express';
import * as c from '../controllers/holiday.controller.js';

const r = Router();

r.get('/', c.list);
r.post('/', c.create);
r.delete('/:id', c.remove);

export default r;
