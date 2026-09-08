// Native Store/Community BrowserViews are separate from the shared Steam document.
// Relay a real press only; do not inspect or forward page content or URLs.
declare const backend: { notifyOutsidePointerDown(): Promise<boolean> };
export default function installOutsidePointerRelay(): void {
  const host = window as unknown as { __steamTrophiesRemoveOutsideRelay?: () => void };
  host.__steamTrophiesRemoveOutsideRelay?.();
  const press = (event: PointerEvent) => {
    if (event.isTrusted) void backend.notifyOutsidePointerDown().catch(() => {});
  };
  document.addEventListener('pointerdown', press, true);
  host.__steamTrophiesRemoveOutsideRelay = () => document.removeEventListener('pointerdown', press, true);
}
