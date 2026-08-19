export function isNumericId(value) {
  return value != null && /^\d{1,12}$/.test(String(value));
}

export function invalidIdResponse(res, name = 'id') {
  return res.status(400).json({ error: `Invalid ${name}` });
}

export function isSafeDateParam(value) {
  if (value == null || value === '') return false;
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{1,2}\.\d{1,2}\.\d{4}\.?$/.test(s);
}
