const MAX_DISCOVERY_ENTRIES = 100_000;
export const DEFAULT_DISCOVERY_REPROBE_SECONDS = 30 * 24 * 60 * 60;

export interface DiscoveryLedgerV1 {
  schemaVersion: 1;
  scannedAtUnixByAppId: Record<string, number>;
}

export function emptyDiscoveryLedger(): DiscoveryLedgerV1 {
  return { schemaVersion: 1, scannedAtUnixByAppId: {} };
}

export function parseDiscoveryLedger(text: string | null): DiscoveryLedgerV1 {
  if (!text) return emptyDiscoveryLedger();
  const value = JSON.parse(text) as Partial<DiscoveryLedgerV1>;
  if (value.schemaVersion !== 1 || !value.scannedAtUnixByAppId || typeof value.scannedAtUnixByAppId !== 'object') {
    throw new Error('Unsupported discovery ledger.');
  }
  const entries = Object.entries(value.scannedAtUnixByAppId);
  if (entries.length > MAX_DISCOVERY_ENTRIES) throw new Error('Discovery ledger exceeds safety limit.');
  const clean: Record<string, number> = {};
  for (const [rawAppId, rawTimestamp] of entries) {
    const appId = Number(rawAppId);
    if (!Number.isSafeInteger(appId) || appId <= 0 || appId > 0xffffffff) continue;
    if (!Number.isSafeInteger(rawTimestamp) || rawTimestamp <= 0) continue;
    clean[String(appId)] = rawTimestamp;
  }
  return { schemaVersion: 1, scannedAtUnixByAppId: clean };
}

export function shouldProbeApp(
  ledger: DiscoveryLedgerV1,
  appId: number,
  nowUnix: number,
  reprobeSeconds = DEFAULT_DISCOVERY_REPROBE_SECONDS,
): boolean {
  const scannedAt = ledger.scannedAtUnixByAppId[String(appId)] ?? 0;
  return scannedAt <= 0 || nowUnix - scannedAt >= reprobeSeconds;
}

export function markAppScanned(ledger: DiscoveryLedgerV1, appId: number, atUnix: number): DiscoveryLedgerV1 {
  if (!Number.isSafeInteger(appId) || appId <= 0 || appId > 0xffffffff) throw new Error('Invalid discovery app id.');
  if (!Number.isSafeInteger(atUnix) || atUnix <= 0) throw new Error('Invalid discovery timestamp.');
  return {
    schemaVersion: 1,
    scannedAtUnixByAppId: { ...ledger.scannedAtUnixByAppId, [String(appId)]: atUnix },
  };
}
