import type { SurfaceKind } from '../../../packages/customization/src';
import { GlobalPackPicker } from './GlobalPackPicker';
import { LayoutEditor } from './LayoutEditor';
import { ThemeAccessibilityPanel } from './ThemeAccessibilityPanel';
import { NotificationSettings } from './NotificationSettings';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function CustomizationHub({ surface }: { surface: SurfaceKind }) {
  return (
    <div className="stt-customization-hub" data-stt-component="customization-hub">
      <GlobalPackPicker />
      <LayoutEditor surface={surface} />
      <ThemeAccessibilityPanel />
      <NotificationSettings />
      <DiagnosticsPanel />
    </div>
  );
}
