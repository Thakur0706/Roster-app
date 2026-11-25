import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PROCESS_NAMES = [
  'Customer Support',
  'Abandoned Cart Conversion',
  'NDR Management',
  'Retention',
];

// 16 single-resource brands (80% of brands)
const SINGLE_BRANDS = [
  ['NovaSkin',   'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['UrbanKicks', 'NO_SUNDAYS_AND_HOLIDAYS',      'Customer Support'],
  ['PureLeaf',   'NO_SUNDAYS_AND_HOLIDAYS',      'Customer Support'],
  ['GlowUp',     'ALL_365',                      'Customer Support'],
  ['FitFuel',    'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['Kidora',     'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'NDR Management'],
  ['CozyNest',   'NO_SUNDAYS_AND_HOLIDAYS',      'Retention'],
  ['LumaTech',   'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['BrewBox',    'ALL_365',                      'Customer Support'],
  ['PetalPop',   'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Abandoned Cart Conversion'],
  ['IronWolf',   'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['Snuggle',    'NO_SUNDAYS_AND_HOLIDAYS',      'Customer Support'],
  ['VedaWell',   'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Retention'],
  ['ZestyBite',  'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['MintMoney',  'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'Customer Support'],
  ['OrbitGear',  'DAILY_EXCEPT_PUBLIC_HOLIDAYS', 'NDR Management'],
];

// 4 multi-employee brands
const MULTI_BRANDS = [
  {
    name: 'TrailBlaze',
    rule: 'ALL_365',
    procs: [['Customer Support', 2], ['Abandoned Cart Conversion', 1], ['NDR Management', 1]],
  },
  {
    name: 'VerdeHome',
    rule: 'DAILY_EXCEPT_PUBLIC_HOLIDAYS',
    procs: [['Customer Support', 1], ['Abandoned Cart Conversion', 1], ['Retention', 1]],
  },
  {
    name: 'AuraFit',
    rule: 'ALL_365',
    procs: [['Customer Support', 2], ['NDR Management', 1]],
  },
  {
    name: 'KettleCo',
    rule: 'NO_SUNDAYS_AND_HOLIDAYS',
    procs: [['Customer Support', 1], ['Retention', 1], ['Abandoned Cart Conversion', 1], ['NDR Management', 1]],
  },
];

const EMPLOYEE_NAMES = [
  'Aditi Sharma', 'Rahul Verma', 'Sneha Iyer', 'Karan Mehta', 'Priya Nair',
  'Arjun Rao', 'Neha Kapoor', 'Vikram Singh', 'Ananya Das', 'Rohit Joshi',
  'Ishita Bose', 'Manav Gupta', 'Tanvi Shah', 'Dev Patel', 'Riya Menon',
  'Siddharth Kulkarni', 'Pooja Reddy', 'Nikhil Chawla', 'Kavya Pillai', 'Amit Trivedi',
  'Shreya Ghosh', 'Yash Malhotra', 'Diya Saxena', 'Harsh Vardhan', 'Meera Krishnan',
  'Aditya Bansal', 'Ritika Jain', 'Suresh Kumar', 'Tara Fernandes', 'Varun Desai',
];

function utc(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

async function main() {
  console.log('Clearing data...');
  await prisma.rosterEntry.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.brandProcess.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.process.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.pod.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.user.deleteMany();

  // --- Admin user ---
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Ops Admin',
      email: 'admin@datastraw-demo.com',
      passwordHash,
      role: 'OPS_MANAGER',
    },
  });

  // --- Processes ---
  const processes = {};
  for (const name of PROCESS_NAMES) {
    processes[name] = await prisma.process.create({ data: { name } });
  }

  // --- Pods ---
  const pods = [];
  for (const name of ['Pod Alpha', 'Pod Beta', 'Pod Gamma']) {
    pods.push(await prisma.pod.create({ data: { name } }));
  }

  // --- Employees (30) ---
  const employees = [];
  for (let i = 0; i < EMPLOYEE_NAMES.length; i++) {
    const weeklyOffDay = i < 16 ? 0 : i % 7;
    employees.push(
      await prisma.employee.create({
        data: {
          name: EMPLOYEE_NAMES[i],
          email: `emp${i + 1}@datastraw-demo.com`,
          podId: pods[Math.floor(i / 10)].id,
          weeklyOffDay,
        },
      })
    );
  }

  // Pod leads = first employee of each pod
  for (let p = 0; p < pods.length; p++) {
    await prisma.pod.update({
      where: { id: pods[p].id },
      data: { leadId: employees[p * 10].id },
    });
  }

  // --- Brands / BrandProcesses / Assignments ---
  let empIdx = 0;

  // Single-resource brands
  for (const [brandName, rule, processName] of SINGLE_BRANDS) {
    const brand = await prisma.brand.create({
      data: { name: brandName, operatingRule: rule },
    });
    const bp = await prisma.brandProcess.create({
      data: {
        brandId: brand.id,
        processId: processes[processName].id,
        minCoverage: 1,
      },
    });
    const emp = employees[empIdx++];
    await prisma.assignment.create({
      data: { employeeId: emp.id, brandProcessId: bp.id, isPrimary: true },
    });
  }

  // Multi-employee brands
  for (const b of MULTI_BRANDS) {
    const brand = await prisma.brand.create({
      data: { name: b.name, operatingRule: b.rule },
    });
    for (const [processName, minCoverage] of b.procs) {
      const bp = await prisma.brandProcess.create({
        data: {
          brandId: brand.id,
          processId: processes[processName].id,
          minCoverage,
        },
      });
      for (let k = 0; k < minCoverage; k++) {
        const emp = employees[empIdx++];
        await prisma.assignment.create({
          data: { employeeId: emp.id, brandProcessId: bp.id, isPrimary: true },
        });
      }
    }
  }

  // --- Public holidays (current year) ---
  const year = new Date().getFullYear();
  const holidays = [
    [1, 26, 'Republic Day'],
    [8, 15, 'Independence Day'],
    [10, 2, 'Gandhi Jayanti'],
    [11, 1, 'Diwali'],
    [12, 25, 'Christmas'],
  ];
  for (const [m, d, name] of holidays) {
    await prisma.publicHoliday.create({
      data: { date: utc(year, m, d), name },
    });
  }

  // --- Sample leaves ---
  const month = new Date().getMonth() + 1;
  await prisma.leave.create({
    data: {
      employeeId: employees[0].id,
      startDate: utc(year, month, 15),
      endDate: utc(year, month, 16),
      type: 'PLANNED_LEAVE',
      status: 'APPROVED',
      reason: 'Family function',
    },
  });

  await prisma.leave.create({
    data: {
      employeeId: employees[17].id,
      startDate: utc(year, month, 22),
      endDate: utc(year, month, 23),
      type: 'COMP_OFF',
      status: 'APPROVED',
      reason: 'Comp off for weekend support',
    },
  });

  console.log('Seed complete.');
  console.log('Login: admin@datastraw-demo.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
