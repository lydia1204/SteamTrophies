import { resolveReleaseYear } from '../runtime/library';
import { useCustomizationState } from '../state/customization-hooks';

export function ReleaseYear({ appId, detail=false }: { appId:number; detail?:boolean }) {
  const visual = useCustomizationState().config.visual;
  const enabled = detail ? visual.showReleaseYearDetail : visual.showReleaseYearLibrary;
  const year = enabled ? resolveReleaseYear(appId) : null;
  return year ? <span className="st-release-year" title="Release year supplied by Steam"> ({year})</span> : null;
}
