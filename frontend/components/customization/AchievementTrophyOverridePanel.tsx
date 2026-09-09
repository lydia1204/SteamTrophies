import { SettingHelp } from './SettingControls';
import { useMemo } from 'react';
import type { AchievementRecord, TrophyTier } from '../../../packages/core/src';
import type { TrophyPackResourceKey } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { TrophyGlyph } from '../TrophyGlyph';

export function AchievementTrophyOverridePanel({ appId, achievement, tier, onClose }: {
  appId: number;
  achievement: AchievementRecord;
  tier: TrophyTier;
  onClose: () => void;
}) {
  const state = useCustomizationState();
  const override = state.config.trophies.games[String(appId)]?.achievementOverrides?.[achievement.id] ?? null;
  const selectedPackId = override?.packId ?? '';
  const selectedPack = state.packs.find((pack) => pack.manifest.id === selectedPackId) ?? null;
  const resources = useMemo(() => selectedPack ? customizationService.getPackResources(selectedPack.manifest.id) : [], [selectedPack]);

  async function choosePack(packId: string) {
    if (!packId) {
      await customizationService.setAchievementAsset(appId, achievement.id, null);
      return;
    }
    const preferred = `trophy.${tier}` as TrophyPackResourceKey;
    const available = customizationService.getPackResources(packId);
    const resourceKey = available.includes(preferred) ? preferred : available[0];
    if (!resourceKey) throw new Error('Selected pack contains no trophy resources.');
    await customizationService.setAchievementAsset(appId, achievement.id, { packId, resourceKey });
  }

  async function chooseResource(resourceKey: TrophyPackResourceKey) {
    if (!selectedPackId) return;
    await customizationService.setAchievementAsset(appId, achievement.id, { packId: selectedPackId, resourceKey });
  }

  return (
    <div className="stt-achievement-override" data-stt-component="achievement-trophy-override" data-stt-achievement={achievement.id}>
      <div className="stt-achievement-override-preview">
        <TrophyGlyph tier={tier} appId={appId} achievementId={achievement.id} size={52} />
      </div>
      <div className="stt-achievement-override-fields">
        <strong>{achievement.name || achievement.id}</strong>
        <label className="stt-field">
          <span>Override pack</span>
          <SettingHelp text="Change this achievement only. Inherit restores the game’s choice." /><select value={selectedPackId} onChange={(event) => void choosePack(event.currentTarget.value)}>
            <option value="">Inherit game / tier / global trophy</option>
            {state.packs.map((pack) => <option key={pack.manifest.id} value={pack.manifest.id}>{pack.manifest.name}</option>)}
          </select>
        </label>
        {selectedPack && (
          <label className="stt-field">
            <span>Icon inside {selectedPack.manifest.name}</span>
            <SettingHelp text="Choose one icon from this pack for this achievement." /><select value={override?.resourceKey ?? `trophy.${tier}`} onChange={(event) => void chooseResource(event.currentTarget.value as TrophyPackResourceKey)}>
              {resources.map((key) => <option key={key} value={key}>{humanResourceName(key)}</option>)}
            </select>
          </label>
        )}
        {selectedPack?.manifest.customTrophies && <small>{Object.keys(selectedPack.manifest.customTrophies).length} named one-off icons are available in this pack.</small>}
      </div>
      <button title="Done" className="st-refresh-button" onClick={onClose}>Done</button>
    </div>
  );
}

function humanResourceName(key: TrophyPackResourceKey): string {
  if (key.startsWith('custom.')) return `Custom • ${key.slice('custom.'.length).replace(/[._-]+/g, ' ')}`;
  return key.slice('trophy.'.length).replace(/^./, (c) => c.toUpperCase());
}
