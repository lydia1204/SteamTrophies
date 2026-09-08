/** CEF85-compatible focus-visible behavior, scoped to this popup document. */
export function watchInputModality(doc: Document): () => void {
  const root = doc.documentElement, previous = root.getAttribute('data-st-input-modality');
  root.setAttribute('data-st-input-modality', 'pointer');
  const pointer = () => root.setAttribute('data-st-input-modality', 'pointer');
  const keyboard = (event: KeyboardEvent) => { if (!['Shift','Control','Alt','Meta'].includes(event.key)) root.setAttribute('data-st-input-modality', 'keyboard'); };
  doc.addEventListener('pointerdown', pointer, true); doc.addEventListener('keydown', keyboard, true);
  return () => { doc.removeEventListener('pointerdown', pointer, true); doc.removeEventListener('keydown', keyboard, true); if (previous == null) root.removeAttribute('data-st-input-modality'); else root.setAttribute('data-st-input-modality', previous); };
}
