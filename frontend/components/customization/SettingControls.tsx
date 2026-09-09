import { useState } from 'react';

let nextHelpId = 0;

/** Native button semantics keep Space/Enter and controller activation working in older CEF. */
export function SettingSwitch({ label, help, checked, onChange, disabled = false }: { label: string; help: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const [helpId] = useState(() => `stt-setting-help-${++nextHelpId}`);
  return <div className="stt-toggle">
    <button id={`${helpId}-switch`} type="button" className="stt-switch" role="switch" aria-checked={checked} aria-label={label} aria-describedby={helpId} title={help} disabled={disabled} onClick={() => onChange(!checked)}><span /></button>
    <label htmlFor={`${helpId}-switch`}>{label}</label><SettingHelp text={help} id={helpId} />
  </div>;
}

export function SettingHelp({ text, id }: { text: string; id?: string }) {
  return <span className="stt-setting-help" tabIndex={0} title={text} aria-label={text} id={id}>?</span>;
}
