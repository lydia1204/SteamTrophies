import { AppId } from './model';
export function assertAppId(v:unknown):asserts v is AppId { if(!Number.isSafeInteger(v)||Number(v)<=0||Number(v)>0xffffffff) throw new Error(`Invalid Steam app id: ${String(v)}`); }
export function assertAchievementId(v:unknown):asserts v is string { if(typeof v!=='string'||v.length===0||v.length>256||/[\u0000-\u001f\u007f]/u.test(v)) throw new Error('Invalid achievement id.'); }
export function boundedText(v:unknown,f=''):string { return typeof v==='string'?v.replace(/\u0000/g,'').slice(0,8192):f; }
export function safeAssetUrl(v:unknown):string|null { if(typeof v!=='string'||v.length===0||v.length>4096)return null; try{const u=new URL(v); if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null; return u.toString();}catch{return null;} }
export function safeRelativeSegment(v:string):string { if(!/^[A-Za-z0-9._-]+$/.test(v)||v==='.'||v==='..')throw new Error('Unsafe path segment.'); return v; }
