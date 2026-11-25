# Smart Roster Management System - Complete Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Core Features](#core-features)
8. [Roster Generation Algorithm](#roster-generation-algorithm)
9. [Conflict Detection System](#conflict-detection-system)
10. [API Documentation](#api-documentation)
11. [User Interface Guide](#user-interface-guide)
12. [Setup & Installation](#setup--installation)
13. [Configuration](#configuration)
14. [Data Flow](#data-flow)
15. [Security](#security)
16. [Testing Guide](#testing-guide)
17. [Deployment](#deployment)
18. [Troubleshooting](#troubleshooting)
19. [Performance Optimization](#performance-optimization)
20. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

### 1.1 Purpose

The Smart Roster Management System is a comprehensive workforce scheduling application designed for operations managers handling 30+ employees across multiple brands, processes, and operational teams (pods). The system automates monthly roster generation while respecting complex business rules, employee availability, and client requirements.

### 1.2 Key Objectives

- **Automated Scheduling**: Generate monthly rosters automatically based on configurable rules
- **Conflict Detection**: Identify and report coverage gaps, staffing issues, and rule violations
- **Flexibility**: Support multiple operating calendars, employee assignments, and business rules
- **Change Management**: Handle real-time changes to employee availability without full regeneration
- **Multi-View Analysis**: Provide different perspectives (employee, brand, pod, process, calendar)

### 1.3 Business Context

**Problem Solved:**
- Manual roster creation is time-consuming and error-prone
- Different brands operate on different schedules (365 days, except holidays, weekdays only)
- Employees have varying availability (weekly offs, leaves, comp-offs)
- Coverage requirements vary by brand and process
- Changes in availability create cascading scheduling conflicts

**Target Users:**
- **Operations Managers**: Create and manage monthly rosters
- **Pod Leads**: Monitor their team's schedules
- **Employees**: View their assignments (future enhancement)

### 1.4 Core Capabilities

1. **Master Data Management**: Employees, Brands, Processes, Pods
2. **Assignment Configuration**: Link employees to brand-processes
3. **Availability Management**: Weekly offs, planned leaves, comp-offs, public holidays
4. **Smart Scheduling**: Deterministic greedy algorithm with fairness balancing
5. **Validation**: Real-time conflict detection with severity classification
6. **Manual Override**: Click-to-edit with backup suggestions
7. **Multi-View Reporting**: Dashboard, employee, coverage, pod, process, calendar views

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                     │
│  ┌────────────┬────────────┬────────────┬─────────────┐    │
│  │ Dashboard  │  Roster    │  Masters   │  Reports    │    │
│  │   Page     │   Page     │  Pages     │   Pages     │    │
│  └────────────┴────────────┴────────────┴─────────────┘    │
│                            ▲                                 │
│                            │ HTTPS/JSON                      │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Axios Client (JWT Auth)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Express.js)                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Auth Middleware (JWT Verification)                 │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────┬────────────┬────────────┬─────────────┐   │
│  │  Employee  │  Roster    │  Brand     │  Dashboard  │   │
│  │ Controller │ Controller │ Controller │  Controller │   │
│  └────────────┴────────────┴────────────┴─────────────┘   │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Scheduler Utility (Algorithm Core)                 │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER (Prisma ORM)                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Prisma Client (Type-Safe Query Builder)            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (PostgreSQL)                        │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┐  │
│  │ Users  │Employees│ Brands │Process │ Roster │ Leaves │  │
│  │  Pods  │Assignments│BrandP│ Entry  │Holiday │        │  │
│  └────────┴────────┴────────┴────────┴────────┴────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

**Client Layer:**
- User interface rendering
- State management (React hooks)
- Form validation
- Client-side routing
- API communication

**API Layer:**
- Request authentication & authorization
- Business logic execution
- Data validation
- Error handling
- Response formatting

**Data Layer:**
- Database abstraction
- Query optimization
- Transaction management
- Schema migration

**Database Layer:**
- Data persistence
- Referential integrity
- Constraint enforcement
- Indexing & performance

### 2.3 Communication Flow

**Request Flow:**
```
User Action → React Component → API Call (Axios) 
  → Express Route → Controller → Prisma Query 
  → PostgreSQL → Response → JSON → React State → UI Update
```

**Authentication Flow:**
```
Login → JWT Generation → Token in localStorage 
  → Token in Request Headers → JWT Verification 
  → User Context → Protected Route Access
```

---

## 3. Technology Stack

### 3.1 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.21+ | Web framework |
| **Prisma** | 5.22+ | ORM & database toolkit |
| **PostgreSQL** | 13+ | Relational database |
| **JWT** | 9.0+ | Authentication tokens |
| **bcryptjs** | 2.4+ | Password hashing |
| **dotenv** | 16.4+ | Environment configuration |
| **CORS** | 2.8+ | Cross-origin requests |

### 3.2 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3+ | UI framework |
| **React Router** | 6.27+ | Client-side routing |
| **Vite** | 5.4+ | Build tool & dev server |
| **Axios** | 1.7+ | HTTP client |
| **CSS3** | - | Styling (no frameworks) |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| **npm** | Package management |
| **Git** | Version control |
| **VS Code** | Code editor |
| **Postman** | API testing |
| **pgAdmin** | Database management |

### 3.4 Why These Technologies?

**Node.js + Express:**
- JavaScript full-stack (same language frontend/backend)
- Large ecosystem, excellent for REST APIs
- Non-blocking I/O for concurrent requests

**Prisma:**
- Type-safe database access
- Auto-generated client
- Easy migrations
- Excellent developer experience

**PostgreSQL:**
- ACID compliance for data integrity
- Complex queries support
- Mature, stable, performant
- JSON support for flexible data

**React:**
- Component-based architecture
- Virtual DOM for performance
- Large community & ecosystem
- Hooks for state management

**Vite:**
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Native ES modules

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ name         │
│ email (UQ)   │
│ passwordHash │
│ role         │
└──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     Pod      │       │   Employee   │       │  Assignment  │
│──────────────│       │──────────────│       │──────────────│
│ id (PK)      │◄─────┤│ id (PK)      │├─────►│ id (PK)      │
│ name (UQ)    │       │ name         │       │ employeeId   │
│ leadId (FK)  │───┐   │ email (UQ)   │       │ brandProcId  │
└──────────────┘   │   │ podId (FK)   │       │ isPrimary    │
                   │   │ weeklyOffDay │       └──────┬───────┘
                   │   │ isActive     │              │
                   │   └──────────────┘              │
                   │                                 │
                   └────────────────────────────────►│
                                                     │
┌──────────────┐       ┌──────────────┐            │
│    Brand     │       │ BrandProcess │◄───────────┘
│──────────────│       │──────────────│
│ id (PK)      │├─────►│ id (PK)      │
│ name (UQ)    │       │ brandId (FK) │
│ operatingRule│       │ processId(FK)│
└──────────────┘       │ operatingRule│◄───┐
                       │ minCoverage  │    │
┌──────────────┐       └──────────────┘    │
│   Process    │                            │
│──────────────│                            │
│ id (PK)      │├───────────────────────────┘
│ name (UQ)    │
└──────────────┘

┌──────────────┐       ┌──────────────┐
│    Leave     │       │PublicHoliday │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ employeeId   │       │ date (UQ)    │
│ startDate    │       │ name         │
│ endDate      │       └──────────────┘
│ type         │
│ status       │
│ reason       │
└──────────────┘

┌──────────────┐       ┌──────────────┐
│    Roster    │       │ RosterEntry  │
│──────────────│       │──────────────│
│ id (PK)      │├─────►│ id (PK)      │
│ month        │       │ rosterId (FK)│
│ year         │       │ date         │
│ status       │       │ employeeId   │
│              │       │ brandProcId  │
│ @@unique     │       │ status       │
│ [month,year] │       │              │
└──────────────┘       │ @@unique     │
                       │ [rosterId,   │
                       │  date,       │
                       │  employeeId] │
                       └──────────────┘
```

### 4.2 Table Definitions

#### **User Table**

Stores system user accounts with authentication credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| name | String | NOT NULL | Full name |
| email | String | UNIQUE, NOT NULL | Login email |
| passwordHash | String | NOT NULL | Bcrypt hashed password |
| role | Enum | DEFAULT 'OPS_MANAGER' | ADMIN, OPS_MANAGER, POD_LEAD |
| createdAt | DateTime | DEFAULT now() | Account creation timestamp |

**Indexes:** `email` (unique)

---

#### **Pod Table**

Organizational groups of employees with designated leads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| name | String | UNIQUE, NOT NULL | Pod name (e.g., "Pod Alpha") |
| leadId | String | UNIQUE, FK → Employee | Pod lead employee ID |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Relationships:**
- `lead`: One-to-one with Employee (optional)
- `employees`: One-to-many with Employee

---

#### **Employee Table**

Individual team members with availability preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| name | String | NOT NULL | Full name |
| email | String | UNIQUE, NOT NULL | Contact email |
| podId | String | FK → Pod | Assigned pod |
| weeklyOffDay | Int | DEFAULT 0 | Preferred weekly off (0=Sun...6=Sat) |
| isActive | Boolean | DEFAULT true | Employment status |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Relationships:**
- `pod`: Many-to-one with Pod
- `ledPod`: One-to-one reverse (if employee is a pod lead)
- `assignments`: One-to-many with Assignment
- `leaves`: One-to-many with Leave
- `rosterEntries`: One-to-many with RosterEntry

**Indexes:** `email` (unique), `podId`, `isActive`

---

#### **Brand Table**

Client brands with operating calendar rules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| name | String | UNIQUE, NOT NULL | Brand name |
| operatingRule | Enum | DEFAULT 'DAILY_EXCEPT_PUBLIC_HOLIDAYS' | Operating schedule |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Operating Rules:**
- `ALL_365`: Operates every day including Sundays and holidays
- `DAILY_EXCEPT_PUBLIC_HOLIDAYS`: Mon-Sun except public holidays
- `NO_SUNDAYS_AND_HOLIDAYS`: Mon-Sat, excluding public holidays

**Relationships:**
- `brandProcesses`: One-to-many with BrandProcess

---

#### **Process Table**

Types of work performed for brands.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| name | String | UNIQUE, NOT NULL | Process name |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Common Processes:**
- Customer Support (CS)
- Abandoned Cart Conversion (ACC)
- Non-Delivery Report Management (NDR)
- Retention

**Relationships:**
- `brandProcesses`: One-to-many with BrandProcess

---

#### **BrandProcess Table**

Join table linking brands to processes with specific requirements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| brandId | String | FK → Brand, NOT NULL | Brand reference |
| processId | String | FK → Process, NOT NULL | Process reference |
| operatingRule | Enum | NULLABLE | Overrides brand rule |
| minCoverage | Int | DEFAULT 1 | Minimum employees required |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Unique Constraint:** `(brandId, processId)` - prevents duplicate assignments

**Key Design:**
- Allows per-process operating rules
- Enables different coverage requirements per process
- One brand can have multiple processes

**Relationships:**
- `brand`: Many-to-one with Brand
- `process`: Many-to-one with Process
- `assignments`: One-to-many with Assignment
- `rosterEntries`: One-to-many with RosterEntry

---

#### **Assignment Table**

Links employees to brand-processes (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| employeeId | String | FK → Employee, NOT NULL | Assigned employee |
| brandProcessId | String | FK → BrandProcess, NOT NULL | Assigned brand-process |
| isPrimary | Boolean | DEFAULT true | Primary vs backup assignment |
| createdAt | DateTime | DEFAULT now() | Assignment timestamp |

**Unique Constraint:** `(employeeId, brandProcessId)` - prevents duplicate assignments

**Usage Patterns:**
- **Single-resource brand**: One employee handles all processes
- **Multi-resource brand**: Multiple employees across processes
- **Shared process**: Multiple employees on same process

---

#### **Leave Table**

Employee time-off requests and approvals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| employeeId | String | FK → Employee, NOT NULL | Employee on leave |
| startDate | Date | NOT NULL | Leave start date (UTC) |
| endDate | Date | NOT NULL | Leave end date (UTC, inclusive) |
| type | Enum | DEFAULT 'PLANNED_LEAVE' | Leave type |
| status | Enum | DEFAULT 'PENDING' | Approval status |
| reason | String | NULLABLE | Leave reason/notes |
| createdAt | DateTime | DEFAULT now() | Request timestamp |

**Leave Types:**
- `PLANNED_LEAVE`: Pre-planned time off
- `COMP_OFF`: Compensatory day off
- `SICK_LEAVE`: Unplanned sick leave

**Leave Status:**
- `PENDING`: Awaiting approval
- `APPROVED`: Approved, blocks scheduling
- `REJECTED`: Rejected, no scheduling impact

**Validation Rules:**
- `endDate` >= `startDate`
- Only `APPROVED` leaves impact roster generation

---

#### **PublicHoliday Table**

Company-wide holiday calendar.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| date | Date | UNIQUE, NOT NULL | Holiday date (UTC) |
| name | String | NOT NULL | Holiday name |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |

**Common Holidays:**
- Republic Day, Independence Day, Gandhi Jayanti, Diwali, Christmas

**Usage:**
- Affects brands with `DAILY_EXCEPT_PUBLIC_HOLIDAYS` rule
- Affects brands with `NO_SUNDAYS_AND_HOLIDAYS` rule
- No impact on `ALL_365` brands

---

#### **Roster Table**

Monthly roster container.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| month | Int | NOT NULL, 1-12 | Month number |
| year | Int | NOT NULL | Year (YYYY) |
| status | Enum | DEFAULT 'DRAFT' | Roster state |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Last modification timestamp |

**Unique Constraint:** `(month, year)` - one roster per month

**Roster Status:**
- `DRAFT`: Editable, can regenerate
- `PUBLISHED`: Locked, requires unpublish to edit

**Relationships:**
- `entries`: One-to-many with RosterEntry

---

#### **RosterEntry Table**

Individual employee daily assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PRIMARY KEY | Unique identifier |
| rosterId | String | FK → Roster, NOT NULL | Parent roster |
| date | Date | NOT NULL | Assignment date (UTC) |
| employeeId | String | FK → Employee, NOT NULL | Assigned employee |
| brandProcessId | String | FK → BrandProcess, NULLABLE | Work assignment |
| status | Enum | DEFAULT 'WEEKLY_OFF' | Day status |
| createdAt | DateTime | DEFAULT now() | Creation timestamp |

**Unique Constraint:** `(rosterId, date, employeeId)` - one entry per employee per day

**Entry Status:**
- `WORKING`: Employee working on brandProcess
- `WEEKLY_OFF`: Scheduled weekly off
- `PUBLIC_HOLIDAY`: Company holiday
- `LEAVE`: On approved leave
- `COMP_OFF`: On compensatory off

**Key Rules:**
- `brandProcessId` required when status = `WORKING`
- `brandProcessId` null for all off statuses
- Unique constraint prevents double-booking

**Indexes:** `(rosterId, date)` for fast daily lookups

---

### 4.3 Database Constraints & Integrity

**Referential Integrity:**
- All foreign keys have `onDelete` rules (CASCADE, SetNull, Restrict)
- Prevents orphaned records
- Maintains data consistency

**Unique Constraints:**
- Prevent duplicate emails, brand names, process names
- Enforce one roster per month
- Prevent duplicate assignments
- Ensure one entry per employee per day

**Check Constraints (Application Level):**
- `minCoverage` >= 1
- `weeklyOffDay` between 0-6
- `month` between 1-12
- Leave `endDate` >= `startDate`

---

## 5. Backend Architecture

### 5.1 Directory Structure

```
server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Demo data seeder
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── employee.controller.js
│   │   ├── brand.controller.js
│   │   ├── process.controller.js
│   │   ├── brandProcess.controller.js
│   │   ├── assignment.controller.js
│   │   ├── leave.controller.js
│   │   ├── holiday.controller.js
│   │   ├── pod.controller.js
│   │   └── roster.controller.js
│   ├── routes/                # Route definitions
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── employee.routes.js
│   │   ├── brand.routes.js
│   │   ├── process.routes.js
│   │   ├── brandProcess.routes.js
│   │   ├── assignment.routes.js
│   │   ├── leave.routes.js
│   │   ├── holiday.routes.js
│   │   ├── pod.routes.js
│   │   └── roster.routes.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── error.js          # Error handling
│   ├── utils/                 # Utility functions
│   │   ├── asyncHandler.js   # Async wrapper
│   │   ├── dates.js          # Date utilities
│   │   └── scheduler.js      # Core algorithm
│   ├── prisma.js             # Prisma client singleton
│   ├── app.js                # Express app setup
│   └── index.js              # Server entry point
├── .env                       # Environment variables
├── .env.example              # Example env file
└── package.json              # Dependencies
```

### 5.2 Core Backend Patterns

#### **5.2.1 Controller Pattern**

All controllers follow a consistent structure:

```javascript
import { prisma } from '../prisma.js';
import { ah } from '../utils/asyncHandler.js';

export const list = ah(async (req, res) => {
  const items = await prisma.model.findMany({
    include: { relations: true },
    orderBy: { field: 'asc' },
  });
  res.json(items);
});

export const create = ah(async (req, res) => {
  const { field1, field2 } = req.body;
  
  // Validation
  if (!field1) {
    return res.status(400).json({ error: 'field1 is required' });
  }
  
  const item = await prisma.model.create({
    data: { field1, field2 },
  });
  
  res.status(201).json(item);
});

export const update = ah(async (req, res) => {
  const { field1 } = req.body;
  
  const item = await prisma.model.update({
    where: { id: req.params.id },
    data: { field1 },
  });
  
  res.json(item);
});

export const remove = ah(async (req, res) => {
  await prisma.model.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
```

**Key Features:**
- `ah()` wrapper catches async errors automatically
- Consistent response format
- Validation before operations
- HTTP status codes (200, 201, 400, 404, 409, 500)

#### **5.2.2 Async Handler Wrapper**

```javascript
// utils/asyncHandler.js
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

**Benefits:**
- Eliminates try-catch blocks
- Automatically forwards errors to error handler
- Keeps controller code clean

#### **5.2.3 Authentication Middleware**

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

**Flow:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature and expiration
3. Attach decoded user to `req.user`
4. Continue to route handler

#### **5.2.4 Error Handler Middleware**

```javascript
// middleware/error.js
export function errorHandler(err, req, res, next) {
  console.error(err);
  
  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      error: 'A record with these values already exists.' 
    });
  }
  
  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  
  // Generic error
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
}
```

**Error Categories:**
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Missing/invalid token
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate unique value
- **500 Internal Server Error**: Unexpected errors

### 5.3 Date Utilities

```javascript
// utils/dates.js

// Convert Date to YYYY-MM-DD string
export const ymd = (d) =>
  (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

// Create UTC date (avoids timezone issues)
export const utcDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

// Get number of days in month
export const daysInMonth = (m, y) => new Date(Date.UTC(y, m, 0)).getUTCDate();

// Generate array of dates for month
export const monthDays = (m, y) =>
  Array.from({ length: daysInMonth(m, y) }, (_, i) => utcDate(y, m, i + 1));

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday',
];
```

**Why UTC?**
- Avoids timezone conversion issues
- Consistent date handling across timezones
- Database stores dates in UTC
- Frontend converts to local time for display

### 5.4 Application Bootstrap

```javascript
// app.js
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';

// Import all routes
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
// ... (other route imports)

const app = express();

// Global middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// Health check (no auth required)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Auth routes (login, register - no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (all require authentication)
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/employees', requireAuth, employeeRoutes);
app.use('/api/brands', requireAuth, brandRoutes);
// ... (other protected routes)

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

```javascript
// index.js
import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
```

---

## 6. Frontend Architecture

### 6.1 Directory Structure

```
client/
├── public/
│   └── favicon.svg           # App icon
├── src/
│   ├── components/           # Reusable components
│   │   ├── Layout.jsx       # Main layout with nav
│   │   └── Modal.jsx        # Modal dialog
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── RosterPage.jsx
│   │   ├── PodRosterPage.jsx
│   │   ├── ProcessRosterPage.jsx
│   │   ├── EmployeesPage.jsx
│   │   ├── BrandsPage.jsx
│   │   ├── AssignmentsPage.jsx
│   │   └── LeavesPage.jsx
│   ├── api.js               # Axios instance
│   ├── auth.jsx             # Auth context
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── styles.css           # Global styles
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

### 6.2 Core Frontend Patterns

#### **6.2.1 API Client Setup**

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && 
        !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

**Features:**
- Centralized API configuration
- Automatic token injection
- Automatic redirect on auth failure
- Proxy configuration in Vite for development

#### **6.2.2 Authentication Context**

```javascript
// auth.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Usage in Components:**
```javascript
function SomeComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome {user.name}</div>;
}
```

#### **6.2.3 Protected Routes**

```javascript
// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <Protected>
          <Layout />
        </Protected>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="roster" element={<RosterPage />} />
        {/* ... other routes */}
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
```

**Flow:**
1. User accesses protected route
2. `Protected` component checks authentication
3. If not authenticated → redirect to `/login`
4. If authenticated → render requested page
5. `Layout` component wraps all protected pages

#### **6.2.4 Data Fetching Pattern**

```javascript
// Standard page component pattern
function SomePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    
    api.get('/endpoint')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []); // Dependencies array

  if (loading) return <div className="muted">Loading…</div>;
  if (error) return <div className="notice">{error}</div>;

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

**Best Practices:**
- Separate loading, error, and success states
- Clear error before refetch
- Use `finally()` to always stop loading
- Dependencies array for useEffect

#### **6.2.5 Form Handling Pattern**

```javascript
function FormComponent() {
  const [form, setForm] = useState({ name: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/endpoint', form);
      setForm({ name: '', email: '' }); // Reset form
      loadData(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6.3 Styling System

**CSS Architecture:**
- No CSS frameworks (pure CSS3)
- BEM-inspired naming
- Utility classes for common patterns
- Component-scoped styles via class names

**Key Classes:**
```css
/* Layout */
.app                  /* Main app container */
.topbar               /* Top navigation bar */
.content              /* Page content area */
.card                 /* White card container */

/* Typography */
.muted                /* Gray text */
.small                /* Small font size */
.emp-name             /* Employee name styling */

/* Buttons */
.btn                  /* Base button */
.btn.primary          /* Primary action button */
.btn.ghost            /* Transparent button */
.btn.small            /* Small button */

/* Layout Helpers */
.row                  /* Flexbox row */
.row.gap              /* Row with gap */
.row.wrap             /* Allow wrapping */
.row.between          /* Space between */
.row.end              /* Align end */
.mb                   /* Margin bottom */
.mt                   /* Margin top */

/* Tables */
.table                /* Standard table */
.grid                 /* Roster grid table */
.sticky-col           /* Sticky first column */
.cell                 /* Grid cell */
.day-head             /* Day header cell */

/* Status Colors */
.status-WORKING       /* Green */
.status-WEEKLY_OFF    /* Gray */
.status-PUBLIC_HOLIDAY /* Blue */
.status-LEAVE         /* Red */
.status-COMP_OFF      /* Yellow */

/* Pills & Badges */
.pill                 /* Rounded status pill */
.pill.ok              /* Green pill */
.pill.danger          /* Red pill */
.pill.amber           /* Yellow pill */

/* Conflicts */
.conflict             /* Conflict item */
.conflict.critical    /* Red background */
.conflict.warning     /* Yellow background */

/* Dashboard */
.stat-grid            /* Stats grid layout */
.stat-card            /* Individual stat card */
.stat-number          /* Large number display */

/* Calendar */
.cal-grid             /* Calendar grid */
.cal-day              /* Calendar day cell */
.cal-day.ok           /* Green day */
.cal-day.gap          /* Red day */
.cal-day.holiday      /* Blue day */

/* Modal */
.modal-backdrop       /* Dark overlay */
.modal                /* Modal container */
.modal-header         /* Modal header */
.modal-body           /* Modal content */
```

**Design Tokens:**
```css
/* Colors */
--primary: #2563eb;    /* Blue */
--success: #dcfce7;    /* Light green */
--danger: #fee2e2;     /* Light red */
--warning: #fef3c7;    /* Light yellow */
--muted: #6b7280;      /* Gray text */
--border: #e4e7eb;     /* Border gray */

/* Spacing */
--gap: 10px;
--padding: 16px;
--margin: 16px;

/* Border Radius */
--radius: 8px;
--radius-large: 10px;
--radius-pill: 999px;
```

---

This documentation continues with the remaining sections. Would you like me to continue with sections 7-20?

in Components:**
```javascript
// In any component
const { user, loading, login, logout } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <Navigate to="/login" />;

return <div>Welcome {user.name}!</div>;
```

#### **6.2.3 Protected Routes**

```javascript
// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
// ... other imports

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/roster" element={<ProtectedRoute><RosterPage /></ProtectedRoute>} />
          {/* ... other protected routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

#### **6.2.4 Data Fetching Pattern**

```javascript
// Standard pattern in all pages
function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/endpoint')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data.length) return <div className="no-data">No data available</div>;

  return (
    <div>
      {data.map((item) => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}
```

#### **6.2.5 Form Handling Pattern**

```javascript
function CreateForm({ onSuccess }) {
  const [formData, setFormData] = useState({ field1: '', field2: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/endpoint', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        name="field1"
        value={formData.field1}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### 6.3 Styling System

**Global CSS Structure:**

```css
/* styles.css */

/* CSS Variables */
:root {
  --primary: #2563eb;       /* Blue */
  --primary-dark: #1e40af;
  --danger: #dc2626;         /* Red */
  --success: #16a34a;        /* Green */
  --warning: #ca8a04;        /* Yellow */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --border-radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
}

/* Base Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

/* Utility Classes */
.card { background: white; padding: 1.5rem; border-radius: var(--border-radius); box-shadow: var(--shadow); }
.btn { padding: 0.5rem 1rem; border-radius: var(--border-radius); cursor: pointer; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-danger { background: var(--danger); color: white; border: none; }
.error { color: var(--danger); padding: 1rem; background: #fee; border-radius: var(--border-radius); }
.success { color: var(--success); padding: 1rem; background: #efe; border-radius: var(--border-radius); }
.loading { text-align: center; padding: 2rem; color: var(--gray-600); }
.grid { display: grid; gap: 1rem; }
```

**Component-Specific Classes:**
- `.roster-grid`: Grid for roster calendar
- `.employee-row`: Row in employee table
- `.stat-card`: Dashboard statistic card
- `.conflict-badge`: Conflict severity indicator
- `.day-cell`: Individual day cell in calendar
- `.day-header`: Day column header

---

## 7. Core Features

### 7.1 Dashboard Overview

**Purpose:** High-level view of roster health and system status.

**Key Metrics:**

1. **Total Employees**: Count of active employees
2. **Active Brands**: Count of brands with assignments
3. **Coverage Percentage**: `(assigned days / required days) × 100`
4. **Active Conflicts**: Count of unresolved scheduling issues

**Coverage Calculation Logic:**

```javascript
// Iterate over all brand-processes and their operating days
let totalRequired = 0;
let totalAssigned = 0;

for (const bp of brandProcesses) {
  const rule = bp.operatingRule || bp.brand.operatingRule;
  
  for (const date of monthDays(month, year)) {
    const isHoliday = holidays.some((h) => ymd(h.date) === ymd(date));
    
    if (operatesOn(rule, date, isHoliday)) {
      totalRequired++;
      
      const hasAssignment = rosterEntries.some((e) =>
        ymd(e.date) === ymd(date) &&
        e.brandProcessId === bp.id &&
        e.status === 'WORKING'
      );
      
      if (hasAssignment) totalAssigned++;
    }
  }
}

const coveragePercentage = (totalAssigned / totalRequired) * 100;
```

**Conflict Detection:**

```javascript
const conflicts = computeConflicts(rosterEntries, assignments, leaves, brandProcesses, holidays, month, year);
const activeConflicts = conflicts.filter((c) => c.severity !== 'INFO');
```

**UI Features:**
- **Month/Year Selector**: Dropdown to change reporting period
- **Stat Cards**: Large cards for each metric
- **Conflict List**: Table showing all active conflicts with severity badges
- **Quick Actions**: Buttons to navigate to Roster Page or regenerate

**API Endpoint:**
```
GET /api/dashboard?month=1&year=2025
```

**Response:**
```json
{
  "totalEmployees": 30,
  "activeBrands": 20,
  "coveragePercentage": 92.5,
  "conflicts": [
    {
      "type": "COVERAGE_GAP",
      "severity": "ERROR",
      "message": "No coverage for Brand A - CS on 2025-01-15",
      "date": "2025-01-15",
      "brandProcessId": "bp123"
    }
  ]
}
```

### 7.2 Roster Generation

**Purpose:** Automatically create monthly employee schedules.

**Trigger:** User clicks "Generate Roster" button on Roster Page.

**Input Parameters:**
- `month` (1-12)
- `year` (YYYY)

**High-Level Process:**

```
1. Load all master data (employees, assignments, leaves, holidays)
2. Create roster record (or fetch existing draft)
3. For each day in month:
   a. Identify operating brand-processes
   b. Find available employees
   c. Assign employees using greedy algorithm
   d. Create roster entries
4. Save all entries to database
5. Return roster with entries
```

**API Endpoint:**
```
POST /api/rosters/generate
Content-Type: application/json

{
  "month": 1,
  "year": 2025
}
```

**Response:**
```json
{
  "id": "roster123",
  "month": 1,
  "year": 2025,
  "status": "DRAFT",
  "entries": [
    {
      "id": "entry1",
      "date": "2025-01-01",
      "employeeId": "emp1",
      "brandProcessId": "bp1",
      "status": "WORKING"
    },
    {
      "id": "entry2",
      "date": "2025-01-01",
      "employeeId": "emp2",
      "brandProcessId": null,
      "status": "PUBLIC_HOLIDAY"
    }
  ]
}
```

**Error Handling:**
- Returns 409 if roster status is `PUBLISHED` (must unpublish first)
- Returns 400 if invalid month/year
- Returns 500 if generation fails

**Algorithm Details:** See Section 8 (Roster Generation Algorithm)

### 7.3 Manual Roster Editing

**Purpose:** Allow ops managers to override automated assignments.

**UI Interaction:**

1. User clicks on a cell in roster grid
2. Modal opens showing:
   - Current assignment
   - Employee name and status
   - Available brand-processes (filtered by employee assignments)
   - Option to mark as leave/comp-off
3. User selects new assignment or status
4. System updates entry and refreshes conflicts

**API Endpoint:**
```
PATCH /api/rosters/entries/:entryId
Content-Type: application/json

{
  "brandProcessId": "bp123",
  "status": "WORKING"
}
```

Or mark as leave:
```json
{
  "brandProcessId": null,
  "status": "LEAVE"
}
```

**Validation Rules:**
- Cannot assign employee to brand-process they're not assigned to
- Cannot edit published rosters (must unpublish first)
- Status must be valid enum value
- `brandProcessId` required when status is `WORKING`

**UI Feedback:**
- Success: Cell updates immediately
- Error: Shows error message in modal
- Conflicts: Red borders appear on affected cells

### 7.4 Conflict Detection

**Purpose:** Identify and report scheduling issues in real-time.

**Conflict Types:**

| Type | Severity | Description |
|------|----------|-------------|
| `COVERAGE_GAP` | ERROR | No employee assigned to operating brand-process |
| `NO_EMPLOYEES_ASSIGNED` | WARNING | Brand-process has no employees in Assignment table |
| `LEAVE_CONFLICT` | ERROR | Employee working on approved leave day |
| `WEEKLY_OFF_OVERRIDE` | INFO | Employee working on their preferred weekly off |

**Detection Logic:**

```javascript
function computeConflicts(entries, assignments, leaves, brandProcesses, holidays, month, year) {
  const conflicts = [];
  
  // 1. Check for coverage gaps
  for (const bp of brandProcesses) {
    const rule = bp.operatingRule || bp.brand.operatingRule;
    
    for (const date of monthDays(month, year)) {
      const isHoliday = holidays.some((h) => ymd(h.date) === ymd(date));
      
      if (operatesOn(rule, date, isHoliday)) {
        const working = entries.filter((e) =>
          ymd(e.date) === ymd(date) &&
          e.brandProcessId === bp.id &&
          e.status === 'WORKING'
        );
        
        if (working.length === 0) {
          conflicts.push({
            type: 'COVERAGE_GAP',
            severity: 'ERROR',
            message: `No coverage for ${bp.brand.name} - ${bp.process.name}`,
            date: ymd(date),
            brandProcessId: bp.id,
          });
        }
      }
    }
  }
  
  // 2. Check for leave conflicts
  for (const entry of entries.filter((e) => e.status === 'WORKING')) {
    const empLeaves = leaves.filter((l) =>
      l.employeeId === entry.employeeId &&
      l.status === 'APPROVED'
    );
    
    for (const leave of empLeaves) {
      if (entry.date >= leave.startDate && entry.date <= leave.endDate) {
        conflicts.push({
          type: 'LEAVE_CONFLICT',
          severity: 'ERROR',
          message: `${entry.employee.name} scheduled on leave day`,
          date: ymd(entry.date),
          employeeId: entry.employeeId,
        });
      }
    }
  }
  
  // 3. Check for no-assignment warnings
  for (const bp of brandProcesses) {
    if (!assignments.some((a) => a.brandProcessId === bp.id)) {
      conflicts.push({
        type: 'NO_EMPLOYEES_ASSIGNED',
        severity: 'WARNING',
        message: `No employees assigned to ${bp.brand.name} - ${bp.process.name}`,
        brandProcessId: bp.id,
      });
    }
  }
  
  return conflicts;
}
```

**API Endpoint:**
```
GET /api/rosters/:rosterId/conflicts
```

**Response:**
```json
{
  "conflicts": [
    {
      "type": "COVERAGE_GAP",
      "severity": "ERROR",
      "message": "No coverage for Brand A - CS on 2025-01-15",
      "date": "2025-01-15",
      "brandProcessId": "bp123"
    },
    {
      "type": "LEAVE_CONFLICT",
      "severity": "ERROR",
      "message": "John Doe scheduled on leave day",
      "date": "2025-01-10",
      "employeeId": "emp456"
    }
  ]
}
```

**UI Display:**
- **Dashboard**: Conflict count + list
- **Roster Page**: Red borders on conflicted cells
- **Pod Roster Page**: Filtered conflicts for pod
- **Process Roster Page**: Filtered conflicts for process

### 7.5 Search Functionality

**Purpose:** Quick filtering across all master data pages.

**Implementation:** Client-side filtering using JavaScript array methods.

**Search Fields by Page:**

**Employees Page:**
```javascript
const filtered = employees.filter((emp) =>
  emp.name.toLowerCase().includes(search.toLowerCase()) ||
  emp.email.toLowerCase().includes(search.toLowerCase()) ||
  emp.pod?.name.toLowerCase().includes(search.toLowerCase())
);
```

**Brands Page:**
```javascript
const filtered = brands.filter((brand) =>
  brand.name.toLowerCase().includes(search.toLowerCase()) ||
  brand.operatingRule.toLowerCase().includes(search.toLowerCase())
);
```

**Assignments Page:**
```javascript
const filtered = assignments.filter((assg) =>
  assg.employee.name.toLowerCase().includes(search.toLowerCase()) ||
  assg.brandProcess.brand.name.toLowerCase().includes(search.toLowerCase()) ||
  assg.brandProcess.process.name.toLowerCase().includes(search.toLowerCase())
);
```

**Roster Page:**
```javascript
const filtered = employees.filter((emp) =>
  emp.name.toLowerCase().includes(search.toLowerCase())
);
```

**UI Pattern:**
```jsx
<div className="search-box">
  <input
    type="text"
    placeholder="Search by name, email, pod..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>

<div className="results">
  {filtered.length === 0 ? (
    <div className="no-data">No results found</div>
  ) : (
    filtered.map((item) => <ItemCard key={item.id} item={item} />)
  )}
</div>
```

**Performance:**
- Client-side filtering is sufficient for 30-60 employee dataset
- Instant feedback (no API calls)
- Case-insensitive matching
- Multi-field search

### 7.6 Pod-wise Roster View

**Purpose:** View schedules grouped by organizational pod.

**Key Features:**
1. **Pod Selector**: Dropdown to choose pod
2. **Employee Grid**: Rows = pod employees, Columns = dates
3. **Pod Statistics**: Total working days, offs, leaves for pod
4. **Filtered Conflicts**: Only show conflicts affecting this pod

**API Endpoint:**
```
GET /api/rosters?month=1&year=2025
```
(Same endpoint as main roster, filtering done client-side)

**UI Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Pod-wise Roster - January 2025                      │
│ Select Pod: [Pod Alpha ▼]                           │
├─────────────────────────────────────────────────────┤
│ Pod Statistics:                                     │
│ • Total Working Days: 450                           │
│ • Total Offs: 90                                    │
│ • Total Leaves: 15                                  │
├─────────────────────────────────────────────────────┤
│ Employee Schedule Grid (Read-Only)                  │
│                                                      │
│        1   2   3   4   5  ...  31                   │
│ Alice  W   W   O   W   W  ...   W                   │
│ Bob    O   W   W   W   L  ...   W                   │
│ Carol  W   W   W   O   W  ...   W                   │
├─────────────────────────────────────────────────────┤
│ Conflicts Affecting This Pod:                       │
│ • ERROR: No coverage for Brand A - CS on 2025-01-15 │
└─────────────────────────────────────────────────────┘
```

**Cell Display:**
- **W (Green)**: Working on a brand-process
- **O (Gray)**: Weekly off
- **L (Red)**: On leave
- **H (Blue)**: Public holiday
- **C (Yellow)**: Comp-off

**Statistics Calculation:**
```javascript
const podEntries = rosterEntries.filter((e) =>
  employees.find((emp) => emp.id === e.employeeId)?.podId === selectedPodId
);

const stats = {
  totalWorking: podEntries.filter((e) => e.status === 'WORKING').length,
  totalOffs: podEntries.filter((e) => e.status === 'WEEKLY_OFF').length,
  totalLeaves: podEntries.filter((e) => e.status === 'LEAVE').length,
};
```

**Why Read-Only?**
- Prevents editing conflicts (main roster is source of truth)
- Avoids complex sync logic between views
- Users can still edit on main Roster Page

### 7.7 Process-wise Roster View

**Purpose:** View schedules grouped by business process.

**Key Features:**
1. **Process Selector**: Dropdown to choose process
2. **Brand Table**: Shows which employees cover each brand for selected process
3. **Employee Grid**: Rows = employees assigned to process, Columns = dates
4. **Coverage Gaps**: Highlights days with no assignments

**API Endpoint:**
```
GET /api/rosters?month=1&year=2025
```
(Same endpoint, filtering done client-side)

**UI Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Process-wise Roster - January 2025                  │
│ Select Process: [Customer Support ▼]                │
├─────────────────────────────────────────────────────┤
│ Brand Coverage:                                     │
│ Brand A: Alice, Bob                                 │
│ Brand B: Carol, Dave                                │
│ Brand C: Eve                                        │
├─────────────────────────────────────────────────────┤
│ Employee Schedule Grid (Read-Only)                  │
│                                                      │
│        1   2   3   4   5  ...  31                   │
│ Alice  W   W   O   W   W  ...   W                   │
│ Bob    O   W   W   W   L  ...   W                   │
│ Carol  W   W   W   O   W  ...   W                   │
├─────────────────────────────────────────────────────┤
│ Coverage Gaps:                                      │
│ • Brand A - no coverage on 2025-01-15               │
│ • Brand C - no coverage on 2025-01-22               │
└─────────────────────────────────────────────────────┘
```

**Brand Coverage Calculation:**
```javascript
const brandProcesses = allBrandProcesses.filter(
  (bp) => bp.processId === selectedProcessId
);

const coverageMap = brandProcesses.map((bp) => ({
  brand: bp.brand.name,
  employees: assignments
    .filter((a) => a.brandProcessId === bp.id)
    .map((a) => a.employee.name),
}));
```

**Gap Detection:**
```javascript
const gaps = [];

for (const bp of brandProcesses) {
  const rule = bp.operatingRule || bp.brand.operatingRule;
  
  for (const date of monthDays(month, year)) {
    const isHoliday = holidays.some((h) => ymd(h.date) === ymd(date));
    
    if (operatesOn(rule, date, isHoliday)) {
      const hasWorker = rosterEntries.some((e) =>
        ymd(e.date) === ymd(date) &&
        e.brandProcessId === bp.id &&
        e.status === 'WORKING'
      );
      
      if (!hasWorker) {
        gaps.push({
          brand: bp.brand.name,
          date: ymd(date),
        });
      }
    }
  }
}
```

### 7.8 Calendar Summary View

**Purpose:** Month-at-a-glance heatmap showing daily assignment distribution.

**Key Features:**
1. **Week Grid Layout**: 7 columns (Sun-Sat), automatic week wrapping
2. **Daily Stats**: Total working, offs, leaves per day
3. **Color-Coded Cells**: Visual indicator of day health
4. **Daily Detail Table**: Click to expand full breakdown

**UI Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Calendar Summary - January 2025                     │
├─────────────────────────────────────────────────────┤
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat                   │
│      1    2    3    4    5    6                     │
│      22W  24W  23W  25W  24W  22W                   │
│      8O   6O   7O   5O   6O   8O                    │
│                                                      │
│ 7    8    9    10   11   12   13                    │
│ 10W  23W  24W  22W  25W  23W  11W                   │
│ 20O  7O   6O   8O   5O   7O   19O                   │
│                                                      │
│ ... (more weeks)                                    │
├─────────────────────────────────────────────────────┤
│ Daily Details:                                      │
│ ▼ Jan 1: 22 working, 8 offs, 0 leaves, 0 holidays  │
│ ▶ Jan 2: 24 working, 6 offs, 0 leaves, 0 holidays  │
└─────────────────────────────────────────────────────┘
```

**Cell Content:**
```
┌──────┐
│ 15   │  ← Day number
│ 23W  │  ← Working count
│ 7O   │  ← Off count
└──────┘
```

**Color Coding:**
- **Green**: All brand-processes covered, no gaps
- **Yellow**: Minor issues (some weekly off overrides)
- **Red**: Critical issues (coverage gaps, leave conflicts)
- **Blue**: Public holiday
- **Gray**: Weekend with no operations

**Data Structure:**
```javascript
const calendarData = monthDays(month, year).map((date) => {
  const dayEntries = rosterEntries.filter((e) => ymd(e.date) === ymd(date));
  
  return {
    date,
    dayOfWeek: date.getUTCDay(),
    working: dayEntries.filter((e) => e.status === 'WORKING').length,
    offs: dayEntries.filter((e) => e.status === 'WEEKLY_OFF').length,
    leaves: dayEntries.filter((e) => e.status === 'LEAVE').length,
    holidays: dayEntries.filter((e) => e.status === 'PUBLIC_HOLIDAY').length,
    hasGaps: conflicts.some((c) =>
      c.type === 'COVERAGE_GAP' && c.date === ymd(date)
    ),
  };
});
```

**CSS Grid Layout:**
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--gray-300);
}

.day-cell.has-gaps {
  background-color: #fee;
  border-color: var(--danger);
}

.day-cell.all-covered {
  background-color: #efe;
  border-color: var(--success);
}
```

---

## 8. Roster Generation Algorithm

### 8.1 Algorithm Overview

**Type:** Deterministic Greedy Algorithm with Fairness Balancing

**Objective:** Assign employees to brand-processes for each day of the month while:
- Respecting operating rules (brand calendars)
- Avoiding conflicts (leaves, weekly offs)
- Distributing workload fairly across employees
- Preferring primary assignments over backup assignments

**High-Level Steps:**

```
1. Load all master data
2. Build lookup structures (availability, assignments)
3. For each date in month:
   a. Identify operating brand-processes
   b. For each brand-process:
      - Find available employees
      - Sort by workload (ascending)
      - Assign first available employee
   c. Create roster entries for all employees
4. Return complete roster
```

### 8.2 Core Algorithm Implementation

```javascript
// utils/scheduler.js

import { ymd, monthDays, DAY_NAMES } from './dates.js';

/**
 * Main roster generation function
 */
export function buildRoster(employees, assignments, leaves, brandProcesses, holidays, month, year) {
  // 1. Build availability map
  const availability = buildAvailabilityMap(employees, leaves, holidays, month, year);
  
  // 2. Build assignment map (employee -> brand-processes)
  const empToBP = new Map();
  for (const a of assignments) {
    if (!empToBP.has(a.employeeId)) empToBP.set(a.employeeId, []);
    empToBP.get(a.employeeId).push({ ...a.brandProcess, isPrimary: a.isPrimary });
  }
  
  // 3. Initialize workload tracker
  const workload = new Map(employees.map((e) => [e.id, 0]));
  
  // 4. Generate entries for each day
  const entries = [];
  
  for (const date of monthDays(month, year)) {
    const dateStr = ymd(date);
    const dayOfWeek = date.getUTCDay();
    const isHoliday = holidays.some((h) => ymd(h.date) === dateStr);
    
    // Get operating brand-processes for this day
    const operatingBPs = brandProcesses.filter((bp) =>
      operatesOn(bp.operatingRule || bp.brand.operatingRule, date, isHoliday)
    );
    
    // Track assignments for this day
    const dailyAssignments = new Map();
    
    // Assign employees to operating brand-processes
    for (const bp of operatingBPs) {
      // Find eligible employees (assigned to this BP and available)
      const eligible = employees.filter((emp) => {
        const bps = empToBP.get(emp.id) || [];
        return bps.some((b) => b.id === bp.id);
      }).filter((emp) => {
        const avail = availability.get(emp.id)?.[dateStr];
        return avail && avail.isAvailable;
      });
      
      if (eligible.length === 0) continue; // No one available (gap)
      
      // Sort by workload (ascending) for fairness
      eligible.sort((a, b) => workload.get(a.id) - workload.get(b.id));
      
      // Prefer primary assignments
      const primaryEmp = eligible.find((emp) => {
        const bps = empToBP.get(emp.id) || [];
        return bps.find((b) => b.id === bp.id)?.isPrimary;
      });
      
      const assignedEmp = primaryEmp || eligible[0];
      
      // Record assignment
      dailyAssignments.set(assignedEmp.id, bp.id);
      workload.set(assignedEmp.id, workload.get(assignedEmp.id) + 1);
    }
    
    // Create entries for all employees
    for (const emp of employees) {
      const avail = availability.get(emp.id)?.[dateStr];
      const bpId = dailyAssignments.get(emp.id);
      
      let status, brandProcessId = null;
      
      if (bpId) {
        status = 'WORKING';
        brandProcessId = bpId;
      } else if (avail && !avail.isAvailable) {
        // Determine why unavailable
        if (avail.reason === 'PUBLIC_HOLIDAY') status = 'PUBLIC_HOLIDAY';
        else if (avail.reason === 'LEAVE') status = 'LEAVE';
        else if (avail.reason === 'COMP_OFF') status = 'COMP_OFF';
        else status = 'WEEKLY_OFF';
      } else {
        // Available but not assigned
        status = 'WEEKLY_OFF';
      }
      
      entries.push({
        date,
        employeeId: emp.id,
        brandProcessId,
        status,
      });
    }
  }
  
  return entries;
}

/**
 * Build availability map: { employeeId: { date: { isAvailable, reason } } }
 */
function buildAvailabilityMap(employees, leaves, holidays, month, year) {
  const map = new Map();
  
  for (const emp of employees) {
    const empAvail = {};
    
    for (const date of monthDays(month, year)) {
      const dateStr = ymd(date);
      const dayOfWeek = date.getUTCDay();
      
      // Check if public holiday
      const isHoliday = holidays.some((h) => ymd(h.date) === dateStr);
      if (isHoliday) {
        empAvail[dateStr] = { isAvailable: false, reason: 'PUBLIC_HOLIDAY' };
        continue;
      }
      
      // Check if on leave
      const onLeave = leaves.some((l) =>
        l.employeeId === emp.id &&
        l.status === 'APPROVED' &&
        date >= l.startDate &&
        date <= l.endDate &&
        (l.type === 'PLANNED_LEAVE' || l.type === 'SICK_LEAVE')
      );
      if (onLeave) {
        empAvail[dateStr] = { isAvailable: false, reason: 'LEAVE' };
        continue;
      }
      
      // Check if comp-off
      const isCompOff = leaves.some((l) =>
        l.employeeId === emp.id &&
        l.status === 'APPROVED' &&
        date >= l.startDate &&
        date <= l.endDate &&
        l.type === 'COMP_OFF'
      );
      if (isCompOff) {
        empAvail[dateStr] = { isAvailable: false, reason: 'COMP_OFF' };
        continue;
      }
      
      // Check if weekly off
      if (dayOfWeek === emp.weeklyOffDay) {
        empAvail[dateStr] = { isAvailable: false, reason: 'WEEKLY_OFF' };
        continue;
      }
      
      // Available
      empAvail[dateStr] = { isAvailable: true };
    }
    
    map.set(emp.id, empAvail);
  }
  
  return map;
}

/**
 * Determine if brand-process operates on given date
 */
function operatesOn(rule, date, isHoliday) {
  const dayOfWeek = date.getUTCDay();
  const isSunday = dayOfWeek === 0;
  
  switch (rule) {
    case 'ALL_365':
      return true;
    
    case 'DAILY_EXCEPT_PUBLIC_HOLIDAYS':
      return !isHoliday;
    
    case 'NO_SUNDAYS_AND_HOLIDAYS':
      return !isSunday && !isHoliday;
    
    default:
      return false;
  }
}
```

### 8.3 Algorithm Characteristics

**Time Complexity:** O(D × B × E)
- D = days in month (~30)
- B = number of brand-processes (~80)
- E = number of employees (~30)
- Total: ~72,000 operations (very fast)

**Space Complexity:** O(E × D)
- Availability map: 30 employees × 30 days = 900 entries
- Roster entries: 30 employees × 30 days = 900 entries

**Determinism:**
- Same input always produces same output
- No random selection
- Predictable behavior for testing

**Fairness:**
- Sorts employees by current workload before assignment
- Employee with least assignments gets next assignment
- Prevents overloading specific employees

**Primary Preference:**
- If multiple employees eligible, prefer primary assignment
- Ensures main employee handles their brand first
- Backup employees fill gaps only when needed

### 8.4 Algorithm Edge Cases

**Case 1: No Employees Available**
- **Scenario:** All employees on leave on same day
- **Result:** No assignment created (creates COVERAGE_GAP conflict)
- **Resolution:** Ops manager manually overrides or adjusts leaves

**Case 2: Employee Not Assigned to Any Brand-Process**
- **Scenario:** New employee added but no assignments created
- **Result:** Employee gets weekly off every day
- **Resolution:** Add assignments on Assignments Page

**Case 3: Brand Operates on Public Holiday**
- **Scenario:** Brand with `ALL_365` rule on Dec 25
- **Result:** Assigned employees work on holiday
- **UI Indicator:** Cell shows "H" background, employee name shown

**Case 4: Multiple Processes for Same Brand**
- **Scenario:** Brand A has CS, ACC, NDR processes
- **Result:** Different employees assigned to each process
- **UI Display:** Cell shows all assigned processes

**Case 5: Employee Leaves Mid-Month**
- **Scenario:** Employee has leave from Jan 15-20
- **Result:** Available Jan 1-14, unavailable Jan 15-20, available Jan 21-31
- **Algorithm:** Checks leave dates for each day independently

### 8.5 Algorithm Improvements (Future)

**Potential Enhancements:**

1. **Min Coverage Enforcement:**
   - Currently generates 1 employee per brand-process
   - Enhancement: Assign `minCoverage` employees per process
   - Use case: Critical processes need 2+ employees

2. **Shift Scheduling:**
   - Currently assumes single shift per day
   - Enhancement: Support morning/evening/night shifts
   - Database: Add `shift` field to RosterEntry

3. **Employee Preferences:**
   - Currently uses fixed weekly off day
   - Enhancement: Allow employees to request specific dates off
   - Database: Add `preference` field to Employee

4. **Skill Matching:**
   - Currently assigns any available employee
   - Enhancement: Match employee skills to process requirements
   - Database: Add `skills` JSON field to Employee and Process

5. **Optimization Algorithms:**
   - Currently uses greedy approach
   - Enhancement: Use constraint satisfaction solver (e.g., OR-Tools)
   - Benefit: Find globally optimal solution, not just locally optimal

---

## 9. Conflict Detection System

### 9.1 Conflict Architecture

**Purpose:** Identify scheduling issues that violate business rules or best practices.

**Detection Points:**
1. **Post-Generation:** After roster is generated
2. **Post-Edit:** After manual entry update
3. **On-Demand:** Dashboard and reporting pages

**Conflict Lifecycle:**

```
Roster Generated/Updated
         ↓
computeConflicts() runs
         ↓
Conflicts stored in memory (not database)
         ↓
UI displays conflicts with severity badges
         ↓
User fixes issue manually
         ↓
Conflicts recomputed
         ↓
Issue resolved (conflict disappears)
```

### 9.2 Conflict Types

#### **COVERAGE_GAP (Severity: ERROR)**

**Definition:** A brand-process that should operate on a date has no employee assigned.

**Detection Logic:**
```javascript
for (const bp of brandProcesses) {
  const rule = bp.operatingRule || bp.brand.operatingRule;
  
  for (const date of monthDays(month, year)) {
    const isHoliday = holidays.some((h) => ymd(h.date) === ymd(date));
    
    if (operatesOn(rule, date, isHoliday)) {
      const working = entries.filter((e) =>
        ymd(e.date) === ymd(date) &&
        e.brandProcessId === bp.id &&
        e.status === 'WORKING'
      );
      
      if (working.length < bp.minCoverage) {
        conflicts.push({
          type: 'COVERAGE_GAP',
          severity: 'ERROR',
          message: `Insufficient coverage for ${bp.brand.name} - ${bp.process.name} on ${ymd(date)}`,
          date: ymd(date),
          brandProcessId: bp.id,
          required: bp.minCoverage,
          actual: working.length,
        });
      }
    }
  }
}
```

**Common Causes:**
- All employees on leave
- No employees assigned to brand-process
- Employee removed from assignment after roster generated

**Resolution:**
- Manually assign available employee
- Adjust leave dates
- Add more employees to brand-process

---

#### **NO_EMPLOYEES_ASSIGNED (Severity: WARNING)**

**Definition:** A brand-process exists but has zero employees in the Assignment table.

**Detection Logic:**
```javascript
for (const bp of brandProcesses) {
  const hasAssignments = assignments.some((a) => a.brandProcessId === bp.id);
  
  if (!hasAssignments) {
    conflicts.push({
      type: 'NO_EMPLOYEES_ASSIGNED',
      severity: 'WARNING',
      message: `No employees assigned to ${bp.brand.name} - ${bp.process.name}`,
      brandProcessId: bp.id,
    });
  }
}
```

**Common Causes:**
- New brand-process created but not yet configured
- All employees removed from brand-process
- Data migration issue

**Resolution:**
- Navigate to Assignments Page
- Create assignments for this brand-process
- Regenerate roster

---

#### **LEAVE_CONFLICT (Severity: ERROR)**

**Definition:** An employee is scheduled to work on a day they have approved leave.

**Detection Logic:**
```javascript
for (const entry of entries.filter((e) => e.status === 'WORKING')) {
  const empLeaves = leaves.filter((l) =>
    l.employeeId === entry.employeeId &&
    l.status === 'APPROVED'
  );
  
  for (const leave of empLeaves) {
    if (entry.date >= leave.startDate && entry.date <= leave.endDate) {
      conflicts.push({
        type: 'LEAVE_CONFLICT',
        severity: 'ERROR',
        message: `${entry.employee.name} scheduled to work on approved leave (${ymd(entry.date)})`,
        date: ymd(entry.date),
        employeeId: entry.employeeId,
        leaveId: leave.id,
      });
    }
  }
}
```

**Common Causes:**
- Leave added after roster generated
- Manual edit assigned employee to work on leave day
- Leave status changed from PENDING to APPROVED

**Resolution:**
- Remove work assignment (change status to LEAVE)
- Reject the leave request
- Assign different employee to cover

---

#### **WEEKLY_OFF_OVERRIDE (Severity: INFO)**

**Definition:** An employee is scheduled to work on their preferred weekly off day.

**Detection Logic:**
```javascript
for (const entry of entries.filter((e) => e.status === 'WORKING')) {
  const emp = employees.find((e) => e.id === entry.employeeId);
  const dayOfWeek = entry.date.getUTCDay();
  
  if (dayOfWeek === emp.weeklyOffDay) {
    conflicts.push({
      type: 'WEEKLY_OFF_OVERRIDE',
      severity: 'INFO',
      message: `${emp.name} working on preferred weekly off (${DAY_NAMES[dayOfWeek]})`,
      date: ymd(entry.date),
      employeeId: entry.employeeId,
    });
  }
}
```

**Common Causes:**
- High workload requires employee availability
- Manual override by ops manager
- Coverage gap has no other options

**Resolution:**
- **Acceptable:** This is informational, not an error
- **Optional:** Assign different employee if available
- **Long-term:** Hire more employees to reduce overrides

---

### 9.3 Conflict Severity Levels

| Severity | Color | Icon | Action Required |
|----------|-------|------|----------------|
| **ERROR** | Red | ❌ | Must fix before publishing |
| **WARNING** | Yellow | ⚠️ | Recommended to fix |
| **INFO** | Blue | ℹ️ | Informational only |

**Severity Guidelines:**

**ERROR:**
- Blocks business operations
- Violates hard constraints
- Must be resolved before roster approval

**WARNING:**
- Indicates potential issues
- May cause problems if not addressed
- Review recommended but not required

**INFO:**
- Informational only
- Does not block operations
- May be acceptable based on business needs

### 9.4 Conflict Resolution Workflow

**Automatic Resolution (Algorithm):**
- Algorithm tries to avoid conflicts during generation
- Checks availability before assignment
- Skips employees on leave/weekly off

**Manual Resolution (User):**

1. **Identify Conflict:**
   - View conflicts on Dashboard or Roster Page
   - Conflicts highlighted with red borders

2. **Choose Resolution:**
   - **Option A:** Fix underlying data (add assignment, adjust leave)
   - **Option B:** Manual override (assign different employee)
   - **Option C:** Accept conflict (if INFO severity)

3. **Apply Fix:**
   - Edit roster entry via click-to-edit modal
   - Or navigate to master data page (Assignments, Leaves)

4. **Verify Resolution:**
   - Conflicts recomputed automatically
   - Confirm conflict no longer appears

**Example Workflow:**

```
Problem: Coverage gap on Jan 15 for Brand A - CS

Step 1: Check Dashboard → see ERROR conflict
Step 2: Navigate to Roster Page → Jan 15 column
Step 3: Click empty cell for available employee
Step 4: Select "Brand A - CS" from dropdown
Step 5: Save → conflict disappears
```

### 9.5 Conflict Performance

**Computation Time:**
- **Average:** 50-100ms for monthly roster (30 employees, 80 brand-processes)
- **Worst Case:** 500ms for large dataset (100 employees, 200 brand-processes)

**Optimization Strategies:**

1. **Memoization:** Cache operating dates for brand-processes
2. **Indexing:** Create lookup maps for fast filtering
3. **Lazy Loading:** Compute conflicts only when needed (not stored in DB)
4. **Incremental Updates:** Recompute only affected dates on edit

**Scalability:**
- Current implementation handles 100 employees × 200 brand-processes
- For larger datasets, consider:
  - Server-side conflict computation
  - Background job processing
  - Conflict caching in Redis

---

## 10. API Documentation

### 10.1 Authentication Endpoints

#### **POST /api/auth/register**

Create a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "OPS_MANAGER"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "OPS_MANAGER"
  }
}
```

**Validation:**
- `name`: Required, non-empty string
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters
- `role`: Optional, defaults to `OPS_MANAGER`

---

#### **POST /api/auth/login**

Authenticate and receive JWT token.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "OPS_MANAGER"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### **GET /api/auth/me**

Get current user info (requires authentication).

**Request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "OPS_MANAGER"
  }
}
```

---

### 10.2 Employee Endpoints

#### **GET /api/employees**

List all employees with pod information.

**Request:**
```http
GET /api/employees
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "emp1",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "podId": "pod1",
    "weeklyOffDay": 0,
    "isActive": true,
    "pod": {
      "id": "pod1",
      "name": "Pod Alpha"
    }
  }
]
```

---

#### **POST /api/employees**

Create a new employee.

**Request:**
```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bob Johnson",
  "email": "bob@example.com",
  "podId": "pod1",
  "weeklyOffDay": 0
}
```

**Response (201):**
```json
{
  "id": "emp2",
  "name": "Bob Johnson",
  "email": "bob@example.com",
  "podId": "pod1",
  "weeklyOffDay": 0,
  "isActive": true
}
```

**Validation:**
- `name`: Required
- `email`: Required, unique
- `podId`: Optional, must exist if provided
- `weeklyOffDay`: Optional, 0-6 (0=Sunday, 6=Saturday)

---

#### **PATCH /api/employees/:id**

Update employee details.

**Request:**
```http
PATCH /api/employees/emp1
Authorization: Bearer <token>
Content-Type: application/json

{
  "weeklyOffDay": 6,
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "emp1",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "podId": "pod1",
  "weeklyOffDay": 6,
  "isActive": false
}
```

---

#### **DELETE /api/employees/:id**

Delete an employee (cascades to assignments and roster entries).

**Request:**
```http
DELETE /api/employees/emp1
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "ok": true
}
```

---

### 10.3 Brand Endpoints

#### **GET /api/brands**

List all brands.

**Request:**
```http
GET /api/brands
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "brand1",
    "name": "Brand A",
    "operatingRule": "DAILY_EXCEPT_PUBLIC_HOLIDAYS"
  }
]
```

---

#### **POST /api/brands**

Create a new brand.

**Request:**
```http
POST /api/brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Brand B",
  "operatingRule": "NO_SUNDAYS_AND_HOLIDAYS"
}
```

**Response (201):**
```json
{
  "id": "brand2",
  "name": "Brand B",
  "operatingRule": "NO_SUNDAYS_AND_HOLIDAYS"
}
```

**Operating Rules:**
- `ALL_365`: Every day including holidays
- `DAILY_EXCEPT_PUBLIC_HOLIDAYS`: Mon-Sun except holidays
- `NO_SUNDAYS_AND_HOLIDAYS`: Mon-Sat, no holidays

---

### 10.4 Roster Endpoints

#### **GET /api/rosters**

Fetch roster for specific month/year.

**Request:**
```http
GET /api/rosters?month=1&year=2025
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "roster1",
  "month": 1,
  "year": 2025,
  "status": "DRAFT",
  "entries": [
    {
      "id": "entry1",
      "rosterId": "roster1",
      "date": "2025-01-01T00:00:00.000Z",
      "employeeId": "emp1",
      "brandProcessId": "bp1",
      "status": "WORKING",
      "employee": {
        "id": "emp1",
        "name": "Alice Smith"
      },
      "brandProcess": {
        "id": "bp1",
        "brand": { "name": "Brand A" },
        "process": { "name": "CS" }
      }
    }
  ]
}
```

**Query Parameters:**
- `month`: Required (1-12)
- `year`: Required (YYYY)

---

#### **POST /api/rosters/generate**

Generate roster for month/year.

**Request:**
```http
POST /api/rosters/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": 1,
  "year": 2025
}
```

**Response (200):**
```json
{
  "id": "roster1",
  "month": 1,
  "year": 2025,
  "status": "DRAFT",
  "entries": [ /* ... */ ]
}
```

**Behavior:**
- If roster exists and status is `DRAFT`: overwrites entries
- If roster exists and status is `PUBLISHED`: returns 409 error
- If roster doesn't exist: creates new roster

---

#### **PATCH /api/rosters/:id**

Update roster status (publish/unpublish).

**Request:**
```http
PATCH /api/rosters/roster1
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PUBLISHED"
}
```

**Response (200):**
```json
{
  "id": "roster1",
  "month": 1,
  "year": 2025,
  "status": "PUBLISHED"
}
```

---

#### **PATCH /api/rosters/entries/:entryId**

Update a single roster entry.

**Request:**
```http
PATCH /api/rosters/entries/entry1
Authorization: Bearer <token>
Content-Type: application/json

{
  "brandProcessId": "bp2",
  "status": "WORKING"
}
```

**Response (200):**
```json
{
  "id": "entry1",
  "date": "2025-01-01T00:00:00.000Z",
  "employeeId": "emp1",
  "brandProcessId": "bp2",
  "status": "WORKING"
}
```

**Validation:**
- `status`: Must be valid enum (`WORKING`, `WEEKLY_OFF`, `LEAVE`, `COMP_OFF`, `PUBLIC_HOLIDAY`)
- `brandProcessId`: Required if status is `WORKING`, null otherwise

---

#### **GET /api/rosters/:id/conflicts**

Get conflicts for a roster.

**Request:**
```http
GET /api/rosters/roster1/conflicts
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "conflicts": [
    {
      "type": "COVERAGE_GAP",
      "severity": "ERROR",
      "message": "No coverage for Brand A - CS on 2025-01-15",
      "date": "2025-01-15",
      "brandProcessId": "bp1"
    }
  ]
}
```

---

### 10.5 Dashboard Endpoint

#### **GET /api/dashboard**

Get dashboard statistics for month/year.

**Request:**
```http
GET /api/dashboard?month=1&year=2025
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalEmployees": 30,
  "activeBrands": 20,
  "coveragePercentage": 92.5,
  "conflicts": [
    {
      "type": "COVERAGE_GAP",
      "severity": "ERROR",
      "message": "No coverage for Brand A - CS on 2025-01-15",
      "date": "2025-01-15",
      "brandProcessId": "bp1"
    }
  ]
}
```

**Query Parameters:**
- `month`: Required (1-12)
- `year`: Required (YYYY)

---

### 10.6 Complete API Reference

**All Endpoints Summary:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/register | Create user account | No |
| POST | /api/auth/login | Login and get token | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/employees | List employees | Yes |
| POST | /api/employees | Create employee | Yes |
| PATCH | /api/employees/:id | Update employee | Yes |
| DELETE | /api/employees/:id | Delete employee | Yes |
| GET | /api/brands | List brands | Yes |
| POST | /api/brands | Create brand | Yes |
| PATCH | /api/brands/:id | Update brand | Yes |
| DELETE | /api/brands/:id | Delete brand | Yes |
| GET | /api/processes | List processes | Yes |
| POST | /api/processes | Create process | Yes |
| PATCH | /api/processes/:id | Update process | Yes |
| DELETE | /api/processes/:id | Delete process | Yes |
| GET | /api/brand-processes | List brand-processes | Yes |
| POST | /api/brand-processes | Create brand-process | Yes |
| PATCH | /api/brand-processes/:id | Update brand-process | Yes |
| DELETE | /api/brand-processes/:id | Delete brand-process | Yes |
| GET | /api/assignments | List assignments | Yes |
| POST | /api/assignments | Create assignment | Yes |
| DELETE | /api/assignments/:id | Delete assignment | Yes |
| GET | /api/leaves | List leaves | Yes |
| POST | /api/leaves | Create leave | Yes |
| PATCH | /api/leaves/:id | Update leave | Yes |
| DELETE | /api/leaves/:id | Delete leave | Yes |
| GET | /api/holidays | List holidays | Yes |
| POST | /api/holidays | Create holiday | Yes |
| DELETE | /api/holidays/:id | Delete holiday | Yes |
| GET | /api/pods | List pods | Yes |
| POST | /api/pods | Create pod | Yes |
| PATCH | /api/pods/:id | Update pod | Yes |
| DELETE | /api/pods/:id | Delete pod | Yes |
| GET | /api/rosters | Fetch roster | Yes |
| POST | /api/rosters/generate | Generate roster | Yes |
| PATCH | /api/rosters/:id | Update roster status | Yes |
| PATCH | /api/rosters/entries/:entryId | Update entry | Yes |
| GET | /api/rosters/:id/conflicts | Get conflicts | Yes |
| GET | /api/dashboard | Get dashboard stats | Yes |

---

## 11. User Interface Guide

### 11.1 Login Page

**URL:** `/login`

**Features:**
- Email and password input fields
- "Login" button
- Error message display for invalid credentials
- Redirects to Dashboard on successful login

**Form Validation:**
- Email must be valid format
- Password required (no minimum length enforced client-side)
- Shows server error messages

**UI Flow:**
```
User enters credentials → Click Login
  → API call to /api/auth/login
  → Success: Store token, redirect to /
  → Failure: Display error message
