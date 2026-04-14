import { AppSnapshot } from './types';

export function exportToJson(snapshot: AppSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pantry-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJson(file: File): Promise<AppSnapshot> {
  const text = await file.text();
  return JSON.parse(text) as AppSnapshot;
}
