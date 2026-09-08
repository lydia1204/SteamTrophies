declare const g_PopupManager: { GetPopups(): Iterable<{ m_popup?: Window }> } | undefined;

/** Focus can move on hover in Steam. Only a real pointer press dismisses the popup. */
export function watchOutsideClicks(inside: Document, dismiss: () => void): () => void {
  const docs = new Set<Document>();
  const press = (event: Event) => { if (event.isTrusted && event.currentTarget !== inside) dismiss(); };
  const sync = () => {
    try {
      if (typeof g_PopupManager === 'undefined') return;
      for (const popup of g_PopupManager.GetPopups()) {
        const doc = popup.m_popup?.document;
        if (doc && doc !== inside && !docs.has(doc)) { docs.add(doc); doc.addEventListener('pointerdown', press, true); }
      }
    } catch { /* Closing Steam windows can disappear between enumeration and access. */ }
  };
  sync(); const timer = setInterval(sync, 300);
  return () => { clearInterval(timer); for (const doc of docs) doc.removeEventListener('pointerdown', press, true); docs.clear(); };
}