```

---

### 11.2 Dashboard Page

**URL:** `/`

**Purpose:** Overview of system health and roster status.

**Components:**

1. **Month/Year Selector:**
   - Dropdowns to select month and year
   - Defaults to current month/year
   - Changes trigger data refetch

2. **Statistics Cards:**
   - Total Employees (active only)
   - Active Brands (brands with assignments)
   - Coverage % (assigned days / required days × 100)
   - Active Conflicts (ERROR/WARNING severity)

3. **Conflicts Section:**
   - Table listing all conflicts
   - Columns: Type, Severity, Message, Date
   - Severity badges (red/yellow/blue)
   - Sorted by severity then date

4. **Quick Actions:**
   - "View Roster" button → navigates to /roster
   - "Generate Roster" button → triggers roster generation

**Data Flow:**
```
Page Load → GET /api/dashboard?month=X&year=Y
  → Display stats and conflicts
  → User changes month
  → Refetch with new params
```

---

### 11.3 Roster Page

**URL:** `/roster`

**Purpose:** Main roster management interface with employee-centric view.

**Features:**

**Tab 1: Employee View**

- **Search Box**: Filter employees by name
- **Month/Year Selector**: Navigate to different months
- **Action Buttons**:
  - "Generate Roster": Create/regenerate roster
  - "Publish"/"Unpublish": Toggle roster status

**Roster Grid:**
- **Rows:** Employees (name + pod)
- **Columns:** Dates (1-31)
- **Cell Content:** Brand-Process abbreviation or status code
  - "ABC-CS" = Working on Brand ABC's CS process
  - "O" = Weekly off
  - "L" = On leave
  - "H" = Public holiday
  - "C" = Comp-off
- **Cell Colors:**
  - Green background = Working
  - Gray background = Off
  - Red background = Leave
  - Blue background = Holiday
  - Red border = Conflict
- **Click-to-Edit:** Click cell to open edit modal

**Edit Modal:**
- Shows employee name and date
- Dropdown to select brand-process (filtered by employee assignments)
- Radio buttons to mark as leave/comp-off/weekly off
- Save button updates entry
- Displays error if validation fails

**Tab 2: Coverage View**

- **Rows:** Brand-Processes
- **Columns:** Dates
- **Cell Content:** Employee names assigned to this brand-process
- **Cell Colors:**
  - Green = At least one employee assigned
  - Red = No employees (coverage gap)
- **Click-to-View:** Shows employee details (read-only)

**Tab 3: Calendar Summary**

- **Week Grid:** 7 columns (Sun-Sat), rows auto-wrap
- **Day Cells:**
  - Day number
  - Working count (e.g., "23W")
  - Off count (e.g., "7O")
- **Daily Details Table:**
  - Expandable rows for each day
  - Shows breakdown: working, offs, leaves, holidays
- **Month Totals:**
  - Total working days
  - Total off days
  - Total leave days

**Data Flow:**
```
Page Load → GET /api/rosters?month=X&year=Y
  → Display grid
  → User clicks cell
  → Open modal with current assignment
  → User changes assignment
  → PATCH /api/rosters/entries/:entryId
  → Refetch roster
  → Update grid
