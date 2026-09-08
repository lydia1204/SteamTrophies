// Explicit, offline recovery. Run after Steam is closed; originals are backed up.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {decodeGameSnapshot, decodeLibraryIndex} = require('../.test-build/packages/storage/src');
const {buildLibraryIndex,parseDiscoveryLedger} = require('../.test-build/packages/core/src');
const root = path.join(os.homedir(), 'Library/Application Support/SteamTrophies/state');
const archiveIndex = process.argv.indexOf('--archive');
if (archiveIndex < 0 || !process.argv[archiveIndex + 1] || process.argv[archiveIndex + 1].startsWith('--')) throw new Error('Usage: npm run build:test, then node scripts/recover-local-state.cjs --archive /absolute/path/to/state-backup.tar.gz [--apply]. Dry-run is the default.');
const archive = fs.realpathSync(process.argv[archiveIndex + 1]);
if (!fs.statSync(archive).isFile()) throw new Error('Backup must be a regular file');
const games = fs.readdirSync(path.join(root,'games')).filter(n=>/^\d+\.v1\.json$/.test(n)).map(n=>decodeGameSnapshot(fs.readFileSync(path.join(root,'games',n),'utf8'),n));
const index = buildLibraryIndex(games.map(g=>g.summary), Math.floor(Date.now()/1000));
decodeLibraryIndex(JSON.stringify(index),'recovered');
const oldLedger = parseDiscoveryLedger(execFileSync('tar',['-xOf',archive,'state/discovery.v1.json'],{encoding:'utf8',maxBuffer:16*1024*1024}));
const ledger = parseDiscoveryLedger(fs.readFileSync(path.join(root,'discovery.v1.json'),'utf8'));
for(const [id,time] of Object.entries(oldLedger.scannedAtUnixByAppId)) ledger.scannedAtUnixByAppId[id]=Math.max(time,ledger.scannedAtUnixByAppId[id]||0);
console.log(JSON.stringify({totals:index.totals,knownApps:Object.keys(ledger.scannedAtUnixByAppId).length,apply:process.argv.includes('--apply')}));
if(process.argv.includes('--apply')) {
  try { execFileSync('pgrep',['-f','steam_osx|millennium-luavm'],{stdio:'pipe'}); throw new Error('Steam must be closed'); }
  catch(e) { if(e.status!==1) throw e; }
  const backup=path.join(os.homedir(),'Library/Application Support/Millennium/backups',`bridge-recovery-${Date.now()}`);
  fs.mkdirSync(backup,{recursive:true});
  execFileSync('tar',['-czf',path.join(backup,'state-before-recovery.tar.gz'),'-C',path.dirname(root),'state']);
  for(const [name,value] of [['index.v1.json',index],['discovery.v1.json',ledger]]) {
    const target=path.join(root,name);
    fs.writeFileSync(`${target}.recovery-tmp`,JSON.stringify(value));
    fs.renameSync(`${target}.recovery-tmp`,target);
  }
  console.log(`Recovered locally; backup: ${backup}`);
}
