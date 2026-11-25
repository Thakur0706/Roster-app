import { Router } from 'express';
import * as c from '../controllers/dashboard.controller.js';

const r = Router();

r.get('/', c.getStats);

export default r;
