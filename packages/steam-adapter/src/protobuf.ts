/**
 * Decodes the tiny CMsgAchievementChange message currently used by Steam:
 * field 1 = optional uint32 appid. Unknown fields are skipped conservatively.
 * Returns null instead of throwing because event hints must never crash the UI.
 */
export function decodeAchievementChangeAppId(buffer: ArrayBuffer): number | null {
  try {
    const bytes = new Uint8Array(buffer);
    let offset = 0;
    while (offset < bytes.length) {
      const key = readVarint(bytes, offset);
      if (!key) return null;
      offset = key.next;
      const field = key.value >>> 3;
      const wire = key.value & 7;
      if (field === 1 && wire === 0) {
        const value = readVarint(bytes, offset);
        if (!value || value.value <= 0 || value.value > 0xffffffff) return null;
        return value.value;
      }
      offset = skipField(bytes, offset, wire);
      if (offset < 0) return null;
    }
    return null;
  } catch {
    return null;
  }
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; next: number } | null {
  let value = 0;
  let shift = 0;
  while (offset < bytes.length && shift <= 28) {
    const byte = bytes[offset++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return { value: value >>> 0, next: offset };
    shift += 7;
  }
  return null;
}

function skipField(bytes: Uint8Array, offset: number, wire: number): number {
  if (wire === 0) return readVarint(bytes, offset)?.next ?? -1;
  if (wire === 1) return offset + 8 <= bytes.length ? offset + 8 : -1;
  if (wire === 2) {
    const len = readVarint(bytes, offset);
    if (!len) return -1;
    const next = len.next + len.value;
    return next <= bytes.length ? next : -1;
  }
  if (wire === 5) return offset + 4 <= bytes.length ? offset + 4 : -1;
  return -1;
}
