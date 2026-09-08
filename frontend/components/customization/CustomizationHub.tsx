import type { SurfaceKind } from '../../../packages/customization/src';
import { GlobalPackPicker } from './GlobalPackPicker';
import { LayoutEditor } from './LayoutEditor';
import { ThemeAccessibilityPanel } from './ThemeAccessibilityPanel';
import { NotificationSettings } from './NotificationSettings';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { useState } from 'react';
import { LibraryDataSettings } from './LibraryDataSettings';

export function CustomizationHub({ surface }: { surface: SurfaceKind }) {
  const [tab, setTab] = useState('packs');
  return (
    <div className="stt-customization-hub" data-stt-component="customization-hub">
      <nav className="st-settings-tabs" aria-label="Settings sections">{[['packs','Trophy packs'],['appearance','Appearance'],['notifications','Notifications'],['library','Library & data'],['diagnostics','Diagnostics'],...(surface === 'big_picture' ? [['layout','Layout']] : [])].map(([id,label]) => <button key={id} className="st-mini-button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
      <div className="st-settings-content">
        {tab === 'packs' && <><GlobalPackPicker /><p className="st-settings-help">For one game or one achievement, open its detail page and choose Trophy icons. Game and achievement overrides take priority over this default.</p></>}
        {tab === 'appearance' && <ThemeAccessibilityPanel />}
        {tab === 'notifications' && <NotificationSettings />}
        {tab === 'library' && <LibraryDataSettings />}
        {tab === 'diagnostics' && <DiagnosticsPanel />}
        {tab === 'layout' && <LayoutEditor surface={surface} />}
      </div>
    </div>
  );
}
