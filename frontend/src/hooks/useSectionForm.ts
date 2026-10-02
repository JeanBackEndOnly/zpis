import { useState, type FormEvent } from 'react';
import { getErrorMessage, getValidationErrors } from '../lib/getErrorMessage';
import type { ValidationErrors } from '../types/api';

type Values = Record<string, string>;

// Form state + validation errors + submit handling for one profile tab
export function useSectionForm(initial: Values, save: (values: Values) => Promise<void>) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name: string, value: string) => setValues((prev) => ({ ...prev, [name]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');
    try {
      await save(values);
    } catch (err) {
      const validation = getValidationErrors(err);
      if (Object.keys(validation).length) setErrors(validation);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return { values, setValues, set, errors, formError, saving, submit };
}

export type SectionForm = ReturnType<typeof useSectionForm>;