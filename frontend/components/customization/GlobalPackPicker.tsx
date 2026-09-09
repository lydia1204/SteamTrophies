import { SettingHelp } from './SettingControls';
import { useState } from 'react';
import { customizationService } from '../../state/customization-service';
import { useCustomizationState } from '../../state/customization-hooks';
import { pickTrophyPackDirectory, revealLocalDirectory } from '../../runtime/steam-ui';
import { TrophyGlyph } from '../TrophyGlyph';

export function GlobalPackPicker() {
  const state = useCustomizationState();
  const [message, setMessage] = useState<string | null>(null);
  const selected = state.packs.find((pack) => pack.manifest.id === state.config.trophies.globalPackId) ?? null;

  async function importPack() {
    setMessage(null);
    try {
      const path = await pickTrophyPackDirectory();
      if (!path) return;
      const pack = await customizationService.importPackDirectory(path, true);
      await customizationService.setGlobalPack(pack.manifest.id);
      setMessage(`Imported and selected ${pack.manifest.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function removeSelected() {
    if (!selected || selected.source !== 'user') return;
    setMessage(null);
    try {
      await customizationService.removePack(selected.manifest.id);
      setMessage(`Removed ${selected.manifest.name}. Any overrides that referenced it were reset safely.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function openOriginal() {
    if (!selected?.originalSourcePath) return;
    try { revealLocalDirectory(selected.originalSourcePath); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
  }

  return (
    <section className="stt-global-pack" data-stt-component="global-trophy-pack">
      <div className="stt-pack-preview">{(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => <TrophyGlyph key={tier} tier={tier} size={34} />)}</div>
      <div className="stt-global-pack-fields">
        <label className="stt-field">
          <span>Default trophy pack</span>
          <SettingHelp text="Choose trophy artwork for games without an individual override." /><select value={state.config.trophies.globalPackId} onChange={(event) => void customizationService.setGlobalPack(event.currentTarget.value)}>
            {state.packs.map((pack) => <option key={pack.manifest.id} value={pack.manifest.id}>{pack.manifest.name} {pack.source === 'builtin' ? '• built in' : '• custom'}</option>)}
          </select>
        </label>
        {selected?.source === 'user' && selected.originalSourcePath && <code className="stt-source-path" title={selected.originalSourcePath}>{selected.originalSourcePath}</code>}
        {message && <div className="stt-customize-message">{message}</div>}
      </div>
      <div className="stt-customize-actions">
        <button title="Import pack folder" onClick={() => void importPack()}>Import pack folder</button>
        {selected?.source === 'user' && selected.originalSourcePath && <button title="Open original source" onClick={openOriginal}>Open original source</button>}
        {selected?.source === 'user' && <button title="Remove pack" onClick={() => void removeSelected()}>Remove pack</button>}
      </div>
    </section>
  );
}
