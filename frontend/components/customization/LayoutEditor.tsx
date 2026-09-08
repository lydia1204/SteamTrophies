import { DEFAULT_WIDGETS, type SurfaceKind } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';

export function LayoutEditor({ surface }: { surface: SurfaceKind }) {
  const state = useCustomizationState();
  const layout = state.config.layout.surfaces[surface];
  const definitions = new Map(DEFAULT_WIDGETS.map((widget) => [widget.id, widget]));
  if (surface !== 'big_picture') return <section className="stt-settings-section"><h3>Dashboard layout</h3><p>Shelf ordering currently applies to Big Picture. Desktop layout controls will follow the new layout design; your saved preferences are retained.</p></section>;
  return (
    <section className="stt-settings-section" data-stt-component="layout-editor" data-stt-surface={surface}>
      <header><div><h3>Dashboard layout</h3><p>Reorder or hide shelves for this surface only.</p></div><button className="st-mini-button" onClick={() => void customizationService.resetLayout(surface)}>Reset</button></header>
      <div className="stt-layout-list">
        {layout.order.map((id, index) => {
          const definition = definitions.get(id);
          if (!definition) return null;
          const hidden = layout.hidden.includes(id);
          return (
            <div className="stt-layout-row" key={id} data-stt-widget={id}>
              <div><strong>{definition.title}</strong><small>{hidden ? 'Hidden' : 'Visible'}</small></div>
              <div className="stt-layout-actions">
                <button className="st-mini-button" disabled={index === 0} onClick={() => void customizationService.moveWidget(surface, id, -1)} aria-label={`Move ${definition.title} up`}>↑</button>
                <button className="st-mini-button" disabled={index === layout.order.length - 1} onClick={() => void customizationService.moveWidget(surface, id, 1)} aria-label={`Move ${definition.title} down`}>↓</button>
                <button className="st-mini-button" onClick={() => void customizationService.setWidgetVisible(surface, id, hidden)}>{hidden ? 'Show' : 'Hide'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
