import { createRoot, Root } from 'react-dom/client';
import { TrophyApp } from './TrophyApp';

let host: HTMLDivElement | null = null;
let root: Root | null = null;

function close(): void {
  root?.unmount();
  root = null;
  host?.remove();
  host = null;
}

export function openTrophyOverlay(): void {
  if (host) {
    host.querySelector<HTMLElement>('.st-overlay-shell')?.focus();
    return;
  }
  host = document.createElement('div');
  host.id = 'steam-trophies-overlay-root';
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(
    <div className="st-overlay-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="st-overlay-shell" tabIndex={-1}>
        <button className="st-overlay-close" onClick={close} aria-label="Close">×</button>
        <TrophyApp />
      </div>
    </div>,
  );
}

export function closeTrophyOverlay(): void {
  close();
}
