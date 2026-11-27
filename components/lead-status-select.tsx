'use client';

import { useState } from 'react';
import { Select } from 'radix-ui';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { leadStatusStyle } from '@/lib/lead-status-colours.mjs';

type Props = {
  label: string;
  options: { value: string; label: string }[];
  name?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export default function LeadStatusSelect({ label, options, name, value, defaultValue, required, disabled, onChange }: Props) {
  const [selection, setSelection] = useState(defaultValue ?? options[0]?.value ?? '');
  const selected = value ?? selection;
  return <div className="lead-status-control">
    {name && <input type="hidden" name={name} value={selected} disabled={disabled}/>}
    <Select.Root value={selected} required={required} disabled={disabled} onValueChange={next => { setSelection(next); onChange?.(next); }}>
      <Select.Trigger className="lead-status-trigger" aria-label={label} style={leadStatusStyle(selected)}>
        <Select.Value>{options.find(option => option.value === selected)?.label || 'Choose status'}</Select.Value>
        <Select.Icon><ChevronDown size={16}/></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="lead-status-menu" position="popper" align="start" sideOffset={6} collisionPadding={8}>
          <Select.ScrollUpButton className="lead-status-scroll"><ChevronUp size={16}/></Select.ScrollUpButton>
          <Select.Viewport className="lead-status-options">
            {options.map(option => <Select.Item key={option.value} value={option.value} className="lead-status-choice" style={leadStatusStyle(option.value)}>
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator><Check size={16}/></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="lead-status-scroll"><ChevronDown size={16}/></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>;
}
