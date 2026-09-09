import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';

let nextHelpId = 0;

/** Native button semantics keep Space/Enter and controller activation working in older CEF. */
export function SettingSwitch({ label, help, checked, onChange, disabled = false }: { label: string; help: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const { config } = useCustomizationState();
  const [helpId] = useState(() => `stt-setting-help-${++nextHelpId}`);
  return <div className="stt-toggle">
    {config.visual.toggleStyle === 'checkbox'
      ? <input id={`${helpId}-switch`} className="stt-checkbox" type="checkbox" checked={checked} aria-label={label} disabled={disabled} onChange={e => onChange(e.target.checked)} />
      : <button id={`${helpId}-switch`} type="button" className="stt-switch" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}><span /></button>}
    <label htmlFor={`${helpId}-switch`}>{label}</label><SettingHelp text={help} id={helpId} />
  </div>;
}

export function SettingHelp({ text, id }: { text: string; id?: string }) {
  const { config } = useCustomizationState();
  const [generatedId] = useState(() => `stt-help-tip-${++nextHelpId}`);
  const tipId = id ?? generatedId;
  const trigger = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{left:number;top:number;width:number} | null>(null);
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const close = () => { cancel(); setPosition(null); };
  const open = () => {
    cancel();
    const node = trigger.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const win = node.ownerDocument.defaultView;
    const width = Math.min(300, (win?.innerWidth ?? 320) - 24);
    setPosition({ left:Math.max(12,Math.min(rect.left,(win?.innerWidth ?? 320)-width-12)), top:Math.min(rect.bottom+8,Math.max(12,(win?.innerHeight ?? 600)-160)), width });
  };
  const leave = () => { cancel(); timer.current = setTimeout(() => setPosition(null),150); };
  useEffect(() => () => cancel(), []);
  useEffect(() => {
    if (!position) return;
    const doc = trigger.current?.ownerDocument;
    const escape = (e:KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const dismiss = () => close();
    const scroll = (e:Event) => { if (!tooltip.current?.contains(e.target as Node)) close(); };
    doc?.addEventListener('keydown',escape,true);
    doc?.addEventListener('scroll',scroll,true);
    doc?.defaultView?.addEventListener('resize',dismiss);
    return () => { doc?.removeEventListener('keydown',escape,true); doc?.removeEventListener('scroll',scroll,true); doc?.defaultView?.removeEventListener('resize',dismiss); };
  }, [!!position]);
  return <><span ref={trigger} className="stt-setting-help" tabIndex={0} aria-label="Help" aria-describedby={position ? tipId : undefined} style={{cursor:config.visual.helpCursor ? 'help' : 'default'}} onMouseEnter={open} onMouseLeave={leave} onFocus={open} onBlur={close} onClick={e => { e.preventDefault(); position ? close() : open(); }}>?</span>
    {position && trigger.current && createPortal(<div ref={tooltip} id={tipId} role="tooltip" className="stt-help-tooltip" onMouseEnter={cancel} onMouseLeave={leave} style={{...customizationService.getCssVariables('desktop'),...position} as CSSProperties}>{text}</div>,trigger.current.ownerDocument.body)}
  </>;
}