```

---

### 11.4 Pod Roster Page

**URL:** `/pod-roster`

**Purpose:** View schedules grouped by pod.

**Components:**

1. **Pod Selector:**
   - Dropdown to select pod
   - Defaults to first pod
   - Changes trigger grid filter

2. **Pod Statistics:**
   - Total working days (all employees in pod)
   - Total offs
   - Total leaves

3. **Employee Grid:**
   - Rows: Employees in selected pod
   - Columns: Dates
   - Cells: Status codes (W/O/L/H/C)
   - **Read-Only** (no click-to-edit)

4. **Conflicts Section:**
   - Filtered to show only conflicts affecting this pod
   - Same table format as Dashboard

**Data Flow:**
```
Page Load → GET /api/rosters?month=X&year=Y
  → GET /api/employees (to get pod assignments)
  → Filter entries by podId
  → Display filtered grid
```

---

### 11.5 Process Roster Page

**URL:** `/process-roster`

**Purpose:** View schedules grouped by process.

**Components:**

1. **Process Selector:**
   - Dropdown to select process
   - Changes trigger grid filter

2. **Brand Coverage Table:**
   - Rows: Brands offering selected process
   - Column: Assigned employees
   - Shows which employees handle each brand

3. **Employee Grid:**
   - Rows: Employees assigned to selected process
   - Columns: Dates
   - Cells: Status codes
   - **Read-Only**

4. **Coverage Gaps Section:**
   - Lists dates with no coverage for brand-processes
   - Format: "Brand A - no coverage on 2025-01-15"

**Data Flow:**
```
Page Load → GET /api/rosters?month=X&year=Y
  → GET /api/brand-processes (to get process links)
  → GET /api/assignments (to get employee-brand links)
  → Filter entries by processId
  → Display filtered grid
