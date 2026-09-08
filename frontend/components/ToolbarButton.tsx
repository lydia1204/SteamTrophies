import { openTrophyOverlay } from './Overlay';
import { trophyStyles } from '../styles/trophies.generated';
import { useCustomizationState } from '../state/customization-hooks';
import { customizationService } from '../state/customization-service';
import type { CSSProperties } from 'react';

export function TrophyToolbarButton({ className = '' }: { className?: string }) {
  useCustomizationState();
  return (
    <><style>{trophyStyles}</style><button className={`${className} st-toolbar-button`} style={customizationService.getCssVariables('desktop') as CSSProperties} onClick={(event) => openTrophyOverlay(event.currentTarget.ownerDocument)} title="Trophies" aria-label="Open Trophies" aria-haspopup="dialog">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10v3h4v3c0 3.1-2.2 5.6-5.2 6.2A6 6 0 0 1 13 16v3h4v3H7v-3h4v-3a6 6 0 0 1-2.8-1.8C5.2 13.6 3 11.1 3 8V5h4V2Zm0 5H5v1c0 1.5.9 2.9 2.2 3.5A10 10 0 0 1 7 9V7Zm10 0v2a10 10 0 0 1-.2 2.5A3.9 3.9 0 0 0 19 8V7h-2Z" /></svg>
    </button></>
  );
}
