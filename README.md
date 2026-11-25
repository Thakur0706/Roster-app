# Smart Roster Management System

A complete, production-ready roster management system built with Node.js, Express, Prisma, PostgreSQL, React, and Vite.

## Features

- **Authentication**: JWT-based auth with role support
- **Master Data Management**: Manage employees, pods, brands, processes
- **Configurable Operating Rules**: Brand-specific operating calendars (365, daily except holidays, no Sundays/holidays)
- **Smart Roster Generation**: Deterministic greedy scheduler that respects constraints
- **Conflict Detection**: Real-time validation with critical/warning severity
- **Multi-View Interface**: Employee view and coverage view
- **Manual Editing**: Click-to-edit with backup suggestions
- **Leave Management**: Planned leave, comp-offs, sick leave tracking
- **Public Holidays**: Configurable holiday calendar

## Prerequisites

- Node.js 18+
- PostgreSQL 13+

## Setup Instructions

### 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE roster_db;"
```

### 2. Backend Setup

```bash
cd roster-app/server
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env to set your DATABASE_URL, JWT_SECRET

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed the database with demo data
npm run seed

# Start the server
npm run dev
```

The API will be running at `http://localhost:4000`

### 3. Frontend Setup

```bash
cd roster-app/client
npm install

# Start the development server
npm run dev
```

The UI will be available at `http://localhost:5173`

### 4. Login

```
Email: admin@datastraw-demo.com
Password: admin123
```

## Demo Flow

### Step 1: Generate a Roster

1. Navigate to the **Roster** page
2. Select current month and year
3. Click **Generate Roster**
4. The system will create roster entries for all employees for the entire month

### Step 2: Review Coverage

1. Switch to **Coverage view** tab
2. Red cells show insufficient coverage (have/need ratio)
3. The seed data includes 365-day brands with single employees having Sunday off, which will show Sunday gaps

### Step 3: Check Conflicts

1. The conflicts panel lists all issues
2. **Critical conflicts** (red):
   - `COVERAGE_GAP`: Not enough employees assigned
   - `NO_EMPLOYEES_ASSIGNED`: Brand-process has no assignments
   - `LEAVE_CONFLICT`: Employee scheduled while on approved leave
3. **Warnings** (yellow):
   - `WEEKLY_OFF_OVERRIDE`: Employee working on preferred day off

### Step 4: Handle a Change (Core Demo)

**Scenario: An employee goes on leave, creating a coverage gap**

1. Go to **Leaves & Holidays** page
2. Add an **APPROVED** leave for an employee who is the only resource on a brand (e.g., employee handling "NovaSkin")
3. Set the leave dates to include a working day
4. Return to **Roster** page
5. The conflicts panel will immediately show a `COVERAGE_GAP` for that brand on those days

**Resolution:**

6. Click the affected cell in the Employee view
7. The modal shows **Backup suggestions** - other employees assigned to that brand-process
8. Candidates are ranked: available employees first, then those on preferred off, then those already working
9. Select another employee, change their status to `WORKING` and assign them to the same brand-process
10. Save → the gap disappears from conflicts

### Step 5: Publish

1. Resolve all **critical** conflicts (warnings are allowed)
2. Click **Publish**
3. The system blocks publishing if critical conflicts remain
4. Published rosters are locked from regeneration (but can be unpublished for edits)

## Architecture Highlights

### Data Model

- **Employee** → belongs to **Pod**, has preferred weekly off day
- **Brand** + **Process** → join entity **BrandProcess** with operating rule and min coverage
- **Assignment**: Many-to-many between Employee and BrandProcess
- **Roster** → **RosterEntry** (one per employee per day)
- **Leave** and **PublicHoliday** are constraint inputs

### Roster Generation Algorithm

Located in `server/src/utils/scheduler.js`:

1. For each day of the month:
   - Build demand list (brand-processes that operate on this day)
   - Sort demand by scarcity (fewest candidates first)
   - Greedy allocation: assign min

Coverage employees to each brand-process
   - Prefer employees NOT on leave, NOT already assigned today, NOT on preferred weekly off
   - Fairness: sort by month-to-date workload
2. Everyone else gets `WEEKLY_OFF`, `PUBLIC_HOLIDAY`, `LEAVE`, or `COMP_OFF`

### Conflict Detection

Located in `server/src/utils/scheduler.js → computeConflicts()`:

- Recomputes all conflicts from stored roster entries + current rules
- This means manual edits are validated immediately
- Returns typed conflicts with severity (critical vs warning)

### Single vs Multi-Resource Brands

Both use the same `BrandProcess.minCoverage`:

- Single-resource brand: `minCoverage = 1`, one `Assignment`
- Multi-resource brand: multiple `Assignment` rows, `minCoverage` can be > 1

The scheduler doesn't distinguish — it just tries to fill `minCoverage` slots from available candidates.

## Design Questions and Answers

### 1. How did I model employees, brands, processes, and pods?

Each employee belongs to a pod and has a preferred weekly off. Brands and processes are separate records, joined by BrandProcess, which stores the operating rule and minimum coverage for that particular brand-process pair. Assignments link employees to the work they can cover. Approved leave and public holidays are separate scheduling inputs, and a monthly roster contains one entry per employee per date.

### 2. How does roster generation work, and how do I check the result?