```

---

### 11.6 Employees Page

**URL:** `/employees`

**Purpose:** Manage employee master data.

**Features:**

1. **Search Box:**
   - Filters by name, email, or pod name
   - Real-time filtering (no API call)

2. **Add Employee Button:**
   - Opens modal with form
   - Fields: Name, Email, Pod, Weekly Off Day
   - Submit calls POST /api/employees

3. **Employee List:**
   - Card layout showing:
     - Name and email
     - Pod name
     - Weekly off day (e.g., "Sunday")
     - Active status badge
   - Edit button (opens modal)
   - Delete button (shows confirmation)

4. **Edit Modal:**
   - Pre-filled form with current values
   - Submit calls PATCH /api/employees/:id

**Data Flow:**
```
Page Load → GET /api/employees
  → GET /api/pods (for pod dropdown)
  → Display list
  → User clicks "Add"
  → Open modal
  → User fills form → POST /api/employees
  → Refetch employees
```

---

### 11.7 Brands Page

**URL:** `/brands`

**Purpose:** Manage brand master data.

**Features:**

1. **Search Box:** Filter by brand name or operating rule

2. **Add Brand Button:** Opens modal

3. **Brand List:**
   - Cards showing brand name and operating rule
   - Color-coded rule badges:
     - Green: ALL_365
     - Blue: DAILY_EXCEPT_PUBLIC_HOLIDAYS
     - Yellow: NO_SUNDAYS_AND_HOLIDAYS
   - Edit and Delete buttons

4. **Brand Form:**
   - Name (text input)
   - Operating Rule (dropdown)
   - Submit creates/updates brand

---

### 11.8 Assignments Page

**URL:** `/assignments`

**Purpose:** Link employees to brand-processes.

**Features:**

1. **Search Box:** Filter by employee name, brand name, or process name

2. **Add Assignment Button:** Opens modal

3. **Assignment List:**
   - Table with columns:
     - Employee Name
     - Brand Name
     - Process Name
     - Primary/Backup badge
     - Delete button
   - Sorted by employee name

4. **Assignment Form:**
   - Employee (dropdown, searchable)
   - Brand (dropdown)
   - Process (dropdown, filtered by selected brand)
   - Is Primary (checkbox)
   - Submit calls POST /api/assignments

**Data Flow:**
```
Page Load → GET /api/assignments (includes relations)
  → GET /api/employees
  → GET /api/brand-processes
  → Display list
  → User clicks "Add"
  → User selects employee, brand, process
  → POST /api/assignments
  → Refetch assignments
