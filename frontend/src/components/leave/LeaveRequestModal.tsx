import { Plus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { getErrorMessage, getValidationErrors } from '../../lib/getErrorMessage';
import { leaveRequestService } from '../../services/leaveRequestService';
import type { ValidationErrors } from '../../types/api';
import type { LeaveType } from '../../types/leave';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';

const typeOptions: { value: LeaveType; label: string }[] = [
  { value: 'vacation_leave', label: 'Vacation Leave' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'special_leave', label: 'Special Leave' },
];

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600';

function Required() {
  return <span className="ml-1 normal-case text-red-600">(required)</span>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1 block text-xs text-red-600">{message}</span> : null;
}

function RequestForm({ onSubmitted }: { onSubmitted: (message: string) => void }) {
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [othersSpecify, setOthersSpecify] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dates, setDates] = useState<string[]>(['']);
  const [contact, setContact] = useState('');
  const [sectionHead, setSectionHead] = useState('');
  const [departmentHead, setDepartmentHead] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // The same date picked twice is only counted once
  const pickedDates = [...new Set(dates.filter(Boolean))].sort();
  const hasDuplicates = dates.filter(Boolean).length !== pickedDates.length;

  const isOthers = leaveType === 'others_leave';
  const error = (key: string) => errors[key]?.[0];

  const setDate = (index: number, value: string) =>
    setDates((prev) => prev.map((d, i) => (i === index ? value : d)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError('');

    if (!leaveType) {
      setErrors({ leave_type: ['Please choose the type of leave.'] });
      return;
    }

    setSaving(true);
    try {
      const res = await leaveRequestService.create({
        leave_type: leaveType,
        others_specify: isOthers ? othersSpecify : null,
        purpose,
        dates: pickedDates,
        contact,
        section_head: sectionHead || null,
        department_head: departmentHead || null,
      });
      onSubmitted(res.message);
    } catch (err) {
      const validation = getValidationErrors(err);
      if (Object.keys(validation).length) setErrors(validation);
      else setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-6 text-center">
        <h2 className="text-base font-bold uppercase leading-snug tracking-tight text-gray-900 sm:text-lg">
          Zamboanga Puericulture Center Org. No.144 Inc.
        </h2>
        <p className="mt-0.5 text-sm font-semibold uppercase text-gray-500">Application for leave</p>
      </div>

      {formError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

      {/* Leave applied for */}
      <fieldset className="mb-5">
        <legend className={labelClass}>
          Leave applied for <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {typeOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="leave_type"
                className="h-4 w-4 accent-red-600"
                checked={leaveType === option.value}
                onChange={() => setLeaveType(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="radio"
              name="leave_type"
              className="h-4 w-4 accent-red-600"
              checked={isOthers}
              onChange={() => setLeaveType('others_leave')}
            />
            Others, specify
          </label>
          <input
            className="input min-w-0 flex-1 disabled:bg-gray-100 disabled:text-gray-400"
            placeholder="Please specify"
            value={othersSpecify}
            disabled={!isOthers}
            onChange={(e) => setOthersSpecify(e.target.value)}
          />
        </div>
        <FieldError message={error('leave_type') ?? error('others_specify')} />
      </fieldset>

      {/* Course / purpose */}
      <label className="mb-5 block">
        <span className={labelClass}>
          Course/Purpose
          <Required />
        </span>
        <input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        <FieldError message={error('purpose')} />
      </label>

      {/* Inclusive dates */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Inclusive date
            <Required />
          </span>
          <Button type="button" onClick={() => setDates((prev) => [...prev, ''])}>
            <Plus className="h-4 w-4" />
            Add date
          </Button>
        </div>
        <div className="space-y-2">
          {dates.map((value, index) => (
            <div key={index}>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="input max-w-xs"
                  aria-label={`Leave date ${index + 1}`}
                  value={value}
                  onChange={(e) => setDate(index, e.target.value)}
                  required={index === 0}
                />
                {dates.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove date"
                    onClick={() => setDates((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <FieldError message={error(`dates.${index}`)} />
            </div>
          ))}
        </div>
        <FieldError message={error('dates')} />
        {hasDuplicates && (
          <p className="mt-1 text-xs text-amber-600">The same date was picked more than once. It is counted once.</p>
        )}
      </div>

      {/* Days + contact */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={labelClass}>
            No. of days
            <Required />
          </span>
          <input className="input bg-gray-100 text-gray-500" value={pickedDates.length} readOnly />
        </label>
        <label className="block min-w-0">
          <span className={labelClass}>
            Contact no. while on leave
            <Required />
          </span>
          <input
            className="input"
            value={contact}
            placeholder="09XX XXX XXXX"
            onChange={(e) => setContact(e.target.value)}
            required
          />
          <FieldError message={error('contact')} />
        </label>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-gray-600">
        I hereby pledge to report for work immediately the following day after expiration of my approved leave of
        absence unless otherwise duly extended. My failure to do so shall subject me to disciplinary action
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className={labelClass}>Section head (optional)</span>
          <input className="input" value={sectionHead} onChange={(e) => setSectionHead(e.target.value)} />
          <FieldError message={error('section_head')} />
        </label>
        <label className="block min-w-0">
          <span className={labelClass}>Department head (optional)</span>
          <input className="input" value={departmentHead} onChange={(e) => setDepartmentHead(e.target.value)} />
          <FieldError message={error('department_head')} />
        </label>
      </div>

      <div className="flex justify-center">
        <Button type="submit" loading={saving} className="w-full px-10 sm:w-auto">
          Submit request
        </Button>
      </div>
    </form>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

export default function LeaveRequestModal({ open, onClose, onSubmitted }: Props) {
  return (
    <Modal open={open} title="Request a leave" size="lg" onClose={onClose}>
      {/* The form unmounts when the modal closes, so it starts empty every time */}
      <RequestForm onSubmitted={onSubmitted} />
    </Modal>
  );
}