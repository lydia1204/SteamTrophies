import { useState, type ReactNode } from 'react';
import { SheetIcon } from './SheetIcon';

export function AchievementGroup({ title, count, total, rarity, initiallyOpen, showRarity, children }: { title:string|null;count:number;total:number;rarity:number|null;initiallyOpen:boolean;showRarity:boolean;children:ReactNode }) {
  const [open,setOpen] = useState(initiallyOpen);
  if (!title) return <>{children}</>;
  return <section className="st-achievement-group"><button className="st-group-heading" title={`${open ? 'Collapse' : 'Expand'} ${title}`} aria-expanded={open} onClick={() => setOpen(v => !v)}><strong>{title}</strong><span>{count}/{total}</span>{showRarity && <small title="Upper bound from the rarest achievement, not exact joint completion rarity">{rarity == null ? 'Rarity unknown' : `≤${rarity.toFixed(1)}%`}</small>}<span className={open ? 'st-group-chevron is-open' : 'st-group-chevron'}><SheetIcon control="down" size={20} /></span></button>{open && children}</section>;
}
