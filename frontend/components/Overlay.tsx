import { TrophyApp } from './TrophyApp';
import { useEffect, useRef, type CSSProperties } from 'react';
import { trophyStyles } from '../styles/trophies.generated';
import { customizationService } from '../state/customization-service';
import { useCustomizationState } from '../state/customization-hooks';
import { ErrorBoundary, showModal } from 'millennium';
import { TrophyToastHost } from './TrophyToastHost';
import { hasNativeDialog, setTrophyPopupOpen } from '../runtime/popup-focus';
import { watchOutsideClicks } from '../runtime/outside-click';
import { watchInputModality } from '../runtime/input-modality';
import { trophyService } from '../state/service';

let modal: { Close(): void } | null = null;
let modalDocument: Document | null = null;
let previousFocus: HTMLElement | null = null;
let openerDocument: Document | null = null;

function didClose(): void {
  modal = null;
  modalDocument = null;
  previousFocus?.blur();
  setTrophyPopupOpen(false);
  previousFocus = null;
  openerDocument = null;
  if (!customizationService.getSnapshot().config.visual.rememberScreen) trophyService.closeGame();
}

function close(): void {
  const active = modal;
  modal = null;
  active?.Close();
  didClose();
}

function OverlayContent() {
  const customization = useCustomizationState();
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = openerDocument;
    if (!customization.config.visual.blurBackground || !opener || opener === shell.current?.ownerDocument) return undefined;
    const style = opener.createElement('style');
    style.textContent = 'html { filter:blur(5px); }';
    opener.head.appendChild(style);
    return () => style.remove();
  }, [customization.config.visual.blurBackground]);
  useEffect(() => {
    const doc = shell.current?.ownerDocument;
    modalDocument = doc ?? null;
    doc?.body.classList.add('st-trophy-popup');
    const stopModality = doc ? watchInputModality(doc) : () => {};
    setTrophyPopupOpen(true);
    shell.current?.focus();
    const stopOutside = doc ? watchOutsideClicks(doc, closeFromOutsidePointer) : () => {};
    return () => { stopOutside(); stopModality(); doc?.body.classList.remove('st-trophy-popup'); setTrophyPopupOpen(false); };
  }, []);
  return <div className="st-overlay-backdrop" style={customizationService.getCssVariables('desktop') as CSSProperties} onMouseDown={(e) => e.target === e.currentTarget && close()}>
    <style>{trophyStyles}</style>
    <div className="st-overlay-shell" ref={shell} role="dialog" aria-modal="true" aria-label="Steam Trophies" tabIndex={-1} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      if (event.key === 'Tab') {
        const container = event.currentTarget as HTMLDivElement;
        const items = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter((el) => el.getClientRects().length > 0);
        const first = items[0], last = items[items.length - 1];
        const active = event.currentTarget.ownerDocument.activeElement;
        if (event.shiftKey && (active === first || active === event.currentTarget)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (active === last || active === event.currentTarget)) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <ErrorBoundary><TrophyApp onClose={close} /><TrophyToastHost /></ErrorBoundary>
    </div>
  </div>;
}

export function openTrophyOverlay(ownerDocument: Document = document): void {
  if (modal) {
    modalDocument?.defaultView?.focus();
    modalDocument?.querySelector<HTMLElement>('.st-overlay-shell')?.focus();
    return;
  }
  previousFocus = ownerDocument.activeElement as HTMLElement | null;
  openerDocument = ownerDocument;
  // Store/Profile/Community are native BrowserViews, above ordinary DOM overlays.
  // Steam's managed popout owns a native window above those views on macOS.
  modal = showModal(<OverlayContent />, ownerDocument.defaultView ?? undefined, {
    strTitle: 'Steam Trophies', bForcePopOut: true, bHideMainWindowForPopouts: false, bHideActionIcons: true,
    popupWidth: 1144, popupHeight: 844, fnOnClose: didClose,
  });
}

export function closeTrophyOverlay(): void {
  close();
}

export function closeFromOutsidePointer(): void {
  if (modal && !hasNativeDialog()) close();
}
