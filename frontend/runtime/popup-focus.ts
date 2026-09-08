let nativeDialogDepth = 0;
let trophyPopupOpen = false;
export const isTrophyPopupOpen = () => trophyPopupOpen;
export const setTrophyPopupOpen = (open: boolean) => { trophyPopupOpen = open; };
export const hasNativeDialog = () => nativeDialogDepth > 0;
export async function withNativeDialog<T>(action: () => Promise<T>): Promise<T> {
  nativeDialogDepth++;
  try { return await action(); } finally { nativeDialogDepth--; }
}
