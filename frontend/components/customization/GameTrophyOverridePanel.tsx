import { SettingHelp } from './SettingControls';
import { useState } from 'react';
import type { GameSnapshot, TrophyTier } from '../../../packages/core/src';
import { customizationService } from '../../state/customization-service';
import { useCustomizationState } from '../../state/customization-hooks';
import { pickTrophyPackDirectory, revealLocalDirectory } from '../../runtime/steam-ui';
import { TrophyGlyph } from '../TrophyGlyph';

export function GameTrophyOverridePanel({ game, onClose }: { game: GameSnapshot; onClose: () => void }) {
  const state = useCustomizationState();
  const inherited = state.config.trophies.globalPackId;
  const selected = state.config.trophies.games[String(game.appId)]?.packId ?? '';
  const effective = selected || inherited;
  const effectivePack = state.packs.find((pack) => pack.manifest.id === effective) ?? null;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function importPack() {
    setBusy(true);
    setMessage(null);
    try {
      const path = await pickTrophyPackDirectory();
      if (!path) return;
      const imported = await customizationService.importPackDirectory(path, true);
      await customizationService.setGamePack(game.appId, imported.manifest.id);
      setMessage(`Imported ${imported.manifest.name} and applied it to ${game.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function openManagedFolder() {
    try {
      const path = await customizationService.getInstalledDirectory(effective);
      if (!path) {
        setMessage('Built-in packs live inside the SteamTrophies plugin bundle and do not have an editable source folder.');
        return;
      }
      revealLocalDirectory(path);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }


  async function chooseTierPack(tier: TrophyTier, packId: string) {
    if (!packId) {
      await customizationService.setTierAsset(game.appId, tier, null);
      return;
    }
    await customizationService.setTierAsset(game.appId, tier, { packId, resourceKey: `trophy.${tier}` });
  }

  function openOriginalSource() {
    if (!effectivePack?.originalSourcePath) {
      setMessage(effectivePack?.source === 'builtin'
        ? 'This is a built-in SteamTrophies pack.'
        : 'The original source folder is no longer recorded. The managed installed copy can still be opened.');
      return;
    }
    try {
      revealLocalDirectory(effectivePack.originalSourcePath);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="stt-customize-panel" data-stt-component="game-trophy-overrides" data-stt-appid={game.appId}>
      <header>
        <div>
          <h3>Trophy icon override</h3>
          <p>Choose a trophy pack only for {game.name}. Achievement artwork remains separate.</p>
        </div>
        <button title="Done" onClick={onClose}>Done</button>
      </header>

      <div className="stt-pack-preview" data-stt-slot="pack-preview">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => <TrophyGlyph key={tier} tier={tier} appId={game.appId} size={42} />)}
      </div>

      <label className="stt-field">
        <span>Pack for this game</span>
        <SettingHelp text="Override the library’s trophy pack for this game." /><select value={selected} disabled={busy} onChange={(event) => void customizationService.setGamePack(game.appId, event.currentTarget.value || null)}>
          <option value="">Use global pack ({state.packs.find((pack) => pack.manifest.id === inherited)?.manifest.name ?? inherited})</option>
          {state.packs.map((pack) => <option key={pack.manifest.id} value={pack.manifest.id}>{pack.manifest.name} {pack.source === 'builtin' ? '• built in' : '• custom'}</option>)}
        </select>
      </label>

      <div className="stt-tier-override-grid" data-stt-slot="tier-overrides">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
          const ref = state.config.trophies.games[String(game.appId)]?.tierOverrides?.[tier];
          return (
            <label className="stt-field" key={tier}>
              <span>{tier.replace(/^./, (c) => c.toUpperCase())} override</span>
              <SettingHelp text="Override this trophy tier for this game only." /><select value={ref?.packId ?? ''} disabled={busy} onChange={(event) => void chooseTierPack(tier, event.currentTarget.value)}>
                <option value="">Inherit game pack</option>
                {state.packs.map((pack) => <option key={pack.manifest.id} value={pack.manifest.id}>{pack.manifest.name}</option>)}
              </select>
            </label>
          );
        })}
      </div>

      <div className="stt-pack-location" data-stt-slot="pack-location">
        <strong>{effectivePack?.manifest.name ?? effective}</strong>
        <span>{effectivePack?.source === 'builtin' ? 'Bundled with SteamTrophies' : 'Managed copy'}</span>
        <span>{effectivePack ? `${effectivePack.manifest.author} • v${effectivePack.manifest.version}` : ''}</span>
        {effectivePack?.source === 'user' && effectivePack.installedPath && <code title={effectivePack.installedPath}>{effectivePack.installedPath}</code>}
        {effectivePack?.source === 'user' && effectivePack.originalSourcePath && <><span>Original source folder</span><code title={effectivePack.originalSourcePath}>{effectivePack.originalSourcePath}</code></>}
      </div>

      <div className="stt-customize-actions">
        <button title={busy ? 'Importing…' : 'Import / update pack folder'} disabled={busy} onClick={() => void importPack()}>{busy ? 'Importing…' : 'Import / update pack folder'}</button>
        {effectivePack?.source === 'user' && effectivePack.originalSourcePath && <button title="Open original source" disabled={busy} onClick={openOriginalSource}>Open original source</button>}
        {effectivePack?.source === 'user' && <button title="Open managed copy" disabled={busy} onClick={() => void openManagedFolder()}>Open managed copy</button>}
        {selected && <button title="Reset game override" disabled={busy} onClick={() => void customizationService.setGamePack(game.appId, null)}>Reset game override</button>}
      </div>

      <p className="stt-pack-help">A custom pack folder contains <code>manifest.json</code> plus PNG/JPEG/WebP trophy files. SteamTrophies validates it, records the original source location, and copies an isolated managed version before use.</p>
      {message && <div className="stt-customize-message">{message}</div>}
      {state.error && <div className="st-error">{state.error}</div>}
    </section>
  );
}
