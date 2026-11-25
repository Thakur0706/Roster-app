export const ymd = (d) =>
  (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);

export const utcDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

export const daysInMonth = (m, y) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const monthDays = (m, y) =>
  Array.from({ length: daysInMonth(m, y) }, (_, i) => utcDate(y, m, i + 1));

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