```

---

### 11.9 Leaves Page

**URL:** `/leaves`

**Purpose:** Manage employee leave requests.

**Features:**

1. **Filter Options:**
   - Employee (dropdown)
   - Status (all/pending/approved/rejected)
   - Type (all/planned/comp-off/sick)

2. **Add Leave Button:** Opens modal

3. **Leave List:**
   - Table with columns:
     - Employee Name
     - Start Date → End Date
     - Type badge
     - Status badge (color-coded)
     - Approve/Reject buttons (if pending)
     - Delete button
   - Sorted by start date descending

4. **Leave Form:**
   - Employee (dropdown)
   - Start Date (date picker)
   - End Date (date picker)
   - Type (dropdown)
   - Reason (textarea, optional)
   - Submit calls POST /api/leaves (status defaults to PENDING)

5. **Approval Actions:**
   - Approve button → PATCH with status=APPROVED
   - Reject button → PATCH with status=REJECTED

**Data Flow:**
```
Page Load → GET /api/leaves (includes employee relation)
  → GET /api/employees (for dropdown)
  → Display list
  → User clicks "Approve"
  → PATCH /api/leaves/:id with status=APPROVED
  → Refetch leaves
```

---

### 11.10 UI Component Library

**Common Components:**

**Button:**
```jsx
<button className="btn btn-primary">
  Primary Action
