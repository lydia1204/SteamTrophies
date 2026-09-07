export interface AssetMeta {
  hash: string;
  bytes: number;
  lastAccessAtUnix: number;
  sourceUrl?: string;
}

export interface AssetEvictionPlan {
  keep: AssetMeta[];
  evict: AssetMeta[];
  keptBytes: number;
}

export function planAssetEviction(assets: readonly AssetMeta[], byteBudget: number): AssetEvictionPlan {
  if (!Number.isFinite(byteBudget) || byteBudget < 0) throw new Error('Invalid byte budget.');
  const sorted = [...assets].sort((a, b) => b.lastAccessAtUnix - a.lastAccessAtUnix);
  const keep: AssetMeta[] = [];
  const evict: AssetMeta[] = [];
  let keptBytes = 0;
  for (const asset of sorted) {
    const bytes = Math.max(0, Math.floor(asset.bytes));
    if (keptBytes + bytes <= byteBudget) {
      keep.push(asset);
      keptBytes += bytes;
    } else {
      evict.push(asset);
    }
  }
  return { keep, evict, keptBytes };
}
