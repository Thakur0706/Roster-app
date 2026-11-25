export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with these values already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}