</button>
```
Classes: `btn`, `btn-primary`, `btn-danger`, `btn-secondary`

**Card:**
```jsx
<div className="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

**Modal:**
```jsx
<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  <h2>Modal Title</h2>
  <form onSubmit={handleSubmit}>
    {/* form fields */}
    <button type="submit">Submit</button>
  </form>
</Modal>
```

**Input Field:**
```jsx
<div className="form-group">
  <label htmlFor="name">Name:</label>
  <input
    id="name"
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    required
  />
</div>
```

**Select Dropdown:**
```jsx
<select value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
  <option value="">Select...</option>
  {options.map((opt) => (
    <option key={opt.id} value={opt.id}>
      {opt.name}
    </option>
  ))}
</select>
```

**Badge:**
```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-danger">Inactive</span>
<span className="badge badge-warning">Pending</span>
```

**Loading Spinner:**
```jsx
{loading && <div className="loading">Loading...</div>}
```

**Error Message:**
```jsx
{error && <div className="error">{error}</div>}
```

---

## 12. Setup & Installation

### 12.1 Prerequisites

**Software Requirements:**

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **PostgreSQL** | 13+ | Database server |
| **Git** | Any | Version control |

**Operating Systems:**
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 20.04+, Debian 11+)

**Hardware Requirements:**
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Disk: 1GB free space

### 12.2 Installation Steps

**1. Clone Repository:**

```bash
git clone <repository-url>
cd roster-app
```

**2. Install Backend Dependencies:**

```bash
cd server
npm install
```

**3. Configure Environment Variables:**

Create `server/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/roster_db"

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your-secret-key-here"

# Server Port
PORT=4000

# Client Origin (for CORS)
CLIENT_ORIGIN="http://localhost:5173"
```

**4. Setup Database:**

```bash
# Create database
createdb roster_db

# Run migrations
npx prisma migrate dev

# Seed demo data (optional)
npm run seed
```

**5. Install Frontend Dependencies:**

```bash
cd ../client
npm install
```

**6. Configure Frontend Environment:**

Create `client/.env`:

```env
VITE_API_URL="http://localhost:4000/api"
```

**7. Start Development Servers:**

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

**8. Access Application:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Database: localhost:5432

**9. Create First User:**

Option A: Use seed data (default user: ops@example.com / password123)

Option B: Register via UI (visit /login, no register button yet - need to call API directly):

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "securePassword123",
    "role": "ADMIN"
  }'
```

### 12.3 Database Setup Details

**PostgreSQL Installation:**

**Windows:**
```bash
# Download installer from postgresql.org
# Run installer, set password for 'postgres' user
# Add PostgreSQL bin to PATH
```

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb roster_db
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb roster_db
sudo -u postgres createuser --superuser $USER
```

**Prisma Migration Commands:**

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

### 12.4 Seed Data

The seed script creates:
- 1 admin user
- 3 pods (Alpha, Beta, Gamma)
- 30 employees (10 per pod)
- 4 processes (CS, ACC, NDR, Retention)
- 20 brands with varying operating rules
- 80 brand-process links
- 60 employee assignments
- 10 public holidays
- 5 sample leaves

**Run Seed:**
```bash
cd server
npm run seed
```

**Default Login:**
- Email: ops@example.com
- Password: password123

---

## 13. Configuration

### 13.1 Environment Variables

**Backend (.env):**

```env
# Required
DATABASE_URL="postgresql://user:pass@host:port/database"
JWT_SECRET="<256-bit-hex-string>"

# Optional
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

**Frontend (.env):**

```env
# Required
VITE_API_URL="http://localhost:4000/api"

# Optional (defaults shown)
VITE_APP_TITLE="Smart Roster Management"
```

### 13.2 Database Configuration

**Connection String Format:**

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Example Configurations:**

**Local Development:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roster_db"
```

**Docker Compose:**
```
DATABASE_URL="postgresql://postgres:postgres@db:5432/roster_db"
```

**Production (SSL):**
```
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

**Connection Pooling (Prisma):**

```javascript
// server/src/prisma.js
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 13.3 CORS Configuration

**Default (Development):**

```javascript
// server/src/app.js
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
```

**Production (Specific Origins):**

```javascript
app.use(cors({
  origin: ['https://yourapp.com', 'https://www.yourapp.com'],
  credentials: true,
}));
```

### 13.4 JWT Configuration

**Token Expiration:**

```javascript
// server/src/middleware/auth.js
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    SECRET,
    { expiresIn: '7d' } // Change to '1h', '30d', etc.
  );
}
```

**Security Recommendations:**
- Use strong secret (256+ bits)
- Rotate secrets periodically
- Set appropriate expiration (balance security vs convenience)
- Store tokens securely (httpOnly cookies in production)

### 13.5 Vite Configuration

```javascript
// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

**Proxy Benefits:**
- Avoids CORS issues in development
- Simplifies API calls (use relative paths)
- Matches production setup

---

## 14. Data Flow

### 14.1 Roster Generation Flow

```
User Clicks "Generate Roster"
         ↓
Frontend: POST /api/rosters/generate { month, year }
         ↓
Backend: roster.controller.generateRoster()
         ↓
├─ Load employees (active only)
├─ Load assignments
├─ Load leaves (approved only)
├─ Load brand-processes
├─ Load public holidays
         ↓
Call scheduler.buildRoster()
         ↓
├─ Build availability map (employee × date)
├─ For each date:
│  ├─ Identify operating brand-processes
│  ├─ For each brand-process:
│  │  ├─ Find eligible employees
│  │  ├─ Sort by workload (fairness)
│  │  ├─ Assign first available
│  ├─ Create roster entries for all employees
         ↓
Save roster + entries to database
         ↓
Return roster with entries
         ↓
Frontend: Update state, re-render grid
```

### 14.2 Manual Edit Flow

```
User Clicks Cell in Roster Grid
         ↓
Frontend: Open modal with current entry
         ↓
User Selects New Assignment
         ↓
Frontend: PATCH /api/rosters/entries/:id { brandProcessId, status }
         ↓
Backend: roster.controller.updateEntry()
         ↓
├─ Validate entry exists
├─ Validate new assignment
├─ Update entry in database
         ↓
Return updated entry
         ↓
Frontend: Update state, close modal, re-render grid
         ↓
Automatically refetch conflicts
         ↓
Update conflict display
```

### 14.3 Conflict Detection Flow

```
Roster Generated/Updated
         ↓
Frontend: GET /api/rosters/:id/conflicts
         ↓
