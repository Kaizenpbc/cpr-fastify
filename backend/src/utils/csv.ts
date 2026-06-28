/**
 * Convert an array of objects to CSV string.
 */
export function toCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val == null) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}
