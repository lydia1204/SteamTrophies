/** Steam's public v2 response uses achievement IDs, not localized display names. */
export function parseGlobalRarity(raw: string): Map<string, number> {
  const rows = JSON.parse(raw)?.achievementpercentages?.achievements;
  if (!Array.isArray(rows)) throw new Error('Steam global rarity response is unavailable.');
  const result = new Map<string, number>();
  for (const row of rows) {
    const value = typeof row?.percent === 'number' ? row.percent : typeof row?.percent === 'string' && /^\d+(\.\d+)?$/.test(row.percent) ? Number(row.percent) : NaN;
    if (typeof row?.name !== 'string' || !row.name || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('Invalid Steam global rarity row.');
    if (result.has(row.name)) throw new Error('Duplicate Steam global rarity ID.');
    result.set(row.name, value);
  }
  return result;
}
