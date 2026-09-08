import { createRoot, type Root } from 'react-dom/client';
import { TrophyToolbarButton } from '../components/ToolbarButton';

declare const g_PopupManager: { GetPopups(): Iterable<{ m_popup?: Window }> } | undefined;

/** Mac fallback: the experimental host did not transform the served header chunk.
 * Anchors verified in live build 1788652215. Never remove or replace a Steam node.
 */
export function installHeaderButton(): () => void {
  const mounted = new Map<Document, { node: HTMLElement; root: Root }>();
  const sync = () => {
    const docs = new Set<Document>();
    try {
      if (typeof g_PopupManager !== 'undefined') for (const popup of g_PopupManager.GetPopups()) {
        if (popup.m_popup?.document) docs.add(popup.m_popup.document);
      }
    } catch { /* A closing window is retried on the next bounded tick. */ }
    for (const [doc, entry] of mounted) if (!docs.has(doc) || !entry.node.isConnected) {
      entry.root.unmount(); entry.node.remove(); mounted.delete(doc);
    }
    for (const doc of docs) {
      const header = doc.querySelector<HTMLElement>('._3cykd-VfN_xBxf3Qxriccm');
      const bell = header?.querySelector<HTMLElement>('._3mGEzzp18imtSzGPkduedi');
      if (!header || !bell || header.querySelector('.st-toolbar-button') || mounted.has(doc)) continue;
      let anchor = bell;
      while (anchor.parentElement && anchor.parentElement !== header) anchor = anchor.parentElement;
      if (anchor.parentElement !== header) continue;
      const node = doc.createElement('span');
      node.dataset.sttHeaderMount = 'true';
      node.style.display = 'inline-flex';
      node.style.marginRight = '8px';
      anchor.insertAdjacentElement('afterend', node);
      const root = createRoot(node);
      root.render(<TrophyToolbarButton className="_2Szzh5sKyGgnLUR870zbDE" />);
      mounted.set(doc, { node, root });
    }
  };
  sync();
  const timer = setInterval(sync, 1000);
  return () => { clearInterval(timer); for (const { node, root } of mounted.values()) { root.unmount(); node.remove(); } mounted.clear(); };
}
