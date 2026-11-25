import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import podRoutes from './routes/pod.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import brandRoutes from './routes/brand.routes.js';
import processRoutes from './routes/process.routes.js';
import brandProcessRoutes from './routes/brandProcess.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import holidayRoutes from './routes/holiday.routes.js';
import rosterRoutes from './routes/roster.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

function clientOrigin() {
  const raw = process.env.CLIENT_ORIGIN;
  if (!raw || raw.trim() === '*') return '*';
  return raw.split(',').map((origin) => origin.trim().replace(/\/+$/, ''));
}

app.use(cors({ origin: clientOrigin() }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/pods', requireAuth, podRoutes);
app.use('/api/employees', requireAuth, employeeRoutes);
app.use('/api/brands', requireAuth, brandRoutes);
app.use('/api/processes', requireAuth, processRoutes);
app.use('/api/brand-processes', requireAuth, brandProcessRoutes);
app.use('/api/assignments', requireAuth, assignmentRoutes);
app.use('/api/leaves', requireAuth, leaveRoutes);
app.use('/api/holidays', requireAuth, holidayRoutes);
app.use('/api/rosters', requireAuth, rosterRoutes);

app.use(errorHandler);

export default app;
