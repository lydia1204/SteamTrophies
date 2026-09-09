import { SettingHelp } from './SettingControls';
import { useState } from 'react';
import type { GameSnapshot } from '../../../packages/core/src';
import type { AchievementGroupV1 } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { SettingSwitch } from './SettingControls';

export function AchievementGroupsSettings({ game }: { game:GameSnapshot }) {
  const { library } = useCustomizationState().config;
  const groups = library.achievementGroups[String(game.appId)] ?? [];
  const [selected,setSelected] = useState('');
  const [name,setName] = useState('');
  const [query,setQuery] = useState('');
  const active = groups.find(g => g.id === selected);
  const save = (next:AchievementGroupV1[]) => void customizationService.setLibraryAppearance({ achievementGroups:{ ...library.achievementGroups,[String(game.appId)]:next } });
  return <fieldset className="stt-setting-group"><legend>Base game & expansion groups</legend><p className="st-settings-help">Steam does not label which achievements belong to each DLC or free update. Create your own groups using verified game information. Unassigned achievements remain visible; grouping never changes Platinum or unlocks.</p>
    <div className="stt-customize-actions"><input aria-label="New group name" placeholder="Base Game or expansion name" maxLength={80} value={name} onChange={e => setName(e.target.value)} /><button className="st-mini-button" disabled={!name.trim() || groups.length >= 64} title="Create an empty achievement group" onClick={() => { const id = `group-${Date.now().toString(36)}`; save([...groups,{ id,title:name.trim(),kind:groups.some(g => g.kind === 'base') ? 'expansion' : 'base',achievementIds:[] }]); setSelected(id); setName(''); }}>Add group</button></div>
    {!!groups.length && <label className="stt-field">Edit group<SettingHelp text="Choose a saved group to edit its membership." /><select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a group</option>{groups.map(g => <option value={g.id} key={g.id}>{g.title} · {g.achievementIds.length}</option>)}</select></label>}
    {active && <><label className="stt-field">Group type<SettingHelp text="Base groups follow your Base Game expansion preference; expansion groups stay separate." /><select value={active.kind} onChange={e => save(groups.map(g => g.id === active.id ? { ...g,kind:e.target.value as 'base' | 'expansion' } : g))}><option value="base">Base game</option><option value="expansion">DLC / free update</option></select></label><input aria-label="Find achievements to group" placeholder="Find achievements to group..." value={query} onChange={e => setQuery(e.target.value)} /><div className="st-group-picker">{game.achievements.filter(a => (!a.hidden || a.achieved) && `${a.name} ${a.description}`.toLowerCase().includes(query.toLowerCase())).map(a => <SettingSwitch key={a.id} label={a.name} help={`Assign to ${active.title}. An achievement can belong to only one group.`} checked={active.achievementIds.includes(a.id)} onChange={checked => save(groups.map(g => ({ ...g,achievementIds:checked && g.id === active.id ? [...g.achievementIds.filter(id => id !== a.id),a.id] : g.achievementIds.filter(id => id !== a.id) })))} />)}</div><button className="st-mini-button" title="Remove this group; keep all achievements and unlocks" onClick={() => { save(groups.filter(g => g.id !== active.id)); setSelected(''); }}>Remove group</button></>}
  </fieldset>;
}
