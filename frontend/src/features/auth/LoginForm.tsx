import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import FormField from '../../components/FormField/FormField';
import { getErrorMessage, getValidationErrors } from '../../lib/getErrorMessage';
import type { ValidationErrors } from '../../types/api';
import { useAuth } from './useAuth';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});

    try {
      const user = await login(email, password);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? (user.user_role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      const validation = getValidationErrors(err);
      if (Object.keys(validation).length) setFieldErrors(validation);
      else setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <FormField label="Email" error={fieldErrors.email?.[0]}>
        <input
          className="input"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Password" error={fieldErrors.password?.[0]}>
        <input
          className="input"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormField>
      <Button type="submit" loading={submitting} className="mt-2 w-full">
        Sign in
      </Button>
    </form>
  );
}