I chose a deterministic greedy scheduler because its decisions are repeatable and relatively easy to explain. For each day, it finds the brand-processes that operate, considers their active assigned employees, and handles the processes with the fewest candidates first. It assigns up to each process's minimum coverage, skipping employees who are on approved leave or already assigned that day. Among the remaining employees, it prefers people who are not on their weekly off and have had less work so far that month. A separate validation pass checks the saved entries against current coverage rules and approved leave, then reports any conflicts.

### 3. How do single-resource and multi-resource brands differ?

They use the same model and scheduling logic. A single-resource brand-process typically has one employee assignment and minimum coverage of one. A process staffed by several employees has multiple assignments, and its minimum coverage can be raised when more than one person is needed. The scheduler tries to fill the configured number of slots from the employees assigned to that process.

### 4. What happens if the only assigned employee is unavailable?

When generating a roster, the scheduler skips an employee who has approved leave. If that leaves a process below its minimum coverage, the app reports a critical coverage gap. If leave is added after generation, the existing roster entry is not changed automatically; validation flags an employee who is still marked as working on approved leave. The manager can update the roster and review the resulting coverage. Backup suggestions include employees already assigned to the same brand-process, so a manager must add an assignment first if no backup is configured.

### 5. How does the app handle conflicts or insufficient staffing?

The app reports critical issues for coverage gaps, brand-processes with no assigned employees, and work scheduled during approved leave. Working on an employee's preferred weekly off is a warning. Critical issues block publishing; warnings remain visible for the manager to consider. After a manual roster edit, the app recalculates conflicts so the manager can review the impact before publishing.

### 6. Which parts are automated, and which stay under human control?

The app generates a monthly draft, applies operating calendars and approved leave, allocates assigned employees, calculates coverage, and reports conflicts. The operations manager maintains assignments, approves or updates leave, chooses how to resolve gaps and warnings, makes manual edits, and publishes the roster. I left those decisions with a person because the scheduler can surface constraints, but the operations team must decide which staffing changes are workable.

### 7. What would I change if the team and brand count doubled?

I would first measure roster generation time and database query performance, then add indexes or pagination where needed. If generation became too slow for a normal web request, I would move it to a background job. I would also consider a constraint solver if the greedy approach stopped producing useful schedules as the rules became more complex. I would avoid splitting the work strictly by pod without checking cross-brand assignments, since an employee may cover several processes.

### 8. What would I improve with one additional week?

I would start with automated tests for single-resource leave, multi-resource minimum coverage, process-specific calendars, holidays, and the rule that critical conflicts block publishing. Then I would improve backup recommendations. They currently rank employees already assigned to the affected brand-process; a useful next step would be to help the manager identify and explicitly approve other eligible backups.

## Key Design Decisions

| Decision | Why |
|----------|-----|
| One `RosterEntry` per employee per day | Matches reality — prevents double-booking by DB constraint |
| `BrandProcess` as first-class entity | Brand and process rules can differ (per requirements) |
| Rules stored, not hard-coded | `OperatingRule` enum with per-BrandProcess override |
| Conflicts computed, not stored | Manual edits validated instantly, no stale flags |
| Greedy determinism over optimization | Reliable, explainable, debuggable |
| Publish gate on critical conflicts | Enforces "identify conflict rather than silently invalid roster" |
| JWT auth + single ops user | Auth required but deliberately minimal |

## Tech Stack

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios
- Vite

## Project Structure

```
roster-app/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                 # Demo data seeder
│   └── src/
│       ├── controllers/            # Route handlers
│       ├── routes/                 # Express routes
│       ├── middleware/             # Auth & error handling
│       ├── utils/
│       │   ├── scheduler.js        # Core roster algorithm
│       │   └── dates.js            # Date utilities
│       ├── app.js                  # Express app
│       └── index.js                # Server entry point
└── client/
    └── src/
        ├── components/             # React components
        ├── pages/                  # Page components
        ├── auth.jsx                # Auth context
        ├── api.js                  # Axios instance
        └── styles.css              # Global styles
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Masters
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

(Similar CRUD for pods, brands, processes, brand-processes, assignments)

### Leaves & Holidays
- `GET /api/leaves` - List leaves
- `POST /api/leaves` - Create leave
- `PUT /api/leaves/:id` - Update leave status
- `GET /api/holidays` - List public holidays
- `POST /api/holidays` - Add holiday

### Roster
- `GET /api/rosters?month=X&year=Y` - Get roster by month
- `POST /api/rosters/generate` - Generate roster
- `GET /api/rosters/:id/conflicts` - Get conflicts
- `GET /api/rosters/:id/suggestions?date=X&brandProcessId=Y` - Get backup suggestions
- `PATCH /api/rosters/entries/:entryId` - Update roster entry
- `POST /api/rosters/:id/publish` - Publish roster
- `POST /api/rosters/:id/unpublish` - Unpublish roster

## Seed Data

The system includes realistic demo data:

- **30 employees** across 3 pods
- **20 brands**:
  - 16 single-resource brands (one employee handles all processes)
  - 4 multi-resource brands (multiple employees across multiple processes)
- **4 processes**: Customer Support, Abandoned Cart Conversion, NDR Management, Retention
- **Operating rules**: Mix of 365-day, daily-except-holidays, and no-Sundays/holidays
- **Sample leaves**: Pre-configured to demonstrate conflict handling
- **Public holidays**: Indian holidays for current year

## License

MIT

---

**Built with ❤️ for DataStraw Assignment**
