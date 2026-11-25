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

## Design Questions & Answers

### 1. Data Model

**Q: How did you model the data?**

`Employee` belongs to `Pod`. `Brand` and `Process` are independent masters. The join entity `BrandProcess` holds the operating rule override and minimum coverage. Employees are linked to work through `Assignment` (many-to-many between Employee and BrandProcess). `Leave` and `PublicHoliday` are constraint inputs. `Roster` → `RosterEntry` is the output, one entry per employee per day.

### 2. Roster Generation

**Q: How does the generation algorithm work?**

Deterministic greedy scheduler. For each day:
1. Build demand list of operating brand-processes
2. Sort by scarcity (fewest candidates first)
3. Assign required employees, preferring those NOT on leave, NOT already working today, NOT on preferred weekly off
4. Fairness: sort by month-to-date workload
5. Everyone else gets OFF status

Validation re-derives conflicts from stored entries, so manual edits are validated immediately.

### 3. Single vs Multi-Resource Brands

**Q: How do you handle both?**

Both use the same `BrandProcess.minCoverage`. Single-resource: `minCoverage = 1`, one `Assignment`. Multi-resource: multiple `Assignment` rows, `minCoverage` can be > 1. The scheduler doesn't distinguish — it fills `minCoverage` slots from available candidates.

### 4. Single Employee Unavailable

**Q: What happens when the only resource is on leave?**

Generation excludes them (leave check), so coverage falls to 0. Validation emits a `COVERAGE_GAP` critical conflict. The coverage view shows the gap in red. The ops manager can assign a backup (suggestions endpoint ranks colleagues) or escalate.

### 5. Conflicts & Insufficient Staffing

**Q: How are conflicts flagged?**

Conflicts are typed and severity-tagged:
- **Critical** (`COVERAGE_GAP`, `NO_EMPLOYEES_ASSIGNED`, `LEAVE_CONFLICT`) block publishing
- **Warnings** (`WEEKLY_OFF_OVERRIDE`) are advisory

The roster is never silently invalid — it's generated, flagged, and the UI requires resolution.

### 6. Automation vs Human Control

**Q: What's automated vs manual?**

**Automated:**
- Allocating working days
- Honoring operating calendars
- Respecting weekly offs, holidays, approved leave
- Computing coverage

**Human:**
- Approving leave
- Adding/removing assignments
- Deciding whether to override a preferred weekly off
- Publishing

The reasoning: staffing decisions have real-world consequences, while combinatorial checking is best done by machine.

### 7. If Team Doubled

**Q: How would you scale?**

The model already scales (no hard-coded team size). First change: move generation to a background job (BullMQ) with per-pod partitioning. Add indexes on `RosterEntry`. Replace greedy heuristic with a constraint solver (OR-Tools CP-SAT) for better fairness and fewer gaps.

### 8. With One More Week

**Q: What would you add next?**

1. OR-Tools-based optimizer behind the same API (scheduler/validator stay unchanged)
2. Roster versioning with diff view for "what changed after this leave"
3. CSV/Excel export
4. Approval workflow with pod-lead sign-off

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
