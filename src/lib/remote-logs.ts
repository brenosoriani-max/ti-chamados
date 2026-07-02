export function parseRemoteLogs(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendRemoteLog(value: string | null | undefined, entry: Record<string, unknown>) {
  const logs = parseRemoteLogs(value);
  logs.push(entry);
  return JSON.stringify(logs);
}
