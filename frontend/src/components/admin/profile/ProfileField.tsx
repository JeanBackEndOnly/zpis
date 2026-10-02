import type { ChangeEvent } from 'react';
import type { SectionForm } from '../../../hooks/useSectionForm';
import FormField from '../../FormField/FormField';
import type { Option } from '../CrudPage';

interface Props {
  form: SectionForm;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'select';
  options?: Option[];
  full?: boolean; // span both columns
  optional?: boolean;
  placeholder?: string;
  errorKey?: string; // when the API error key differs from the field name
  onChange?: (value: string) => void; // override the default change handler
}

export default function ProfileField({
  form,
  name,
  label,
  type = 'text',
  options = [],
  full,
  optional,
  placeholder,
  errorKey,
  onChange,
}: Props) {
  const value = form.values[name] ?? '';
  const handle = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange ? onChange(e.target.value) : form.set(name, e.target.value);

  return (
    <div className={`min-w-0 ${full ? 'sm:col-span-2' : ''}`}>
      <FormField label={optional ? `${label} (optional)` : label} error={form.errors[errorKey ?? name]?.[0]}>
        {type === 'select' ? (
          <select className="input" value={value} onChange={handle} required={!optional}>
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            className="input"
            type={type}
            step={type === 'number' ? '0.01' : undefined}
            min={type === 'number' ? 0 : undefined}
            value={value}
            placeholder={placeholder}
            onChange={handle}
            required={!optional}
          />
        )}
      </FormField>
    </div>
  );
}