Backend: roster.controller.getConflicts()
         ↓
Call scheduler.computeConflicts()
         ↓
├─ Check coverage gaps (brand-process × date)
├─ Check leave conflicts (working on leave day)
├─ Check no-assignment warnings
├─ Check weekly-off overrides
         ↓
Return conflicts array
         ↓
Frontend: Display conflicts in UI
         ↓
User Fixes Issue
         ↓
Refetch conflicts
         ↓
Conflict disappears (if resolved)
```

### 14.4 Authentication Flow

```
User Enters Credentials
         ↓
Frontend: POST /api/auth/login { email, password }
         ↓
Backend: auth.controller.login()
         ↓
├─ Find user by email
├─ Compare password hash
├─ Generate JWT token
         ↓
Return { token, user }
         ↓
Frontend: Store token in localStorage
         ↓
Set Authorization header for future requests
         ↓
Redirect to Dashboard
         ↓
Protected Route: Check token
         ↓
If valid: Render page
If invalid: Redirect to /login
```

### 14.5 Data Loading Flow

```
Page Component Mounts
         ↓
useEffect hook runs
         ↓
API call with Axios
         ↓
Request Interceptor: Add Authorization header
         ↓
Backend: Verify JWT token
         ↓
If invalid: Return 401
If valid: Process request
         ↓
Response Interceptor: Check status
         ↓
If 401: Redirect to /login
If 200: Return data
         ↓
Frontend: Update state with data
         ↓
React re-renders component
         ↓
Display data in UI
```

---

## 15. Security

### 15.1 Authentication Security

**Password Hashing:**

```javascript
import bcrypt from 'bcryptjs';

// On registration
const passwordHash = await bcrypt.hash(password, 10);

// On login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**JWT Security:**

- **Secret Storage:** Store `JWT_SECRET` in environment variable (never commit)
- **Token Expiration:** Default 7 days (configurable)
- **Payload:** Minimal data (user ID, role, name, email)
- **Signing Algorithm:** HS256 (HMAC SHA-256)

**Token Storage:**

```javascript
// Current: localStorage (vulnerable to XSS)
localStorage.setItem('token', token);

// Recommended for production: httpOnly cookies
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### 15.2 Authorization

**Role-Based Access Control (RBAC):**

```javascript
// Current roles
enum UserRole {
  ADMIN
  OPS_MANAGER
  POD_LEAD
}

// Future middleware
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.delete('/api/employees/:id', requireAuth, requireRole('ADMIN'), employeeController.remove);
```

**Current Implementation:**
- All authenticated users have full access
- Future: Implement role-based permissions

### 15.3 Input Validation

**Backend Validation:**

```javascript
// Example: Create employee
export const create = ah(async (req, res) => {
  const { name, email, podId, weeklyOffDay } = req.body;
  
  // Required fields
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // Email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Weekly off day range
  if (weeklyOffDay !== undefined && (weeklyOffDay < 0 || weeklyOffDay > 6)) {
    return res.status(400).json({ error: 'weeklyOffDay must be 0-6' });
  }
  
  // Pod exists
  if (podId) {
    const podExists = await prisma.pod.findUnique({ where: { id: podId } });
    if (!podExists) {
      return res.status(400).json({ error: 'Pod not found' });
    }
  }
  
  // Create employee
  const employee = await prisma.employee.create({ data: { name, email, podId, weeklyOffDay } });
  res.status(201).json(employee);
});
```

**Frontend Validation:**

```jsx
<input
  type="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### 15.4 SQL Injection Protection

**Prisma ORM:**

Prisma automatically parameterizes queries, preventing SQL injection:

```javascript
// Safe (Prisma parameterizes)
await prisma.employee.findMany({
  where: { name: { contains: userInput } },
});

// Dangerous (never do this with Prisma)
await prisma.$executeRawUnsafe(`SELECT * FROM Employee WHERE name = '${userInput}'`);

// Safe raw query (use $executeRaw with parameters)
await prisma.$executeRaw`SELECT * FROM Employee WHERE name = ${userInput}`;
```

### 15.5 XSS Protection

**React Automatic Escaping:**

React escapes all string values by default:

```jsx
// Safe (React escapes)
<div>{userInput}</div>

// Dangerous (bypasses escaping)
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**CSP Headers (Future Enhancement):**

```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

### 15.6 CSRF Protection

**Current:** Not implemented (all requests are stateless with JWT)

**Future (if using cookies):**

```javascript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', (req, res) => {
  // CSRF token automatically validated
});
```

### 15.7 Rate Limiting

**Future Enhancement:**

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);
```

### 15.8 Security Checklist

**Production Deployment:**

- [ ] Use HTTPS (TLS/SSL certificates)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (256+ bits)
- [ ] Enable CORS whitelist (remove wildcard)
- [ ] Implement rate limiting
- [ ] Add CSP headers
- [ ] Use httpOnly cookies for tokens
- [ ] Enable Prisma query logging (monitor suspicious activity)
- [ ] Implement role-based access control
- [ ] Add input validation on all endpoints
- [ ] Sanitize error messages (don't leak internal details)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Database backups
- [ ] Monitor for security vulnerabilities

---

## 16. Testing Guide

### 16.1 Manual Testing Workflow

**Complete System Test:**

**1. Authentication:**
```
✓ Register new user
✓ Login with valid credentials
✓ Login with invalid credentials (should fail)
✓ Access protected route without token (should redirect)
✓ Logout
```

**2. Master Data:**
```
✓ Create pod
✓ Create employee (assign to pod)
✓ Update employee weekly off day
✓ Deactivate employee
✓ Create brand with operating rule
✓ Create process
✓ Create brand-process link
✓ Create assignment (employee → brand-process)
✓ Create public holiday
✓ Create leave request
✓ Approve leave
```

**3. Roster Generation:**
```
✓ Generate roster for current month
✓ Verify all employees have entries
✓ Verify employees on leave not assigned
✓ Verify weekly offs respected
✓ Verify operating rules respected
✓ Check for conflicts
```

**4. Manual Editing:**
```
✓ Click cell in roster
✓ Change assignment
✓ Save and verify update
✓ Mark employee as leave
✓ Verify conflict detection
```

**5. Reports:**
```
✓ View dashboard statistics
✓ View pod roster
✓ View process roster
✓ View calendar summary
✓ Verify all views show consistent data
```

### 16.2 API Testing with Postman

**Collection Structure:**

```
Roster Management API
├── Auth
│   ├── Register
│   ├── Login
│   └── Get Current User
├── Employees
│   ├── List Employees
│   ├── Create Employee
│   ├── Update Employee
│   └── Delete Employee
├── Brands
│   ├── List Brands
│   ├── Create Brand
│   ├── Update Brand
│   └── Delete Brand
├── Rosters
│   ├── Fetch Roster
│   ├── Generate Roster
│   ├── Update Roster Status
│   ├── Update Entry
│   └── Get Conflicts
└── Dashboard
    └── Get Stats
```

**Example Requests:**

**Login:**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "ops@example.com",
  "password": "password123"
}

# Save token from response
pm.environment.set("token", pm.response.json().token);
```

**Generate Roster:**
```
POST {{baseUrl}}/rosters/generate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "month": 1,
  "year": 2025
}
```

**Environment Variables:**
```
baseUrl: http://localhost:4000/api
token: <set-from-login-response>
```

### 16.3 Database Testing

**Prisma Studio:**

```bash
cd server
npx prisma studio
```

Opens GUI at http://localhost:5555 for browsing/editing data.

**SQL Queries:**

```bash
psql -U postgres -d roster_db
```

```sql
-- Count employees
SELECT COUNT(*) FROM "Employee";

-- Check roster entry counts
SELECT month, year, COUNT(*) 
FROM "RosterEntry" 
JOIN "Roster" ON "RosterEntry"."rosterId" = "Roster".id
GROUP BY month, year;

-- Find conflicts (manual check)
SELECT e.date, e."employeeId", e.status, l."startDate", l."endDate"
FROM "RosterEntry" e
JOIN "Leave" l ON e."employeeId" = l."employeeId"
WHERE e.status = 'WORKING'
  AND e.date >= l."startDate"
  AND e.date <= l."endDate"
  AND l.status = 'APPROVED';
```

### 16.4 Unit Testing (Future)

**Recommended Stack:**
- **Backend:** Jest + Supertest
- **Frontend:** Vitest + React Testing Library

**Example Backend Test:**

```javascript
// server/tests/scheduler.test.js
import { buildRoster } from '../src/utils/scheduler';

describe('Roster Scheduler', () => {
  test('assigns employees to operating brand-processes', () => {
    const employees = [/* ... */];
    const assignments = [/* ... */];
    const leaves = [];
    const brandProcesses = [/* ... */];
    const holidays = [];
    
    const entries = buildRoster(employees, assignments, leaves, brandProcesses, holidays, 1, 2025);
    
    expect(entries.length).toBe(employees.length * 31); // 31 days in January
    expect(entries.filter(e => e.status === 'WORKING').length).toBeGreaterThan(0);
  });
  
  test('respects employee leave', () => {
    const employees = [{ id: 'emp1', weeklyOffDay: 0 }];
    const assignments = [{ employeeId: 'emp1', brandProcess: { id: 'bp1' } }];
    const leaves = [{
      employeeId: 'emp1',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-15'),
      status: 'APPROVED',
      type: 'PLANNED_LEAVE',
    }];
    const brandProcesses = [{ id: 'bp1', operatingRule: 'ALL_365' }];
    const holidays = [];
    
    const entries = buildRoster(employees, assignments, leaves, brandProcesses, holidays, 1, 2025);
    const jan15 = entries.find(e => e.date.getUTCDate() === 15);
    
    expect(jan15.status).toBe('LEAVE');
    expect(jan15.brandProcessId).toBeNull();
  });
});
```

**Example Frontend Test:**

```javascript
// client/tests/LoginPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import api from '../src/api';

jest.mock('../src/api');

test('logs in user on form submit', async () => {
  api.post.mockResolvedValue({
    data: { token: 'fake-token', user: { name: 'Test User' } },
  });
  
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
  
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
  });
});
```

### 16.5 Load Testing (Future)

**Tool:** Apache JMeter or k6

**Scenario:**
- 100 concurrent users
- Each user generates roster for different month
- Measure response times and throughput

**Expected Performance:**
- Roster generation: < 1 second
- Conflict detection: < 500ms
- API endpoints: < 200ms

---

## 17. Deployment

### 17.1 Production Environment Setup

**Infrastructure Requirements:**

| Component | Minimum Spec | Recommended |
|-----------|--------------|-------------|
| **Web Server** | 1 vCPU, 1GB RAM | 2 vCPU, 2GB RAM |
| **Database** | 1 vCPU, 1GB RAM | 2 vCPU, 4GB RAM |
| **Storage** | 10GB SSD | 20GB SSD |
| **Bandwidth** | 100GB/month | 500GB/month |

**Hosting Options:**
- **Heroku:** Easy deployment, managed PostgreSQL
- **AWS:** EC2 + RDS, full control
- **DigitalOcean:** Droplets + Managed Databases
- **Vercel:** Frontend (Vite), Vercel Postgres
- **Render:** Full-stack, managed PostgreSQL

### 17.2 Heroku Deployment

**1. Install Heroku CLI:**

```bash
npm install -g heroku
heroku login
```

**2. Create Heroku Apps:**

```bash
# Create apps
heroku create roster-api
heroku create roster-client

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0 -a roster-api

# Get database URL
heroku config:get DATABASE_URL -a roster-api
```

**3. Configure Backend:**

```bash
cd server

# Set environment variables
heroku config:set JWT_SECRET="<your-secret>" -a roster-api
heroku config:set CLIENT_ORIGIN="https://roster-client.herokuapp.com" -a roster-api

# Deploy
git init
heroku git:remote -a roster-api
git add .
git commit -m "Initial commit"
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy -a roster-api
```

**4. Configure Frontend:**

```bash
cd client

# Set API URL
heroku config:set VITE_API_URL="https://roster-api.herokuapp.com/api" -a roster-client

# Deploy
git init
heroku git:remote -a roster-client
git add .
git commit -m "Initial commit"
git push heroku main
```

**5. Add Buildpacks:**

```bash
# Backend (Node.js)
heroku buildpacks:set heroku/nodejs -a roster-api

# Frontend (Node.js + static)
heroku buildpacks:add heroku/nodejs -a roster-client
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static -a roster-client
```

**6. Configure Static Buildpack:**

Create `client/static.json`:

```json
{
  "root": "dist",
  "clean_urls": true,
  "routes": {
    "/**": "index.html"
  }
}
```

### 17.3 Docker Deployment

**Dockerfile (Backend):**

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]
```

**Dockerfile (Frontend):**

```dockerfile
# client/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: roster_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  api:
    build: ./server
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/roster_db
      JWT_SECRET: your-secret-key
      PORT: 4000
      CLIENT_ORIGIN: http://localhost:3000
    ports:
      - '4000:4000'
    depends_on:
      - db
    command: sh -c "npx prisma migrate deploy && npm start"

  client:
    build: ./client
    environment:
      VITE_API_URL: http://localhost:4000/api
    ports:
      - '3000:80'
    depends_on:
      - api

volumes:
  postgres_data:
