'use client';

import { Select } from 'radix-ui';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type Item = { id: string; name: string; price: string; disabled: boolean };
type Props = {
  label: string;
  value: string;
  items: Item[];
  disabled: boolean;
  onChange: (value: string) => void;
};

export default function QuotationItemSelect({ label, value, items, disabled, onChange }: Props) {
  const selected = items.find(item => item.id === value);
  return <Select.Root value={value} onValueChange={onChange} required disabled={disabled}>
    <Select.Trigger className="quotation-item-trigger" aria-label={label}>
      <Select.Value placeholder="Select item">
        {selected && <span className="quotation-item-copy"><span className="quotation-item-name">{selected.name}</span><span className="quotation-item-price">₹{selected.price}</span></span>}
      </Select.Value>
      <Select.Icon><ChevronDown size={20}/></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content className="quotation-item-menu" position="popper" align="start" sideOffset={8} collisionPadding={12}>
        <Select.ScrollUpButton className="quotation-item-scroll"><ChevronUp size={20}/></Select.ScrollUpButton>
        <Select.Viewport className="quotation-item-options">
          {items.map(item => <Select.Item className="quotation-item-option" key={item.id} value={item.id} disabled={item.disabled} textValue={item.name}>
            <Select.ItemText><span className="quotation-item-copy"><span className="quotation-item-name">{item.name}</span><span className="quotation-item-price">₹{item.price}{item.disabled ? ' · Already added' : ''}</span></span></Select.ItemText>
            <Select.ItemIndicator className="quotation-item-check"><Check size={20}/></Select.ItemIndicator>
          </Select.Item>)}
        </Select.Viewport>
        <Select.ScrollDownButton className="quotation-item-scroll"><ChevronDown size={20}/></Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}