```

**Deploy:**

```bash
docker-compose up -d
```

### 17.4 nginx Configuration

**client/nginx.conf:**

```nginx
server {
  listen 80;
  server_name localhost;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://api:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### 17.5 SSL/TLS Setup

**Let's Encrypt (Free SSL):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

**Update nginx:**

```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  # ... rest of config
}

server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$server_name$request_uri;
}
```

### 17.6 Database Migration Strategy

**Zero-Downtime Migration:**

```bash
# 1. Backup database
pg_dump roster_db > backup.sql

# 2. Run migrations (non-breaking changes only)
npx prisma migrate deploy

# 3. If migration fails, rollback
psql roster_db < backup.sql
```

**Breaking Changes:**

```
1. Deploy new code with backward-compatible schema
2. Run data migration script
3. Deploy code that uses new schema
4. Remove old columns/tables
```

---

## 18. Troubleshooting

### 18.1 Common Issues

**Issue: "Prisma Client Not Generated"**

**Symptoms:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
cd server
npx prisma generate
```

---

**Issue: "Database Connection Failed"**

**Symptoms:**
```
Error: Can't reach database server at `localhost:5432`
```

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Linux/macOS
   sudo systemctl status postgresql
   # Windows
   pg_ctl status
   ```

2. Verify connection string in `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/roster_db"
   ```

3. Check firewall allows port 5432

4. Test connection:
   ```bash
   psql -U postgres -d roster_db
   ```

---

**Issue: "JWT Token Invalid"**

**Symptoms:**
```
401 Unauthorized: Invalid or expired token
```

**Solution:**
1. Clear localStorage and login again
2. Verify `JWT_SECRET` matches between sessions
3. Check token expiration (default 7 days)
4. Ensure Authorization header format: `Bearer <token>`

---

**Issue: "CORS Policy Error"**

**Symptoms:**
```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**
1. Check `CLIENT_ORIGIN` in `server/.env`:
   ```
   CLIENT_ORIGIN="http://localhost:5173"
   ```

2. Restart backend server

3. Verify CORS middleware in `server/src/app.js`:
   ```javascript
   app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
   ```

---

**Issue: "Roster Generation Takes Too Long"**

**Symptoms:**
- Generation takes > 5 seconds
- UI freezes during generation

**Solution:**
1. Check dataset size (30 employees × 80 brand-processes should be fast)
2. Add database indexes:
   ```prisma
   @@index([date, employeeId])
   @@index([rosterId, brandProcessId])
   ```
3. Profile algorithm with `console.time()`:
   ```javascript
   console.time('buildRoster');
   const entries = buildRoster(...);
   console.timeEnd('buildRoster');
   ```

---

**Issue: "Conflicts Not Updating"**

**Symptoms:**
- Fix issue but conflict still shows
- Conflict list stale

**Solution:**
1. Conflicts are computed on-demand, not cached
2. Force refetch after edit:
   ```javascript
   const handleSave = async () => {
     await api.patch(`/rosters/entries/${entryId}`, data);
     await fetchRoster(); // Refetch roster
     await fetchConflicts(); // Refetch conflicts
   };
   ```

3. Check browser console for API errors

---

### 18.2 Debugging Tools

**Backend Debugging:**

**Enable Prisma Query Logging:**

```javascript
// server/src/prisma.js
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Add Debug Logs:**

```javascript
export const generateRoster = ah(async (req, res) => {
  console.log('[Roster] Generating for', req.body);
  
  const entries = buildRoster(...);
  console.log('[Roster] Generated', entries.length, 'entries');
  
  res.json(roster);
});
```

**Frontend Debugging:**

**React DevTools:**
- Install browser extension
- Inspect component props/state
- Profile render performance

**Network Tab:**
- Monitor API requests
- Check request/response payloads
- Identify slow endpoints

**Console Logs:**

```javascript
useEffect(() => {
  console.log('[RosterPage] Fetching roster for', month, year);
  
  api.get('/rosters', { params: { month, year } })
    .then((res) => {
      console.log('[RosterPage] Received', res.data.entries.length, 'entries');
      setRoster(res.data);
    });
}, [month, year]);
```

---

### 18.3 Performance Profiling

**Backend Profiling:**

```bash
# Install clinic.js
npm install -g clinic

# Profile CPU
clinic doctor -- node server/src/index.js

# Profile event loop
clinic bubble -- node server/src/index.js

# Profile memory
clinic heapprofiler -- node server/src/index.js
```

**Frontend Profiling:**

```javascript
// Use React Profiler
import { Profiler } from 'react';

<Profiler id="RosterPage" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <RosterPage />
</Profiler>
```

**Database Query Performance:**

```sql
-- Enable query timing
\timing on

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM "RosterEntry"
WHERE "rosterId" = 'roster1'
  AND date >= '2025-01-01'
  AND date < '2025-02-01';

-- Check slow queries (PostgreSQL)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 19. Performance Optimization

### 19.1 Backend Optimization

**Database Indexing:**

```prisma
// schema.prisma

model RosterEntry {
  // ... fields

  @@index([rosterId, date]) // Optimize daily queries
  @@index([employeeId, date]) // Optimize employee lookups
  @@index([brandProcessId, date]) // Optimize coverage queries
}

model Leave {
  @@index([employeeId, status]) // Optimize availability checks
  @@index([startDate, endDate]) // Optimize date range queries
}
```

**Query Optimization:**

```javascript
// Bad: N+1 query problem
const employees = await prisma.employee.findMany();
for (const emp of employees) {
  const pod = await prisma.pod.findUnique({ where: { id: emp.podId } });
  emp.pod = pod;
}

// Good: Include relations
const employees = await prisma.employee.findMany({
  include: { pod: true },
});
```

**Batch Operations:**

```javascript
// Bad: Multiple inserts
for (const entry of entries) {
  await prisma.rosterEntry.create({ data: entry });
}

// Good: Batch insert
await prisma.rosterEntry.createMany({ data: entries });
```

**Connection Pooling:**

```javascript
// prisma.js
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  connectionLimit: 10,
});
```

### 19.2 Frontend Optimization

**Code Splitting:**

```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RosterPage = lazy(() => import('./pages/RosterPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/roster" element={<RosterPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Memoization:**

```javascript
import { useMemo } from 'react';

function RosterPage() {
  const [roster, setRoster] = useState(null);
  const [search, setSearch] = useState('');
  
  // Expensive filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);
  
  return <EmployeeGrid employees={filteredEmployees} />;
}
```

**Virtualization (Large Lists):**

```bash
npm install react-window
```

```javascript
import { FixedSizeList } from 'react-window';

function EmployeeList({ employees }) {
  const Row = ({ index, style }) => (
    <div style={style}>{employees[index].name}</div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={employees.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Debounced Search:**

```javascript
import { useState, useEffect } from 'react';

function SearchBox({ onSearch }) {
  const [input, setInput] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => onSearch(input), 300);
    return () => clearTimeout(timer);
  }, [input, onSearch]);
  
  return <input value={input} onChange={(e) => setInput(e.target.value)} />;
}
```

### 19.3 Caching Strategies

**Backend Caching (Redis):**

```bash
npm install redis
```

```javascript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export const getDashboard = ah(async (req, res) => {
  const { month, year } = req.query;
  const cacheKey = `dashboard:${month}:${year}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Compute stats
  const stats = await computeDashboardStats(month, year);
  
  // Cache for 5 minutes
  await redis.setEx(cacheKey, 300, JSON.stringify(stats));
  
  res.json(stats);
});
```

**Frontend Caching (React Query):**

```bash
npm install @tanstack/react-query
```

```javascript
import { useQuery } from '@tanstack/react-query';

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: () => api.get('/dashboard', { params: { month, year } }).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <Dashboard stats={data} />;
}
```

### 19.4 Bundle Size Optimization

**Analyze Bundle:**

```bash
npm run build -- --mode production
npx vite-bundle-visualizer
```

**Tree Shaking:**

```javascript
// Bad: Imports entire library
import _ from 'lodash';

// Good: Import only needed functions
import { sortBy } from 'lodash-es';
```

**Environment-Specific Code:**

```javascript
if (import.meta.env.DEV) {
  console.log('Debug info');
}
// This code is removed in production build
```

---

## 20. Future Enhancements

### 20.1 Planned Features

**1. Advanced Reporting:**
- **Employee Utilization Report**: Track workload distribution
- **Brand Coverage Report**: Identify under-staffed brands
- **Leave Balance Report**: Monitor leave accrual/usage
- **Forecast Report**: Predict staffing needs for next quarter

**2. Notifications:**
- **Email Alerts**: Notify employees of roster changes
- **SMS Integration**: Send roster via SMS
- **Push Notifications**: Mobile app notifications
- **Webhook Integration**: Trigger external systems on events

**3. Mobile App:**
- **React Native**: iOS/Android app
- **Employee Self-Service**: View own roster, request leaves
- **Push Notifications**: Roster published, leave approved
- **Offline Mode**: View cached roster without internet

**4. Approval Workflow:**
- **Roster Approval**: Pod leads review before publish
- **Leave Approval**: Multi-level approval chain
- **Change Requests**: Employees request roster changes
- **Audit Trail**: Track who approved what and when

**5. Shift Scheduling:**
- **Multiple Shifts**: Morning, evening, night
- **Shift Preferences**: Employees prefer certain shifts
- **Shift Rotation**: Automatic rotation across shifts
- **Overtime Tracking**: Flag excessive hours

**6. Skills & Certifications:**
- **Skill Matrix**: Tag employees with skills
- **Skill-Based Matching**: Assign based on required skills
- **Certification Expiry**: Alert before certifications expire
- **Training Recommendations**: Suggest training based on gaps

**7. Advanced Algorithm:**
- **Constraint Satisfaction**: Use OR-Tools for optimization
- **Multi-Objective Optimization**: Balance fairness, preferences, costs
- **What-If Analysis**: Preview impact of changes before applying
- **Auto-Conflict Resolution**: Suggest fixes for conflicts

**8. Integration:**
- **HRMS Integration**: Sync employee data with Workday/SAP
- **Calendar Integration**: Export to Google Calendar/Outlook
- **Slack/Teams Bots**: Query roster via chat
- **API for Third-Party Apps**: Public REST API

**9. Analytics Dashboard:**
- **Trends**: Workload trends over time
- **Heatmaps**: Identify busy vs slow periods
- **Predictive Analytics**: Forecast staffing needs
- **Custom Reports**: User-defined report builder

**10. Multi-Tenancy:**
- **Multiple Organizations**: Separate data per company
- **White-Label**: Customizable branding per tenant
- **Tenant-Specific Rules**: Different operating rules per org

### 20.2 Technical Debt

**Code Quality:**
- [ ] Add TypeScript for type safety
- [ ] Implement unit tests (Jest + React Testing Library)
- [ ] Add integration tests (Cypress/Playwright)
- [ ] Improve error handling (custom error classes)
- [ ] Add JSDoc comments to complex functions

**Security:**
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Use httpOnly cookies for tokens
- [ ] Add CSP headers

**Performance:**
- [ ] Add database indexes
- [ ] Implement Redis caching
- [ ] Add query result pagination
- [ ] Optimize frontend bundle size
- [ ] Add CDN for static assets

**DevOps:**
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add automated testing
- [ ] Add staging environment
- [ ] Implement blue-green deployment
- [ ] Add monitoring (New Relic/Datadog)

### 20.3 Scalability Roadmap

**Phase 1: Current (1-100 employees)**
- Single server
- PostgreSQL on same machine
- Manual deployment

**Phase 2: Growth (100-500 employees)**
- Separate API and database servers
- Read replicas for database
- Load balancer (nginx)
- Redis for caching
- Automated deployment (CI/CD)

**Phase 3: Enterprise (500+ employees)**
- Microservices architecture
- Kubernetes orchestration
- Database sharding
- Event-driven architecture (Kafka)
- Multi-region deployment
- Advanced monitoring (Datadog, Grafana)

### 20.4 Contributing

**How to Contribute:**

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with descriptive commits
4. Add tests for new features
5. Ensure all tests pass
6. Submit pull request

**Code Style:**
- Use ESLint (extends `eslint:recommended`)
- Prettier for formatting
- Conventional commits (feat, fix, docs, etc.)

**Pull Request Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)
```

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Assignment** | Link between employee and brand-process |
| **Brand** | Client brand requiring support |
| **Brand-Process** | Combination of brand and process type |
| **Conflict** | Scheduling issue violating business rules |
| **Coverage** | Percentage of required days with employee assignments |
| **Coverage Gap** | Operating day with no employee assigned |
| **Operating Rule** | Calendar defining when brand operates |
| **Pod** | Organizational group of employees |
| **Process** | Type of work (CS, ACC, NDR, Retention) |
| **Roster** | Monthly schedule container |
| **Roster Entry** | Single employee assignment for one day |
| **Weekly Off** | Employee's preferred day off (usually Sunday) |

### B. Acronyms

| Acronym | Full Form |
|---------|-----------|
| **ACC** | Abandoned Cart Conversion |
| **API** | Application Programming Interface |
| **CORS** | Cross-Origin Resource Sharing |
| **CSRF** | Cross-Site Request Forgery |
| **CS** | Customer Support |
| **CSP** | Content Security Policy |
| **JWT** | JSON Web Token |
| **NDR** | Non-Delivery Report |
| **ORM** | Object-Relational Mapping |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SQL** | Structured Query Language |
| **XSS** | Cross-Site Scripting |

### C. File Reference

**Key Files:**

| File | Purpose |
|------|---------|
| `server/prisma/schema.prisma` | Database schema |
| `server/src/utils/scheduler.js` | Core algorithm |
| `server/src/app.js` | Express app setup |
| `server/src/middleware/auth.js` | JWT authentication |
| `client/src/App.jsx` | Root React component |
| `client/src/api.js` | Axios instance |
| `client/src/auth.jsx` | Auth context |
| `client/src/pages/RosterPage.jsx` | Main roster interface |

### D. External Resources

**Documentation:**
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Docs](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

**Tutorials:**
- [Prisma + PostgreSQL Tutorial](https://www.prisma.io/docs/getting-started)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [JWT Authentication Guide](https://jwt.io/introduction)

**Community:**
- GitHub Issues: [Report bugs or request features]
- Stack Overflow: [Tag: smart-roster-management]
- Discord: [Community chat server]

---

## 🎉 Conclusion

This documentation covers every aspect of the Smart Roster Management System from architecture to deployment. Use it as your guide for understanding, maintaining, and extending the system.

**Next Steps:**
1. Complete setup following Section 12
2. Run through manual testing workflow (Section 16.1)
3. Review security checklist (Section 15.8)
4. Plan your first enhancement (Section 20.1)

**Need Help?**
- Check Troubleshooting section (Section 18)
- Review API documentation (Section 10)
- Contact: [Your support email/channel]

**Version:** 1.0.0  
**Last Updated:** November 24, 2026  
**Authors:** Smart Roster Development Team

---

**End of Documentation**
